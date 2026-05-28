import { describe, expect, it } from 'vitest'

import {
  calcRefundRate,
  formatKRW,
  HHmmToMinutes,
  minutesToHHmm,
  PLATFORM_FEE_RATE,
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
