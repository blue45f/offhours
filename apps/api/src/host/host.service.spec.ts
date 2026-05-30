import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HostService } from './host.service'

/**
 * 호스트 순수입(earnings) 회귀 방지 — 정산 금액은 호스트 신뢰의 핵심이라 산식을 잠근다.
 * 불변식: ① net = 총액 − 수수료 − 보장료 (크레딧·포인트·보증금은 게스트측이라 제외),
 * ② allTime/thisMonth 는 COMPLETED 만, pending 은 미완료(PAID/CHECKED_IN/CHECKED_OUT),
 * ③ payoutAt = (checkedOutAt ?? endAt) + 정산주기, upcoming 은 미래 정산 또는 미완료.
 */
function makeHost(profile: Record<string, unknown> | null, reservations: any[] = []) {
  const prisma: any = {
    hostProfile: { findUnique: vi.fn().mockResolvedValue(profile) },
    reservation: { findMany: vi.fn().mockResolvedValue(reservations) },
  }
  return new HostService(prisma)
}

const NOW = new Date('2026-05-15T12:00:00Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
})

describe('HostService.earnings', () => {
  it('프로필 없으면 0 정산', async () => {
    const e = await makeHost(null).earnings('u1')
    expect(e.totals).toEqual({ thisMonthNetKRW: 0, pendingNetKRW: 0, allTimeNetKRW: 0, count: 0 })
  })

  it('예약 없으면 0 정산', async () => {
    const e = await makeHost({ id: 'h1', payoutCycle: 'D7' }, []).earnings('u1')
    expect(e.totals.count).toBe(0)
    expect(e.upcoming).toHaveLength(0)
  })

  it('net=총액−수수료−보장료 / COMPLETED·pending 분리 / upcoming 정산일·byMonth 귀속', async () => {
    const svc = makeHost({ id: 'h1', payoutCycle: 'D7' }, [
      {
        id: 'r1',
        code: 'OFH1',
        status: 'COMPLETED',
        totalKRW: 300000,
        feeKRW: 36000,
        protectionFeeKRW: 10000, // 보장료는 호스트 순수입에서 빠진다
        startAt: new Date('2026-05-10T20:00:00Z'),
        endAt: new Date('2026-05-10T23:00:00Z'),
        checkedOutAt: new Date('2026-05-10T23:30:00Z'),
        space: { title: '루프탑' },
      },
      {
        id: 'r2',
        code: 'OFH2',
        status: 'COMPLETED',
        totalKRW: 200000,
        feeKRW: 24000,
        protectionFeeKRW: 0,
        startAt: new Date('2026-04-10T20:00:00Z'), // 지난달 → thisMonth 제외
        endAt: new Date('2026-04-10T23:00:00Z'),
        checkedOutAt: new Date('2026-04-10T23:30:00Z'),
        space: { title: '주방' },
      },
      {
        id: 'r3',
        code: 'OFH3',
        status: 'PAID', // 미완료 → pending, allTime 제외
        totalKRW: 100000,
        feeKRW: 12000,
        protectionFeeKRW: 5000,
        startAt: new Date('2026-05-20T20:00:00Z'),
        endAt: new Date('2026-05-20T23:00:00Z'),
        checkedOutAt: null,
        space: { title: '라운지' },
      },
    ])
    const e = await svc.earnings('u1')
    // net: r1 254000(=300000−36000−10000), r2 176000, r3 83000
    expect(e.totals.allTimeNetKRW).toBe(430000) // COMPLETED 만 254000 + 176000
    expect(e.totals.thisMonthNetKRW).toBe(254000) // 5월 COMPLETED 만 (r1)
    expect(e.totals.pendingNetKRW).toBe(83000) // 미완료 r3
    expect(e.totals.count).toBe(2) // COMPLETED 건수

    // upcoming: r1(정산 5/17 미래) + r3(미완료) — r2(정산 4/17 과거 & COMPLETED) 제외, payoutAt asc
    expect(e.upcoming.map((u) => u.reservationId)).toEqual(['r1', 'r3'])
    expect(e.upcoming[0].netKRW).toBe(254000)
    // r1 payoutAt = checkedOutAt(5/10) + 7일 = 5/17
    expect(e.upcoming[0].payoutAt.startsWith('2026-05-17')).toBe(true)

    // byMonth: 6개월 버킷, COMPLETED startAt 월 귀속
    expect(e.byMonth).toHaveLength(6)
    expect(e.byMonth.find((m) => m.month === '2026-05')?.netKRW).toBe(254000)
    expect(e.byMonth.find((m) => m.month === '2026-04')?.netKRW).toBe(176000)
  })

  it('D14 정산 주기는 14일 뒤가 정산일', async () => {
    const svc = makeHost({ id: 'h1', payoutCycle: 'D14' }, [
      {
        id: 'r1',
        code: 'OFH1',
        status: 'PAID',
        totalKRW: 100000,
        feeKRW: 12000,
        protectionFeeKRW: 0,
        startAt: new Date('2026-05-20T20:00:00Z'),
        endAt: new Date('2026-05-20T23:00:00Z'),
        checkedOutAt: null,
        space: { title: '라운지' },
      },
    ])
    const e = await svc.earnings('u1')
    // payoutAt = endAt(5/20) + 14일 = 6/3
    expect(e.upcoming[0].payoutAt.startsWith('2026-06-03')).toBe(true)
  })
})
