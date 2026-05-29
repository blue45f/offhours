import { useId, useState } from 'react'
import { Check, CircleHelp, X } from 'lucide-react'
import type { RsvpStatus } from '@offhours/shared'
import { RsvpStatusLabel } from '@offhours/shared'

import { cn } from '../../utils/cn'
import { Input } from '../../components/ui/Input'

const ORDER: RsvpStatus[] = ['GOING', 'MAYBE', 'NO']

const icon: Record<RsvpStatus, typeof Check> = {
  GOING: Check,
  MAYBE: CircleHelp,
  NO: X,
}

// 선택 상태는 색 + 채움(모양)으로도 구분 — 색만으로 의미를 전달하지 않는다
const selected: Record<RsvpStatus, string> = {
  GOING:
    'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-[var(--shadow-sm)]',
  MAYBE:
    'border-transparent bg-[var(--color-fg)] text-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)]',
  NO: 'border-transparent bg-[color-mix(in_srgb,var(--color-fg)_8%,var(--color-bg-elevated))] text-[var(--color-fg-muted)] ring-1 ring-inset ring-[var(--color-border-strong)]',
}

interface RsvpControlProps {
  defaultName?: string
  pending?: boolean
  onSubmit: (name: string, status: RsvpStatus) => void
}

export function RsvpControl({ defaultName = '', pending, onSubmit }: RsvpControlProps) {
  const [name, setName] = useState(defaultName)
  const [choice, setChoice] = useState<RsvpStatus | null>(null)
  const [touched, setTouched] = useState(false)
  const groupId = useId()
  const labelId = `${groupId}-label`
  const trimmed = name.trim()
  const nameMissing = touched && trimmed.length === 0

  function choose(status: RsvpStatus) {
    setChoice(status)
    if (trimmed.length === 0) {
      setTouched(true)
      return
    }
    onSubmit(trimmed, status)
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${groupId}-name`} className="mb-1.5 block text-sm font-medium">
          어떻게 부르면 될까요
        </label>
        <Input
          id={`${groupId}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="이름 또는 닉네임"
          maxLength={40}
          autoComplete="name"
          enterKeyHint="done"
          error={nameMissing}
          aria-describedby={nameMissing ? `${groupId}-err` : undefined}
        />
        {nameMissing && (
          <p id={`${groupId}-err`} className="mt-1.5 text-xs text-[var(--color-error)]">
            이름을 먼저 알려주세요
          </p>
        )}
      </div>

      <div role="group" aria-labelledby={labelId} className="space-y-2">
        <span id={labelId} className="block text-sm font-medium">
          참석하시나요
        </span>
        <div className="grid grid-cols-3 gap-2">
          {ORDER.map((status) => {
            const Icon = icon[status]
            const active = choice === status
            return (
              <button
                key={status}
                type="button"
                aria-pressed={active}
                disabled={pending}
                onClick={() => choose(status)}
                className={cn(
                  'flex h-[4.25rem] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-lg)] border text-sm font-medium',
                  'transition-[background,color,border-color,transform] duration-[var(--duration-base)] ease-[var(--easing-standard)]',
                  'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
                  active
                    ? selected[status]
                    : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-fg)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-subtle)]'
                )}
              >
                <Icon size={18} aria-hidden />
                {RsvpStatusLabel[status]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
