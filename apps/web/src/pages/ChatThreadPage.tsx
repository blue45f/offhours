import { Navigate, useParams } from 'react-router-dom'

import { ChatShell } from '../components/chat/ChatShell'
import { ChatThreadView } from '../components/chat/ChatThreadView'
import { useChatThread } from '../features/chat/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

/** 채팅 스레드 — 알림 딥링크(/chat/:id)의 착지점. md+ 에서는 목록과 나란히 보인다 */
export default function ChatThreadPage() {
  const { id } = useParams<{ id: string }>()
  const thread = useChatThread(id)
  useDocumentTitle(thread.data?.peerName ? `${thread.data.peerName}님과의 대화` : '채팅')

  if (!id) return <Navigate to="/chat" replace />

  return (
    <ChatShell activeId={id}>
      <ChatThreadView threadId={id} />
    </ChatShell>
  )
}
