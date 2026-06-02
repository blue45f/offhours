import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale/ko'

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value
}

export function formatKRW(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

export function formatKRWShort(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`
  if (value >= 10_000) return `${Math.round(value / 10_000).toLocaleString('ko-KR')}만`
  return value.toLocaleString('ko-KR')
}

export function formatDateKR(value: string | Date): string {
  return format(toDate(value), 'yyyy년 M월 d일 (EEE)', { locale: ko })
}

export function formatDateTimeKR(value: string | Date): string {
  return format(toDate(value), 'M월 d일 (EEE) HH:mm', { locale: ko })
}

export function formatTimeRange(start: string | Date, end: string | Date): string {
  return `${format(toDate(start), 'HH:mm')} – ${format(toDate(end), 'HH:mm')}`
}

export function timeFromNow(value: string | Date): string {
  const diff = (new Date(value).getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return diff > 0 ? '곧' : '방금 전'
  if (abs < 3600) return `${Math.round(abs / 60)}분 ${diff > 0 ? '뒤' : '전'}`
  if (abs < 86400) return `${Math.round(abs / 3600)}시간 ${diff > 0 ? '뒤' : '전'}`
  return `${Math.round(abs / 86400)}일 ${diff > 0 ? '뒤' : '전'}`
}
