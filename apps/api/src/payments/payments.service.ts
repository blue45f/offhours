import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { ConfirmPaymentInput } from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import { TossProvider } from './toss.provider'

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly toss: TossProvider,
    private readonly notifications: NotificationsService
  ) {}

  async createIntent(userId: string, reservationId: string, method: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    })
    if (!reservation) throw new NotFoundException('예약을 찾을 수 없어요')
    if (reservation.guestId !== userId)
      throw new BadRequestException('본인 예약만 결제할 수 있어요')
    if (!['REQUESTED', 'APPROVED'].includes(reservation.status)) {
      throw new BadRequestException('결제할 수 없는 예약 상태에요')
    }
    const orderId = `ord_${reservation.id}_${Date.now()}`
    const existing = await this.prisma.payment.findUnique({ where: { reservationId } })
    if (existing) {
      return {
        orderId: existing.orderId,
        amount: existing.amountKRW,
        clientKey: process.env.TOSS_CLIENT_KEY ?? '',
      }
    }
    const payment = await this.prisma.payment.create({
      data: {
        reservationId,
        providerKey: orderId,
        orderId,
        method,
        // 법인 크레딧·적립 포인트 차감분을 제외한 실 결제액
        amountKRW:
          reservation.totalKRW - reservation.creditAppliedKRW - reservation.pointsAppliedKRW,
        status: 'READY',
      },
    })
    return {
      orderId: payment.orderId,
      amount: payment.amountKRW,
      clientKey: process.env.TOSS_CLIENT_KEY ?? '',
    }
  }

  async confirm(userId: string, input: ConfirmPaymentInput) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId: input.orderId },
      include: {
        reservation: { include: { space: { include: { venue: { include: { host: true } } } } } },
      },
    })
    if (!payment) throw new NotFoundException('결제 정보를 찾을 수 없어요')
    if (payment.reservation.guestId !== userId) throw new BadRequestException()
    if (payment.amountKRW !== input.amount) throw new BadRequestException('금액이 일치하지 않아요')

    const tossRes = await this.toss.confirm(input)
    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerKey: tossRes.paymentKey,
        status: 'CAPTURED',
        method: tossRes.method ?? payment.method,
        receiptUrl: tossRes.receipt?.url ?? null,
        rawResponse: tossRes as unknown as object,
        capturedAt: new Date(),
      },
    })
    await this.prisma.reservation.update({
      where: { id: payment.reservationId },
      data: { status: 'PAID' },
    })

    await this.notifications.create(payment.reservation.guestId, {
      type: 'PAYMENT_COMPLETED',
      title: '결제가 완료됐어요',
      body: `${payment.reservation.space.title} (${payment.reservation.code})`,
      data: { reservationId: payment.reservationId },
    })
    await this.notifications.create(payment.reservation.space.venue.host.userId, {
      type: 'PAYMENT_COMPLETED',
      title: '게스트가 결제했어요',
      body: `${payment.reservation.code} 결제 완료`,
      data: { reservationId: payment.reservationId },
    })

    return updated
  }

  async refund(reservationId: string, reason: string, amount?: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { reservationId },
    })
    if (!payment) throw new NotFoundException()
    if (!['CAPTURED', 'PARTIAL_REFUNDED'].includes(payment.status)) return null

    await this.toss.refund(payment.providerKey, { cancelReason: reason, cancelAmount: amount })
    const refundedAll = !amount || amount >= payment.amountKRW
    return this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: refundedAll ? 'REFUNDED' : 'PARTIAL_REFUNDED',
        refundedAt: new Date(),
      },
    })
  }
}
