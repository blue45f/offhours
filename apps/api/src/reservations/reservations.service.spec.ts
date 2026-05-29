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
  return {
    svc: new ReservationsService(prisma, slots, notifications, waitlist),
    prisma,
    waitlist,
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
  it('결제된 예약 취소 → 보증금 전액 환급 + released 표기 + 크레딧·포인트 환원', async () => {
    const { svc, prisma, waitlist } = makeService(paid)
    const res: any = await svc.cancelByGuest('g1', 'r1', '단순 변심')
    expect(res.depositRefundKRW).toBe(100000)
    const upd = prisma.reservation.update.mock.calls[0][0]
    expect(upd.data.status).toBe('REFUNDED')
    expect(upd.data.depositReleasedAt).toBeInstanceOf(Date)
    expect(prisma.corporateProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { creditBalanceKRW: { increment: 50000 } } })
    )
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { pointsKRW: { increment: 20000 } } })
    )
    expect(waitlist.notifyOnSlotFreed).toHaveBeenCalledWith('s1')
  })

  it('미결제(REQUESTED) 취소 → 보증금 환급 없음(예치 전), 크레딧은 환원', async () => {
    const { svc, prisma } = makeService({ ...paid, status: 'REQUESTED' })
    const res: any = await svc.cancelByGuest('g1', 'r1', '단순 변심')
    expect(res.depositRefundKRW).toBe(0)
    const upd = prisma.reservation.update.mock.calls[0][0]
    expect(upd.data.depositReleasedAt).toBeUndefined()
    expect(prisma.corporateProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { creditBalanceKRW: { increment: 50000 } } })
    )
  })
})
