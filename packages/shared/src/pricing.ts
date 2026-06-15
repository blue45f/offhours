import { z } from 'zod'

export const PricingRuleSchema = z.object({
  id: z.string(),
  label: z.string(),
  multiplier: z.number(),
  weekdayMask: z.number().int().min(0).max(127),
  startMinute: z.number().int().min(0).max(1440),
  endMinute: z.number().int().min(0).max(2880),
  priority: z.number().int(),
})
export type PricingRule = z.infer<typeof PricingRuleSchema>

export const CreatePricingRuleSchema = z.object({
  label: z.string().trim().min(1).max(40),
  multiplier: z.number().min(0.1).max(10),
  weekdayMask: z.number().int().min(0).max(127),
  startMinute: z.number().int().min(0).max(1440),
  endMinute: z.number().int().min(0).max(2880),
  priority: z.number().int().min(0).max(100).default(0),
})
export type CreatePricingRuleInput = z.infer<typeof CreatePricingRuleSchema>

export function weekdayMaskFromArray(days: number[]): number {
  return days.reduce((mask, d) => mask | (1 << d), 0)
}

export function arrayFromWeekdayMask(mask: number): number[] {
  return Array.from({ length: 7 }, (_, i) => i).filter((i) => (mask & (1 << i)) !== 0)
}

/** 게스트에게 노출하는 동적 가격 한 줄 요약 — "주말 야간 +20%" 형태 */
export const PricingTierSchema = z.object({
  label: z.string(),
  /** 기본가 대비 증감률(%) — 양수=할증, 음수=할인. 0이면 동일 */
  deltaPct: z.number().int(),
})
export type PricingTier = z.infer<typeof PricingTierSchema>

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function describeWeekdays(mask: number): string {
  const days = arrayFromWeekdayMask(mask)
  if (days.length === 0 || days.length === 7) return '매일'
  if (days.length === 2 && days.includes(0) && days.includes(6)) return '주말'
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) return '평일'
  return days.map((d) => WEEKDAY_LABELS[d]).join('·')
}

function describeWindow(startMinute: number, endMinute: number): string {
  const full = startMinute <= 0 && endMinute >= 1440
  if (full) return ''
  const fmt = (m: number) => {
    const norm = ((m % 1440) + 1440) % 1440
    const h = Math.floor(norm / 60)
    const mm = norm % 60
    return mm === 0 ? `${h}시` : `${h}:${String(mm).padStart(2, '0')}`
  }
  // 심야(자정 인근 시작·익일 종료) 구간은 "야간"으로 자연스럽게 표기
  if (startMinute >= 21 * 60 || endMinute > 1440) return '야간'
  return `${fmt(startMinute)}~${fmt(endMinute)}`
}

/**
 * 원시 PricingRule[] 를 게스트용 요약 티어로 변환한다.
 * 우선순위 높은 순 → 동일 라벨 중복 제거 → 기본가와 같은(배수 1) 규칙 제외.
 */
export function summarizePricingRules(
  rules: Array<
    Pick<PricingTier, never> & {
      label?: string
      multiplier: number
      weekdayMask: number
      startMinute: number
      endMinute: number
      priority: number
    }
  >
): PricingTier[] {
  const seen = new Set<string>()
  return rules
    .filter((r) => Math.abs(r.multiplier - 1) > 0.001)
    .sort((a, b) => b.priority - a.priority || b.multiplier - a.multiplier)
    .map((r) => {
      const days = describeWeekdays(r.weekdayMask)
      const window = describeWindow(r.startMinute, r.endMinute)
      const label =
        (r.label && r.label.trim()) || [days, window].filter(Boolean).join(' ') || '특정 시간'
      const deltaPct = Math.round((r.multiplier - 1) * 100)
      return { label, deltaPct }
    })
    .filter((t) => {
      if (seen.has(t.label)) return false
      seen.add(t.label)
      return true
    })
}
