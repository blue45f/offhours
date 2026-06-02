import { describe, expect, it, vi } from 'vitest'

import { ReservationsService } from './reservations.service'

/**
 * 취소 환급 회귀 방지 — 결제된 예약 취소 시 보증금 전액 환급(depositReleasedAt 설정),
 * 법인 크레딧·적립 포인트 환원. 보증금이 취소 예약에 영구히 묶이던 버그의 재발 방지.
 */
function makeService(reservation: Record<string, unknown>) {
  const prisma: any = {
    reservation: {
      findUnique: vi.fn().mockResolvedValue(reservation),
      update: vi.fn().mockResolvedValue({ id: reservation.id, status: 'REFUNDED' }),
    },
    corporateProfile: { update: vi.fn().mockResolvedValue({}) },
    user: {
      update: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({ trustScore: 50 }),
    },
  }
  const slots: any = {}
  const notifications: any = { create: vi.fn().mockResolvedValue(undefined) }
  const waitlist: any = { notifyOnSlotFreed: vi.fn().mockResolvedValue(undefined) }
  const payments: any = { refund: vi.fn().mockResolvedValue({}) }
  return {
    svc: new ReservationsService(prisma, slots, notifications, waitlist, payments),
    prisma,
    waitlist,
    payments,
  }
}

// 7일 이상 남은 시점 → STANDARD 정책 환불률 100% (취소 페널티 trustScore 차감 경로 회피)
const farFuture = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
const paid = {
  id: 'r1',
  guestId: 'g1',
  status: 'PAID',
  startAt: farFuture,
  totalKRW: 300000,
  depositKRW: 100000,
  depositReleasedAt: null,
  creditAppliedKRW: 50000,
  corporateProfileId: 'c1',
  pointsAppliedKRW: 20000,
  cancellationPolicy: 'STANDARD',
  spaceId: 's1',
  space: { venue: { host: { userId: 'h1' } } },
}

describe('ReservationsService.cancelByGuest', () => {
  it('결제된 예약 100% 취소 → 보증금 전액 + 크레딧·포인트 전액 환원 + 카드 환불(PG)', async () => {
    const { svc, prisma, waitlist, payments } = makeService(paid)
    const res: any = await svc.cancelByGuest('g1', 'r1', '단순 변심')
    expect(res.depositRefundKRW).toBe(100000)
    const upd = prisma.reservation.update.mock.calls[0][0]
    expect(upd.data.status).toBe('REFUNDED')
    expect(upd.data.depositReleasedAt).toBeInstanceOf(Date)
    // 환불률 100% → 비례 환원 = 전액
    expect(prisma.corporateProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { creditBalanceKRW: { increment: 50000 } } })
    )
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { pointsKRW: { increment: 20000 } } })
    )
    // 카드 환불 = 서비스 카드분(230000) + 보증금(100000)
    expect(payments.refund).toHaveBeenCalledWith('r1', expect.any(String), 330000)
    expect(waitlist.notifyOnSlotFreed).toHaveBeenCalledWith('s1')
  })

  it('부분 환불(FLEXIBLE 24h 이내 = 50%) → 비례 배분: 크레딧·포인트·카드 모두 환불률만큼만', async () => {
    const partial = {
      ...paid,
      startAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12h 후 → FLEXIBLE 50%
      cancellationPolicy: 'FLEXIBLE',
    }
    const { svc, prisma, payments } = makeService(partial)
    await svc.cancelByGuest('g1', 'r1', '단순 변심')
    // 크레딧 50000×0.5=25000, 포인트 20000×0.5=10000 (전액 아님 — 몰수분 비례 적용)
    expect(prisma.corporateProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { creditBalanceKRW: { increment: 25000 } } })
    )
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { pointsKRW: { increment: 10000 } } })
    )
    // 카드 = 0.5×(300000−50000−20000) + 보증금 100000 = 115000 + 100000
    expect(payments.refund).toHaveBeenCalledWith('r1', expect.any(String), 215000)
  })

  it('미결제(REQUESTED) 취소 → 보증금·카드 환불 없음(예치 전), 크레딧은 환원', async () => {
    const { svc, prisma, payments } = makeService({ ...paid, status: 'REQUESTED' })
    const res: any = await svc.cancelByGuest('g1', 'r1', '단순 변심')
    expect(res.depositRefundKRW).toBe(0)
    const upd = prisma.reservation.update.mock.calls[0][0]
    expect(upd.data.depositReleasedAt).toBeUndefined()
    expect(prisma.corporateProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { creditBalanceKRW: { increment: 50000 } } })
    )
    expect(payments.refund).not.toHaveBeenCalled() // 결제 전이라 PG 환불 없음
  })
})

