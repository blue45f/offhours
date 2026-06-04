import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'

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
        aria-invalid={error || undefined}
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
      aria-invalid={error || undefined}
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
  // 에러 메시지에 id 를 부여하고 입력에 aria-describedby 로 연결해 스크린리더가
  // 무엇이 잘못됐는지 읽도록 한다. Input/Textarea 는 ...props 를 내부 요소로
  // 전달하므로 cloneElement 로 주입한 aria-describedby 가 실제 입력에 도달한다.
  const errorId = useId()
  const describedBy = error ? errorId : undefined
  const field =
    describedBy && isValidElement(children)
      ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
          'aria-describedby': describedBy,
        })
      : children

  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="block mb-1.5 text-sm font-medium text-[var(--color-fg)]">
          {label}
          {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
        </span>
      )}
      {field}
      {error ? (
        <span id={errorId} role="alert" className="mt-1.5 block text-xs text-[var(--color-error)]">
          {error}
        </span>
      ) : helper ? (
        <span className="mt-1.5 block text-xs text-[var(--color-fg-subtle)]">{helper}</span>
      ) : null}
    </label>
  )
}
