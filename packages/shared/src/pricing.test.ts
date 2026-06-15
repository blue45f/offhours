import { describe, expect, it } from 'vitest'

import {
  arrayFromWeekdayMask,
  paginated,
  summarizePricingRules,
  weekdayMaskFromArray,
} from './index'

describe('shared utilities', () => {
  it('round-trips weekday masks', () => {
    expect(arrayFromWeekdayMask(weekdayMaskFromArray([0, 2, 6]))).toEqual([0, 2, 6])
  })

  it('keeps paginated totalPages at least one', () => {
    expect(paginated([], 0, 1, 20)).toMatchObject({
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })
  })
})

describe('summarizePricingRules', () => {
  const weekend = weekdayMaskFromArray([0, 6])

  it('drops base-rate (multiplier 1) rules', () => {
    expect(
      summarizePricingRules([
        { multiplier: 1, weekdayMask: 127, startMinute: 0, endMinute: 1440, priority: 0 },
      ])
    ).toEqual([])
  })

  it('emits delta percentages and prefers explicit labels', () => {
    const tiers = summarizePricingRules([
      {
        label: '주말 야간',
        multiplier: 1.2,
        weekdayMask: weekend,
        startMinute: 22 * 60,
        endMinute: 1740,
        priority: 10,
      },
    ])
    expect(tiers).toEqual([{ label: '주말 야간', deltaPct: 20 }])
  })

  it('sorts by priority then multiplier and de-dupes labels', () => {
    const tiers = summarizePricingRules([
      {
        label: '주말',
        multiplier: 1.1,
        weekdayMask: weekend,
        startMinute: 0,
        endMinute: 1440,
        priority: 1,
      },
      {
        label: '주말',
        multiplier: 1.3,
        weekdayMask: weekend,
        startMinute: 0,
        endMinute: 1440,
        priority: 5,
      },
    ])
    expect(tiers).toEqual([{ label: '주말', deltaPct: 30 }])
  })

  it('derives a label from weekday/window when none given', () => {
    const tiers = summarizePricingRules([
      {
        multiplier: 1.15,
        weekdayMask: weekend,
        startMinute: 22 * 60,
        endMinute: 1740,
        priority: 0,
      },
    ])
    expect(tiers[0]).toMatchObject({ deltaPct: 15 })
    expect(tiers[0].label).toContain('주말')
  })
})
