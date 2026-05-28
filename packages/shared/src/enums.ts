import { z } from 'zod'

export const Role = {
  USER: 'USER',
  HOST: 'HOST',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
} as const
export const RoleSchema = z.enum(['USER', 'HOST', 'ADMIN', 'SUPERADMIN'])
export type Role = z.infer<typeof RoleSchema>

export const TaxType = { INDIVIDUAL: 'INDIVIDUAL', CORPORATE: 'CORPORATE' } as const
export const TaxTypeSchema = z.enum(['INDIVIDUAL', 'CORPORATE'])
export type TaxType = z.infer<typeof TaxTypeSchema>

export const PayoutCycle = { D7: 'D7', D14: 'D14' } as const
export const PayoutCycleSchema = z.enum(['D7', 'D14'])
export type PayoutCycle = z.infer<typeof PayoutCycleSchema>

export const VenueCategory = {
  CAFE: 'CAFE',
  BAR: 'BAR',
  RESTAURANT: 'RESTAURANT',
  STUDIO: 'STUDIO',
  GALLERY: 'GALLERY',
  ROOFTOP: 'ROOFTOP',
  HOUSE: 'HOUSE',
  FITNESS: 'FITNESS',
  DANCE: 'DANCE',
  PRACTICE: 'PRACTICE',
  WORKSHOP: 'WORKSHOP',
  MEETING: 'MEETING',
  ETC: 'ETC',
} as const
export const VenueCategorySchema = z.enum([
  'CAFE',
  'BAR',
  'RESTAURANT',
  'STUDIO',
  'GALLERY',
  'ROOFTOP',
  'HOUSE',
  'FITNESS',
  'DANCE',
  'PRACTICE',
  'WORKSHOP',
  'MEETING',
  'ETC',
])
export type VenueCategory = z.infer<typeof VenueCategorySchema>

export const VenueCategoryLabel: Record<VenueCategory, string> = {
  CAFE: '카페',
  BAR: '바·호프',
  RESTAURANT: '레스토랑',
  STUDIO: '사진·영상 스튜디오',
  GALLERY: '갤러리',
  ROOFTOP: '루프탑',
  HOUSE: '하우스',
  FITNESS: '헬스·PT·요가',
  DANCE: '댄스 스튜디오',
  PRACTICE: '음악 연습실',
  WORKSHOP: '공방·메이커스페이스',
  MEETING: '세미나·스터디룸',
  ETC: '기타',
}

/**
 * 영업외 시간 대여 시 법적 안전도가 높은 카테고리.
 * 식품위생법·다중이용업소법 이슈가 적어 부업형 호스트 진입 장벽이 가장 낮음.
 */
export const SAFE_CATEGORIES = [
  'STUDIO',
  'GALLERY',
  'FITNESS',
  'DANCE',
  'PRACTICE',
  'WORKSHOP',
  'MEETING',
] as const

export const VenueStatusSchema = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'SUSPENDED',
  'REJECTED',
])
export type VenueStatus = z.infer<typeof VenueStatusSchema>

export const SpaceStatusSchema = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'SUSPENDED',
  'REJECTED',
])
export type SpaceStatus = z.infer<typeof SpaceStatusSchema>

export const AlcoholPolicySchema = z.enum(['PROHIBITED', 'BYOB', 'HOST_LICENSED', 'UNRESTRICTED'])
export type AlcoholPolicy = z.infer<typeof AlcoholPolicySchema>
export const AlcoholPolicyLabel: Record<AlcoholPolicy, string> = {
  PROHIBITED: '주류 반입 금지',
  BYOB: 'BYOB (외부 주류 반입 가능)',
  HOST_LICENSED: '호스트 주류 라이선스 이용',
  UNRESTRICTED: '제한 없음',
}

export const CateringPolicySchema = z.enum(['EXTERNAL_OK', 'HOST_ONLY', 'BYO_OK'])
export type CateringPolicy = z.infer<typeof CateringPolicySchema>
export const CateringPolicyLabel: Record<CateringPolicy, string> = {
  EXTERNAL_OK: '외부 케이터링 가능',
  HOST_ONLY: '호스트 메뉴만 이용',
  BYO_OK: '간단한 음식 직접 반입 가능',
}

export const RepeatRuleSchema = z.enum(['NONE', 'WEEKLY', 'MONTHLY'])
export type RepeatRule = z.infer<typeof RepeatRuleSchema>

export const PurposeSchema = z.enum(['PARTY', 'WEDDING', 'MEETING', 'POPUP', 'SHOOT', 'OTHER'])
export type Purpose = z.infer<typeof PurposeSchema>
export const PurposeLabel: Record<Purpose, string> = {
  PARTY: '파티·생일',
  WEDDING: '스몰웨딩',
  MEETING: '모임·세미나',
  POPUP: '팝업·전시',
  SHOOT: '촬영',
  OTHER: '기타',
}

export const ReservationStatusSchema = z.enum([
  'REQUESTED',
  'APPROVED',
  'PAID',
  'CHECKED_IN',
  'CHECKED_OUT',
  'COMPLETED',
  'CANCELED',
  'REFUNDED',
])
export type ReservationStatus = z.infer<typeof ReservationStatusSchema>
export const ReservationStatusLabel: Record<ReservationStatus, string> = {
  REQUESTED: '요청됨',
  APPROVED: '승인됨',
  PAID: '결제 완료',
  CHECKED_IN: '체크인',
  CHECKED_OUT: '체크아웃',
  COMPLETED: '이용 완료',
  CANCELED: '취소됨',
  REFUNDED: '환불됨',
}

export const PaymentProviderSchema = z.enum(['TOSS'])
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>

export const PaymentStatusSchema = z.enum([
  'READY',
  'AUTHORIZED',
  'CAPTURED',
  'PARTIAL_REFUNDED',
  'REFUNDED',
  'FAILED',
])
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>

export const SettlementStatusSchema = z.enum(['PENDING', 'SCHEDULED', 'PAID', 'FAILED'])
export type SettlementStatus = z.infer<typeof SettlementStatusSchema>

export const NotificationTypeSchema = z.enum([
  'RESERVATION_REQUESTED',
  'RESERVATION_APPROVED',
  'RESERVATION_REJECTED',
  'PAYMENT_COMPLETED',
  'REVIEW_REQUESTED',
  'CHAT_MESSAGE',
  'SYSTEM',
])
export type NotificationType = z.infer<typeof NotificationTypeSchema>

export const ReportTargetSchema = z.enum(['USER', 'SPACE', 'REVIEW', 'MESSAGE'])
export type ReportTarget = z.infer<typeof ReportTargetSchema>

export const ReportReasonSchema = z.enum([
  'SCAM',
  'ABUSE',
  'INAPPROPRIATE',
  'FAKE_LISTING',
  'OTHER',
])
export type ReportReason = z.infer<typeof ReportReasonSchema>

export const ReportStatusSchema = z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'])
export type ReportStatus = z.infer<typeof ReportStatusSchema>

export const DisputeStatusSchema = z.enum([
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED_FAVOR_GUEST',
  'RESOLVED_FAVOR_HOST',
  'DISMISSED',
])
export type DisputeStatus = z.infer<typeof DisputeStatusSchema>
