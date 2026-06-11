import type { ReactNode } from 'react'

import { ChatListPane } from './ChatListPane'
import { cn } from '../../utils/cn'

interface ChatShellProps {
  /** 현재 열린 스레드 — 목록 하이라이트 + 모바일에서 목록/스레드 중 무엇을 보일지 결정 */
  activeId?: string
  children: ReactNode
}

/**
 * 채팅 2-페인 셸 — 라우트 분할(/chat 목록, /chat/:id 스레드)을 유지하면서
 * md+ 에서는 목록을 항상 왼쪽에 보여준다. 모바일은 한 번에 한 페인만.
 */
export function ChatShell({ activeId, children }: ChatShellProps) {
  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-headline serif mb-6">채팅</h1>
      <div className="grid min-h-[520px] grid-cols-1 overflow-hidden rounded-[var(--radius-2xl)] hairline bg-[var(--color-bg-elevated)] md:grid-cols-[300px_1fr]">
        <aside
          className={cn(
            'overflow-y-auto border-[var(--color-border)] md:block md:border-r',
            activeId && 'hidden'
          )}
        >
          <ChatListPane activeId={activeId} />
        </aside>
        <div className={cn('min-h-0 flex-col md:flex', activeId ? 'flex' : 'hidden')}>
          {children}
        </div>
      </div>
    </div>
  )
}
