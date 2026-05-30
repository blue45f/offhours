import { describe, expect, it, vi } from 'vitest'

import { SplitsService } from './splits.service'

/**
 * 분담 결제(splits) 회귀 방지 — 1/N 더치페이의 돈 정합성. 핵심 불변식:
 * ① perMemberKRW = 올림(총액/인원) → 합산이 항상 총액 이상이라 주최자가 미수금 없이 회수,
 * ② 금액 대비 인원 과다(< 인원×100) 거절, ③ markPaid 멱등(결제 링크 중복 탭 방어).
 */
function makeSplits(opts: { reservation?: any; member?: any }) {
  const prisma: any = {
    reservation: { findUnique: vi.fn().mockResolvedValue(opts.reservation ?? null) },
    reservationSplit: {
      create: vi.fn().mockImplementation(({ data }: any) => ({
        id: 'split1',
        reservationId: data.reservationId,
        memberCount: data.memberCount,
        perMemberKRW: data.perMemberKRW,
        note: data.note ?? null,
        createdAt: new Date('2026-05-01T00:00:00Z'),
        members: Array.from({ length: data.memberCount }, (_, i) => ({
          id: `m${i + 1}`,
          idx: i + 1,
          token: `tok${i + 1}`,
          label: data.members.create[i].label ?? null,
          status: 'PENDING',
          paidAt: null,
        })),
      })),
    },
    splitMember: {
      findUnique: vi.fn().mockResolvedValue(opts.member ?? null),
      update: vi.fn().mockResolvedValue({}),
    },
  }
  return { svc: new SplitsService(prisma), prisma }
}

describe('SplitsService.create', () => {
  it('perMemberKRW = 올림(총액/인원) — 합산이 총액 이상이라 미수금 0', async () => {
    const { svc, prisma } = makeSplits({
      reservation: { guestId: 'g1', totalKRW: 100000, split: null },
    })
    const d = await svc.create('g1', 'r1', { memberCount: 3 })
    expect(prisma.reservationSplit.create.mock.calls[0][0].data.perMemberKRW).toBe(33334) // ceil(100000/3)
    expect(d.perMemberKRW * d.memberCount).toBeGreaterThanOrEqual(100000) // 절대 미달 없음
    expect(d.members).toHaveLength(3)
    expect(d.members.map((m) => m.idx)).toEqual([1, 2, 3])
    expect(d.paidCount).toBe(0)
  })

  it('금액 대비 인원이 너무 많으면 거절(총액 < 인원×100)', async () => {
    const { svc } = makeSplits({ reservation: { guestId: 'g1', totalKRW: 500, split: null } })
    await expect(svc.create('g1', 'r1', { memberCount: 6 })).rejects.toThrow() // 500 < 600
  })

  it('예약 본인이 아니면 Forbidden', async () => {
    const { svc } = makeSplits({
      reservation: { guestId: 'other', totalKRW: 100000, split: null },
    })
    await expect(svc.create('g1', 'r1', { memberCount: 2 })).rejects.toThrow()
  })

  it('이미 분담 결제가 있으면 거절(중복 생성 방지)', async () => {
    const { svc } = makeSplits({
      reservation: { guestId: 'g1', totalKRW: 100000, split: { id: 's', members: [] } },
    })
    await expect(svc.create('g1', 'r1', { memberCount: 2 })).rejects.toThrow()
  })
})

describe('SplitsService.markPaid', () => {
  it('PENDING 멤버 송금 → PAID 마킹', async () => {
    const { svc, prisma } = makeSplits({ member: { id: 'm1', status: 'PENDING' } })
    const r = await svc.markPaid('tok1')
    expect(r.alreadyPaid).toBe(false)
    expect(prisma.splitMember.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PAID' }) })
    )
  })

  it('이미 PAID 면 멱등 — 재처리/업데이트 없음', async () => {
    const { svc, prisma } = makeSplits({ member: { id: 'm1', status: 'PAID' } })
    const r = await svc.markPaid('tok1')
    expect(r.alreadyPaid).toBe(true)
    expect(prisma.splitMember.update).not.toHaveBeenCalled()
  })

  it('없는 토큰이면 NotFound', async () => {
    const { svc } = makeSplits({ member: null })
    await expect(svc.markPaid('nope')).rejects.toThrow()
  })
})
