import { describe, expect, it } from 'vitest'
import { creditBonus } from './corporate'

describe('creditBonus', () => {
  it('충전 구간별 보너스 — 100만↑ 5% / 300만↑ 8% / 500만↑ 10%', () => {
    expect(creditBonus(500_000)).toBe(0)
    expect(creditBonus(1_000_000)).toBe(50_000)
    expect(creditBonus(3_000_000)).toBe(240_000)
    expect(creditBonus(5_000_000)).toBe(500_000)
  })
})
