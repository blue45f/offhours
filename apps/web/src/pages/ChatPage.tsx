import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import type { ChatMessage, ChatSummary } from '@offhours/shared'

import { api } from '../services/api'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useMe } from '../store/auth'
import { cn } from '../utils/cn'
import { formatDateTimeKR } from '../utils/format'

export default function ChatPage() {
  const me = useMe()
  const [sp] = useSearchParams()
  const [active, setActive] = useState<string | null>(sp.get('c'))
  const [text, setText] = useState('')
  const qc = useQueryClient()

  const list = useQuery({
    queryKey: ['chats'],
    queryFn: () => api.get<ChatSummary[]>('/chat'),
    refetchInterval: 30_000,
  })

  const messages = useQuery({
    queryKey: ['chats', active, 'messages'],
    enabled: !!active,
    queryFn: () => api.get<ChatMessage[]>(`/chat/${active}/messages`),
    refetchInterval: active ? 8000 : false,
  })

  const send = useMutation({
    mutationFn: (body: string) => api.post(`/chat/${active}/messages`, { body }),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['chats', active, 'messages'] })
    },
  })

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-headline serif mb-6">채팅</h1>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 min-h-[480px] rounded-[var(--radius-2xl)] hairline bg-[var(--color-bg-elevated)] overflow-hidden">
        <aside className="border-r border-[var(--color-border)] overflow-y-auto">
          {list.data?.length === 0 && (
            <EmptyState
              title="채팅이 없어요"
              description="예약을 시작하면 호스트와 대화할 수 있어요."
            />
          )}
          {list.data?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                active === c.id
                  ? 'bg-[var(--color-bg-subtle)]'
                  : 'hover:bg-[var(--color-bg-subtle)]'
              )}
            >
              <Avatar src={c.peerAvatarUrl} name={c.peerName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate">{c.peerName}</span>
                  {c.unreadCount > 0 && (
                    <span className="ml-2 inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--color-fg-muted)] truncate">
                  {c.lastMessage ?? '대화를 시작해보세요'}
                </div>
              </div>
            </button>
          ))}
        </aside>
        <section className="flex flex-col">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--color-fg-muted)]">
              왼쪽에서 대화를 선택해주세요.
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.data?.map((m) => {
                  const mine = m.senderId === me?.id
                  return (
                    <div key={m.id} className={cn('flex gap-2', mine && 'justify-end')}>
                      {!mine && <Avatar src={m.senderAvatarUrl} name={m.senderName} size="sm" />}
                      <div
                        className={cn(
                          'max-w-[70%] rounded-[var(--radius-xl)] px-3.5 py-2 text-sm leading-relaxed',
                          mine
                            ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
                            : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg)]'
                        )}
                      >
                        <div>{m.body}</div>
                        <div
                          className={cn(
                            'mt-1 text-[10px] opacity-70',
                            mine ? 'text-white' : 'text-[var(--color-fg-muted)]'
                          )}
                        >
                          {formatDateTimeKR(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (text.trim()) send.mutate(text)
                }}
                className="border-t border-[var(--color-border)] p-3 flex items-center gap-2"
              >
                <Input
                  placeholder="메시지 입력…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <Button type="submit" loading={send.isPending} leading={<Send size={14} />}>
                  전송
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
