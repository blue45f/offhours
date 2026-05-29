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

/**
 * 게스트의 멘탈모델로 검색하는 use-case 분류.
 * Venue 카테고리(공급자 분류)와 직교: 같은 카페가 BIRTHDAY/CLASS/MEETUP 여럿에 노출될 수 있음.
 * Peerspace 의 "Event Type" 모델 한국화. 검색 SEO 도 long-tail 로 잡힌다.
 */
export const UseCase = {
  BIRTHDAY: 'BIRTHDAY',
  WEDDING_SMALL: 'WEDDING_SMALL',
  BABYSHOWER: 'BABYSHOWER',
  GATHERING: 'GATHERING',
  CORPORATE_WORKSHOP: 'CORPORATE_WORKSHOP',
  TEAM_BUILDING: 'TEAM_BUILDING',
  POPUP_EXHIBIT: 'POPUP_EXHIBIT',
  FILMING: 'FILMING',
  CLASS: 'CLASS',
  REHEARSAL: 'REHEARSAL',
  PHOTOSHOOT: 'PHOTOSHOOT',
  NETWORKING: 'NETWORKING',
} as const
export const UseCaseSchema = z.enum([
  'BIRTHDAY',
  'WEDDING_SMALL',
  'BABYSHOWER',
  'GATHERING',
  'CORPORATE_WORKSHOP',
  'TEAM_BUILDING',
  'POPUP_EXHIBIT',
  'FILMING',
  'CLASS',
  'REHEARSAL',
  'PHOTOSHOOT',
  'NETWORKING',
])
export type UseCase = z.infer<typeof UseCaseSchema>

export interface UseCaseMeta {
  label: string
  emoji: string
  /** 게스트에게 보여줄 한 줄 설명 (홈 그리드의 sub-text) */
  hint: string
  /** 이 use case 에 어울리는 venue 카테고리(공급 매칭 기본값) */
  matchCategories: VenueCategory[]
  /** 일반적인 인원 범위 (search prefill 용) */
  typicalCapacity: { min: number; max: number }
}

export const USE_CASE_META: Record<UseCase, UseCaseMeta> = {
  BIRTHDAY: {
    label: '친구 생일파티',
    emoji: '🎂',
    hint: '20~40명 케이크·BYOB',
    matchCategories: ['CAFE', 'BAR', 'RESTAURANT', 'ROOFTOP', 'HOUSE'],
    typicalCapacity: { min: 10, max: 40 },
  },
  WEDDING_SMALL: {
    label: '스몰웨딩',
    emoji: '💒',
    hint: '60~120명, 음향·식음 가능',
    matchCategories: ['GALLERY', 'ROOFTOP', 'HOUSE', 'RESTAURANT'],
    typicalCapacity: { min: 40, max: 120 },
  },
  BABYSHOWER: {
    label: '베이비샤워·돌잔치',
    emoji: '🎀',
    hint: '15~40명, 포토존 좋은 곳',
    matchCategories: ['CAFE', 'HOUSE', 'STUDIO'],
    typicalCapacity: { min: 10, max: 40 },
  },
  GATHERING: {
    label: '동호회·모임',
    emoji: '🍻',
    hint: '10~30명 음료·간단한 식사',
    matchCategories: ['CAFE', 'BAR', 'RESTAURANT', 'MEETING'],
    typicalCapacity: { min: 6, max: 30 },
  },
  CORPORATE_WORKSHOP: {
    label: '사내 워크샵·MT',
    emoji: '💼',
    hint: '20~50명, 프로젝터·세금계산서',
    matchCategories: ['MEETING', 'WORKSHOP', 'HOUSE', 'ROOFTOP'],
    typicalCapacity: { min: 10, max: 50 },
  },
  TEAM_BUILDING: {
    label: '팀빌딩·송년회',
    emoji: '🎉',
    hint: '30~80명 통대관',
    matchCategories: ['BAR', 'RESTAURANT', 'ROOFTOP', 'HOUSE'],
    typicalCapacity: { min: 20, max: 80 },
  },
  POPUP_EXHIBIT: {
    label: '팝업·브랜드 전시',
    emoji: '🪧',
    hint: '하루~주말 단위 임대',
    matchCategories: ['GALLERY', 'STUDIO', 'CAFE', 'ETC'],
    typicalCapacity: { min: 20, max: 200 },
  },
  FILMING: {
    label: '영상·광고 촬영',
    emoji: '🎬',
    hint: '하루 단위, 음향 통제 가능',
    matchCategories: ['STUDIO', 'HOUSE', 'CAFE', 'GALLERY', 'ROOFTOP'],
    typicalCapacity: { min: 4, max: 30 },
  },
  CLASS: {
    label: '원데이 클래스·강의',
    emoji: '🧑‍🏫',
    hint: '8~30명, 테이블·콘센트',
    matchCategories: ['WORKSHOP', 'MEETING', 'CAFE', 'STUDIO'],
    typicalCapacity: { min: 6, max: 30 },
  },
  REHEARSAL: {
    label: '리허설·연습',
    emoji: '🎼',
    hint: '음향·무대 비치',
    matchCategories: ['PRACTICE', 'DANCE', 'STUDIO'],
    typicalCapacity: { min: 2, max: 20 },
  },
  PHOTOSHOOT: {
    label: '프로필·스냅 촬영',
    emoji: '📸',
    hint: '1~2시간, 자연광·소품',
    matchCategories: ['STUDIO', 'HOUSE', 'CAFE', 'ROOFTOP'],
    typicalCapacity: { min: 1, max: 10 },
  },
  NETWORKING: {
    label: '세미나·네트워킹',
    emoji: '🗣️',
    hint: '30~100명, 음향·마이크',
    matchCategories: ['MEETING', 'WORKSHOP', 'BAR', 'GALLERY'],
    typicalCapacity: { min: 20, max: 100 },
  },
}

export const UseCaseLabel: Record<UseCase, string> = Object.fromEntries(
  (Object.keys(USE_CASE_META) as UseCase[]).map((k) => [k, USE_CASE_META[k].label])
) as Record<UseCase, string>

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
export const DisputeStatusLabel: Record<DisputeStatus, string> = {
  OPEN: '접수됨',
  UNDER_REVIEW: '검토 중',
  RESOLVED_FAVOR_GUEST: '게스트 인정',
  RESOLVED_FAVOR_HOST: '호스트 인정',
  DISMISSED: '기각',
}

export const DisputeKindSchema = z.enum(['GENERAL', 'DAMAGE'])
export type DisputeKind = z.infer<typeof DisputeKindSchema>

/** 안심 보장 등급 — 영업 외 통대관의 #1 진입장벽(파손·도난)을 해소하는 게스트 부담 보장. */
export const ProtectionTierSchema = z.enum(['NONE', 'STANDARD', 'PREMIUM'])
export type ProtectionTier = z.infer<typeof ProtectionTierSchema>
