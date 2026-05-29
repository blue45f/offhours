import { Sparkles } from 'lucide-react'

import { useForYou } from '../../features/spaces/api'
import { useRecentlyViewedStore } from '../../store/recentlyViewed'
import { SpaceCard } from './SpaceCard'
import { Skeleton } from '../ui/Skeleton'

/**
 * 둘러본 공간이 3개 이상일 때만 노출되는 "당신을 위한 추천" 캐러셀.
 * 카테고리·use-case 빈도 기반 추천 (백엔드).
 */
export function ForYouSection() {
  const slugs = useRecentlyViewedStore((s) => s.slugs)
  const seedSlugs = slugs.slice(0, 6)
  const enabled = seedSlugs.length >= 3
  const { data, isLoading } = useForYou(enabled ? seedSlugs : [], 4)
  if (!enabled) return null

  return (
    <section className="container-page py-12 md:py-16">
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="inline-flex items-center gap-1 text-xs font-bold tracking-widest uppercase text-[var(--color-accent)]">
            <Sparkles size={12} /> For You
          </span>
          <h2 className="mt-2 text-headline">당신이 본 공간과 비슷한 무드</h2>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            방금 보신 카테고리·모임 유형에 맞춰 골랐어요
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-xl)]" />
                <Skeleton variant="text" className="w-3/4" />
              </div>
            ))
          : data?.map((s) => <SpaceCard key={s.id} space={s} />)}
      </div>
    </section>
  )
}
