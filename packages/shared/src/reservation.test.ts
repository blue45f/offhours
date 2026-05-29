import { describe, expect, it } from 'vitest'
import { calcReservationFee, payableKRW } from './reservation'

describe('calcReservationFee', () => {
  it('총액의 12%(반올림)', () => {
    expect(calcReservationFee(100000)).toBe(12000)
    expect(calcReservationFee(125000)).toBe(15000)
  })
})

describe('payableKRW', () => {
  const base = { totalKRW: 300000, depositKRW: 0, creditAppliedKRW: 0, pointsAppliedKRW: 0 }

  it('보증금은 더하고 크레딧·포인트는 뺀다', () => {
    expect(payableKRW({ ...base, depositKRW: 100000 })).toBe(400000)
    expect(payableKRW({ ...base, creditAppliedKRW: 50000 })).toBe(250000)
    expect(payableKRW({ ...base, pointsAppliedKRW: 20000 })).toBe(280000)
    expect(
      payableKRW({
        totalKRW: 300000,
        depositKRW: 100000,
        creditAppliedKRW: 50000,
        pointsAppliedKRW: 20000,
      })
    ).toBe(330000)
  })

  it('음수가 되지 않는다', () => {
    expect(payableKRW({ ...base, creditAppliedKRW: 999999 })).toBe(0)
  })
})
