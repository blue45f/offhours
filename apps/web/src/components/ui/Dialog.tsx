import * as RDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../utils/cn'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hideClose?: boolean
}

const sizes = {
  sm: 'max-w-[420px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
  xl: 'max-w-[960px]',
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  size = 'md',
  hideClose,
}: DialogProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--color-overlay)] backdrop-blur-sm data-[state=open]:animate-[fadeIn_var(--duration-base)_var(--easing-standard)]" />
        <RDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[var(--z-modal)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2',
            'rounded-[var(--radius-2xl)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-modal)] border border-[var(--color-border)]',
            'p-6 md:p-7 max-h-[90vh] overflow-y-auto outline-none',
            'data-[state=open]:animate-[slideUp_var(--duration-base)_var(--easing-standard)]',
            sizes[size]
          )}
        >
          {title && (
            <div className="mb-4 pr-8">
              <RDialog.Title className="text-title font-semibold">{title}</RDialog.Title>
              {description && (
                <RDialog.Description className="mt-1.5 text-sm text-[var(--color-fg-muted)]">
                  {description}
                </RDialog.Description>
              )}
            </div>
          )}
          {children}
          {footer && <div className="mt-6 flex items-center justify-end gap-2">{footer}</div>}
          {!hideClose && (
            <RDialog.Close
              className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)]"
              aria-label="닫기"
            >
              <X size={18} />
            </RDialog.Close>
          )}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  )
}
