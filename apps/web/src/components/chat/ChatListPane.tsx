import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { ReservationStatusLabel, type ChatSummary } from '@offhours/shared'

import { useChats } from '../../features/chat/api'
import { Avatar } from '../ui/Avatar'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'
import { cn } from '../../utils/cn'
import { timeFromNow } from '../../utils/format'

function contextLine(c: ChatSummary): string | null {
  if (!c.spaceTitle) return null
  if (c.reservationCode && c.reservationStatus) {
    return `${c.spaceTitle} · ${ReservationStatusLabel[c.reservationStatus]}`
  }
  return `${c.spaceTitle} · 예약 전 문의`
}

export function ChatListPane({ activeId }: { activeId?: string }) {
  const { data, isLoading } = useChats()

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton variant="text" className="w-1/2" />
              <Skeleton variant="text" className="w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle size={20} />}
        title="대화가 없어요"
        description="공간 상세의 '문의하기'로 호스트에게 먼저 말을 걸거나, 예약을 시작하면 대화가 열려요."
      />
    )
  }

  return (
    <nav aria-label="채팅 목록">
      <ul>
        {data.map((c) => {
          const line = contextLine(c)
          return (
            <li key={c.id}>
              <Link
                to={`/chat/${c.id}`}
                aria-current={activeId === c.id ? 'page' : undefined}
                className={cn(
                  'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                  activeId === c.id
                    ? 'bg-[var(--color-bg-subtle)]'
                    : 'hover:bg-[var(--color-bg-subtle)]'
                )}
              >
                <span className="relative shrink-0">
                  <Avatar src={c.peerAvatarUrl} name={c.peerName} size="md" />
                  {c.spaceThumbnailUrl && (
                    <img
                      src={c.spaceThumbnailUrl}
                      alt=""
                      aria-hidden
                      className="absolute -bottom-1 -right-1 size-5 rounded-[6px] object-cover ring-2 ring-[var(--color-bg-elevated)]"
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        'truncate text-sm',
                        c.unreadCount > 0 ? 'font-bold' : 'font-semibold'
                      )}
                    >
                      {c.peerName}
                    </span>
                    {c.lastMessageAt && (
                      <span className="shrink-0 text-[11px] text-[var(--color-fg-subtle)]">
                        {timeFromNow(c.lastMessageAt)}
                      </span>
                    )}
                  </span>
                  {line && (
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--color-primary)]">
                      {line}
                    </span>
                  )}
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'truncate text-xs',
                        c.unreadCount > 0
                          ? 'font-medium text-[var(--color-fg)]'
                          : 'text-[var(--color-fg-muted)]'
                      )}
                    >
                      {c.lastMessage ?? '대화를 시작해보세요'}
                    </span>
                    {c.unreadCount > 0 && (
                      <span
                        aria-label={`안 읽은 메시지 ${c.unreadCount}개`}
                        className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white"
                      >
                        {c.unreadCount > 9 ? '9+' : c.unreadCount}
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
