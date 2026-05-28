import { z } from 'zod'
import { ReportReasonSchema, ReportStatusSchema, ReportTargetSchema } from './enums'

export const CreateReportSchema = z.object({
  targetType: ReportTargetSchema,
  targetId: z.string().min(1),
  reason: ReportReasonSchema,
  description: z.string().trim().min(10).max(2000),
})
export type CreateReportInput = z.infer<typeof CreateReportSchema>

export const ReportSchema = z.object({
  id: z.string(),
  reporterId: z.string(),
  targetType: ReportTargetSchema,
  targetId: z.string(),
  reason: ReportReasonSchema,
  description: z.string(),
  status: ReportStatusSchema,
  resolution: z.string().nullable(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
})
export type Report = z.infer<typeof ReportSchema>

export const ResolveReportSchema = z.object({
  status: ReportStatusSchema,
  resolution: z.string().trim().min(2).max(1000),
})
export type ResolveReportInput = z.infer<typeof ResolveReportSchema>
