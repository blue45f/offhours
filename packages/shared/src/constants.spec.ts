import { describe, expect, it } from 'vitest'

import {
  calcRefundRate,
  earnedPoints,
  formatKRW,
  HHmmToMinutes,
  minutesToHHmm,
  PLATFORM_FEE_RATE,
  purposeMultiplier,
} from './constants'

describe('calcRefundRate', () => {
  const now = new Date('2026-06-01T00:00:00Z')

  it('7일 이전 취소는 100% 환불', () => {
    expect(calcRefundRate(new Date('2026-06-10T00:00:00Z'), now)).toBe(1)
  })

  it('3일 이전 취소는 50% 환불', () => {
    expect(calcRefundRate(new Date('2026-06-05T00:00:00Z'), now)).toBe(0.5)
  })

  it('1일 이전 취소는 20% 환불', () => {
    expect(calcRefundRate(new Date('2026-06-02T12:00:00Z'), now)).toBe(0.2)
  })

  it('당일 취소는 환불 없음', () => {
    expect(calcRefundRate(new Date('2026-06-01T06:00:00Z'), now)).toBe(0)
  })

  it('FLEXIBLE: 24시간 전 100%, 이내 50%', () => {
    expect(calcRefundRate(new Date('2026-06-03T00:00:00Z'), now, 'FLEXIBLE')).toBe(1)
    expect(calcRefundRate(new Date('2026-06-01T12:00:00Z'), now, 'FLEXIBLE')).toBe(0.5)
  })

  it('STRICT: 3일 이내 환불 불가, 3일 전은 50%', () => {
    expect(calcRefundRate(new Date('2026-06-03T00:00:00Z'), now, 'STRICT')).toBe(0)
    expect(calcRefundRate(new Date('2026-06-05T00:00:00Z'), now, 'STRICT')).toBe(0.5)
  })
})

describe('time helpers', () => {
  it('minutesToHHmm', () => {
    expect(minutesToHHmm(0)).toBe('00:00')
    expect(minutesToHHmm(90)).toBe('01:30')
    expect(minutesToHHmm(1320)).toBe('22:00')
  })
  it('HHmmToMinutes', () => {
    expect(HHmmToMinutes('22:00')).toBe(1320)
  })
})

describe('formatKRW', () => {
  it('숫자에 천단위 콤마와 원', () => {
    expect(formatKRW(120000)).toBe('120,000원')
  })
})

describe('PLATFORM_FEE_RATE', () => {
  it('수수료율은 12%', () => {
    expect(PLATFORM_FEE_RATE).toBe(0.12)
  })
})

describe('earnedPoints', () => {
  it('실 결제액의 2% 적립(반올림)', () => {
    expect(earnedPoints(0)).toBe(0)
    expect(earnedPoints(300_000)).toBe(6_000)
    expect(earnedPoints(125_000)).toBe(2_500)
  })
})

describe('purposeMultiplier', () => {
  it('파티·웨딩·팝업은 할증, 미팅·기타는 기본가', () => {
    expect(purposeMultiplier('PARTY')).toBe(1.15)
    expect(purposeMultiplier('WEDDING')).toBe(1.2)
    expect(purposeMultiplier('POPUP')).toBe(1.1)
    expect(purposeMultiplier('MEETING')).toBe(1.0)
    expect(purposeMultiplier('OTHER')).toBe(1.0)
  })
})
