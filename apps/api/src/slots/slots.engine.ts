import type { BusinessHour, Holiday, PricingRule, RepeatRule } from '@prisma/client'

const DAY_MINUTES = 24 * 60
const HOLIDAY_OPEN_MINUTE = 9 * 60
const HOLIDAY_CLOSE_MINUTE = 21 * 60
const NIGHT_END_MINUTE = 6 * 60

export interface SlotPlan {
  startAt: Date
  endAt: Date
  pricePerHourKRW: number
}

function startOfDayKST(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(-9, 0, 0, 0)
  return d
}

function addMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60 * 1000)
}

function isHoliday(date: Date, holidays: Holiday[]): boolean {
  const ymd = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`
  return holidays.some((h) => matchHoliday(date, h, ymd))
}

function matchHoliday(target: Date, h: Holiday, ymd: (d: Date) => string): boolean {
  const targetYmd = ymd(target)
  const hDate = new Date(h.date)
  const rule: RepeatRule = h.repeat
  if (rule === 'NONE') return ymd(hDate) === targetYmd
  if (rule === 'WEEKLY') return hDate.getUTCDay() === target.getUTCDay()
  if (rule === 'MONTHLY') return hDate.getUTCDate() === target.getUTCDate()
  return false
}

export function pricePerHour(
  basePriceKRW: number,
  rules: PricingRule[],
  startAt: Date,
  endAt: Date
): number {
  const weekday = startAt.getUTCDay()
  const startMin = startAt.getUTCHours() * 60 + startAt.getUTCMinutes()
  const endMin =
    endAt.getUTCHours() * 60 +
    endAt.getUTCMinutes() +
    (endAt.getUTCDate() !== startAt.getUTCDate() ? DAY_MINUTES : 0)
  const matched = rules
    .filter((r) => (r.weekdayMask & (1 << weekday)) !== 0)
    .filter((r) => overlaps(r.startMinute, r.endMinute, startMin, endMin))
    .sort((a, b) => b.priority - a.priority)[0]
  return Math.round(basePriceKRW * (matched?.multiplier ?? 1))
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

export function generateOffhoursPlans(opts: {
  fromDate: Date
  days: number
  businessHours: BusinessHour[]
  holidays: Holiday[]
  cleaningMinutes: number
  basePriceKRW: number
  pricingRules: PricingRule[]
}): SlotPlan[] {
  const { fromDate, days, businessHours, holidays, cleaningMinutes, basePriceKRW, pricingRules } =
    opts
  const plans: SlotPlan[] = []
  const bhMap = new Map<number, BusinessHour>(businessHours.map((b) => [b.weekday, b]))

  for (let i = 0; i < days; i++) {
    const day = startOfDayKST(addMinutes(fromDate, i * DAY_MINUTES))
    const weekday = day.getUTCDay()
    const holiday = isHoliday(day, holidays)
    const bh = bhMap.get(weekday)

    if (holiday || !bh) {
      const start = addMinutes(day, HOLIDAY_OPEN_MINUTE)
      const end = addMinutes(day, HOLIDAY_CLOSE_MINUTE)
      plans.push({
        startAt: start,
        endAt: end,
        pricePerHourKRW: pricePerHour(basePriceKRW, pricingRules, start, end),
      })
      continue
    }

    const nightStart = addMinutes(day, bh.closeMinute + cleaningMinutes)
    const nextDayStart = addMinutes(day, DAY_MINUTES)
    const nextBh = bhMap.get((weekday + 1) % 7)
    const nextOpen = nextBh
      ? addMinutes(nextDayStart, nextBh.openMinute)
      : addMinutes(nextDayStart, NIGHT_END_MINUTE)
    const latestEnd = addMinutes(nextOpen, -cleaningMinutes)
    if (latestEnd.getTime() > nightStart.getTime() + 60 * 60 * 1000) {
      plans.push({
        startAt: nightStart,
        endAt: latestEnd,
        pricePerHourKRW: pricePerHour(basePriceKRW, pricingRules, nightStart, latestEnd),
      })
    }
  }
  return plans
}
