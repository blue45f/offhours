import { AMENITY_OPTIONS } from './space'
import { KOREA_REGIONS } from './constants'
import { USE_CASE_META, VenueCategoryLabel, type UseCase, type VenueCategory } from './enums'

export interface SmartSearchParse {
  region?: string
  category?: VenueCategory
  capacity?: number
  useCases?: UseCase[]
  amenities?: string[]
  /** 자연어 입력에서 매칭되지 않은 잔여 키워드 (= q 검색어로 폴백) */
  q?: string
}

const CATEGORY_KEYWORDS: Record<VenueCategory, string[]> = {
  CAFE: ['카페', '카폐', 'cafe'],
  BAR: ['바', '호프', '와인', '와인바', '펍', '술집', 'bar'],
  RESTAURANT: ['레스토랑', '식당', '다이닝', '레스트', 'restaurant', 'dining'],
  STUDIO: ['스튜디오', '촬영', '룩북', 'studio'],
  GALLERY: ['갤러리', '전시', '아트', 'gallery'],
  ROOFTOP: ['루프탑', '옥상', 'rooftop'],
  HOUSE: ['하우스', '한옥', '주택', '집', '단독'],
  FITNESS: ['헬스', 'pt', '요가', '필라테스', 'fitness', 'gym'],
  DANCE: ['댄스', '연습', '안무', 'dance'],
  PRACTICE: ['합주', '연습실', '음악실', '드럼', 'practice'],
  WORKSHOP: ['공방', '도예', '메이커', '워크숍', 'workshop'],
  MEETING: ['세미나', '회의실', '스터디룸', '강의실', 'meeting'],
  ETC: [],
}

const AMENITY_KEYWORDS: Record<string, string[]> = {
  wifi: ['와이파이', '인터넷', 'wifi'],
  projector: ['빔', '프로젝터', '스크린', 'projector'],
  speaker: ['스피커', '음향', 'speaker'],
  mic: ['마이크', 'mic'],
  parking: ['주차', '발렛', 'parking'],
  kitchen: ['주방', '취사', 'kitchen'],
  fridge: ['냉장고', 'fridge'],
  ac: ['에어컨', '냉방'],
  heater: ['난방', '히터'],
  piano: ['피아노', 'piano'],
  tv: ['tv', '모니터'],
  photobooth: ['포토존', '포토부스', 'photo'],
  rooftop: ['루프탑', '테라스'],
  pet: ['반려동물', '반려견', 'pet'],
  wheelchair: ['휠체어', '베리어프리'],
}

// use case 키워드는 USE_CASE_META.label 외에 별칭도 함께 매칭
const USE_CASE_KEYWORDS: Record<UseCase, string[]> = {
  BIRTHDAY: ['생일', '생파', 'birthday'],
  WEDDING_SMALL: ['스몰웨딩', '결혼', '웨딩', 'wedding'],
  BABYSHOWER: ['베이비샤워', '돌잔치', '돌잔', 'babyshower'],
  GATHERING: ['모임', '동호회', '동아리'],
  CORPORATE_WORKSHOP: ['워크샵', '워크숍', '사내', '회사', 'mt'],
  TEAM_BUILDING: ['팀빌딩', '회식', '송년', '신년'],
  POPUP_EXHIBIT: ['팝업', '브랜드', '전시'],
  FILMING: ['촬영', '영상', '광고', 'filming'],
  CLASS: ['클래스', '강의', '강좌', '레슨', 'class'],
  REHEARSAL: ['리허설', '연습', 'rehearsal'],
  PHOTOSHOOT: ['스냅', '프로필', '사진', 'photo'],
  NETWORKING: ['네트워킹', '컨퍼런스', '세미나', 'networking'],
}

/**
 * 한국어 자연어 검색 입력을 정형 필터로 파싱.
 * - "강남 야간 와인 30명" → { region: '서울', category: 'BAR', capacity: 30, useCases: ['BIRTHDAY'?] }
 * - LLM 없이 사전 기반 substring 매칭. 다중 매칭은 첫 번째 우선.
 */
