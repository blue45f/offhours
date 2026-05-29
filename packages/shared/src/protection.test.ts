import { describe, expect, it } from 'vitest'
import { protectionCoverage, protectionFee } from './protection'

describe('protectionFee', () => {
  it('NONE 은 보장료가 0', () => {
    expect(protectionFee('NONE', 1_000_000)).toBe(0)
  })

  it('STANDARD 는 공간 이용료의 4%, 단 최소 보장료(9,900) 로 방어', () => {
    expect(protectionFee('STANDARD', 1_000_000)).toBe(40_000)
    expect(protectionFee('STANDARD', 100_000)).toBe(9_900) // 4% = 4,000 < 9,900
  })

  it('PREMIUM 는 공간 이용료의 6%, 단 최소 보장료(19,900) 로 방어', () => {
    expect(protectionFee('PREMIUM', 1_000_000)).toBe(60_000)
    expect(protectionFee('PREMIUM', 200_000)).toBe(19_900) // 6% = 12,000 < 19,900
  })
})

describe('protectionCoverage', () => {
  it('등급별 보장 한도', () => {
    expect(protectionCoverage('NONE')).toBe(0)
    expect(protectionCoverage('STANDARD')).toBe(5_000_000)
    expect(protectionCoverage('PREMIUM')).toBe(20_000_000)
  })
})
