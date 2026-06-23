import { VenueCategoryLabel } from '@offhours/shared'

export interface Space {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  category: string
  categoryLabel: string
  district: string
  addressRoad: string
  capacity: number
  basePriceKRW: number
  alcohol: string
  catering: string
  amenities: string[]
  rating: number
  photos: string[]
}

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'
const PREFIX = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`

export const AMENITY_LABEL: Record<string, string> = {
  wifi: '와이파이',
  projector: '빔프로젝터',
  speaker: '스피커',
  kitchen: '주방',
  photobooth: '포토부스',
  parking: '주차',
  mic: '마이크',
  tables: '테이블',
  ac: '냉난방',
  sound: '음향',
  lighting: '조명',
  mirror: '거울',
  shower: '샤워',
  kiln: '가마',
  piano: '피아노',
  whiteboard: '화이트보드',
}
export const ALCOHOL_LABEL: Record<string, string> = {
  BYOB: '주류 반입 가능',
  HOST_LICENSED: '주류 판매(라이선스)',
  HOST_ONLY: '호스트 제공',
  NONE: '주류 불가',
}
export const CATERING_LABEL: Record<string, string> = {
  EXTERNAL_OK: '외부 케이터링 가능',
  HOST_ONLY: '호스트 케이터링',
  NONE: '케이터링 불가',
}

export async function getSpaces(): Promise<Space[]> {
  try {
    const res = await fetch(`${PREFIX}/spaces?pageSize=100`)
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    const data = await res.json()
    const items = data.items || []
    return items.map((card: any) => ({
      id: card.id,
      slug: card.slug,
      title: card.title,
      summary: card.summary,
      description: card.summary,
      category: card.category,
      categoryLabel: VenueCategoryLabel[card.category as keyof typeof VenueCategoryLabel] ?? card.category,
      district: card.district,
      addressRoad: '',
      capacity: card.capacityMax,
      basePriceKRW: card.basePriceKRW,
      alcohol: '',
      catering: '',
      amenities: [],
      rating: card.ratingAvg,
      photos: [card.thumbnailUrl, ...card.photoUrls].filter(Boolean),
    }))
  } catch (error) {
    console.error('getSpaces failed:', error)
    return []
  }
}

export async function getSpace(slug: string): Promise<Space | undefined> {
  try {
    const res = await fetch(`${PREFIX}/spaces/slug/${slug}`)
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    const detail = await res.json()
    return {
      id: detail.id,
      slug: detail.slug,
      title: detail.title,
      summary: detail.summary,
      description: detail.description,
      category: detail.category,
      categoryLabel: VenueCategoryLabel[detail.category as keyof typeof VenueCategoryLabel] ?? detail.category,
      district: detail.district,
      addressRoad: detail.venue?.addressRoad ?? '',
      capacity: detail.capacityMax,
      basePriceKRW: detail.basePriceKRW,
      alcohol: detail.alcoholPolicy,
      catering: detail.cateringPolicy,
      amenities: detail.amenities || [],
      rating: detail.ratingAvg,
      photos: (detail.photos || []).map((p: any) => p.url),
    }
  } catch (error) {
    console.error(`getSpace failed for ${slug}:`, error)
    return undefined
  }
}

export const won = (n: number) => '₩' + n.toLocaleString('ko-KR')