/**
 * 이용 시간 연장 회귀 방지 — 영업 외 고유 가드(슬롯 끝=다음 영업 준비 경계)와 증분 가격의
 * 정합성을 잠근다. 핵심 불변식: ① 수수료는 보장료를 뺀 소계에만 부과(호스트 매출 기준),
 * ② 실 결제액은 공유 payableKRW 공식으로 재계산(보증금 가산·크레딧·포인트 차감),
 * ③ 다음 영업 준비/충돌/호스트 차단을 넘기는 연장은 거절.
 */
const extReservationStart = new Date('2026-06-01T22:00:00.000Z')
const extReservationEnd = new Date('2026-06-02T00:00:00.000Z')
const slotFarEnd = new Date('2026-06-02T04:00:00.000Z')
const extendable = {
  id: 'r1',
  guestId: 'g1',
  status: 'PAID',
  startAt: extReservationStart,
  endAt: extReservationEnd,
  spaceId: 's1',
  purpose: 'PARTY',
  baseAmountKRW: 200000,
  cleaningFeeKRW: 30000,
  addonsAmountKRW: 0,
  protectionFeeKRW: 10000,
  depositKRW: 100000,
  creditAppliedKRW: 50000,
  pointsAppliedKRW: 20000,
  payment: { id: 'p1' },
  space: { venueId: 'v1', title: '루프탑 라운지', venue: { host: { userId: 'h1' } } },
}

function makeExtendService(opts: {
  reservation?: Record<string, unknown>
  slotEndAt?: Date | null
  conflict?: unknown
  block?: unknown
  additionalKRW?: number
}) {
  const reservation = opts.reservation ?? extendable
  const prisma: any = {
    reservation: {
      findUnique: vi.fn().mockResolvedValue(reservation),
      findFirst: vi.fn().mockResolvedValue(opts.conflict ?? null),
      update: vi.fn().mockImplementation(({ data }: any) => ({ id: 'r1', ...data })),
    },
    slot: {
      findFirst: vi
        .fn()
        .mockResolvedValue(
          opts.slotEndAt === null ? null : { endAt: opts.slotEndAt ?? slotFarEnd }
        ),
    },
    venueBlock: { findFirst: vi.fn().mockResolvedValue(opts.block ?? null) },
    payment: { update: vi.fn().mockResolvedValue({}) },
  }
  const slots: any = {
    calcExtension: vi.fn().mockResolvedValue({ additionalKRW: opts.additionalKRW ?? 60000 }),
  }
  const notifications: any = { create: vi.fn().mockResolvedValue(undefined) }
  const waitlist: any = { notifyOnSlotFreed: vi.fn().mockResolvedValue(undefined) }
  const payments: any = { refund: vi.fn().mockResolvedValue({}) }
  return {
    svc: new ReservationsService(prisma, slots, notifications, waitlist, payments),
    prisma,
  }
}

