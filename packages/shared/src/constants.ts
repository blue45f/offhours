export const PLATFORM_FEE_RATE = 0.12

export const CANCEL_POLICY = [
  { hoursBefore: 168, refundRate: 1.0, label: '7일 전' },
  { hoursBefore: 72, refundRate: 0.5, label: '3일 전' },
  { hoursBefore: 24, refundRate: 0.2, label: '1일 전' },
  { hoursBefore: 0, refundRate: 0, label: '당일' },
] as const

export function calcRefundRate(startAt: Date | string, now: Date = new Date()): number {
  const startMs = new Date(startAt).getTime()
  const diffH = (startMs - now.getTime()) / (1000 * 60 * 60)
  if (diffH >= 168) return 1.0
  if (diffH >= 72) return 0.5
  if (diffH >= 24) return 0.2
  return 0
}

export const TRUST_SCORE = {
  INITIAL: 50,
  MIN: 0,
  MAX: 100,
  BUMP_ON_GOOD_REVIEW: 2,
  PENALTY_ON_CANCEL: -5,
  PENALTY_ON_DISPUTE: -15,
  BONUS_ON_VERIFY: 10,
} as const

export const KOREA_REGIONS = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
] as const
export type KoreaRegion = (typeof KOREA_REGIONS)[number]

export const WEEKDAY_LABEL_SHORT = ['일', '월', '화', '수', '목', '금', '토'] as const
export const WEEKDAY_LABEL_LONG = [
  '일요일',
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일',
] as const

export function minutesToHHmm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function HHmmToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

export function formatKRW(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

const EARTH_RADIUS_KM = 6371
function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Haversine 공식 — 두 위경도 간 직선 거리(km) */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  if (km < 10) return `${km.toFixed(1)}km`
  return `${Math.round(km)}km`
}

/** 라스트미닛 슬롯 자동 할인율 — 시작 6시간 내 5%, 3시간 내 10%, 1시간 내 15% */
export function lastMinuteDiscountRate(startAt: Date | string, now: Date = new Date()): number {
  const diffH = (new Date(startAt).getTime() - now.getTime()) / (1000 * 60 * 60)
  if (diffH <= 0 || diffH > 6) return 0
  if (diffH <= 1) return 0.15
  if (diffH <= 3) return 0.1
  return 0.05
}

export function formatResponseTimeBadge(avgApprovalMin: number | null | undefined): string | null {
  if (avgApprovalMin == null) return null
  if (avgApprovalMin <= 60) return '1시간 내 응답'
  if (avgApprovalMin <= 6 * 60) return `${Math.round(avgApprovalMin / 60)}시간 내 응답`
  if (avgApprovalMin <= 24 * 60) return '24시간 내 응답'
  return '응답 다소 늦음'
}
