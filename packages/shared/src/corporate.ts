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
  /** 영업 외 크레딧 잔액 (B2B 선충전 멤버십) */
  creditBalanceKRW: z.number().default(0),
  createdAt: z.string(),
})
export type CorporateProfile = z.infer<typeof CorporateProfileSchema>

/**
 * 영업 외 크레딧 — 기업이 워크샵·팀빌딩 예약용 크레딧을 선충전하면 충전액에 따라 보너스
 * 크레딧을 적립(수요 선약속 → 콜드스타트 완화). 예약 시 결제액에서 차감. Spacebase Business
 * 의 기업 멤버십을 영업 외 대관에 맞춘 것 — 스페이스클라우드/아워플레이스엔 없음.
 */
export const CREDIT_BONUS_TIERS = [
  { min: 5_000_000, rate: 0.1 },
  { min: 3_000_000, rate: 0.08 },
  { min: 1_000_000, rate: 0.05 },
] as const

export function creditBonus(amountKRW: number): number {
  for (const t of CREDIT_BONUS_TIERS) {
    if (amountKRW >= t.min) return Math.round(amountKRW * t.rate)
  }
  return 0
}

export const TopupCreditSchema = z.object({
  amountKRW: z.number().int().min(100_000).max(50_000_000),
})
export type TopupCreditInput = z.infer<typeof TopupCreditSchema>

/** 예약에 동결된 법인 정보 스냅샷 — 결제 후 회사 정보가 바뀌어도 영수증은 그대로. */
export const CorporateReservationSnapshotSchema = z.object({
  companyName: z.string(),
  businessNumber: z.string(),
  ceoName: z.string(),
  billingEmail: z.string(),
  taxPayer: CorporateTaxTypeSchema,
})
export type CorporateReservationSnapshot = z.infer<typeof CorporateReservationSnapshotSchema>
