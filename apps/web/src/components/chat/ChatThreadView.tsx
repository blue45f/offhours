import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, EyeOff, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import type { ChatMessage } from '@offhours/shared'

import { chatKeys, useChatMessages, useChatThread, useSendMessage } from '../../features/chat/api'
import { useMe } from '../../store/auth'
import { getErrorMessage } from '../../services/api'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { AttachmentInput, AttachmentThumbs } from '../ui/AttachmentInput'
import { Skeleton } from '../ui/Skeleton'
import { ChatContextCard } from './ChatContextCard'
import { cn } from '../../utils/cn'
import { formatDateKR } from '../../utils/format'
import { format, parseISO } from 'date-fns'

/** 같은 날 메시지를 묶기 위한 day key */
function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

export function ChatThreadView({ threadId }: { threadId: string }) {
  const me = useMe()
  const qc = useQueryClient()
  const thread = useChatThread(threadId)
  const messages = useChatMessages(threadId)
  const send = useSendMessage(threadId)
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastCountRef = useRef(0)

  // 스레드를 열어 메시지를 읽으면 서버 lastReadAt 이 갱신되므로 목록 unread 도 새로 가져온다
  useEffect(() => {
    if (messages.isSuccess) {
      qc.invalidateQueries({ queryKey: chatKeys.list, exact: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, messages.isSuccess])

  // 새 메시지 도착 시에만 하단으로 — 즉시 점프(behavior: auto)라 reduced-motion 에도 안전
  useEffect(() => {
    const count = messages.data?.length ?? 0
    if (count > 0 && count !== lastCountRef.current) {
      lastCountRef.current = count
      bottomRef.current?.scrollIntoView({ block: 'end' })
    }
  }, [messages.data?.length])

  async function onSend() {
    const body = text.trim()
    if (!body && attachments.length === 0) return
    try {
      await send.mutateAsync({ body, attachments })
      setText('')
      setAttachments([])
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  // 내가 보낸 마지막 메시지 — 상대 lastReadAt 과 비교해 "읽음" 표시
  const myLast = [...(messages.data ?? [])].reverse().find((m) => m.senderId === me?.id)
  const myLastRead =
    !!myLast && !!thread.data?.peerLastReadAt && thread.data.peerLastReadAt >= myLast.createdAt

  return (
    <section aria-label="대화" className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <Link
          to="/chat"
          aria-label="채팅 목록으로"
          className="inline-flex size-8 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] md:hidden"
        >
          <ArrowLeft size={16} />
        </Link>
        {thread.isLoading ? (
          <Skeleton variant="text" className="w-32" />
        ) : (
          <>
            <Avatar src={thread.data?.peerAvatarUrl} name={thread.data?.peerName} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{thread.data?.peerName}</div>
            </div>
          </>
        )}
      </header>

      {thread.data && <ChatContextCard thread={thread.data} />}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn('h-10 w-1/2 rounded-[var(--radius-xl)]', i % 2 === 1 && 'ml-auto')}
            />
          ))}
        {!messages.isLoading && messages.data?.length === 0 && (
          <p className="py-10 text-center text-sm text-[var(--color-fg-muted)]">
            첫 메시지를 보내 대화를 시작해보세요.
          </p>
        )}
        {messages.data?.map((m, i) => {
          const prev = messages.data[i - 1]
          const showDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt)
          const mine = m.senderId === me?.id
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-4 flex items-center gap-3" role="separator">
                  <span className="h-px flex-1 bg-[var(--color-border-subtle)]" />
                  <span className="text-[11px] font-medium text-[var(--color-fg-subtle)]">
                    {formatDateKR(m.createdAt)}
                  </span>
                  <span className="h-px flex-1 bg-[var(--color-border-subtle)]" />
                </div>
              )}
              <MessageBubble
                message={m}
                mine={mine}
                readReceipt={mine && m.id === myLast?.id ? (myLastRead ? '읽음' : null) : null}
              />
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void onSend()
        }}
        className="border-t border-[var(--color-border)] p-3"
      >
        {attachments.length > 0 && (
          <div className="mb-2">
            <AttachmentInput value={attachments} onChange={setAttachments} size="sm" />
          </div>
        )}
        <div className="flex items-center gap-2">
          {attachments.length === 0 && (
            <AttachmentInput
              value={attachments}
              onChange={setAttachments}
              size="sm"
              className="[&>button]:size-9"
            />
          )}
          <Input
            placeholder="메시지 입력…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="메시지 입력"
            className="flex-1"
          />
          <Button
            type="submit"
            loading={send.isPending}
            disabled={!text.trim() && attachments.length === 0}
            leading={<Send size={14} />}
          >
            전송
          </Button>
        </div>
      </form>
    </section>
  )
}

function MessageBubble({
  message,
  mine,
  readReceipt,
}: {
  message: ChatMessage
  mine: boolean
  readReceipt: string | null
}) {
  return (
    <div className={cn('flex gap-2', mine && 'justify-end')}>
      {!mine && <Avatar src={message.senderAvatarUrl} name={message.senderName} size="sm" />}
      <div className={cn('max-w-[70%]', mine && 'flex flex-col items-end')}>
        <div
          className={cn(
            'rounded-[var(--radius-xl)] px-3.5 py-2 text-sm leading-relaxed',
            mine
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
              : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg)]'
          )}
        >
          {message.isHidden ? (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-xs italic',
                mine ? 'text-white/75' : 'text-[var(--color-fg-muted)]'
              )}
            >
              <EyeOff size={12} /> 운영 정책에 따라 가려진 메시지예요
            </span>
          ) : (
            <>
              {message.attachments.length > 0 && (
                <AttachmentThumbs
                  attachments={message.attachments}
                  thumbClassName="size-28"
                  className={cn(message.body && 'mb-1.5')}
                />
              )}
              {message.body && (
                <div className="whitespace-pre-line break-words">{message.body}</div>
              )}
            </>
          )}
          <div
            className={cn(
              'mt-1 text-[10px] opacity-70',
              mine ? 'text-white' : 'text-[var(--color-fg-muted)]'
            )}
          >
            {format(parseISO(message.createdAt), 'HH:mm')}
          </div>
        </div>
        {readReceipt && (
          <span className="mt-0.5 text-[10px] font-medium text-[var(--color-primary)]">
            {readReceipt}
          </span>
        )}
      </div>
    </div>
  )
}
