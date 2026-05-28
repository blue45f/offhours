import { forwardRef, type HTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  elevated?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive, elevated, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-[var(--radius-xl)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
        elevated && 'shadow-[var(--shadow-md)]',
        interactive &&
          'transition-[transform,box-shadow] duration-[var(--duration-base)] ease-[var(--easing-standard)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    />
  )
})

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'p-6 pb-4 border-b border-[var(--color-border-subtle)] flex items-start justify-between gap-4',
          className
        )}
        {...props}
      />
    )
  }
)

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...props }, ref) {
    return <h3 ref={ref} className={cn('text-title font-semibold', className)} {...props} />
  }
)

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardBody({ className, ...props }, ref) {
    return <div ref={ref} className={cn('p-6', className)} {...props} />
  }
)

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'p-6 pt-4 border-t border-[var(--color-border-subtle)] flex items-center gap-3',
          className
        )}
        {...props}
      />
    )
  }
)
