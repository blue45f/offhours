import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

import { cn } from '../../utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'accent'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leading?: ReactNode
  trailing?: ReactNode
  full?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] shadow-[var(--shadow-sm)]',
  secondary:
    'bg-[var(--color-bg-elevated)] text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]',
  ghost: 'bg-transparent text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]',
  outline:
    'bg-transparent text-[var(--color-fg)] border border-[var(--color-border-strong)] hover:bg-[var(--color-bg-subtle)]',
  destructive: 'bg-[var(--color-error)] text-white hover:opacity-90',
  accent: 'bg-[var(--color-accent)] text-white hover:opacity-90 shadow-[var(--shadow-sm)]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-[var(--radius-md)] gap-1.5',
  md: 'h-10 px-4 text-[0.9375rem] rounded-[var(--radius-lg)] gap-2',
  lg: 'h-12 px-5 text-base rounded-[var(--radius-lg)] gap-2',
  xl: 'h-14 px-7 text-lg rounded-[var(--radius-xl)] gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    className,
    loading,
    leading,
    trailing,
    full,
    children,
    disabled,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium select-none',
        'transition-[background,color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--easing-standard)]',
        'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        full && 'w-full',
        className
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {!loading && leading}
      {children}
      {trailing}
    </button>
  )
})
