import { useEffect, useState } from 'react'

export interface Countdown {
  /** D-day 정수 (음수면 이미 지남) */
  days: number
  hours: number
  minutes: number
  seconds: number
  /** 시작 시각이 지났는지 */
  past: boolean
  /** 1분 이내로 임박했는지 */
  imminent: boolean
}

function diff(target: number, now: number): Countdown {
  const ms = target - now
  const past = ms <= 0
  const abs = Math.abs(ms)
  const days = Math.floor(abs / 86_400_000)
  const hours = Math.floor((abs % 86_400_000) / 3_600_000)
  const minutes = Math.floor((abs % 3_600_000) / 60_000)
  const seconds = Math.floor((abs % 60_000) / 1000)
  return { days, hours, minutes, seconds, past, imminent: !past && ms < 60_000 }
}

/** 모임 시작까지 남은 시간을 매초 갱신 — prefers-reduced-motion이어도 값은 갱신(시각적 흔들림만 줄임) */
export function useCountdown(startAt?: string): Countdown | null {
  const target = startAt ? new Date(startAt).getTime() : NaN
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (Number.isNaN(target)) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [target])

  return Number.isNaN(target) ? null : diff(target, now)
}