describe('ReservationsService.extend', () => {
  it('연장 happy — 증분 가격 + 수수료는 보장료 뺀 소계 기준 + 실결제액 재계산', async () => {
    const { svc, prisma } = makeExtendService({})
    const res: any = await svc.extend('g1', 'r1', { hours: 2 })
    expect(res.additionalKRW).toBe(60000)
    const upd = prisma.reservation.update.mock.calls[0][0].data
    expect(upd.endAt).toEqual(new Date('2026-06-02T02:00:00.000Z'))
    expect(upd.baseAmountKRW).toBe(260000) // 200000 + 60000 증분
    expect(upd.totalKRW).toBe(300000) // 260000 + 청소 30000 + 보장 10000
    // 수수료는 보장료 제외 소계(290000)에만 — 총액(300000)이 아니다. round(290000*0.12)=34800
    expect(upd.feeKRW).toBe(34800)
    // 실결제액 = 총액 + 보증금 − 크레딧 − 포인트 = 300000 + 100000 − 50000 − 20000
    expect(prisma.payment.update.mock.calls[0][0].data.amountKRW).toBe(330000)
  })

  it('영업 외 안전 경계 — 다음 영업 준비(슬롯 끝)를 넘기는 연장은 거절', async () => {
    const { svc, prisma } = makeExtendService({
      slotEndAt: new Date('2026-06-02T01:00:00.000Z'), // 1시간만 허용인데 2시간 요청
    })
    await expect(svc.extend('g1', 'r1', { hours: 2 })).rejects.toThrow()
    expect(prisma.reservation.update).not.toHaveBeenCalled()
  })

  it('연장 구간에 다른 예약이 있으면 거절', async () => {
    const { svc, prisma } = makeExtendService({ conflict: { id: 'r2' } })
    await expect(svc.extend('g1', 'r1', { hours: 2 })).rejects.toThrow()
    expect(prisma.reservation.update).not.toHaveBeenCalled()
  })

  it('연장 구간이 호스트 차단 일정과 겹치면 거절', async () => {
    const { svc, prisma } = makeExtendService({ block: { id: 'b1' } })
    await expect(svc.extend('g1', 'r1', { hours: 2 })).rejects.toThrow()
    expect(prisma.reservation.update).not.toHaveBeenCalled()
  })

  it('결제 완료(PAID/CHECKED_IN) 상태가 아니면 연장 불가', async () => {
    const { svc } = makeExtendService({ reservation: { ...extendable, status: 'REQUESTED' } })
    await expect(svc.extend('g1', 'r1', { hours: 2 })).rejects.toThrow()
  })

  it('예약 게스트 본인이 아니면 연장 불가(Forbidden)', async () => {
    const { svc } = makeExtendService({})
    await expect(svc.extend('intruder', 'r1', { hours: 2 })).rejects.toThrow()
  })
})

/**
 * 연장 예상 추가 요금 견적 — 확정 전 다이얼로그 표시용. 소유자 확인 + calcExtension 결과 반환.
 */
function makeQuoteService(reservation: Record<string, unknown> | null, additionalKRW = 45000) {
  const prisma: any = {
    reservation: { findUnique: vi.fn().mockResolvedValue(reservation) },
  }
  const slots: any = { calcExtension: vi.fn().mockResolvedValue({ hours: 2, additionalKRW }) }
  const notifications: any = { create: vi.fn() }
  const waitlist: any = { notifyOnSlotFreed: vi.fn() }
  const payments: any = { refund: vi.fn().mockResolvedValue({}) }
  return { svc: new ReservationsService(prisma, slots, notifications, waitlist, payments), slots }
}

const quoteReservation = {
  guestId: 'g1',
  spaceId: 's1',
  endAt: new Date('2026-06-01T00:00:00.000Z'),
  purpose: 'PARTY',
}

describe('ReservationsService.extensionQuote', () => {
  it('소유자에게 calcExtension 견적 반환', async () => {
    const { svc, slots } = makeQuoteService(quoteReservation, 45000)
    const q = await svc.extensionQuote('g1', 'r1', 2)
    expect(q).toEqual({ hours: 2, additionalKRW: 45000 })
    // newEnd = endAt + 2h 로 calcExtension 호출
    expect(slots.calcExtension).toHaveBeenCalledWith(
      's1',
      quoteReservation.endAt,
      new Date('2026-06-01T02:00:00.000Z'),
      'PARTY'
    )
  })

  it('없는 예약이면 NotFound', async () => {
    const { svc } = makeQuoteService(null)
    await expect(svc.extensionQuote('g1', 'r1', 2)).rejects.toThrow()
  })

  it('예약 게스트 본인이 아니면 Forbidden', async () => {
    const { svc } = makeQuoteService(quoteReservation)
    await expect(svc.extensionQuote('intruder', 'r1', 2)).rejects.toThrow()
  })
})
