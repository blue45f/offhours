import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, type Reservation, type ReservationStatus } from '@prisma/client'
import { calcReservationFee, calcRefundRate, type CreateReservationInput } from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'
import { SlotsService } from '../slots/slots.service'
import { randomCode } from '../common/util/code'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slots: SlotsService,
    private readonly notifications: NotificationsService
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

    const quote = await this.slots.calcAmount(space.id, startAt, endAt)
    const totalKRW = quote.totalKRW
    const feeKRW = calcReservationFee(totalKRW)
    const code = randomCode('OFH')
    const status: ReservationStatus = space.instantBook ? 'APPROVED' : 'REQUESTED'
    const checkInCode = Math.random().toString(36).slice(2, 8).toUpperCase()

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
        baseAmountKRW: quote.baseAmountKRW,
        cleaningFeeKRW: quote.cleaningFeeKRW,
        totalKRW,
        feeKRW,
        checkInCode,
      },
    })

    await this.notifications.create(space.venue.host.userId, {
      type: 'RESERVATION_REQUESTED',
      title: '새 예약 요청',
      body: `${space.title} (${reservation.code})`,
      data: { reservationId: reservation.id },
    })

    return reservation
  }

  async approve(hostUserId: string, reservationId: string) {
    const r = await this.ensureHost(hostUserId, reservationId)
    if (r.status !== 'REQUESTED') throw new BadRequestException('승인할 수 없는 상태에요')
    const updated = await this.prisma.reservation.update({
      where: { id: r.id },
      data: { status: 'APPROVED' },
    })
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
    await this.notifications.create(r.guestId, {
      type: 'RESERVATION_REJECTED',
      title: '예약이 거절됐어요',
      body: `${r.space.title} — ${reason}`,
      data: { reservationId: r.id },
    })
    return updated
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
    const refundRate = calcRefundRate(r.startAt)
    const refundKRW = Math.round(r.totalKRW * refundRate)
    const next: ReservationStatus = r.status === 'PAID' ? 'REFUNDED' : 'CANCELED'
    const updated = await this.prisma.reservation.update({
      where: { id: r.id },
      data: { status: next, cancelReason: reason },
    })
    await this.notifications.create(r.space.venue.host.userId, {
      type: 'SYSTEM',
      title: '예약 취소',
      body: `${r.code} 게스트 취소 (환불률 ${Math.round(refundRate * 100)}%)`,
      data: { reservationId: r.id, refundKRW },
    })
    return { ...updated, refundKRW }
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

  async checkOut(hostUserId: string, reservationId: string) {
    const r = await this.ensureHost(hostUserId, reservationId)
    if (r.status !== 'CHECKED_IN')
      throw new BadRequestException('체크인 상태에서만 체크아웃 가능해요')
    const updated = await this.prisma.reservation.update({
      where: { id: r.id },
      data: { status: 'COMPLETED', checkedOutAt: new Date() },
    })
    await this.prisma.user.update({
      where: { id: r.guestId },
      data: { guestedCount: { increment: 1 } },
    })
    await this.prisma.user.update({
      where: { id: r.space.venue.host.userId },
      data: { hostedCount: { increment: 1 } },
    })
    await this.notifications.create(r.guestId, {
      type: 'REVIEW_REQUESTED',
      title: '리뷰를 남겨주세요',
      body: `${r.space.title} 이용은 어떠셨나요?`,
      data: { reservationId: r.id },
    })
    return updated
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
        guest: { select: { id: true, name: true, avatarUrl: true } },
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
        guest: { select: { id: true, name: true, avatarUrl: true } },
        payment: true,
      },
    })
    if (!r) throw new NotFoundException()
    const isGuest = r.guestId === userId
    const isHost = r.space.venue.host.userId === userId
    if (!isGuest && !isHost) throw new ForbiddenException()
    return this.toRow(r, true)
  }

  private toRow(
    r: Reservation & {
      space: {
        id: string
        title: string
        photos: { url: string }[]
        venue?: { host?: { user?: { id: string; name: string } } }
      }
      guest?: { id: string; name: string; avatarUrl: string | null } | null
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
      totalKRW: r.totalKRW,
      feeKRW: r.feeKRW,
      cancelReason: r.cancelReason,
      checkInCode: detail ? r.checkInCode : null,
      checkedInAt: r.checkedInAt?.toISOString() ?? null,
      checkedOutAt: r.checkedOutAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
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
