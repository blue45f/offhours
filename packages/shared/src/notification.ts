import { z } from 'zod'
import { NotificationTypeSchema } from './enums'

export const NotificationSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.unknown()).nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
})
export type Notification = z.infer<typeof NotificationSchema>

export const MarkReadSchema = z.object({
  ids: z.array(z.string()).min(1),
})
export type MarkReadInput = z.infer<typeof MarkReadSchema>
