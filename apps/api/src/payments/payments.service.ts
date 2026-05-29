import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { payableKRW, type ConfirmPaymentInput } from '@offhours/shared'

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
    const clientKey = process.env.TOSS_CLIENT_KEY ?? ''
    // 실 결제액(공유 단일 공식): 총액 + 보증금 − 크레딧 − 포인트
    const amount = payableKRW(reservation)
    const existing = await this.prisma.payment.findUnique({ where: { reservationId } })
    if (existing) {
      return {
        orderId: existing.orderId,
        amount: existing.amountKRW,
        clientKey,
        settled: existing.status === 'CAPTURED',
      }
    }
    const orderId = `ord_${reservation.id}_${Date.now()}`
    // 크레딧·포인트가 결제액을 전액 충당(0원)하면 PG 호출 없이 즉시 정산한다(0원 결제는 PG가 거부).
    if (amount <= 0) {
      const payment = await this.prisma.payment.create({
        data: {
          reservationId,
          providerKey: orderId,
          orderId,
          method: 'CREDIT',
          amountKRW: 0,
          status: 'CAPTURED',
          capturedAt: new Date(),
        },
      })
      await this.settleReservationPaid(reservationId)
      return { orderId: payment.orderId, amount: 0, clientKey, settled: true }
    }
    const payment = await this.prisma.payment.create({
      data: {
        reservationId,
        providerKey: orderId,
        orderId,
        method,
        amountKRW: amount,
        status: 'READY',
      },
    })
    return { orderId: payment.orderId, amount: payment.amountKRW, clientKey, settled: false }
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

    // 이미 정산됐거나(멱등) 0원 결제(크레딧·포인트 전액 충당)는 PG 호출 없이 통과
    if (payment.status === 'CAPTURED' || payment.amountKRW <= 0) {
      if (payment.status !== 'CAPTURED') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'CAPTURED', capturedAt: new Date() },
        })
        await this.settleReservationPaid(payment.reservationId)
      }
      return this.prisma.payment.findUnique({ where: { id: payment.id } })
    }

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
    await this.settleReservationPaid(payment.reservationId)
    return updated
  }

  /** 예약을 PAID 로 전환하고 게스트·호스트에게 결제 완료 알림 — confirm·0원 정산 공통 */
  private async settleReservationPaid(reservationId: string) {
    const reservation = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'PAID' },
      include: { space: { include: { venue: { include: { host: true } } } } },
    })
    await this.notifications.create(reservation.guestId, {
      type: 'PAYMENT_COMPLETED',
      title: '결제가 완료됐어요',
      body: `${reservation.space.title} (${reservation.code})`,
      data: { reservationId },
    })
    await this.notifications.create(reservation.space.venue.host.userId, {
      type: 'PAYMENT_COMPLETED',
      title: '게스트가 결제했어요',
      body: `${reservation.code} 결제 완료`,
      data: { reservationId },
    })
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
