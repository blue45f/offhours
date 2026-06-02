import { useMemo } from 'react'
import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { Clock } from 'lucide-react'

import { useSpaceSlots } from '../../features/spaces/api'
import { cn } from '../../utils/cn'

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']
const WEEKS = 6

interface OpenSlot {
  startAt: string
  endAt: string
  priceKRW: number
}

interface Props {
  spaceId: string
  /** YYYY-MM-DD */
  value: string
  onPickDate: (date: string) => void
  onPickSlot: (startTime: string, endTime: string) => void
}

function ymd(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}
function hm(iso: string): string {
  return format(parseISO(iso), 'HH:mm')
}
function durationH(startIso: string, endIso: string): number {
  return Math.round((parseISO(endIso).getTime() - parseISO(startIso).getTime()) / 3_600_000)
}

/**
 * 영업 외 시간 가용 캘린더 — 향후 6주를 그려 열린 슬롯이 있는 날을 강조.
 * 날짜를 누르면 그날의 영업 외 슬롯 칩이 뜨고, 칩을 누르면 시작/종료 시간이 자동 입력된다.
 * "영업 외 자동 슬롯" USP 를 게스트가 한눈에 체감하는 표면.
 */
export function AvailabilityCalendar({ spaceId, value, onPickDate, onPickSlot }: Props) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // 이번 주 일요일부터 6주
  const gridStart = useMemo(() => startOfWeek(today, { weekStartsOn: 0 }), [today])
  const gridEnd = useMemo(() => addDays(gridStart, WEEKS * 7), [gridStart])

  const { data: slots } = useSpaceSlots(spaceId, gridStart.toISOString(), gridEnd.toISOString())

  // 날짜별 열린 슬롯 모음
  const byDay = useMemo(() => {
    const map = new Map<string, OpenSlot[]>()
    for (const s of slots ?? []) {
      if (!s.isOpen || s.isReserved) continue
      const key = ymd(parseISO(s.startAt))
      const arr = map.get(key) ?? []
      arr.push({ startAt: s.startAt, endAt: s.endAt, priceKRW: s.priceKRW })
      map.set(key, arr)
    }
    for (const arr of map.values()) arr.sort((a, b) => a.startAt.localeCompare(b.startAt))
    return map
  }, [slots])

  const days = useMemo(() => {
    return Array.from({ length: WEEKS * 7 }, (_, i) => addDays(gridStart, i))
  }, [gridStart])

  const selectedSlots = byDay.get(value) ?? []
  const monthLabel = `${days[7].getFullYear()}년 ${days[7].getMonth() + 1}월`

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-[var(--color-fg-muted)]">{monthLabel}</div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY.map((w, i) => (
          <div
            key={w}
            className={cn(
              'text-[10px] font-semibold pb-1',
              i === 0
                ? 'text-[var(--color-error)]'
                : i === 6
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-fg-muted)]'
            )}
          >
            {w}
          </div>
        ))}
        {days.map((d) => {
          const key = ymd(d)
          const isPast = d < today
          const openCount = byDay.get(key)?.length ?? 0
          const hasOpen = openCount > 0 && !isPast
          const isSelected = key === value
          return (
            <button
              key={key}
              type="button"
              disabled={isPast || !hasOpen}
              onClick={() => onPickDate(key)}
              className={cn(
                'relative aspect-square rounded-[var(--radius-md)] text-xs transition-colors',
                isSelected
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-bold'
                  : hasOpen
                    ? 'bg-[var(--color-primary-soft)] text-[var(--color-fg)] font-semibold hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-fg)]'
                    : 'text-[var(--color-fg-subtle)]',
                (isPast || !hasOpen) && 'cursor-default opacity-40'
              )}
            >
              {d.getDate()}
              {hasOpen && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-[var(--color-primary)]" />
              )}
            </button>
          )
        })}
      </div>

      {value && (
        <div className="mt-3">
          {selectedSlots.length === 0 ? (
            <p className="text-xs text-[var(--color-fg-muted)] text-center py-2">
              이 날은 열린 영업 외 슬롯이 없어요. 강조된 날짜를 선택하거나 빈자리 알림을
              신청해보세요.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedSlots.map((s) => (
                <button
                  key={s.startAt}
                  type="button"
                  onClick={() => onPickSlot(hm(s.startAt), hm(s.endAt))}
                  className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--color-bg-subtle)] px-2.5 py-1 text-[11px] font-medium hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <Clock size={10} />
                  {hm(s.startAt)}–{hm(s.endAt)} · {durationH(s.startAt, s.endAt)}시간
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
