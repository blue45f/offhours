import { describe, expect, it } from 'vitest'

import { arrayFromWeekdayMask, paginated, weekdayMaskFromArray } from './index'

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
