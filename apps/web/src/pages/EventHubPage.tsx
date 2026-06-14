import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale/ko'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import toast from 'react-hot-toast'
import { ArrowRight, CalendarDays, MapPin, Pencil, Users } from 'lucide-react'
import type { EventSummary, Rsvp, RsvpStatus } from '@offhours/shared'
import { PurposeLabel, RsvpStatusLabel } from '@offhours/shared'

import { cn } from '../utils/cn'
import { useEvent, useRsvp } from '../features/events/api'
import { useCountdown, type Countdown } from '../features/events/useCountdown'
import { getClientToken, readSavedName, saveName } from '../features/events/clientToken'
import { RsvpControl } from '../features/events/RsvpControl'
import { AddToCalendar } from '../features/events/AddToCalendar'
import { getErrorMessage } from '../services/api'
import { Avatar } from '../components/ui/Avatar'
import { Skeleton } from '../components/ui/Skeleton'

const CONFIRMED = new Set(['APPROVED', 'PAID', 'CHECKED_IN', 'COMPLETED'])
const EASE = [0.2, 0, 0, 1] as const

function useMinuteNow(): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  return now
}

function partOfDay(h: number): string {
  if (h < 5) return '새벽'
  if (h < 12) return '아침'
  if (h < 17) return '낮'
  if (h < 21) return '저녁'
  return '밤'
}

/** "5월 30일 토요일 · 밤 11시" 같은 자연스러운 한국어 표기 */
function inviteDateLine(value: string): string {
  const d = parseISO(value)
  const h = d.getHours()
  const hour12 = h % 12 === 0 ? 12 : h % 12
  const min = d.getMinutes()
  const time = min === 0 ? `${partOfDay(h)} ${hour12}시` : `${partOfDay(h)} ${hour12}시 ${min}분`
  return `${format(d, 'M월 d일 EEEE', { locale: ko })} · ${time}`
}

function fullDateLine(start: string, end: string): string {
  const s = parseISO(start)
  const e = parseISO(end)
  const date = format(s, 'yyyy년 M월 d일 (EEE)', { locale: ko })
  return `${date} · ${format(s, 'HH:mm')} ~ ${format(e, 'HH:mm')}`
}

function countdownLabel(c: Countdown): string {
  if (c.past) return '지금 모이는 중이에요'
  if (c.imminent) return '곧 시작해요'
  const dLabel = `D-${c.days}`
  if (c.days > 0) return `${dLabel} · ${c.hours}시간 ${c.minutes}분`
  if (c.hours > 0) return `${c.hours}시간 ${c.minutes}분 남았어요`
  return `${c.minutes}분 ${c.seconds}초 남았어요`
}

export default function EventHubPage() {
  const { code } = useParams<{ code: string }>()
  const { data, isLoading, isError } = useEvent(code)

  if (isLoading) return <EventSkeleton />
  if (isError || !data) return <NotFound />
  return <EventHub event={data} />
}

