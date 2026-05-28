import { Star } from 'lucide-react'

import { cn } from '../../utils/cn'

interface StarRatingProps {
  value: number
  outOf?: number
  size?: number
  showValue?: boolean
  className?: string
}

export function StarRating({ value, outOf = 5, size = 14, showValue, className }: StarRatingProps) {
  const stars = Array.from({ length: outOf })
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {stars.map((_, i) => {
        const filled = i + 1 <= Math.round(value)
        return (
          <Star
            key={i}
            size={size}
            className={cn(
              filled
                ? 'fill-[var(--color-accent)] text-[var(--color-accent)]'
                : 'text-[var(--color-border-strong)]'
            )}
          />
        )
      })}
      {showValue && (
        <span className="ml-1 text-xs font-medium text-[var(--color-fg-muted)]">
          {value.toFixed(1)}
        </span>
      )}
    </span>
  )
}
