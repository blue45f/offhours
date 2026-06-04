import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      {/* 톤 레이어링: 순중립 회색 대신 워밍 프라이머리 틴트 + 헤어라인 링으로 브랜드 무드를 유지 */}
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-1 ring-[var(--color-border)]">
        {icon ?? <Sparkles size={24} strokeWidth={1.5} />}
      </div>
      <h3 className="text-title font-semibold tracking-[-0.01em] text-[var(--color-fg)]">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