export function parseSmartQuery(text: string): SmartSearchParse {
  const original = text.trim()
  if (!original) return {}
  const lower = original.toLowerCase()
  const result: SmartSearchParse = {}
  let remaining = original

  // 지역: 서울/경기/부산… (정확히 매칭). 동·구 키워드는 별도(향후)
  for (const r of KOREA_REGIONS) {
    if (lower.includes(r.toLowerCase())) {
      result.region = r
      remaining = remaining.replace(new RegExp(r, 'gi'), ' ')
      break
    }
  }
  // 강남/홍대 같은 별칭 → 서울
  const SEOUL_HINTS = [
    '강남',
    '홍대',
    '망원',
    '연남',
    '성수',
    '한남',
    '이태원',
    '잠실',
    '여의도',
    '서촌',
    '북촌',
    '판교',
    '판교역',
  ]
  if (!result.region) {
    for (const h of SEOUL_HINTS) {
      if (lower.includes(h)) {
        result.region = h === '판교' ? '경기' : '서울'
        break
      }
    }
  }

  // 카테고리
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of kws) {
      if (lower.includes(kw.toLowerCase())) {
        result.category = cat as VenueCategory
        remaining = remaining.replace(new RegExp(kw, 'gi'), ' ')
        break
      }
    }
    if (result.category) break
  }

  // 인원: "30명" / "8인" / "20people"
  const capMatch = original.match(/(\d{1,3})\s*(?:명|인|people|ppl)/i)
  if (capMatch) {
    result.capacity = Number(capMatch[1])
    remaining = remaining.replace(capMatch[0], ' ')
  }

  // useCases (여러 개 가능)
  const matchedUses: UseCase[] = []
  for (const [uc, kws] of Object.entries(USE_CASE_KEYWORDS) as [UseCase, string[]][]) {
    for (const kw of kws) {
      if (lower.includes(kw.toLowerCase())) {
        if (!matchedUses.includes(uc)) matchedUses.push(uc)
        remaining = remaining.replace(new RegExp(kw, 'gi'), ' ')
        break
      }
    }
  }
  if (matchedUses.length > 0) result.useCases = matchedUses

  // amenities (여러 개)
  const matchedAmenities: string[] = []
  for (const [amenity, kws] of Object.entries(AMENITY_KEYWORDS)) {
    for (const kw of kws) {
      if (lower.includes(kw.toLowerCase())) {
        if (!matchedAmenities.includes(amenity)) matchedAmenities.push(amenity)
        remaining = remaining.replace(new RegExp(kw, 'gi'), ' ')
        break
      }
    }
  }
  if (matchedAmenities.length > 0) result.amenities = matchedAmenities

  // 남은 키워드는 q 로 폴백 (>=2자)
  const rest = remaining.replace(/\s+/g, ' ').trim()
  if (rest.length >= 2) {
    result.q = rest
  }

  return result
}

export interface SmartChip {
  key: keyof SmartSearchParse | string
  label: string
  emoji?: string
}

export function describeParse(parsed: SmartSearchParse): SmartChip[] {
  const chips: SmartChip[] = []
  if (parsed.region) chips.push({ key: 'region', label: parsed.region, emoji: '📍' })
  if (parsed.category)
    chips.push({ key: 'category', label: VenueCategoryLabel[parsed.category], emoji: '🏷️' })
  if (parsed.capacity) chips.push({ key: 'capacity', label: `${parsed.capacity}명`, emoji: '👥' })
  for (const uc of parsed.useCases ?? []) {
    const meta = USE_CASE_META[uc]
    chips.push({ key: `useCase:${uc}`, label: meta?.label ?? uc, emoji: meta?.emoji })
  }
  for (const a of parsed.amenities ?? []) {
    const opt = AMENITY_OPTIONS.find((o) => o.value === a)
    chips.push({ key: `amenity:${a}`, label: opt?.label ?? a, emoji: '✅' })
  }
  if (parsed.q) chips.push({ key: 'q', label: `"${parsed.q}"`, emoji: '🔍' })
  return chips
}

/** parsed 결과를 URL params 로 직렬화 (SpacesPage 의 query schema 와 동일). */
export function toSearchParams(parsed: SmartSearchParse): URLSearchParams {
  const sp = new URLSearchParams()
  if (parsed.region) sp.set('region', parsed.region)
  if (parsed.category) sp.set('category', parsed.category)
  if (parsed.capacity) sp.set('capacity', String(parsed.capacity))
  if (parsed.useCases && parsed.useCases.length > 0) sp.set('useCases', parsed.useCases.join(','))
  if (parsed.amenities && parsed.amenities.length > 0)
    sp.set('amenities', parsed.amenities.join(','))
  if (parsed.q) sp.set('q', parsed.q)
  return sp
}
