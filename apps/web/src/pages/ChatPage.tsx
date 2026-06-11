import { Navigate, useSearchParams } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'

import { ChatShell } from '../components/chat/ChatShell'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

/** 채팅 목록 — 스레드는 /chat/:id 로 라우트 분할. 구 딥링크(?c=)는 새 경로로 영구 이동 */
export default function ChatPage() {
  useDocumentTitle('채팅')
  const [sp] = useSearchParams()
  const legacy = sp.get('c')
  if (legacy) return <Navigate to={`/chat/${legacy}`} replace />

  return (
    <ChatShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <MessageCircle size={22} strokeWidth={1.5} />
        </span>
        <p className="text-sm font-medium text-[var(--color-fg)]">대화를 선택해주세요</p>
        <p className="max-w-[36ch] text-xs leading-relaxed text-[var(--color-fg-muted)]">
          예약 채팅과 예약 전 문의가 한 곳에 모여요. 왼쪽 목록에서 스레드를 열어보세요.
        </p>
      </div>
    </ChatShell>
  )
}