function EventHub({ event }: { event: EventSummary }) {
  const reduce = useReducedMotion()
  const rsvp = useRsvp(event.code)
  const countdown = useCountdown(event.startAt)
  const now = useMinuteNow()

  const token = useMemo(() => getClientToken(), [])
  const [savedName, setSavedName] = useState(() => readSavedName())
  const [editing, setEditing] = useState(false)
  // 본인 응답은 이름이 아니라 서버가 clientToken 으로 판정한 mine 플래그로 식별(동명이인 오인 방지)
  const myRsvp = event.rsvps.find((r) => r.mine)

  async function submit(name: string, status: RsvpStatus) {
    saveName(name)
    setSavedName(name)
    try {
      await rsvp.mutateAsync({ name, status, clientToken: token })
      setEditing(false)
      const verb =
        status === 'GOING'
          ? '참석으로 응답했어요'
          : status === 'MAYBE'
            ? '미정으로 표시했어요'
            : '불참으로 응답했어요'
      toast.success(`${name}님, ${verb}`)
    } catch (e) {
      toast.error(getErrorMessage(e, '응답을 저장하지 못했어요'))
    }
  }

  const confirmed = CONFIRMED.has(event.reservationStatus)
  // 종료 시각이 지났으면 "끝난 모임" — 카운트다운 카피와 캘린더 추가를 분기한다.
  const ended = new Date(event.endAt).getTime() < now
  const rise = reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }

  return (
    <div className="bg-[var(--color-bg)]">
      <Hero
        event={event}
        confirmed={confirmed}
        countdown={countdown}
        ended={ended}
        reduce={!!reduce}
      />

      <div className="mx-auto w-full max-w-[37.5rem] px-5 pb-20">
        <motion.section
          {...rise}
          transition={{ duration: 0.5, ease: EASE }}
          className="-mt-6 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6 py-7 shadow-[var(--shadow-md)] sm:px-8"
        >
          <p className="text-meta uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
            모임 안내
          </p>
          <dl className="mt-4 divide-y divide-[var(--color-border-subtle)]">
            <Detail icon={CalendarDays} term="일시">
              {fullDateLine(event.startAt, event.endAt)}
            </Detail>
            <Detail icon={MapPin} term="위치">
              <span>
                {event.region} {event.district}
              </span>
              <span className="mt-1 block text-[0.8125rem] leading-relaxed text-[var(--color-fg-subtle)]">
                정확한 주소는 호스트 확정 후 참석자에게 공개돼요
              </span>
            </Detail>
            <Detail icon={Users} term="인원">
              {event.headcount}명 규모 · {PurposeLabel[event.purpose]}
            </Detail>
            <Detail icon={null} term="호스트">
              {event.hostName}
            </Detail>
          </dl>
          {!ended && (
            <AddToCalendar
              title={event.spaceTitle}
              startAt={event.startAt}
              endAt={event.endAt}
              location={`${event.region} ${event.district}`}
              details={`${PurposeLabel[event.purpose]} · ${event.hostName}님 초대`}
            />
          )}
        </motion.section>

        <motion.section
          {...rise}
          transition={{ duration: 0.5, delay: reduce ? 0 : 0.08, ease: EASE }}
          className="mt-7"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-title serif">함께하는 사람들</h2>
            <Tally counts={event.counts} />
          </div>

          <People rsvps={event.rsvps} reduce={!!reduce} />

          <div className="mt-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-5 sm:p-6">
            {myRsvp && !editing ? (
              <Responded rsvp={myRsvp} onEdit={() => setEditing(true)} />
            ) : (
              <RsvpControl defaultName={savedName} pending={rsvp.isPending} onSubmit={submit} />
            )}
          </div>
        </motion.section>

        <footer className="mt-12 border-t border-[var(--color-border-subtle)] pt-6 text-center">
          <Link
            to="/spaces"
            className="group inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
          >
            Offhours에서 더 둘러보기
            <ArrowRight
              size={15}
              className="transition-transform duration-[var(--duration-base)] ease-[var(--easing-standard)] group-hover:translate-x-0.5"
            />
          </Link>
        </footer>
      </div>
    </div>
  )
}

function Hero({
  event,
  confirmed,
  countdown,
  ended,
  reduce,
}: {
  event: EventSummary
  confirmed: boolean
  countdown: Countdown | null
  ended: boolean
  reduce: boolean
}) {
  const fade = reduce ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }
  return (
    <header className="relative isolate overflow-hidden">
      {event.spaceThumbnailUrl ? (
        <img
          src={event.spaceThumbnailUrl}
          alt={`${event.spaceTitle} 공간 전경`}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 size-full"
          style={{
            background:
              'radial-gradient(120% 90% at 30% 0%, oklch(0.62 0.05 135) 0%, oklch(0.46 0.06 130) 45%, oklch(0.32 0.05 120) 100%)',
          }}
        />
      )}
      {/* 따뜻한 하단 스크림 — 순수 검정 대신 올리브/크림 톤 */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, oklch(0.22 0.03 110 / 0.92) 0%, oklch(0.28 0.03 115 / 0.6) 38%, oklch(0.4 0.03 120 / 0.18) 68%, transparent 100%)',
        }}
      />

      <div className="relative mx-auto flex min-h-[72svh] w-full max-w-[37.5rem] flex-col justify-end px-6 pb-16 pt-28 sm:min-h-[68svh]">
        <motion.div {...fade} transition={{ duration: 0.6, ease: EASE }}>
          <p className="text-sm font-medium text-[var(--color-fg-inverse)]/85">
            {event.hostName}님이 초대합니다
          </p>
          <h1 className="serif mt-2 text-[clamp(2.1rem,1.5rem+3vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.02em] text-[var(--color-fg-inverse)]">
            {event.spaceTitle}
          </h1>
          <p className="mt-3 text-[1.0625rem] text-[var(--color-fg-inverse)]/90">
            {inviteDateLine(event.startAt)}
          </p>
        </motion.div>

        <motion.div
          {...(reduce ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } })}
          transition={{ duration: 0.6, delay: reduce ? 0 : 0.12, ease: EASE }}
          className="mt-5 flex flex-wrap items-center gap-2.5"
        >
          {confirmed && (
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-bg-elevated)]/92 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-[var(--color-primary)]" aria-hidden />
              예약 확정
            </span>
          )}
          {countdown && (
            <span
              className="inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--color-fg-inverse)]/25 px-3.5 py-1.5 text-sm font-semibold text-[var(--color-fg-inverse)]"
              aria-live="polite"
            >
              {ended ? '이미 끝난 모임이에요' : countdownLabel(countdown)}
            </span>
          )}
        </motion.div>
      </div>
    </header>
  )
}

