import type { HTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

type Tone = 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  soft?: boolean
  dot?: boolean
}

const toneSoft: Record<Tone, string> = {
  neutral: 'bg-[var(--color-bg-subtle)] text-[var(--color-fg)]',
  primary: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
  accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
  success:
    'bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)] text-[var(--color-success)]',
  warning:
    'bg-[color-mix(in_srgb,var(--color-warning)_14%,transparent)] text-[var(--color-warning)]',
  error: 'bg-[color-mix(in_srgb,var(--color-error)_14%,transparent)] text-[var(--color-error)]',
  info: 'bg-[color-mix(in_srgb,var(--color-info)_14%,transparent)] text-[var(--color-info)]',
}

const toneSolid: Record<Tone, string> = {
  neutral: 'bg-[var(--color-fg)] text-[var(--color-bg)]',
  primary: 'bg-[var(--color-primary)] text-white',
  accent: 'bg-[var(--color-accent)] text-white',
  success: 'bg-[var(--color-success)] text-white',
  warning: 'bg-[var(--color-warning)] text-white',
  error: 'bg-[var(--color-error)] text-white',
  info: 'bg-[var(--color-info)] text-white',
}

const toneDot: Record<Tone, string> = {
  neutral: 'bg-[var(--color-fg-muted)]',
  primary: 'bg-[var(--color-primary)]',
  accent: 'bg-[var(--color-accent)]',
  success: 'bg-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]',
  error: 'bg-[var(--color-error)]',
  info: 'bg-[var(--color-info)]',
}

export function Badge({
  tone = 'neutral',
  soft = true,
  dot,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-medium leading-none',
        soft ? toneSoft[tone] : toneSolid[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('size-1.5 rounded-full', toneDot[tone])} />}
      {children}
    </span>
  )
}
