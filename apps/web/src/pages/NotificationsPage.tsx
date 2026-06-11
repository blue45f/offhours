import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { Notification, NotificationType } from '@offhours/shared'
import {
  Bell,
  CalendarCheck,
  CalendarX,
  ChevronRight,
  CreditCard,
  MessageCircle,
  Star,
} from 'lucide-react'
import type { ComponentType } from 'react'

import { api } from '../services/api'
import { notificationLink } from '../features/notifications/deeplink'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { formatDateTimeKR } from '../utils/format'
import { cn } from '../utils/cn'

const TYPE_ICON: Record<NotificationType, ComponentType<{ size?: number | string }>> = {
  RESERVATION_REQUESTED: CalendarCheck,
  RESERVATION_APPROVED: CalendarCheck,
  RESERVATION_REJECTED: CalendarX,
  PAYMENT_COMPLETED: CreditCard,
  REVIEW_REQUESTED: Star,
  CHAT_MESSAGE: MessageCircle,
  SYSTEM: Bell,
}

export default function NotificationsPage() {
  useDocumentTitle('알림')
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications'),
  })
  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const markOne = useMutation({
    mutationFn: (id: string) => api.patch('/notifications/read', { ids: [id] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  /** 카드 클릭 = 개별 읽음 + 해당 예약/채팅/공간으로 이동 (이동 불가 알림은 읽음만) */
  function onOpen(n: Notification) {
    if (!n.readAt) markOne.mutate(n.id)
    const link = notificationLink(n)
    if (link) navigate(link)
  }

  return (
    <div className="container-page py-8 md:py-12 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-headline serif">알림</h1>
        {data && data.some((n) => !n.readAt) && (
          <Button variant="ghost" size="sm" onClick={() => markAll.mutate()}>
            모두 읽음
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-20 w-full rounded-[var(--radius-lg)]" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Bell size={20} />}
          title="새 알림이 없어요"
          description="예약·메시지·시스템 알림이 여기 표시돼요."
        />
      ) : (
        <ul className="space-y-3">
          {data.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Bell
            const link = notificationLink(n)
            const unread = !n.readAt
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onOpen(n)}
                  className={cn(
                    'group flex w-full items-start gap-3.5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 text-left transition-colors',
                    'hover:bg-[var(--color-bg-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)] outline-none',
                    unread && 'border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)]/30'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
                      unread
                        ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
                        : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]'
                    )}
                  >
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={cn('text-sm', unread ? 'font-bold' : 'font-semibold')}>
                        {n.title}
                        {unread && (
                          <span
                            aria-label="안 읽음"
                            className="ml-1.5 inline-block size-1.5 rounded-full bg-[var(--color-accent)] align-middle"
                          />
                        )}
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-xs text-[var(--color-fg-subtle)]">
                        {formatDateTimeKR(n.createdAt)}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-[var(--color-fg-muted)] line-clamp-2">
                      {n.body}
                    </span>
                  </span>
                  {link && (
                    <ChevronRight
                      size={16}
                      aria-hidden
                      className="mt-1 shrink-0 text-[var(--color-fg-subtle)] transition-transform group-hover:translate-x-0.5"
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