function Detail({
  icon: Icon,
  term,
  children,
}: {
  icon: typeof CalendarDays | null
  term: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3.5 py-3.5 first:pt-0 last:pb-0">
      <div className="flex w-16 shrink-0 items-center gap-2 pt-0.5 text-[var(--color-fg-muted)]">
        {Icon ? (
          <Icon size={16} aria-hidden className="text-[var(--color-fg-subtle)]" />
        ) : (
          <span className="w-4" />
        )}
        <dt className="text-sm">{term}</dt>
      </div>
      <dd className="flex-1 text-[0.9375rem] text-[var(--color-fg)]">{children}</dd>
    </div>
  )
}

function Tally({ counts }: { counts: EventSummary['counts'] }) {
  const items: { label: string; value: number; cls: string }[] = [
    { label: '참석', value: counts.going, cls: 'text-[var(--color-primary)]' },
    { label: '미정', value: counts.maybe, cls: 'text-[var(--color-fg-muted)]' },
    { label: '불참', value: counts.no, cls: 'text-[var(--color-fg-subtle)]' },
  ]
  return (
    <p className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
      {items.map((it, i) => (
        <span key={it.label} className="flex items-center gap-2">
          {i > 0 && <span className="text-[var(--color-border-strong)]">·</span>}
          <span>
            {it.label} <span className={cn('font-semibold tabular-nums', it.cls)}>{it.value}</span>
          </span>
        </span>
      ))}
    </p>
  )
}

const chipStyle: Record<RsvpStatus, string> = {
  GOING:
    'rounded-[var(--radius-pill)] border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
  MAYBE:
    'rounded-[var(--radius-md)] border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)]',
  NO: 'rounded-[var(--radius-md)] border-dashed border-[var(--color-border-strong)] bg-transparent text-[var(--color-fg-subtle)]',
}

const dotStyle: Record<RsvpStatus, string> = {
  GOING: 'bg-[var(--color-primary)]',
  MAYBE: 'border border-[var(--color-fg-muted)] bg-transparent',
  NO: 'bg-[var(--color-fg-subtle)] opacity-50',
}

function People({ rsvps, reduce }: { rsvps: Rsvp[]; reduce: boolean }) {
  if (rsvps.length === 0) {
    return (
      <div className="mt-5 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)]/60 px-6 py-9 text-center">
        <p className="text-[0.9375rem] font-medium text-[var(--color-fg)]">
          첫 참석자가 되어주세요
        </p>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          아래에서 이름을 남기고 참석 여부를 알려주세요
        </p>
      </div>
    )
  }
  // 참석 → 미정 → 불참 순으로 보기 좋게 정렬
  const order: Record<RsvpStatus, number> = { GOING: 0, MAYBE: 1, NO: 2 }
  const sorted = [...rsvps].sort((a, b) => order[a.status] - order[b.status])
  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {sorted.map((r, i) => (
        <motion.li
          key={r.id}
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: reduce ? 0 : Math.min(i * 0.03, 0.3), ease: EASE }}
          className={cn(
            'inline-flex items-center gap-2 border py-1 pl-1 pr-2.5',
            chipStyle[r.status]
          )}
        >
          <Avatar name={r.name} size="xs" />
          <span className="text-[0.8125rem] font-medium">{r.name}</span>
          <span className="sr-only">{RsvpStatusLabel[r.status]}</span>
          <span className={cn('size-1.5 rounded-full', dotStyle[r.status])} aria-hidden />
        </motion.li>
      ))}
    </ul>
  )
}

function Responded({ rsvp, onEdit }: { rsvp: Rsvp; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Avatar name={rsvp.name} size="md" />
        <div>
          <p className="text-[0.9375rem] font-semibold text-[var(--color-fg)]">
            {rsvp.name}님 · {RsvpStatusLabel[rsvp.status]}
          </p>
          <p className="text-sm text-[var(--color-fg-muted)]">응답이 저장됐어요</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-fg)]"
      >
        <Pencil size={13} aria-hidden />
        변경
      </button>
    </div>
  )
}

function EventSkeleton() {
  return (
    <div className="bg-[var(--color-bg)]">
      <div className="relative min-h-[60svh] overflow-hidden bg-[var(--color-bg-subtle)]">
        <div className="skeleton absolute inset-0" />
        <div className="relative mx-auto flex min-h-[60svh] w-full max-w-[37.5rem] flex-col justify-end gap-3 px-6 pb-16">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[37.5rem] px-5">
        <div className="-mt-6 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-7 shadow-[var(--shadow-md)]">
          <Skeleton className="h-3 w-20" />
          <div className="mt-5 space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="container-page flex min-h-[70svh] flex-col items-center justify-center py-16 text-center">
      <div className="serif text-[var(--color-fg-subtle)]" aria-hidden style={{ fontSize: '3rem' }}>
        ✉
      </div>
      <h1 className="mt-4 text-title serif">초대장을 찾을 수 없어요</h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--color-fg-muted)]">
        링크가 만료됐거나 주소가 정확하지 않을 수 있어요. 초대해 준 분께 다시 확인해 주세요.
      </p>
      <Link
        to="/spaces"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        Offhours 둘러보기
        <ArrowRight size={15} />
      </Link>
    </div>
  )
}
