import { z } from 'zod'
import { RoleSchema } from './enums'

export const DashboardKpiSchema = z.object({
  gmvTodayKRW: z.number(),
  gmvYesterdayKRW: z.number(),
  reservationsToday: z.number(),
  reservationsActive: z.number(),
  disputesOpen: z.number(),
  newGuestsToday: z.number(),
  newHostsToday: z.number(),
  conversionRate: z.number(),
  avgApprovalMin: z.number(),
  openReports: z.number(),
})
export type DashboardKpi = z.infer<typeof DashboardKpiSchema>

export const TimeSeriesPointSchema = z.object({
  date: z.string(),
  value: z.number(),
})
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>

export const CategoryShareSchema = z.object({
  category: z.string(),
  value: z.number(),
})
export type CategoryShare = z.infer<typeof CategoryShareSchema>

export const SetRoleSchema = z.object({
  role: RoleSchema,
})
export type SetRoleInput = z.infer<typeof SetRoleSchema>

export const SetSuspendedSchema = z.object({
  suspended: z.boolean(),
  reason: z.string().trim().max(500).optional(),
})
export type SetSuspendedInput = z.infer<typeof SetSuspendedSchema>

export const AdminUserRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: RoleSchema,
  isSuspended: z.boolean(),
  isVerified: z.boolean(),
  trustScore: z.number(),
  createdAt: z.string(),
  reservationCount: z.number(),
})
export type AdminUserRow = z.infer<typeof AdminUserRowSchema>

export const AuditLogRowSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  ip: z.string().nullable(),
  createdAt: z.string(),
})
export type AuditLogRow = z.infer<typeof AuditLogRowSchema>

export const BroadcastNotificationSchema = z.object({
  audience: z.enum(['ALL', 'GUESTS', 'HOSTS', 'SUSPENDED']),
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(2000),
})
export type BroadcastNotificationInput = z.infer<typeof BroadcastNotificationSchema>
