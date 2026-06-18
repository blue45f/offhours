/**
 * TestimonialsSection — ReviewDesk(서비스 전반 후기 벽)를 offhours 네이티브 UI 로 렌더.
 * ──────────────────────────────────────────────────────────────────────────
 * `@heejun/deskcloud` 의 pk_ 브라우저 클라이언트로 데이터만 받아 앱 자체 컴포넌트
 * (Card·StarRating·디자인 토큰)로 그린다. 위젯 임베드/외부 CSS 없음.
 *
 * 코어 후기(공간별 ReviewThread)와 별개의 "서비스 전반 사회적 증거"다. env
 * (VITE_REVIEWDESK_URL) 미설정 시 훅이 비활성 → 아무것도 렌더하지 않는다(무영향).
 */
import { Quote, Star } from 'lucide-react'
import { type ReactElement } from 'react'

import { useReviewAggregate, useTestimonials } from '../../domains/deskcloud/api'
import { deskEnabled } from '../../domains/deskcloud/clients'
import { Skeleton } from '../ui/Skeleton'
import { StarRating } from '../ui/StarRating'

import type { PublicReview } from '@heejun/deskcloud'

function formatCount(n: number): string {
  return new Intl.NumberFormat('ko-KR').format(n)
}

export function TestimonialsSection(): ReactElement | null {
  const enabled = deskEnabled.review()
  const wall = useTestimonials(6)
  const aggregate = useReviewAggregate()

  // env 미설정 → 비활성. 데이터가 비어 있어도(첫 운영 단계) 섹션을 숨겨 빈 박스를 막는다.
  if (!enabled) return null
  const items = wall.data?.items ?? []
  if (!wall.isLoading && items.length === 0) return null

  const avg = aggregate.data?.avgRating
  const count = aggregate.data?.count ?? 0

  return (
    <section className="mt-16 md:mt-20" aria-labelledby="testimonials-heading">
      <h2 id="testimonials-heading" className="text-headline text-balance">
        호스트와 게스트의 이야기
      </h2>
      <p className="mt-2 max-w-[68ch] text-pretty text-sm leading-relaxed text-[var(--color-fg-muted)]">
        Offhours 를 거쳐 간 분들이 직접 남긴 후기예요.
        {avg != null && count > 0 && (
          <span className="ml-1 inline-flex items-center gap-1.5 align-middle font-medium text-[var(--color-fg)]">
            <Star size={14} className="fill-[var(--color-accent)] text-[var(--color-accent)]" />
            평균 {avg.toFixed(1)} · 후기 {formatCount(count)}개
          </span>
        )}
      </p>

      {wall.isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-[var(--radius-xl)]" />
          ))}
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((review) => (
            <li key={review.id}>
              <TestimonialCard review={review} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function TestimonialCard({ review }: { review: PublicReview }): ReactElement {
  return (
    <figure className="flex h-full flex-col rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-sm)]">
      <Quote
        size={20}
        aria-hidden
        className="text-[var(--color-primary)] opacity-70"
        strokeWidth={1.5}
      />
      {review.title && (
        <figcaption className="mt-3 text-pretty font-semibold text-[var(--color-fg)]">
          {review.title}
        </figcaption>
      )}
      <blockquote className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-[var(--color-fg-muted)]">
        {review.body}
      </blockquote>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-4">
        <span className="text-sm font-medium text-[var(--color-fg)]">{review.authorName}</span>
        <StarRating value={review.rating} size={14} />
      </div>
      {review.reply && (
        <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 text-xs leading-relaxed text-[var(--color-fg-muted)]">
          <span className="font-semibold text-[var(--color-fg)]">Offhours 답변</span> {review.reply}
        </p>
      )}
    </figure>
  )
}
