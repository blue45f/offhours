import { z } from 'zod'

export const AddonUnitSchema = z.enum(['PER_BOOKING', 'PER_HOUR', 'PER_PERSON'])
export type AddonUnit = z.infer<typeof AddonUnitSchema>

export const AddonCategorySchema = z.enum([
  'EQUIPMENT',
  'CATERING',
  'SETUP',
  'STAFF',
  'CLEANING',
  'OTHER',
])
export type AddonCategory = z.infer<typeof AddonCategorySchema>

export const AddonUnitLabel: Record<AddonUnit, string> = {
  PER_BOOKING: '건당',
  PER_HOUR: '시간당',
  PER_PERSON: '인당',
}

export const AddonCategoryLabel: Record<AddonCategory, string> = {
  EQUIPMENT: '장비',
  CATERING: '케이터링',
  SETUP: '데코·세팅',
  STAFF: '인력',
  CLEANING: '청소·정리',
  OTHER: '기타',
}

/** 공간 상세 예약 패널에서 노출되는 유료 옵션 카드 */
export const SpaceAddonSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  priceKRW: z.number(),
  unit: AddonUnitSchema,
  category: AddonCategorySchema,
})
export type SpaceAddon = z.infer<typeof SpaceAddonSchema>

/** 예약 시 게스트가 선택한 옵션 — { addonId, qty } */
export const AddonSelectionSchema = z.object({
  addonId: z.string().min(1),
  qty: z.number().int().min(1).max(500),
})
export type AddonSelection = z.infer<typeof AddonSelectionSchema>

/** 견적·예약에 동결되는 옵션 라인아이템 스냅샷 */
export const AddonLineSchema = z.object({
  addonId: z.string(),
  name: z.string(),
  unit: AddonUnitSchema,
  qty: z.number(),
  unitPriceKRW: z.number(),
  amountKRW: z.number(),
})
export type AddonLine = z.infer<typeof AddonLineSchema>

/**
 * 옵션 금액 계산 — 서버 견적과 클라이언트 프리뷰가 동일한 결과를 내도록 공유한다.
 * PER_HOUR 만 예약 시간(시간)을 곱하고, PER_BOOKING·PER_PERSON 은 수량만 곱한다.
 */
export function addonAmount(unit: AddonUnit, priceKRW: number, qty: number, hours: number): number {
  if (unit === 'PER_HOUR') return priceKRW * qty * Math.max(1, hours)
  return priceKRW * qty
}
