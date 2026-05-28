import { z } from 'zod'

export const SlotSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  priceKRW: z.number(),
  isOpen: z.boolean(),
  isReserved: z.boolean().default(false),
})
export type Slot = z.infer<typeof SlotSchema>

export const DaySlotsSchema = z.object({
  date: z.string(),
  slots: z.array(SlotSchema),
})
export type DaySlots = z.infer<typeof DaySlotsSchema>

export const AvailabilityQuerySchema = z.object({
  from: z.string(),
  to: z.string(),
})
export type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>
