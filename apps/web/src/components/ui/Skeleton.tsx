import { cn } from '../../utils/cn'

interface SkeletonProps {
  className?: string
  variant?: 'rect' | 'circle' | 'text'
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton',
        variant === 'rect' && 'rounded-[var(--radius-md)]',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'rounded-[var(--radius-sm)] h-4',
        className
      )}
    />
  )
}
