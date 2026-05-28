import { z } from 'zod'

export const PricingRuleSchema = z.object({
  id: z.string(),
  label: z.string(),
  multiplier: z.number(),
  weekdayMask: z.number().int().min(0).max(127),
  startMinute: z.number().int().min(0).max(1440),
  endMinute: z.number().int().min(0).max(2880),
  priority: z.number().int(),
})
export type PricingRule = z.infer<typeof PricingRuleSchema>

export const CreatePricingRuleSchema = z.object({
  label: z.string().trim().min(1).max(40),
  multiplier: z.number().min(0.1).max(10),
  weekdayMask: z.number().int().min(0).max(127),
  startMinute: z.number().int().min(0).max(1440),
  endMinute: z.number().int().min(0).max(2880),
  priority: z.number().int().min(0).max(100).default(0),
})
export type CreatePricingRuleInput = z.infer<typeof CreatePricingRuleSchema>

export function weekdayMaskFromArray(days: number[]): number {
  return days.reduce((mask, d) => mask | (1 << d), 0)
}

export function arrayFromWeekdayMask(mask: number): number[] {
  return Array.from({ length: 7 }, (_, i) => i).filter((i) => (mask & (1 << i)) !== 0)
}
