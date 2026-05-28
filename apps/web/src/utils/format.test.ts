import { afterEach, describe, expect, it, vi } from 'vitest'

import { formatKRWShort, timeFromNow } from './format'

describe('format utilities', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats compact Korean won amounts', () => {
    expect(formatKRWShort(125_000)).toBe('13만')
    expect(formatKRWShort(150_000_000)).toBe('1.5억')
  })

  it('formats relative time from the current clock', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))

    expect(timeFromNow('2024-01-01T00:30:00.000Z')).toBe('30분 뒤')
    expect(timeFromNow('2023-12-31T22:00:00.000Z')).toBe('2시간 전')
  })
})
