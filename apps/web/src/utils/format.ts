export function formatKRW(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

export function formatKRWShort(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`
  if (value >= 10_000) return `${Math.round(value / 10_000).toLocaleString('ko-KR')}만`
  return value.toLocaleString('ko-KR')
}

export function formatDateKR(value: string | Date): string {
  const d = new Date(value)
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
}

export function formatDateTimeKR(value: string | Date): string {
  const d = new Date(value)
  return d.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatTimeRange(start: string | Date, end: string | Date): string {
  const s = new Date(start)
  const e = new Date(end)
  const sd = s.toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
  const ed = e.toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${sd} – ${ed}`
}

export function timeFromNow(value: string | Date): string {
  const diff = (new Date(value).getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return diff > 0 ? '곧' : '방금 전'
  if (abs < 3600) return `${Math.round(abs / 60)}분 ${diff > 0 ? '뒤' : '전'}`
  if (abs < 86400) return `${Math.round(abs / 3600)}시간 ${diff > 0 ? '뒤' : '전'}`
  return `${Math.round(abs / 86400)}일 ${diff > 0 ? '뒤' : '전'}`
}
