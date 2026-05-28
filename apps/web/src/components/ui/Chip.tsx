import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/cn'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  leading?: ReactNode
}

export function Chip({ selected, leading, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-pill)] px-3.5 text-sm font-medium',
        'border transition-[background,color,border-color] duration-[var(--duration-fast)]',
        selected
          ? 'bg-[var(--color-fg)] text-[var(--color-bg)] border-transparent'
          : 'bg-[var(--color-bg-elevated)] text-[var(--color-fg)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
        className
      )}
      {...props}
    >
      {leading}
      {children}
    </button>
  )
}
