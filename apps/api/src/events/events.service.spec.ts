import { describe, expect, it, vi } from 'vitest'

import { EventsService } from './events.service'

/**
 * 이벤트 RSVP 회귀 방지 — 본인 응답(mine)은 이름이 아니라 viewer 의 clientToken 으로 판정한다
 * (동명이인 오인·중복 방지). 참석 집계(counts)도 함께 검증.
 */
function makeEvents(rsvps: any[]) {
  const reservation = {
    code: 'OFH1',
    status: 'PAID',
    startAt: new Date('2026-06-10T11:00:00Z'),
    endAt: new Date('2026-06-10T14:00:00Z'),
    headcount: 20,
    purpose: 'PARTY',
    space: {
      title: '루프탑 라운지',
      photos: [{ url: 'https://img/1.jpg' }],
      venue: { region: '서울', district: '강남구', host: { user: { name: '호스트' } } },
    },
    rsvps,
  }
  const prisma: any = {
    reservation: { findUnique: vi.fn().mockResolvedValue(reservation) },
  }
  return new EventsService(prisma)
}

const rsvps = [
  {
    id: 'a',
    name: '민수',
    status: 'GOING',
    createdAt: new Date('2026-06-01T00:00:00Z'),
    clientToken: 'tok-A',
  },
  {
    id: 'b',
    name: '민수',
    status: 'MAYBE',
    createdAt: new Date('2026-06-02T00:00:00Z'),
    clientToken: 'tok-B',
  },
  {
    id: 'c',
    name: '지영',
    status: 'NO',
    createdAt: new Date('2026-06-03T00:00:00Z'),
    clientToken: 'tok-C',
  },
]

describe('EventsService.getByCode', () => {
  it('viewer 토큰과 일치하는 응답만 mine=true (동명이인 b 는 false)', async () => {
    const svc = makeEvents(rsvps)
    const e = await svc.getByCode('OFH1', 'tok-A')
    expect(e.rsvps.find((r) => r.id === 'a')?.mine).toBe(true)
    expect(e.rsvps.find((r) => r.id === 'b')?.mine).toBe(false) // 같은 이름(민수)이지만 토큰 다름
    expect(e.rsvps.find((r) => r.id === 'c')?.mine).toBe(false)
  })

  it('viewer 토큰이 없으면 전부 mine=false', async () => {
    const svc = makeEvents(rsvps)
    const e = await svc.getByCode('OFH1')
    expect(e.rsvps.every((r) => r.mine === false)).toBe(true)
  })

  it('참석 상태 집계(counts)', async () => {
    const svc = makeEvents(rsvps)
    const e = await svc.getByCode('OFH1', 'tok-A')
    expect(e.counts).toEqual({ going: 1, maybe: 1, no: 1 })
  })
})
