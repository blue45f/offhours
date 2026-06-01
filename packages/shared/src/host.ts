import { z } from 'zod'
import { PayoutCycleSchema, TaxTypeSchema } from './enums'

export const BusinessNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{3}-?\d{2}-?\d{5}$/, '사업자등록번호 형식이 올바르지 않아요')
  .transform((v) => v.replace(/-/g, ''))

export const CreateHostProfileSchema = z.object({
  businessName: z.string().trim().min(1, '상호명을 입력해주세요').max(80),
  businessNumber: BusinessNumberSchema,
  businessLicenseUrl: z.string().url().optional(),
  taxType: TaxTypeSchema.default('INDIVIDUAL'),
  bankName: z.string().trim().min(1).max(20),
  bankAccount: z.string().trim().min(8).max(30),
  payoutCycle: PayoutCycleSchema.default('D7'),
})
export type CreateHostProfileInput = z.infer<typeof CreateHostProfileSchema>

export const UpdateHostProfileSchema = CreateHostProfileSchema.partial()
export type UpdateHostProfileInput = z.infer<typeof UpdateHostProfileSchema>

export const HostProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessName: z.string(),
  businessNumber: z.string(),
  // 정산 은행명은 프로필 편집 시 복원에 필요(미반환 시 토스뱅크로 덮어쓰는 버그). 계좌번호는 민감해 미반환.
  bankName: z.string(),
  taxType: TaxTypeSchema,
  payoutCycle: PayoutCycleSchema,
  isInsured: z.boolean(),
  approvedAt: z.string().nullable(),
  createdAt: z.string(),
})
export type HostProfile = z.infer<typeof HostProfileSchema>
