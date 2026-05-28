import { z } from 'zod'

export const BlockSourceSchema = z.enum(['MANUAL', 'EXTERNAL'])
export type BlockSource = z.infer<typeof BlockSourceSchema>

export const BlockSourceLabel: Record<BlockSource, string> = {
  MANUAL: '수동 차단',
  EXTERNAL: '외부 캘린더',
}

export const CreateManualBlockSchema = z
  .object({
    venueId: z.string().min(1),
    label: z.string().trim().min(1).max(80),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    color: z.string().max(20).optional(),
  })
  .refine((d) => new Date(d.endAt) > new Date(d.startAt), {
    message: '종료 시각은 시작 이후여야 해요',
    path: ['endAt'],
  })
export type CreateManualBlockInput = z.infer<typeof CreateManualBlockSchema>

export const ConnectExternalCalendarSchema = z.object({
  venueId: z.string().min(1),
  label: z.string().trim().min(1).max(40),
  icsUrl: z.string().url(),
  color: z.string().max(20).optional(),
})
export type ConnectExternalCalendarInput = z.infer<typeof ConnectExternalCalendarSchema>

export const VenueBlockSchema = z.object({
  id: z.string(),
  venueId: z.string(),
  venueName: z.string(),
  label: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  source: BlockSourceSchema,
  externalCalendarId: z.string().nullable(),
  externalCalendarLabel: z.string().nullable(),
  color: z.string().nullable(),
})
export type VenueBlock = z.infer<typeof VenueBlockSchema>

export const ExternalCalendarSchema = z.object({
  id: z.string(),
  venueId: z.string(),
  venueName: z.string(),
  label: z.string(),
  icsUrl: z.string(),
  color: z.string().nullable(),
  lastSyncedAt: z.string().nullable(),
  lastError: z.string().nullable(),
  blockCount: z.number(),
})
export type ExternalCalendar = z.infer<typeof ExternalCalendarSchema>

export const HostCalendarOverviewSchema = z.object({
  blocks: z.array(VenueBlockSchema),
  calendars: z.array(ExternalCalendarSchema),
})
export type HostCalendarOverview = z.infer<typeof HostCalendarOverviewSchema>
