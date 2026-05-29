import { z } from 'zod'
import {
  CancellationPolicySchema,
  ProtectionTierSchema,
  PurposeSchema,
  ReservationStatusSchema,
} from './enums'
import { AddonLineSchema, AddonSelectionSchema } from './addon'
import { DisputeSummarySchema } from './protection'

// 베이스 오브젝트(미정제) — refine 이 붙은 스키마에는 .omit()/.extend() 를 쓸 수 없으므로
// (Zod v4 런타임 가드) 파생 스키마는 이 오브젝트에서 만든 뒤 각자 refine 을 다시 적용한다.
const CreateReservationObject = z.object({
  spaceId: z.string().min(1),
  startAt: z.string(),
  endAt: z.string(),
  headcount: z.number().int().min(1).max(500),
  purpose: PurposeSchema,
  note: z.string().trim().max(500).optional(),
  /** true 면 corporateProfile 을 동결해 예약에 첨부, 세금계산서 발행 워크플로우 진입 */
  useCorporateBilling: z.boolean().optional(),
  /** true 면 법인 크레딧 잔액을 결제액에서 차감 (useCorporateBilling 필요) */
  useCredit: z.boolean().optional(),
  /** true 면 보유 적립 포인트를 결제액에서 차감 */
  usePoints: z.boolean().optional(),
  /** 게스트가 선택한 유료 옵션(애드온) */
  addons: z.array(AddonSelectionSchema).max(20).optional(),
  /** 반복 예약 그룹 식별자 — createRecurring 내부에서만 주입, 일반 단건 예약에서는 무시 */
  recurringGroupId: z.string().optional(),
})

const endAfterStart = (v: { startAt: string; endAt: string }) =>
  new Date(v.endAt).getTime() > new Date(v.startAt).getTime()
const endAfterStartIssue = { message: '종료 시간은 시작 시간 이후여야 해요', path: ['endAt'] }

export const CreateReservationSchema = CreateReservationObject.refine(
  endAfterStart,
  endAfterStartIssue
)
export type CreateReservationInput = z.infer<typeof CreateReservationSchema>

export const CancelReservationSchema = z.object({
  reason: z.string().trim().min(2).max(300),
})
export type CancelReservationInput = z.infer<typeof CancelReservationSchema>

/** 이용 시간 연장 — 영업 외 안전 경계(다음 영업 준비) 안에서만 N시간 추가 */
export const ExtendReservationSchema = z.object({
  hours: z.number().int().min(1).max(6),
})
export type ExtendReservationInput = z.infer<typeof ExtendReservationSchema>

export const ApproveReservationSchema = z.object({
  note: z.string().trim().max(300).optional(),
})
export type ApproveReservationInput = z.infer<typeof ApproveReservationSchema>

/**
 * 호스트 체크아웃 체크리스트 — 청소 SLA의 운영 마지막 단계.
 * 모든 필수 항목을 체크하지 않으면 백엔드에서 거절한다.
 */
export const CHECKOUT_ITEMS = [
  { key: 'restored', label: '집기·테이블 원상복구', required: true },
  { key: 'trash', label: '쓰레기 분리·반출', required: true },
  { key: 'audio', label: '음향·전자기기 종료', required: true },
  { key: 'lights', label: '조명·냉난방 종료', required: true },
  { key: 'lock', label: '출입문 잠금 확인', required: true },
  { key: 'lost', label: '분실물 확인', required: false },
] as const

export type CheckoutItemKey = (typeof CHECKOUT_ITEMS)[number]['key']

export const CheckOutSchema = z.object({
  checklist: z.object({
    restored: z.boolean(),
    trash: z.boolean(),
    audio: z.boolean(),
    lights: z.boolean(),
    lock: z.boolean(),
    lost: z.boolean().optional(),
  }),
  note: z.string().trim().max(500).optional(),
  photoUrls: z.array(z.string().url()).max(5).optional(),
})
export type CheckOutInput = z.infer<typeof CheckOutSchema>

export const RejectReservationSchema = z.object({
  reason: z.string().trim().min(2).max(300),
})
export type RejectReservationInput = z.infer<typeof RejectReservationSchema>

export const ReservationSchema = z.object({
  id: z.string(),
  code: z.string(),
  spaceId: z.string(),
  spaceTitle: z.string(),
  spaceThumbnailUrl: z.string().nullable(),
  guestId: z.string(),
  guestName: z.string(),
  /** 호스트 의사결정용 게스트 신뢰 시그널 — 본인 인증·신뢰 점수·이용 횟수 */
  guestVerified: z.boolean().default(false),
  guestTrustScore: z.number().default(50),
  guestGuestedCount: z.number().default(0),
  hostId: z.string(),
  hostName: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  headcount: z.number(),
  purpose: PurposeSchema,
  note: z.string().nullable(),
  status: ReservationStatusSchema,
  baseAmountKRW: z.number(),
  cleaningFeeKRW: z.number(),
  depositKRW: z.number(),
  /** 선택한 유료 옵션 합계 + 라인 스냅샷 */
  addonsAmountKRW: z.number().default(0),
  addons: z.array(AddonLineSchema).nullable().optional(),
  /** 안심 보장 — 등급·게스트 부담 보장료·보장 한도 스냅샷 */
  protectionTier: ProtectionTierSchema.default('NONE'),
  protectionFeeKRW: z.number().default(0),
  protectionCoverageKRW: z.number().default(0),
  /** 취소 정책 스냅샷 — 예약 시점 공간 정책 */
  cancellationPolicy: CancellationPolicySchema.default('STANDARD'),
  /** 파손 보장 청구(있으면) — 호스트가 넣은 청구의 상태 요약 */
  dispute: DisputeSummarySchema.nullable().optional(),
  totalKRW: z.number(),
  feeKRW: z.number(),
  /** 법인 크레딧 차감액 — 실 결제액 = totalKRW - creditAppliedKRW */
  creditAppliedKRW: z.number().default(0),
  /** 적립 포인트 차감액 */
  pointsAppliedKRW: z.number().default(0),
  cancelReason: z.string().nullable(),
  checkInCode: z.string().nullable(),
  checkedInAt: z.string().nullable(),
  checkedOutAt: z.string().nullable(),
  createdAt: z.string(),
  /** 법인 결제일 때 동결된 회사 정보 (세금계산서 발행 대상). 일반 결제면 null */
  corporateSnapshot: z
    .object({
      companyName: z.string(),
      businessNumber: z.string(),
      ceoName: z.string(),
      billingEmail: z.string(),
      taxPayer: z.enum(['GENERAL', 'TAX_FREE']),
    })
    .nullable()
    .optional(),
})
export type Reservation = z.infer<typeof ReservationSchema>

/** 정기·반복 예약 생성 요청 — weeks 회 만큼 매주 같은 요일·시간대로 반복 예약 */
export const CreateRecurringSchema = CreateReservationObject.omit({ recurringGroupId: true })
  .extend({ weeks: z.number().int().min(2).max(12) })
  .refine(endAfterStart, endAfterStartIssue)
export type CreateRecurringInput = z.infer<typeof CreateRecurringSchema>

/** 반복 예약 생성 결과 — 성공·건너뜀 목록 반환 */
export const RecurringResultSchema = z.object({
  groupId: z.string(),
  created: z.array(ReservationSchema),
  skipped: z.array(z.object({ startAt: z.string(), reason: z.string() })),
})
export type RecurringResult = z.infer<typeof RecurringResultSchema>

export function calcReservationFee(totalKRW: number): number {
  return Math.round(totalKRW * 0.12)
}
