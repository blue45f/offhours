import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'crypto'
import { Prisma, type Dispute, type Reservation, type ReservationStatus } from '@prisma/client'
import {
  ReservationSchema,
  TRUST_SCORE,
  calcReservationFee,
  calcRefundRate,
  clampTrust,
  earnedPoints,
  payableKRW,
  type AddonLine,
  type CheckOutInput,
  type CreateRecurringInput,
  type CreateReservationInput,
  type ExtendReservationInput,
  type FileClaimInput,
  type RecurringResult,
} from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'
import { SlotsService } from '../slots/slots.service'
import { randomCode, randomUpperCode } from '../common/util/code'
import { NotificationsService } from '../notifications/notifications.service'
import { WaitlistService } from '../waitlist/waitlist.service'
import { PaymentsService } from '../payments/payments.service'

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slots: SlotsService,
    private readonly notifications: NotificationsService,
    private readonly waitlist: WaitlistService,
    private readonly payments: PaymentsService
  ) {}

  async create(guestId: string, input: CreateReservationInput) {
    const startAt = new Date(input.startAt)
    const endAt = new Date(input.endAt)
    if (endAt.getTime() <= startAt.getTime()) throw new BadRequestException('잘못된 시간 범위에요')

    const space = await this.prisma.space.findUnique({
      where: { id: input.spaceId },
      include: { venue: { include: { host: true } } },
    })
    if (!space || space.status !== 'ACTIVE')
      throw new NotFoundException('예약할 수 없는 공간이에요')
    if (space.venue.host.userId === guestId)
      throw new BadRequestException('본인 공간은 예약할 수 없어요')

    const hours = Math.ceil((endAt.getTime() - startAt.getTime()) / (60 * 60 * 1000))
    if (hours < space.minHours) {
      throw new BadRequestException(`최소 ${space.minHours}시간 이상 예약해주세요`)
    }
    if (input.headcount > space.capacityMax) {
      throw new BadRequestException(`최대 ${space.capacityMax}명까지 가능해요`)
    }

    const conflict = await this.prisma.reservation.findFirst({
      where: {
        spaceId: space.id,
        status: { in: ['REQUESTED', 'APPROVED', 'PAID', 'CHECKED_IN'] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    })
    if (conflict) throw new BadRequestException('이미 예약된 시간이에요')

    const quote = await this.slots.calcAmount(
      space.id,
      startAt,
      endAt,
      input.addons ?? [],
      input.purpose
    )
    const totalKRW = quote.totalKRW
    // 보장료는 게스트 부담·보장 풀 적립이므로 수수료(12%)는 호스트 매출 소계에만 적용한다.
    const feeKRW = calcReservationFee(quote.subtotalKRW)
    const code = randomCode('OFH')
    const status: ReservationStatus = space.instantBook ? 'APPROVED' : 'REQUESTED'
    const checkInCode = randomUpperCode(6)

    // 법인 결제 — 현재 등록된 corporate 프로필을 스냅샷으로 동결해 첨부
    let corporateProfileId: string | null = null
    let corporateSnapshot: object | null = null
    let creditAppliedKRW = 0
    if (input.useCorporateBilling) {
      const corp = await this.prisma.corporateProfile.findUnique({ where: { userId: guestId } })
      if (!corp) {
        throw new BadRequestException('법인 결제 프로필이 없어요. 마이페이지에서 먼저 등록해주세요')
      }
      corporateProfileId = corp.id
      corporateSnapshot = {
        companyName: corp.companyName,
        businessNumber: corp.businessNumber,
        ceoName: corp.ceoName,
        billingEmail: corp.billingEmail,
        taxPayer: corp.taxPayer,
      }
      // 법인 크레딧 차감 — 결제액에서 잔액만큼 선차감(B2B 선충전 멤버십)
      if (input.useCredit && corp.creditBalanceKRW > 0) {
        creditAppliedKRW = Math.min(corp.creditBalanceKRW, totalKRW)
        await this.prisma.corporateProfile.update({
          where: { id: corp.id },
          data: { creditBalanceKRW: { decrement: creditAppliedKRW } },
        })
      }
    }

    // 적립 포인트 사용 — 크레딧 차감 후 남은 결제액에서 추가 차감(모든 게스트). 서버가 잔액을
    // 직접 읽어 차감하므로 클라이언트 표시가 낡아도 이중 차감이 없다.
    let pointsAppliedKRW = 0
    if (input.usePoints) {
      const guestUser = await this.prisma.user.findUnique({
        where: { id: guestId },
        select: { pointsKRW: true },
      })
      const payableAfterCredit = Math.max(0, totalKRW - creditAppliedKRW)
      pointsAppliedKRW = Math.min(guestUser?.pointsKRW ?? 0, payableAfterCredit)
      if (pointsAppliedKRW > 0) {
        await this.prisma.user.update({
          where: { id: guestId },
          data: { pointsKRW: { decrement: pointsAppliedKRW } },
        })
      }
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        code,
        spaceId: space.id,
        guestId,
        startAt,
        endAt,
        headcount: input.headcount,
        purpose: input.purpose,
        note: input.note ?? null,
        status,
        // 라스트미닛 할인이 적용된 실제 결제 금액을 저장. 정상가는 quote.baseAmountKRW.
        baseAmountKRW: quote.discountedBaseAmountKRW,
        cleaningFeeKRW: quote.cleaningFeeKRW,
        depositKRW: space.depositKRW,
        addonsAmountKRW: quote.addonsKRW,
        addonsSnapshot: quote.addons.length > 0 ? (quote.addons as object) : undefined,
        protectionTier: quote.protectionTier,
        protectionFeeKRW: quote.protectionFeeKRW,
        protectionCoverageKRW: quote.protectionCoverageKRW,
        cancellationPolicy: space.cancellationPolicy,
        totalKRW,
        feeKRW,
        checkInCode,
        corporateProfileId,
        corporateSnapshot: corporateSnapshot ?? undefined,
        creditAppliedKRW,
        pointsAppliedKRW,
        recurringGroupId: input.recurringGroupId ?? null,
      },
    })

    await this.notifications.create(space.venue.host.userId, {
      type: 'RESERVATION_REQUESTED',
      title: '새 예약 요청',
      body: `${space.title} (${reservation.code})`,
      data: { reservationId: reservation.id },
    })

    // 청소 대행 자동 매칭 — 청소비가 있으면 지역 우선·활성 폴백으로 제휴 업체를 배정한다.
    // 청소 SLA의 Phase 2: "다음 영업 전 원상복구"를 호스트 대신 플랫폼이 운영으로 보장.
    if (space.cleaningFeeKRW > 0) {
      const partner =
        (await this.prisma.cleaningPartner.findFirst({
          where: { isActive: true, region: space.venue.region },
          orderBy: { ratingAvg: 'desc' },
        })) ??
        (await this.prisma.cleaningPartner.findFirst({
          where: { isActive: true },
          orderBy: { ratingAvg: 'desc' },
        }))
      if (partner) {
        await this.prisma.cleaningJob.create({
          data: {
            reservationId: reservation.id,
            partnerId: partner.id,
            scheduledAt: endAt,
            feeKRW: space.cleaningFeeKRW,
          },
        })
      }
    }

    return reservation
  }

  async createRecurring(guestId: string, input: CreateRecurringInput): Promise<RecurringResult> {
    const groupId = randomUUID()
    const { weeks, ...baseInput } = input
    const baseStart = new Date(baseInput.startAt)
    const baseEnd = new Date(baseInput.endAt)
    const durationMs = baseEnd.getTime() - baseStart.getTime()

    const created: RecurringResult['created'] = []
    const skipped: RecurringResult['skipped'] = []

    for (let i = 0; i < weeks; i++) {
      const occStart = new Date(baseStart.getTime() + i * 7 * 24 * 60 * 60 * 1000)
      const occEnd = new Date(occStart.getTime() + durationMs)
      const occInput: CreateReservationInput = {
        ...baseInput,
        startAt: occStart.toISOString(),
        endAt: occEnd.toISOString(),
        recurringGroupId: groupId,
      }
      try {
        const r = await this.create(guestId, occInput)
        const detail = await this.getOne(guestId, r.id)
        // getOne returns extra fields (venueAddressRoad, arrivalGuide); parse to ReservationSchema shape.
        created.push(ReservationSchema.parse(detail))
      } catch (e) {
        skipped.push({
          startAt: occStart.toISOString(),
          reason: e instanceof Error ? e.message : '예약할 수 없는 시간',
        })
      }
    }

    return { groupId, created, skipped }
  }

  async approve(hostUserId: string, reservationId: string) {
    const r = await this.ensureHost(hostUserId, reservationId)
    if (r.status !== 'REQUESTED') throw new BadRequestException('승인할 수 없는 상태에요')
    const updated = await this.prisma.reservation.update({
      where: { id: r.id },
      data: { status: 'APPROVED' },
    })
    await this.recordHostResponse(hostUserId, r.createdAt)
    await this.notifications.create(r.guestId, {
      type: 'RESERVATION_APPROVED',
      title: '예약이 승인됐어요',
      body: `${r.space.title} (${r.code})`,
      data: { reservationId: r.id },
    })
    return updated
  }

  async reject(hostUserId: string, reservationId: string, reason: string) {
    const r = await this.ensureHost(hostUserId, reservationId)
    if (r.status !== 'REQUESTED') throw new BadRequestException('거절할 수 없는 상태에요')
    const updated = await this.prisma.reservation.update({
      where: { id: r.id },
      data: { status: 'CANCELED', cancelReason: reason },
    })
    await this.recordHostResponse(hostUserId, r.createdAt)
    await this.bumpTrust(hostUserId, TRUST_SCORE.PENALTY_HOST_REJECT)
    await this.notifications.create(r.guestId, {
      type: 'RESERVATION_REJECTED',
      title: '예약이 거절됐어요',
      body: `${r.space.title} — ${reason}`,
      data: { reservationId: r.id },
    })
    return updated
  }

  private async bumpTrust(userId: string, delta: number) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { trustScore: true },
    })
    if (!u) return
    await this.prisma.user.update({
      where: { id: userId },
      data: { trustScore: clampTrust(u.trustScore + delta) },
    })
  }

  /**
   * 호스트의 응답 통계를 갱신한다.
   * 캐시는 incremental 추정 — 최근 30일 cron 재집계는 별도 잡으로 정확화.
   * 표본 < 10 또는 응답률 < 0.9 면 SpaceCard 뱃지가 자동으로 숨겨진다.
   */
  private async recordHostResponse(hostUserId: string, requestedAt: Date) {
    const respondedAtMs = Date.now()
    const minutes = Math.max(1, Math.round((respondedAtMs - requestedAt.getTime()) / 60000))
    const within24h = minutes <= 24 * 60

    const host = await this.prisma.user.findUnique({
      where: { id: hostUserId },
      select: { responseMedianMin: true, responseRate24h: true, responseSampleCount: true },
    })
    if (!host) return

    const n = (host.responseSampleCount ?? 0) + 1
    // 중앙값은 정확히는 분포가 필요하지만 캐시 단순화를 위해 EMA(α=0.3)로 근사.
    const prevMedian = host.responseMedianMin ?? minutes
    const nextMedian = Math.round(prevMedian * 0.7 + minutes * 0.3)
    const prevRate = host.responseRate24h ?? (within24h ? 1 : 0)
    const nextRate = (prevRate * (n - 1) + (within24h ? 1 : 0)) / n

    await this.prisma.user.update({
      where: { id: hostUserId },
      data: {
        responseMedianMin: nextMedian,
        responseRate24h: Number(nextRate.toFixed(3)),
        responseSampleCount: n,
        responseUpdatedAt: new Date(),
      },
    })
  }

  async cancelByGuest(guestId: string, reservationId: string, reason: string) {
    const r = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { space: { include: { venue: { include: { host: true } } } } },
    })
    if (!r) throw new NotFoundException()
    if (r.guestId !== guestId) throw new ForbiddenException()
    if (!['REQUESTED', 'APPROVED', 'PAID'].includes(r.status)) {
      throw new BadRequestException('취소할 수 없는 상태에요')
    }
    const refundRate = calcRefundRate(r.startAt, new Date(), r.cancellationPolicy)
    const refundKRW = Math.round(r.totalKRW * refundRate)
    const next: ReservationStatus = r.status === 'PAID' ? 'REFUNDED' : 'CANCELED'
    // 결제된 예약을 취소하면 이용이 없었으므로 보증금은 전액 환급 처리(released 표기).
    // 보증금 자동 환급 크론은 COMPLETED 만 대상이라, 취소 예약은 여기서 직접 풀어준다.
    const releaseDeposit = r.status === 'PAID' && r.depositKRW > 0 && !r.depositReleasedAt
    const depositRefundKRW = releaseDeposit ? r.depositKRW : 0
    const updated = await this.prisma.reservation.update({
      where: { id: r.id },
      data: {
        status: next,
        cancelReason: reason,
        ...(releaseDeposit ? { depositReleasedAt: new Date() } : {}),
      },
    })
    // 비례 배분 환원 — 몰수분(1−환불률)을 카드·크레딧·포인트 서비스 분담분에 비례로 적용한다.
    // (creditApplied + pointsApplied ≤ totalKRW 가 보장돼 카드 서비스분은 항상 ≥ 0)
    const creditRefund = Math.round(refundRate * r.creditAppliedKRW)
    const pointsRefund = Math.round(refundRate * r.pointsAppliedKRW)
    if (creditRefund > 0 && r.corporateProfileId) {
      await this.prisma.corporateProfile.update({
        where: { id: r.corporateProfileId },
        data: { creditBalanceKRW: { increment: creditRefund } },
      })
    }
    if (pointsRefund > 0) {
      await this.prisma.user.update({
        where: { id: r.guestId },
        data: { pointsKRW: { increment: pointsRefund } },
      })
    }
    // 카드 환불(실 PG, mock 게이트) — 서비스 카드분(환불률 적용) + 보증금 전액. PAID 였을 때만 실제 결제가 잡혀 있다.
    const cardServiceRefundKRW = Math.round(
      refundRate * (r.totalKRW - r.creditAppliedKRW - r.pointsAppliedKRW)
    )
    const cardRefundKRW = cardServiceRefundKRW + depositRefundKRW
    if (r.status === 'PAID' && cardRefundKRW > 0) {
      await this.payments
        .refund(r.id, `게스트 취소 (환불률 ${Math.round(refundRate * 100)}%)`, cardRefundKRW)
        .catch(() => null)
    }
    // 환불률이 낮을수록(=시작 임박 취소) 페널티 가중.
    const penalty = refundRate < 1 ? TRUST_SCORE.PENALTY_GUEST_CANCEL : 0
    if (penalty) await this.bumpTrust(guestId, penalty)
    await this.notifications.create(r.space.venue.host.userId, {
      type: 'SYSTEM',
      title: '예약 취소',
      body: `${r.code} 게스트 취소 (환불률 ${Math.round(refundRate * 100)}%)`,
      data: { reservationId: r.id, refundKRW },
    })
    // 이 시간대가 다시 비었으니 대기자에게 빈자리 알림
    await this.waitlist.notifyOnSlotFreed(r.spaceId).catch(() => null)
    return { ...updated, refundKRW, depositRefundKRW, cardRefundKRW, creditRefund, pointsRefund }
  }

  /**
   * 미응답 예약 요청 자동 만료 — 호스트가 응답하지 않은 REQUESTED 예약을 정리한다.
   * 영업 외 대관은 라스트미닛 비중이 커 게스트가 한없이 대기하면 다른 공간을 못 잡는다.
   * 이용 시작 시각이 지났거나 48시간 응답이 없으면 자동 취소하고, 대기자에게 빈자리를 알린다.
   */
  async expireStale() {
    const now = new Date()
    const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const stale = await this.prisma.reservation.findMany({
      where: {
        status: 'REQUESTED',
        OR: [{ startAt: { lt: now } }, { createdAt: { lt: cutoff } }],
      },
      include: { space: { include: { venue: { include: { host: true } } } } },
      take: 200,
    })
    for (const r of stale) {
      await this.prisma.reservation.update({
        where: { id: r.id },
        data: { status: 'CANCELED', cancelReason: '호스트 미응답으로 자동 만료' },
      })
      await this.notifications.create(r.guestId, {
        type: 'RESERVATION_REJECTED',
        title: '예약 요청이 만료됐어요',
        body: `${r.space.title} — 호스트 미응답으로 자동 취소됐어요`,
        data: { reservationId: r.id },
      })
      await this.notifications.create(r.space.venue.host.userId, {
        type: 'SYSTEM',
        title: '미응답 예약 자동 만료',
        body: `${r.code} 요청이 자동 취소됐어요`,
        data: { reservationId: r.id },
      })
      await this.waitlist.notifyOnSlotFreed(r.spaceId).catch(() => null)
    }
    return { expired: stale.length }
  }

  /**
   * 보증금 자동 환급 — 분쟁 없이 이용 완료 후 7일이 지난 예약의 보증금을 환급 처리한다.
   * PRODUCT.md §8 "분쟁 없으면 7일 내 자동 해제" 정책의 구현. 게스트에게 환급 알림.
   */
  async releaseDeposits() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const due = await this.prisma.reservation.findMany({
      where: {
        status: 'COMPLETED',
        depositKRW: { gt: 0 },
        depositReleasedAt: null,
        checkedOutAt: { lt: cutoff },
        dispute: { is: null },
      },
      include: { space: { select: { title: true } } },
      take: 200,
    })
    for (const r of due) {
      await this.prisma.reservation.update({
        where: { id: r.id },
        data: { depositReleasedAt: new Date() },
      })
      await this.notifications.create(r.guestId, {
        type: 'SYSTEM',
        title: '보증금이 환급됐어요',
        body: `${r.space.title} — 보증금 ${r.depositKRW.toLocaleString()}원 환급 완료`,
        data: { reservationId: r.id },
      })
    }
    return { released: due.length }
  }

  /**
   * 연장 예상 추가 요금 — 다이얼로그에서 확정 전에 동적 가격을 미리 보여주기 위한 견적.
   * 실제 가능 여부(슬롯 경계·충돌)는 commit(extend) 시 최종 검증한다.
   */
  async extensionQuote(guestId: string, reservationId: string, hours: number) {
    const r = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { guestId: true, spaceId: true, endAt: true, purpose: true },
    })
    if (!r) throw new NotFoundException()
    if (r.guestId !== guestId) throw new ForbiddenException()
    const newEnd = new Date(r.endAt.getTime() + hours * 60 * 60 * 1000)
    const ext = await this.slots.calcExtension(r.spaceId, r.endAt, newEnd, r.purpose)
    return { hours, additionalKRW: ext.additionalKRW }
  }

  /**
   * 이용 시간 연장 — "파티가 무르익었는데 1시간만 더" 수요를 잡는다. 단, 영업 외 대관의
   * 핵심 제약을 지킨다: 예약이 속한 자동 슬롯의 끝(= 다음 영업 준비 + 청소 버퍼를 남긴
   * 안전 경계)을 넘길 수 없다. 일반 공간대여 플랫폼은 "다음 영업"을 모델링하지 않아 못 하는
   * 영업 외 고유 가드. 뒤 예약·호스트 차단과 겹치면 거절하고, 연장분은 동적 가격으로 가산한다.
   */
  async extend(guestId: string, reservationId: string, input: ExtendReservationInput) {
    const r = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { space: { include: { venue: { include: { host: true } } } }, payment: true },
    })
    if (!r) throw new NotFoundException()
    if (r.guestId !== guestId) throw new ForbiddenException()
    if (!['PAID', 'CHECKED_IN'].includes(r.status)) {
      throw new BadRequestException('이용 중(결제 완료)인 예약만 연장할 수 있어요')
    }
    const newEnd = new Date(r.endAt.getTime() + input.hours * 60 * 60 * 1000)

    // 영업 외 안전 경계 — 예약이 속한 자동 슬롯의 끝(다음 영업 준비 시각)을 넘길 수 없다.
    const slot = await this.prisma.slot.findFirst({
      where: { spaceId: r.spaceId, startAt: { lte: r.startAt }, endAt: { gte: r.endAt } },
      select: { endAt: true },
    })
    if (!slot) throw new BadRequestException('이 예약은 연장할 수 없어요')
    if (newEnd.getTime() > slot.endAt.getTime()) {
      throw new BadRequestException(
        `다음 영업 준비 때문에 ${slot.endAt.getHours()}시까지만 연장할 수 있어요`
      )
    }

    // 연장 구간에 다른 예약·호스트 차단이 있으면 불가
    const conflict = await this.prisma.reservation.findFirst({
      where: {
        spaceId: r.spaceId,
        id: { not: r.id },
        status: { in: ['REQUESTED', 'APPROVED', 'PAID', 'CHECKED_IN'] },
        startAt: { lt: newEnd },
        endAt: { gt: r.endAt },
      },
    })
    if (conflict) throw new BadRequestException('연장하려는 시간에 다른 예약이 있어요')
    const block = await this.prisma.venueBlock.findFirst({
      where: { venueId: r.space.venueId, startAt: { lt: newEnd }, endAt: { gt: r.endAt } },
      select: { id: true },
    })
    if (block) throw new BadRequestException('연장하려는 시간이 호스트 일정과 겹쳐요')

    const ext = await this.slots.calcExtension(r.spaceId, r.endAt, newEnd, r.purpose)
    const newBase = r.baseAmountKRW + ext.additionalKRW
    const newSubtotal = newBase + r.cleaningFeeKRW + r.addonsAmountKRW
    const newTotal = newSubtotal + r.protectionFeeKRW
    const updated = await this.prisma.reservation.update({
      where: { id: r.id },
      data: {
        endAt: newEnd,
        baseAmountKRW: newBase,
        totalKRW: newTotal,
        feeKRW: calcReservationFee(newSubtotal),
      },
    })
    if (r.payment) {
      // 실 결제액 정합성 유지 — 공유 payableKRW 단일 공식 사용(연장 후 금액 재계산)
      await this.prisma.payment.update({
        where: { reservationId: r.id },
        data: {
          amountKRW: payableKRW({
            totalKRW: newTotal,
            depositKRW: r.depositKRW,
            creditAppliedKRW: r.creditAppliedKRW,
            pointsAppliedKRW: r.pointsAppliedKRW,
          }),
        },
      })
    }
    await this.notifications.create(r.space.venue.host.userId, {
      type: 'SYSTEM',
      title: '이용 시간 연장',
      body: `${r.space.title} — ${input.hours}시간 연장 (+${ext.additionalKRW.toLocaleString()}원)`,
      data: { reservationId: r.id },
    })
    return { ...updated, additionalKRW: ext.additionalKRW }
  }

  async checkIn(hostUserId: string, reservationId: string, code: string) {
    const r = await this.ensureHost(hostUserId, reservationId)
    if (r.status !== 'PAID')
      throw new BadRequestException('결제 완료 상태에서만 체크인할 수 있어요')
    if (r.checkInCode !== code.toUpperCase()) {
      throw new BadRequestException('체크인 코드가 일치하지 않아요')
    }
    return this.prisma.reservation.update({
      where: { id: r.id },
      data: { status: 'CHECKED_IN', checkedInAt: new Date() },
    })
  }

  async checkOut(hostUserId: string, reservationId: string, input: CheckOutInput) {
    const r = await this.ensureHost(hostUserId, reservationId)
    if (r.status !== 'CHECKED_IN')
      throw new BadRequestException('체크인 상태에서만 체크아웃 가능해요')
    const c = input.checklist
    if (!c.restored || !c.trash || !c.audio || !c.lights || !c.lock) {
      throw new BadRequestException(
        '청소 SLA — 원상복구·쓰레기·음향·조명·잠금 5개 항목을 모두 확인해주세요'
      )
    }
    const updated = await this.prisma.reservation.update({
      where: { id: r.id },
      data: {
        status: 'COMPLETED',
        checkedOutAt: new Date(),
        checkoutChecklist: {
          ...c,
          note: input.note ?? null,
          photoUrls: input.photoUrls ?? [],
          completedAt: new Date().toISOString(),
          completedBy: hostUserId,
        } as object,
      },
    })
    // 이용 완료 시 실 결제액의 일정 비율을 게스트 포인트로 적립(재방문 레버)
    const paidKRW = r.totalKRW - r.creditAppliedKRW - r.pointsAppliedKRW
    await this.prisma.user.update({
      where: { id: r.guestId },
      data: { guestedCount: { increment: 1 }, pointsKRW: { increment: earnedPoints(paidKRW) } },
    })
    await this.prisma.user.update({
      where: { id: r.space.venue.host.userId },
      data: { hostedCount: { increment: 1 } },
    })
    // 청소 대행 배정이 있으면 완료 처리
    await this.prisma.cleaningJob.updateMany({
      where: { reservationId: r.id, status: 'SCHEDULED' },
      data: { status: 'DONE' },
    })
    await this.notifications.create(r.guestId, {
      type: 'REVIEW_REQUESTED',
      title: '리뷰를 남겨주세요',
      body: `${r.space.title} 이용은 어떠셨나요?`,
      data: { reservationId: r.id },
    })
    return updated
  }

  /**
   * 안심 보장 파손 청구 — 보장 적용 + 이용 완료된 예약에 호스트가 기물 파손·도난을 청구한다.
   * 체크아웃 사진(checkoutChecklist.photoUrls)이 증빙으로 자동 첨부돼 "before/after" 근거가
   * 남고, 보장 한도 안에서만 청구 가능. Dispute(kind=DAMAGE)로 적재돼 운영팀이 중재한다.
   * 영업 중인 가게를 빌려주는 호스트의 #1 진입장벽(파손 공포)을 실제 보장으로 닫는 표면.
   */
  async fileClaim(hostUserId: string, reservationId: string, input: FileClaimInput) {
    const r = await this.ensureHost(hostUserId, reservationId)
    if (r.protectionTier === 'NONE') {
      throw new BadRequestException('안심 보장이 적용되지 않은 예약이에요')
    }
    if (!['CHECKED_OUT', 'COMPLETED'].includes(r.status)) {
      throw new BadRequestException('이용이 끝난 예약에만 파손을 청구할 수 있어요')
    }
    if (input.amountClaimedKRW > r.protectionCoverageKRW) {
      throw new BadRequestException(
        `보장 한도(${r.protectionCoverageKRW.toLocaleString()}원)를 초과했어요`
      )
    }
    const existing = await this.prisma.dispute.findUnique({ where: { reservationId: r.id } })
    if (existing) throw new BadRequestException('이미 접수된 청구가 있어요')

    // 청소 SLA 체크아웃이 남긴 퇴실 사진을 증빙으로 자동 첨부
    const checklist = r.checkoutChecklist as { photoUrls?: string[] } | null
    const checkoutPhotos = checklist?.photoUrls ?? []
    const dispute = await this.prisma.dispute.create({
      data: {
        reservationId: r.id,
        raisedById: hostUserId,
        kind: 'DAMAGE',
        reason: input.reason,
        description: input.description,
        evidence: { photoUrls: [...(input.evidenceUrls ?? []), ...checkoutPhotos] } as object,
        amountClaimedKRW: input.amountClaimedKRW,
        coverageKRW: r.protectionCoverageKRW,
        status: 'OPEN',
      },
    })
    await this.notifications.create(r.guestId, {
      type: 'SYSTEM',
      title: '파손 보장 청구가 접수됐어요',
      body: `${r.space.title} — 운영팀 검토 후 안내드릴게요`,
      data: { reservationId: r.id, disputeId: dispute.id },
    })
    return dispute
  }

  private toDisputeSummary(d: Dispute) {
    return {
      id: d.id,
      kind: d.kind,
      status: d.status,
      reason: d.reason,
      amountClaimedKRW: d.amountClaimedKRW,
      coverageKRW: d.coverageKRW,
      createdAt: d.createdAt.toISOString(),
    }
  }

  async listMineAsGuest(guestId: string, status?: ReservationStatus) {
    const where: Prisma.ReservationWhereInput = { guestId, ...(status ? { status } : {}) }
    const reservations = await this.prisma.reservation.findMany({
      where,
      include: {
        space: { include: { photos: { take: 1, orderBy: { order: 'asc' } } } },
      },
      orderBy: { startAt: 'desc' },
      take: 100,
    })
    return reservations.map((r) => this.toRow(r))
  }

  async listMineAsHost(hostUserId: string, status?: ReservationStatus) {
    const host = await this.prisma.hostProfile.findUnique({ where: { userId: hostUserId } })
    if (!host) return []
    const where: Prisma.ReservationWhereInput = {
      space: { venue: { hostId: host.id } },
      ...(status ? { status } : {}),
    }
    const reservations = await this.prisma.reservation.findMany({
      where,
      include: {
        space: { include: { photos: { take: 1, orderBy: { order: 'asc' } } } },
        guest: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            isVerified: true,
            trustScore: true,
            guestedCount: true,
          },
        },
      },
      orderBy: { startAt: 'desc' },
      take: 100,
    })
    return reservations.map((r) => this.toRow(r))
  }

  async getOne(userId: string, reservationId: string) {
    const r = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        space: {
          include: {
            photos: { take: 1, orderBy: { order: 'asc' } },
            venue: { include: { host: { include: { user: true } } } },
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            isVerified: true,
            trustScore: true,
            guestedCount: true,
          },
        },
        payment: true,
        dispute: true,
        cleaningJob: { include: { partner: true } },
      },
    })
    if (!r) throw new NotFoundException()
    const isGuest = r.guestId === userId
    const isHost = r.space.venue.host.userId === userId
    if (!isGuest && !isHost) throw new ForbiddenException()
    const row = this.toRow(r, true)
    // 결제 완료된 게스트에게만 호스트의 도착 가이드 노출 (PAID/CHECKED_IN/COMPLETED).
    const showArrival = ['PAID', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'].includes(r.status)
    return {
      ...row,
      dispute: r.dispute ? this.toDisputeSummary(r.dispute) : null,
      cleaningJob: r.cleaningJob
        ? {
            partnerName: r.cleaningJob.partner.name,
            scheduledAt: r.cleaningJob.scheduledAt.toISOString(),
            status: r.cleaningJob.status,
            feeKRW: r.cleaningJob.feeKRW,
          }
        : null,
      venueAddressRoad: showArrival ? r.space.venue.addressRoad : null,
      arrivalGuide: showArrival ? (r.space.venue.arrivalGuide as object | null) : null,
    }
  }

  private toRow(
    r: Reservation & {
      space: {
        id: string
        title: string
        photos: { url: string }[]
        venue?: { host?: { user?: { id: string; name: string } } }
      }
      guest?: {
        id: string
        name: string
        avatarUrl: string | null
        isVerified?: boolean
        trustScore?: number
        guestedCount?: number
      } | null
    },
    detail = false
  ) {
    return {
      id: r.id,
      code: r.code,
      spaceId: r.space.id,
      spaceTitle: r.space.title,
      spaceThumbnailUrl: r.space.photos[0]?.url ?? null,
      guestId: r.guestId,
      guestName: r.guest?.name ?? '',
      guestVerified: r.guest?.isVerified ?? false,
      guestTrustScore: r.guest?.trustScore ?? 50,
      guestGuestedCount: r.guest?.guestedCount ?? 0,
      hostId: r.space.venue?.host?.user?.id ?? '',
      hostName: r.space.venue?.host?.user?.name ?? '',
      startAt: r.startAt.toISOString(),
      endAt: r.endAt.toISOString(),
      headcount: r.headcount,
      purpose: r.purpose,
      note: r.note,
      status: r.status,
      baseAmountKRW: r.baseAmountKRW,
      cleaningFeeKRW: r.cleaningFeeKRW,
      depositKRW: r.depositKRW,
      depositReleasedAt:
        (r as { depositReleasedAt?: Date | null }).depositReleasedAt?.toISOString() ?? null,
      addonsAmountKRW: (r as { addonsAmountKRW?: number }).addonsAmountKRW ?? 0,
      addons: (r as { addonsSnapshot?: AddonLine[] | null }).addonsSnapshot ?? null,
      protectionTier:
        (r as { protectionTier?: 'NONE' | 'STANDARD' | 'PREMIUM' }).protectionTier ?? 'NONE',
      protectionFeeKRW: (r as { protectionFeeKRW?: number }).protectionFeeKRW ?? 0,
      protectionCoverageKRW: (r as { protectionCoverageKRW?: number }).protectionCoverageKRW ?? 0,
      cancellationPolicy:
        (r as { cancellationPolicy?: 'FLEXIBLE' | 'STANDARD' | 'STRICT' }).cancellationPolicy ??
        'STANDARD',
      creditAppliedKRW: (r as { creditAppliedKRW?: number }).creditAppliedKRW ?? 0,
      pointsAppliedKRW: (r as { pointsAppliedKRW?: number }).pointsAppliedKRW ?? 0,
      totalKRW: r.totalKRW,
      feeKRW: r.feeKRW,
      cancelReason: r.cancelReason,
      checkInCode: detail ? r.checkInCode : null,
      checkedInAt: r.checkedInAt?.toISOString() ?? null,
      checkedOutAt: r.checkedOutAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      corporateSnapshot: (r as { corporateSnapshot?: object | null }).corporateSnapshot ?? null,
    }
  }

  private async ensureHost(hostUserId: string, reservationId: string) {
    const r = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { space: { include: { venue: { include: { host: true } } } } },
    })
    if (!r) throw new NotFoundException()
    if (r.space.venue.host.userId !== hostUserId) throw new ForbiddenException()
    return r
  }
}
