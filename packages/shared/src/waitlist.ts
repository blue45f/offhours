import { z } from 'zod'

export const JoinWaitlistSchema = z.object({
  desiredDate: z.string().datetime().optional(),
})
export type JoinWaitlistInput = z.infer<typeof JoinWaitlistSchema>

export const WaitlistStatusSchema = z.object({
  count: z.number(),
  joined: z.boolean(),
})
export type WaitlistStatus = z.infer<typeof WaitlistStatusSchema>
