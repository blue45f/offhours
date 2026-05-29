import { z } from 'zod'

export const CorporateTaxTypeSchema = z.enum(['GENERAL', 'TAX_FREE'])
export type CorporateTaxType = z.infer<typeof CorporateTaxTypeSchema>

export const CorporateTaxTypeLabel: Record<CorporateTaxType, string> = {
  GENERAL: '일반과세자',
  TAX_FREE: '면세사업자',
}

const BIZ_NUMBER_PATTERN = /^\d{3}-\d{2}-\d{5}$/

export const UpsertCorporateProfileSchema = z.object({
  companyName: z.string().trim().min(1).max(60),
  businessNumber: z.string().trim().regex(BIZ_NUMBER_PATTERN, '사업자번호 형식: 000-00-00000'),
  ceoName: z.string().trim().min(1).max(20),
  billingEmail: z.string().email(),
  taxOfficeAddress: z.string().trim().max(200).optional(),
  taxPayer: CorporateTaxTypeSchema.default('GENERAL'),
})
export type UpsertCorporateProfileInput = z.infer<typeof UpsertCorporateProfileSchema>

export const CorporateProfileSchema = UpsertCorporateProfileSchema.extend({
  id: z.string(),
  createdAt: z.string(),
})
export type CorporateProfile = z.infer<typeof CorporateProfileSchema>

/** 예약에 동결된 법인 정보 스냅샷 — 결제 후 회사 정보가 바뀌어도 영수증은 그대로. */
export const CorporateReservationSnapshotSchema = z.object({
  companyName: z.string(),
  businessNumber: z.string(),
  ceoName: z.string(),
  billingEmail: z.string(),
  taxPayer: CorporateTaxTypeSchema,
})
export type CorporateReservationSnapshot = z.infer<typeof CorporateReservationSnapshotSchema>
