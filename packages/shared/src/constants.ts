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
