import data from '../sample-data.json'

export interface Space {
  id: string
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

const items: Space[] = (data as { items?: Space[] }).items || []
export function getSpaces(): Space[] {
  return items
}
export function getSpace(id: string): Space | undefined {
  return items.find((s) => s.id === id)
}
export const won = (n: number) => '₩' + n.toLocaleString('ko-KR')
