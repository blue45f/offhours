import { z } from 'zod'
import { DisputeKindSchema, DisputeStatusSchema } from './enums'
import type { ProtectionTier } from './enums'

/**
 * 안심 보장 플랜 — 영업 중인 가게를 통째로 빌려주는 영업 외 대관의 #1 진입장벽인
 * "기물 파손·도난 공포"를 해소한다. Peerspace($1M+$25K)가 표준을 세웠지만 스페이스
 * 클라우드/아워플레이스엔 전무. 단, 통짜 보험을 떠안다 철회한 Splacer의 전철을 피해
 * **게스트가 건당 보장료를 부담하는 하이브리드 모델**로 보장 풀을 적립한다.
 */
export interface ProtectionPlan {
  tier: ProtectionTier
  label: string
  /** 파손·도난 보장 한도 (KRW) */
  coverageKRW: number
  /** 보장료율 — 공간 이용료(할인 적용가) 기준 */
  feeRate: number
  /** 최소 보장료 (저가 단시간 예약 방어) */
  minFeeKRW: number
  /** 게스트·호스트에게 노출되는 한 줄 설명 */
  blurb: string
}

export const PROTECTION_PLANS: Record<ProtectionTier, ProtectionPlan> = {
  NONE: {
    tier: 'NONE',
    label: '미적용',
    coverageKRW: 0,
    feeRate: 0,
    minFeeKRW: 0,
    blurb: '안심 보장 미적용',
  },
  STANDARD: {
    tier: 'STANDARD',
    label: '기본 보장',
    coverageKRW: 5_000_000,
    feeRate: 0.04,
    minFeeKRW: 9_900,
    blurb: '기물 파손·도난 최대 500만원 보장',
  },
  PREMIUM: {
    tier: 'PREMIUM',
    label: '프리미엄 보장',
    coverageKRW: 20_000_000,
    feeRate: 0.06,
    minFeeKRW: 19_900,
    blurb: '기물 파손·도난 최대 2,000만원 보장',
  },
}

/**
 * 보장료 계산 — 게스트가 부담하고 보장 풀을 적립하므로 호스트 매출·플랫폼 수수료(12%)
 * 대상이 아니다. baseKRW = 공간 이용료(할인 적용가). 청소비·애드온은 제외한다.
 * 서버 견적과 클라이언트 프리뷰가 동일한 결과를 내도록 공유한다.
 */
export function protectionFee(tier: ProtectionTier, baseKRW: number): number {
  const plan = PROTECTION_PLANS[tier]
  if (!plan || plan.feeRate === 0) return 0
  return Math.max(plan.minFeeKRW, Math.round(baseKRW * plan.feeRate))
}

export function protectionCoverage(tier: ProtectionTier): number {
  return PROTECTION_PLANS[tier]?.coverageKRW ?? 0
}

/** 호스트가 보장 적용 예약에 파손·도난을 청구할 때의 입력 */
export const FileClaimSchema = z.object({
  amountClaimedKRW: z.number().int().min(10_000).max(50_000_000),
  reason: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(1000),
  /** 추가 증빙 사진 — 체크아웃 사진은 서버에서 자동 첨부된다 */
  evidenceUrls: z.array(z.string().url()).max(8).optional(),
})
export type FileClaimInput = z.infer<typeof FileClaimSchema>

/** 예약 디테일에 노출되는 분쟁·청구 요약 */
export const DisputeSummarySchema = z.object({
  id: z.string(),
  kind: DisputeKindSchema,
  status: DisputeStatusSchema,
  reason: z.string(),
  amountClaimedKRW: z.number().nullable(),
  coverageKRW: z.number().nullable(),
  createdAt: z.string(),
})
export type DisputeSummary = z.infer<typeof DisputeSummarySchema>
