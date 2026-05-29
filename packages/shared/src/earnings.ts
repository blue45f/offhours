import { z } from 'zod'

export const HostEarningsSchema = z.object({
  totals: z.object({
    thisMonthNetKRW: z.number(),
    pendingNetKRW: z.number(),
    allTimeNetKRW: z.number(),
    count: z.number(),
  }),
  upcoming: z.array(
    z.object({
      reservationId: z.string(),
      code: z.string(),
      spaceTitle: z.string(),
      startAt: z.string(),
      netKRW: z.number(),
      payoutAt: z.string(),
    })
  ),
  byMonth: z.array(
    z.object({
      month: z.string(),
      netKRW: z.number(),
    })
  ),
})

export type HostEarnings = z.infer<typeof HostEarningsSchema>
