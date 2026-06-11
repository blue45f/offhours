import { z } from 'zod'
import { DisputeKindSchema, DisputeStatusSchema, RoleSchema } from './enums'

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

/** 관리자 분쟁·보장 청구 큐 행 — 파손 청구(DAMAGE) 포함, 증빙 사진은 체크아웃 사진. */
export const DisputeRowSchema = z.object({
  id: z.string(),
  reservationId: z.string(),
  reservationCode: z.string(),
  spaceTitle: z.string(),
  kind: DisputeKindSchema,
  reason: z.string(),
  description: z.string(),
  amountClaimedKRW: z.number().nullable(),
  coverageKRW: z.number().nullable(),
  status: DisputeStatusSchema,
  resolution: z.string().nullable(),
  raisedByName: z.string(),
  evidencePhotoUrls: z.array(z.string()).default([]),
  createdAt: z.string(),
})
export type DisputeRow = z.infer<typeof DisputeRowSchema>

export const ResolveDisputeSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'RESOLVED_FAVOR_GUEST', 'RESOLVED_FAVOR_HOST', 'DISMISSED']),
  resolution: z.string().trim().max(1000).optional(),
})
export type ResolveDisputeInput = z.infer<typeof ResolveDisputeSchema>

/**
 * 신고된 후기·채팅 메시지 모더레이션 — 삭제 대신 숨김(흐름 보존) + 첨부 제거.
 * 숨김 해제를 위해 hidden 은 boolean 으로 받는다.
 */
export const ModerateContentSchema = z
  .object({
    hidden: z.boolean().optional(),
    stripAttachments: z.boolean().optional(),
  })
  .refine((v) => v.hidden !== undefined || v.stripAttachments === true, {
    message: '숨김 여부 또는 첨부 제거 중 하나는 지정해야 해요',
  })
export type ModerateContentInput = z.infer<typeof ModerateContentSchema>

/** 신고 큐에서 대상 내용을 바로 보고 처리하기 위한 타깃 미리보기 */
export const ReportTargetSummarySchema = z.object({
  excerpt: z.string().nullable(),
  authorName: z.string().nullable(),
  isHidden: z.boolean().nullable(),
  attachmentCount: z.number().nullable(),
})
export type ReportTargetSummary = z.infer<typeof ReportTargetSummarySchema>
