import { z } from 'zod'
import {
  AlcoholPolicySchema,
  CancellationPolicySchema,
  CateringPolicySchema,
  ProtectionTierSchema,
  PurposeSchema,
  SpaceStatusSchema,
  UseCaseSchema,
  VenueCategorySchema,
} from './enums'

export const AMENITY_OPTIONS = [
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'projector', label: '빔프로젝터' },
  { value: 'speaker', label: '음향·스피커' },
  { value: 'mic', label: '마이크' },
  { value: 'parking', label: '주차' },
  { value: 'toilet', label: '화장실' },
  { value: 'kitchen', label: '주방·취사' },
  { value: 'fridge', label: '냉장고' },
  { value: 'ac', label: '에어컨' },
  { value: 'heater', label: '난방' },
  { value: 'tables', label: '테이블·의자' },
  { value: 'piano', label: '피아노' },
  { value: 'tv', label: 'TV·모니터' },
  { value: 'photobooth', label: '포토존' },
  { value: 'rooftop', label: '루프탑·테라스' },
  { value: 'smoking', label: '흡연구역' },
  { value: 'pet', label: '반려동물 가능' },
  { value: 'wheelchair', label: '휠체어 접근' },
] as const

export const AmenitySchema = z.enum(AMENITY_OPTIONS.map((o) => o.value) as [string, ...string[]])
export type Amenity = z.infer<typeof AmenitySchema>

export const SpacePhotoSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  blurhash: z.string().nullable(),
  order: z.number(),
  alt: z.string().nullable(),
})
export type SpacePhoto = z.infer<typeof SpacePhotoSchema>

export const CreateSpaceSchema = z.object({
  venueId: z.string().min(1),
  title: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(10).max(140),
  description: z.string().trim().min(40).max(4000),
  capacityMin: z.number().int().min(1).default(1),
  capacityMax: z.number().int().min(1),
  areaM2: z.number().int().min(1).optional(),
  basePriceKRW: z.number().int().min(0),
  cleaningFeeKRW: z.number().int().min(0).default(0),
  depositKRW: z.number().int().min(0).max(5_000_000).default(0),
  cleaningMinutes: z.number().int().min(0).max(240).default(60),
  minHours: z.number().int().min(1).max(24).default(3),
  instantBook: z.boolean().default(false),
  alcoholPolicy: AlcoholPolicySchema,
  cateringPolicy: CateringPolicySchema,
  protectionTier: ProtectionTierSchema.default('NONE'),
  cancellationPolicy: CancellationPolicySchema.default('STANDARD'),
  amenities: z.array(z.string()).default([]),
  useCases: z.array(UseCaseSchema).max(12).default([]),
  rules: z.string().trim().max(2000).default(''),
  photoUrls: z.array(z.string().url()).min(1, '대표 사진을 1장 이상 등록해주세요').max(20),
})
export type CreateSpaceInput = z.infer<typeof CreateSpaceSchema>

export const UpdateSpaceSchema = CreateSpaceSchema.partial().omit({ venueId: true })
export type UpdateSpaceInput = z.infer<typeof UpdateSpaceSchema>

export const SpaceCardSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  capacityMin: z.number(),
  capacityMax: z.number(),
  basePriceKRW: z.number(),
  ratingAvg: z.number(),
  ratingCount: z.number(),
  thumbnailUrl: z.string().nullable(),
  blurhash: z.string().nullable(),
  /** 카드 호버 자동 슬라이드용 추가 사진(최대 3장). thumbnail 외 사진. */
  photoUrls: z.array(z.string()).default([]),
  region: z.string(),
  district: z.string(),
  category: VenueCategorySchema,
  instantBook: z.boolean(),
  /** 호스트가 정한 use-case 태그. 게스트의 멘탈모델 검색용 */
  useCases: z.array(UseCaseSchema).default([]),
  /** 게스트 위치 기준 거리(km). 위치 파라미터 없이 검색하면 null */
  distanceKm: z.number().nullable().optional(),
  /** 곧 시작 가능한 가장 빠른 슬롯 시각 (ISO). 검색에 availableFrom/Live 옵션을 줄 때만 채워짐 */
  nextAvailableAt: z.string().nullable().optional(),
  /** 일반가 대비 할인율 (0~1). 라스트미닛 슬롯에 한해 표기 */
  lastMinuteDiscount: z.number().nullable().optional(),
  /** 호스트 응답 중앙값(분). 최근 30일 신규 문의 ≥10건 + 응답률 ≥90%일 때만 노출 */
  avgApprovalMin: z.number().nullable().optional(),
  /** 호스트 24h 이내 응답률 (0~1). 90% 이상일 때만 뱃지 노출 */
  responseRate24h: z.number().nullable().optional(),
  /** 응답 통계 표본 수 (최근 30일). 10건 미만이면 뱃지 미노출 */
  responseSampleCount: z.number().nullable().optional(),
  /** 신규 등록 (7일 이내) — 카드에 "🆕 신규" 뱃지 */
  isNew: z.boolean().optional(),
  /** 인기 공간 (평점 ≥4.85 + 후기 ≥10건) — 카드에 "🔥 인기" 뱃지 */
  isHot: z.boolean().optional(),
  /** 사업자 인증 완료(approvedAt) — 카드/상세에 "검증 사업장" 뱃지. 실제 사업장 신뢰 시그널 */
  verifiedBusiness: z.boolean().optional(),
  /** 호스트 책임보험 가입 */
  hostInsured: z.boolean().optional(),
  /** 오프아워스 우수 호스트(높은 신뢰점수 + 운영 이력) — 카드 프레스티지 뱃지 */
  superHost: z.boolean().optional(),
})
export type SpaceCard = z.infer<typeof SpaceCardSchema>

