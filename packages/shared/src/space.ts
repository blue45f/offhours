import { z } from 'zod'
import {
  AlcoholPolicySchema,
  CateringPolicySchema,
  PurposeSchema,
  SpaceStatusSchema,
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
  cleaningMinutes: z.number().int().min(0).max(240).default(60),
  minHours: z.number().int().min(1).max(24).default(3),
  instantBook: z.boolean().default(false),
  alcoholPolicy: AlcoholPolicySchema,
  cateringPolicy: CateringPolicySchema,
  amenities: z.array(z.string()).default([]),
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
  region: z.string(),
  district: z.string(),
  category: VenueCategorySchema,
  instantBook: z.boolean(),
})
export type SpaceCard = z.infer<typeof SpaceCardSchema>

export const SpaceDetailSchema = SpaceCardSchema.extend({
  description: z.string(),
  areaM2: z.number().nullable(),
  cleaningFeeKRW: z.number(),
  cleaningMinutes: z.number(),
  minHours: z.number(),
  alcoholPolicy: AlcoholPolicySchema,
  cateringPolicy: CateringPolicySchema,
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
    }),
  }),
})
export type SpaceDetail = z.infer<typeof SpaceDetailSchema>

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
  instantBook: z.coerce.boolean().optional(),
  sort: z.enum(['popular', 'newest', 'price-asc', 'price-desc', 'rating']).default('popular'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(20),
})
export type SpaceSearch = z.infer<typeof SpaceSearchSchema>
