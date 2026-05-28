import * as RTabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'

import { cn } from '../../utils/cn'

interface TabsProps {
  value: string
  onValueChange: (v: string) => void
  items: { value: string; label: ReactNode }[]
  className?: string
  variant?: 'underline' | 'pill'
}

export function Tabs({ value, onValueChange, items, className, variant = 'underline' }: TabsProps) {
  return (
    <RTabs.Root value={value} onValueChange={onValueChange} className={className}>
      <RTabs.List
        className={cn(
          'flex gap-1',
          variant === 'underline' && 'border-b border-[var(--color-border)]',
          variant === 'pill' && 'p-1 rounded-[var(--radius-pill)] bg-[var(--color-bg-subtle)] w-fit'
        )}
      >
        {items.map((item) => (
          <RTabs.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'relative inline-flex items-center justify-center transition-colors duration-[var(--duration-fast)]',
              variant === 'underline' &&
                'px-3 py-2.5 text-sm font-medium text-[var(--color-fg-muted)] data-[state=active]:text-[var(--color-fg)] data-[state=active]:after:content-[""] data-[state=active]:after:absolute data-[state=active]:after:bottom-[-1px] data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--color-primary)]',
              variant === 'pill' &&
                'rounded-[var(--radius-pill)] px-4 py-1.5 text-sm font-medium text-[var(--color-fg-muted)] data-[state=active]:text-[var(--color-primary-fg)] data-[state=active]:bg-[var(--color-primary)]'
            )}
          >
            {item.label}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
    </RTabs.Root>
  )
}
