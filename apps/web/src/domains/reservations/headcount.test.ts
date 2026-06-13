import { describe, expect, it } from 'vitest'

import { defaultHeadcount } from './headcount'

describe('defaultHeadcount', () => {
  it('일반 공간은 기본 10명', () => {
    expect(defaultHeadcount(1, 50)).toBe(10)
  })

  it('작은 공간(정원 < 10)은 정원으로 클램프 — 정원 초과 기본값 방지', () => {
    expect(defaultHeadcount(1, 4)).toBe(4)
  })

  it('최소 인원이 10보다 크면 최소 인원', () => {
    expect(defaultHeadcount(20, 100)).toBe(20)
  })

  it('항상 [min, max] 범위 안', () => {
    for (const [min, max] of [
      [1, 1],
      [2, 8],
      [10, 10],
      [5, 200],
    ]) {
      const h = defaultHeadcount(min, max)
      expect(h).toBeGreaterThanOrEqual(min)
      expect(h).toBeLessThanOrEqual(max)
    }
  })
})