export const SpaceDetailSchema = SpaceCardSchema.extend({
  description: z.string(),
  areaM2: z.number().nullable(),
  cleaningFeeKRW: z.number(),
  depositKRW: z.number().default(0),
  cleaningMinutes: z.number(),
  minHours: z.number(),
  alcoholPolicy: AlcoholPolicySchema,
  cateringPolicy: CateringPolicySchema,
  protectionTier: ProtectionTierSchema.default('NONE'),
  cancellationPolicy: CancellationPolicySchema.default('STANDARD'),
  amenities: z.array(z.string()),
  rules: z.string(),
  status: SpaceStatusSchema,
  photos: z.array(SpacePhotoSchema),
  venue: z.object({
    id: z.string(),
    name: z.string(),
    addressRoad: z.string(),
    lat: z.number(),
    lng: z.number(),
    host: z.object({
      id: z.string(),
      name: z.string(),
      avatarUrl: z.string().nullable(),
      trustScore: z.number(),
      hostedCount: z.number(),
      /** 호스트 후기 답글률 (0~1). 후기 ≥3건 + 답글 ≥1건일 때만 노출 권장 */
      reviewResponseRate: z.number().nullable(),
      reviewSampleCount: z.number(),
      /** 사업자 인증 완료 — 실제 사업장 검증(스페이스클라우드의 개인 호스트가 못 하는 신뢰) */
      isVerifiedBusiness: z.boolean(),
      isInsured: z.boolean(),
    }),
  }),
  /** 활동 시그널: 최근 30일 PAID/COMPLETED 예약 건수 */
  bookingsLast30d: z.number(),
  /** 누적 페이지 조회수 */
  viewCount: z.number(),
})
export type SpaceDetail = z.infer<typeof SpaceDetailSchema>

export const PriceSuggestionQuerySchema = z.object({
  category: VenueCategorySchema,
  region: z.string().trim().max(20).optional(),
  district: z.string().trim().max(30).optional(),
  capacityMax: z.coerce.number().int().min(1).optional(),
})
export type PriceSuggestionQuery = z.infer<typeof PriceSuggestionQuerySchema>

export const PriceSuggestionSchema = z.object({
  sampleCount: z.number(),
  p25: z.number().nullable(),
  median: z.number().nullable(),
  p75: z.number().nullable(),
  /** 시장 분포 + 인원·점유 보정한 권장가 (KRW/h). 표본 미달이면 null */
  suggested: z.number().nullable(),
  /** 같은 지역 활성 공간의 최근 30일 평균 슬롯 점유율 (0~1). null=데이터 부족 */
  occupancy: z.number().nullable(),
  /** 사용자에게 보여줄 한 줄 설명 */
  hint: z.string(),
})
export type PriceSuggestion = z.infer<typeof PriceSuggestionSchema>

export const SpaceSearchSchema = z.object({
  q: z.string().trim().max(80).optional(),
  region: z.string().trim().max(20).optional(),
  district: z.string().trim().max(30).optional(),
  category: VenueCategorySchema.optional(),
  purpose: PurposeSchema.optional(),
  capacity: z.coerce.number().int().min(1).optional(),
  date: z.string().optional(),
  startMinute: z.coerce.number().int().min(0).max(1440).optional(),
  endMinute: z.coerce.number().int().min(0).max(2880).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  amenities: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').filter(Boolean) : undefined)),
  useCases: z
    .string()
    .optional()
    .transform((v) =>
      v ? (v.split(',').filter(Boolean) as Array<z.infer<typeof UseCaseSchema>>) : undefined
    ),
  instantBook: z.coerce.boolean().optional(),
  /** 사업자 인증된(검증된) 사업장만 */
  verifiedOnly: z.coerce.boolean().optional(),
  /** 위치 기반: 위도·경도 + 반경(km) */
  lat: z.coerce.number().min(33).max(43).optional(),
  lng: z.coerce.number().min(124).max(132).optional(),
  radiusKm: z.coerce.number().min(0.3).max(50).optional(),
  /** "지금부터 N시간 안에 시작 가능한 슬롯이 있는 공간" 라이브 매칭 */
  liveWithinHours: z.coerce.number().int().min(1).max(72).optional(),
  sort: z
    .enum(['popular', 'newest', 'price-asc', 'price-desc', 'rating', 'distance', 'live'])
    .default('popular'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(20),
})
export type SpaceSearch = z.infer<typeof SpaceSearchSchema>
