import { useState } from 'react'
import { Star } from 'lucide-react'

import { cn } from '../../utils/cn'

const LABELS = ['아쉬워요', '그저 그래요', '괜찮아요', '좋아요', '최고예요'] as const

interface RatingInputProps {
  value: number
  onChange: (value: number) => void
  size?: number
  className?: string
}

/** 별점 입력 — 표시 전용 StarRating 과 달리 hover 프리뷰 + 키보드 접근이 되는 radiogroup */
export function RatingInput({ value, onChange, size = 26, className }: RatingInputProps) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="radiogroup"
        aria-label="별점"
        className="inline-flex items-center gap-0.5"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}점 — ${LABELS[n - 1]}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            className="rounded-[var(--radius-sm)] p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]"
          >
            <Star
              size={size}
              className={cn(
                'transition-colors duration-[var(--duration-fast)]',
                n <= active
                  ? 'fill-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'text-[var(--color-border-strong)]'
              )}
            />
          </button>
        ))}
      </div>
      <span aria-live="polite" className="min-w-[64px] text-sm text-[var(--color-fg-muted)]">
        {active > 0 ? LABELS[active - 1] : '선택해주세요'}
      </span>
    </div>
  )
}
