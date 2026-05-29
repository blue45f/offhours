import type { CancellationPolicy } from './enums'

export const PLATFORM_FEE_RATE = 0.12

/**
 * 취소·환불 정책 티어 — 호스트가 공간별로 선택. 영업 외 대관은 라스트미닛 비중이 커서
 * 유연(FLEXIBLE) 정책이 전환 레버가 되고, 인기 주말·성수기 공간은 엄격(STRICT)으로
 * 노쇼를 방어한다. Splacer/Giggster/Airbnb 의 Flexible·Moderate·Strict 한국화.
 * 각 schedule 은 hoursBefore 내림차순 — diffH 가 처음 충족하는 구간의 refundRate 적용.
 */
export const CANCELLATION_POLICIES: Record<
  CancellationPolicy,
  {
    label: string
    blurb: string
    schedule: { hoursBefore: number; refundRate: number; label: string }[]
  }
> = {
  FLEXIBLE: {
    label: '유연',
    blurb: '이용 24시간 전까지 100% 환불, 이후 50%',
    schedule: [
      { hoursBefore: 24, refundRate: 1.0, label: '24시간 전' },
      { hoursBefore: 0, refundRate: 0.5, label: '24시간 이내' },
    ],
  },
  STANDARD: {
    label: '일반',
    blurb: '7일 전 100% · 3일 전 50% · 1일 전 20%',
    schedule: [
      { hoursBefore: 168, refundRate: 1.0, label: '7일 전' },
      { hoursBefore: 72, refundRate: 0.5, label: '3일 전' },
      { hoursBefore: 24, refundRate: 0.2, label: '1일 전' },
      { hoursBefore: 0, refundRate: 0, label: '당일' },
    ],
  },
  STRICT: {
    label: '엄격',
    blurb: '7일 전 100% · 3일 전 50% · 이후 환불 불가',
    schedule: [
      { hoursBefore: 168, refundRate: 1.0, label: '7일 전' },
      { hoursBefore: 72, refundRate: 0.5, label: '3일 전' },
      { hoursBefore: 0, refundRate: 0, label: '3일 이내' },
    ],
  },
}

export function calcRefundRate(
  startAt: Date | string,
  now: Date = new Date(),
  policy: CancellationPolicy = 'STANDARD'
): number {
  const diffH = (new Date(startAt).getTime() - now.getTime()) / (1000 * 60 * 60)
  for (const tier of CANCELLATION_POLICIES[policy].schedule) {
    if (diffH >= tier.hoursBefore) return tier.refundRate
  }
  return 0
}

export const TRUST_SCORE = {
  INITIAL: 50,
  MIN: 0,
  MAX: 100,
  /** 평점별 적용 — 5점 +3, 4점 +2, 3점 -1, 2점 -3, 1점 -5 */
  REVIEW_DELTA: { 5: 3, 4: 2, 3: -1, 2: -3, 1: -5 } as Record<number, number>,
  PENALTY_HOST_REJECT: -2,
  PENALTY_HOST_NO_SHOW: -8,
  PENALTY_GUEST_CANCEL: -2,
  PENALTY_DISPUTE: -15,
  BONUS_ON_VERIFY: 10,
} as const

export function clampTrust(score: number): number {
  return Math.max(TRUST_SCORE.MIN, Math.min(TRUST_SCORE.MAX, score))
}

export type TrustTier = {
  key: 'top' | 'excellent' | 'good' | 'normal' | 'caution'
  label: string
  hint: string
  /** 0~1 진행도 (UI 게이지) */
  progress: number
}

/**
 * 신뢰 점수 → 사용자 친화 티어. Airbnb Superhost / Peerspace Power Host / Tagvenue
 * Supervenue 의 4~5단 분류를 합성. caution 은 거래 위험 시그널이라 회색 대신 amber 톤.
 */
export function formatTrustTier(score: number | null | undefined): TrustTier {
  const s = clampTrust(score ?? TRUST_SCORE.INITIAL)
  if (s >= 90) return { key: 'top', label: '최고 신뢰', hint: '상위 5% 호스트', progress: s / 100 }
  if (s >= 75)
    return { key: 'excellent', label: '우수', hint: '응답·이행·평점 모두 우수', progress: s / 100 }
  if (s >= 60) return { key: 'good', label: '양호', hint: '안정적인 운영 이력', progress: s / 100 }
  if (s >= 45)
    return { key: 'normal', label: '보통', hint: '신규 또는 표본 부족', progress: s / 100 }
  return { key: 'caution', label: '주의', hint: '최근 취소·분쟁 누적', progress: s / 100 }
}

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

/**
 * Airbnb / Peerspace / Tagvenue 룰 합성:
 * - 최근 30일 신규 문의 ≥ {@link RESPONSE_BADGE_MIN_SAMPLE} 건
 * - 24h 이내 응답률 ≥ {@link RESPONSE_BADGE_MIN_RATE}
 * 둘 다 만족하지 못하면 통계 왜곡 방지를 위해 뱃지 미노출.
 *
 * 라벨은 중앙값 기준 1 / 3 / 12 / 24h 4단계로 양자화. 24h 초과면 null.
 */
export const RESPONSE_BADGE_MIN_SAMPLE = 10
export const RESPONSE_BADGE_MIN_RATE = 0.9

export function formatResponseTimeBadge(input: {
  medianMin: number | null | undefined
  rate24h: number | null | undefined
  sampleCount: number | null | undefined
}): string | null {
  const { medianMin, rate24h, sampleCount } = input
  if (medianMin == null || rate24h == null || sampleCount == null) return null
  if (sampleCount < RESPONSE_BADGE_MIN_SAMPLE) return null
  if (rate24h < RESPONSE_BADGE_MIN_RATE) return null
  if (medianMin <= 60) return '보통 1시간 안에 답해요'
  if (medianMin <= 3 * 60) return '보통 3시간 안에 답해요'
  if (medianMin <= 12 * 60) return '보통 12시간 안에 답해요'
  if (medianMin <= 24 * 60) return '보통 24시간 안에 답해요'
  return null
}
