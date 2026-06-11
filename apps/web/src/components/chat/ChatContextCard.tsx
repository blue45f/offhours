import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, MessageCircleQuestion } from 'lucide-react'
import { ReservationStatusLabel, type ChatSummary } from '@offhours/shared'

import { Badge } from '../ui/Badge'
import { formatDateTimeKR } from '../../utils/format'

/**
 * 스레드 상단의 예약 컨텍스트 카드 — 무슨 건으로 나누는 대화인지(예약/예약 전 문의)와
 * 원본(예약 상세·공간 상세)으로 가는 동선을 한 장에 담는다.
 */
export function ChatContextCard({ thread }: { thread: ChatSummary }) {
  if (!thread.spaceTitle) return null
  const isReservation = !!thread.reservationId

  const to = isReservation
    ? `/me/reservations/${thread.reservationId}`
    : thread.spaceSlug
      ? `/spaces/${thread.spaceSlug}`
      : null
  if (!to) return null

  return (
    <Link
      to={to}
      className="group flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]/60 px-4 py-2.5 transition-colors hover:bg-[var(--color-bg-subtle)]"
    >
      {thread.spaceThumbnailUrl ? (
        <img
          src={thread.spaceThumbnailUrl}
          alt=""
          aria-hidden
          className="size-10 shrink-0 rounded-[var(--radius-md)] object-cover"
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <MessageCircleQuestion size={18} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{thread.spaceTitle}</span>
          {isReservation && thread.reservationStatus ? (
            <Badge tone="primary" soft className="shrink-0">
              {ReservationStatusLabel[thread.reservationStatus]}
            </Badge>
          ) : (
            <Badge tone="accent" soft className="shrink-0">
              예약 전 문의
            </Badge>
          )}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-fg-muted)]">
          {isReservation && thread.reservationStartAt ? (
            <>
              <CalendarDays size={11} />
              {formatDateTimeKR(thread.reservationStartAt)}
              {thread.reservationCode && (
                <span className="font-mono text-[var(--color-fg-subtle)]">
                  {thread.reservationCode}
                </span>
              )}
            </>
          ) : (
            '공간 상세 보기'
          )}
        </span>
      </span>
      <ChevronRight
        size={16}
        className="shrink-0 text-[var(--color-fg-subtle)] transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  )
}
