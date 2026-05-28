import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

import { cn } from '../../utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leading?: ReactNode
  trailing?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, leading, trailing, ...props },
  ref
) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 h-11 px-3.5 rounded-[var(--radius-lg)]',
        'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
        'focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary-soft)]',
        'transition-[border-color,box-shadow] duration-[var(--duration-fast)]',
        error &&
          'border-[var(--color-error)] focus-within:border-[var(--color-error)] focus-within:ring-[color-mix(in_srgb,var(--color-error)_18%,transparent)]',
        className
      )}
    >
      {leading && <span className="text-[var(--color-fg-muted)] shrink-0">{leading}</span>}
      <input
        ref={ref}
        className="w-full bg-transparent text-[0.9375rem] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] outline-none"
        {...props}
      />
      {trailing && <span className="text-[var(--color-fg-muted)] shrink-0">{trailing}</span>}
    </div>
  )
})

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(function Textarea({ className, error, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full min-h-[120px] p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)]',
        'border border-[var(--color-border)] text-[0.9375rem] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)]',
        'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] outline-none',
        error && 'border-[var(--color-error)]',
        className
      )}
      {...props}
    />
  )
})

interface FieldProps {
  label?: ReactNode
  helper?: ReactNode
  error?: ReactNode
  required?: boolean
  children: ReactNode
  className?: string
}

export function Field({ label, helper, error, required, children, className }: FieldProps) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="block mb-1.5 text-sm font-medium text-[var(--color-fg)]">
          {label}
          {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-[var(--color-error)]">{error}</span>
      ) : helper ? (
        <span className="mt-1.5 block text-xs text-[var(--color-fg-subtle)]">{helper}</span>
      ) : null}
    </label>
  )
}
