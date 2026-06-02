import { describe, expect, it } from 'vitest'
import type { BusinessHour, PricingRule } from '@prisma/client'

import { generateOffhoursPlans, pricePerHour } from './slots.engine'

function bh(weekday: number, openMinute: number, closeMinute: number): BusinessHour {
  return { id: `bh${weekday}`, venueId: 'v', weekday, openMinute, closeMinute }
}

describe('generateOffhoursPlans', () => {
  it('휴무일에는 09:00~21:00 통대관 슬롯이 생성된다', () => {
    const monday = new Date('2026-06-01T00:00:00Z')
    const plans = generateOffhoursPlans({
      fromDate: monday,
      days: 1,
      businessHours: [],
      holidays: [],
      cleaningMinutes: 60,
      basePriceKRW: 50000,
      pricingRules: [],
    })
    expect(plans).toHaveLength(1)
    expect(plans[0].pricePerHourKRW).toBe(50000)
  })

  it('영업일에는 마감 + 청소시간 이후부터 야간 슬롯이 생성된다', () => {
    const monday = new Date('2026-06-01T00:00:00Z')
    const businessHours: BusinessHour[] = Array.from({ length: 7 }, (_, i) => bh(i, 600, 1320))
    const plans = generateOffhoursPlans({
      fromDate: monday,
      days: 1,
      businessHours,
      holidays: [],
      cleaningMinutes: 60,
      basePriceKRW: 50000,
      pricingRules: [],
    })
    expect(plans.length).toBeGreaterThanOrEqual(1)
  })
})

describe('pricePerHour', () => {
  it('매칭되는 동적 가격 룰이 없으면 베이스 가격', () => {
    const start = new Date('2026-06-01T20:00:00Z')
    const end = new Date('2026-06-01T22:00:00Z')
    expect(pricePerHour(50000, [], start, end)).toBe(50000)
  })

  it('우선순위가 높은 룰이 적용된다', () => {
    const start = new Date('2026-06-01T20:00:00Z')
    const end = new Date('2026-06-01T22:00:00Z')
    const rules: PricingRule[] = [
      {
        id: 'a',
        spaceId: 's',
        label: '+10%',
        multiplier: 1.1,
        weekdayMask: 0b1111111,
        startMinute: 0,
        endMinute: 24 * 60,
        priority: 0,
      },
      {
        id: 'b',
        spaceId: 's',
        label: '+50%',
        multiplier: 1.5,
        weekdayMask: 0b1111111,
        startMinute: 18 * 60,
        endMinute: 24 * 60,
        priority: 10,
      },
    ]
    expect(pricePerHour(50000, rules, start, end)).toBe(75000)
  })
})
