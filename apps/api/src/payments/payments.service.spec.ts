import { describe, expect, it, vi } from 'vitest'

import { PaymentsService } from './payments.service'

/**
 * 결제 정산 회귀 방지 — 크레딧·포인트 전액 충당(0원) 시 PG 없이 즉시 정산하고, 잔액이
 * 남으면 READY 인텐트만 만든다(0원을 Toss로 보내면 거부되던 버그의 재발 방지).
 */
function makeService(reservation: Record<string, unknown>) {
  const prisma: any = {
    reservation: {
      findUnique: vi.fn().mockResolvedValue(reservation),
      update: vi.fn().mockResolvedValue({
        guestId: reservation.guestId,
        code: 'OFH-TEST',
        space: { title: '테스트 공간', venue: { host: { userId: 'host1' } } },
      }),
    },
    payment: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi
        .fn()
        .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 'pay1', ...data })
        ),
    },
  }
  const toss: any = { confirm: vi.fn() }
  const notifications: any = { create: vi.fn().mockResolvedValue(undefined) }
  return { svc: new PaymentsService(prisma, toss, notifications), prisma, toss, notifications }
}

const base = {
  id: 'r1',
  guestId: 'g1',
  status: 'APPROVED',
  totalKRW: 100000,
  depositKRW: 0,
  creditAppliedKRW: 0,
  pointsAppliedKRW: 0,
}

describe('PaymentsService.createIntent', () => {
  it('크레딧이 결제액을 전액 충당(payable=0)하면 PG 없이 즉시 정산', async () => {
    const { svc, prisma, toss, notifications } = makeService({ ...base, creditAppliedKRW: 100000 })
    const res = await svc.createIntent('g1', 'r1', 'CARD')
    expect(res.amount).toBe(0)
    expect(res.settled).toBe(true)
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CAPTURED', amountKRW: 0 }),
      })
    )
    expect(prisma.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PAID' }) })
    )
    expect(toss.confirm).not.toHaveBeenCalled()
    expect(notifications.create).toHaveBeenCalledTimes(2) // 게스트 + 호스트
  })

  it('결제액이 남으면 READY 인텐트만 만들고 즉시 정산하지 않음', async () => {
    const { svc, prisma } = makeService({ ...base, totalKRW: 100000, depositKRW: 50000 })
    const res = await svc.createIntent('g1', 'r1', 'CARD')
    expect(res.amount).toBe(150000) // total + 보증금
    expect(res.settled).toBe(false)
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'READY', amountKRW: 150000 }),
      })
    )
    expect(prisma.reservation.update).not.toHaveBeenCalled()
  })
})
