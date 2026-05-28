import { z } from 'zod'

export const SplitMemberStatusSchema = z.enum(['PENDING', 'PAID', 'CANCELED'])
export type SplitMemberStatus = z.infer<typeof SplitMemberStatusSchema>

export const SplitMemberStatusLabel: Record<SplitMemberStatus, string> = {
  PENDING: '대기 중',
  PAID: '송금 완료',
  CANCELED: '취소',
}

export const CreateSplitSchema = z.object({
  memberCount: z.coerce.number().int().min(2).max(20),
  note: z.string().trim().max(200).optional(),
  labels: z.array(z.string().trim().max(20)).max(20).optional(),
})
export type CreateSplitInput = z.infer<typeof CreateSplitSchema>

export const SplitMemberSchema = z.object({
  id: z.string(),
  idx: z.number(),
  token: z.string(),
  label: z.string().nullable(),
  status: SplitMemberStatusSchema,
  paidAt: z.string().nullable(),
})
export type SplitMember = z.infer<typeof SplitMemberSchema>

export const SplitDetailSchema = z.object({
  id: z.string(),
  reservationId: z.string(),
  memberCount: z.number(),
  perMemberKRW: z.number(),
  paidCount: z.number(),
  note: z.string().nullable(),
  createdAt: z.string(),
  members: z.array(SplitMemberSchema),
})
export type SplitDetail = z.infer<typeof SplitDetailSchema>

export const PublicSplitInfoSchema = z.object({
  spaceTitle: z.string(),
  reservationCode: z.string(),
  hostName: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  headcount: z.number(),
  totalKRW: z.number(),
  memberCount: z.number(),
  perMemberKRW: z.number(),
  paidCount: z.number(),
  payerName: z.string(),
  /** 이 멤버 슬롯 */
  member: SplitMemberSchema,
})
export type PublicSplitInfo = z.infer<typeof PublicSplitInfoSchema>
