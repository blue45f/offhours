import { History } from 'lucide-react'

import { useSpacesBySlugs } from '../../features/spaces/api'
import { useRecentlyViewedStore } from '../../store/recentlyViewed'
import { SpaceCard } from './SpaceCard'

interface Props {
  /** 헤더 표시할 영역 헤더 라벨. 비우면 컴팩트 모드 */
  title?: string
  /** 최대 표시 개수 */
  max?: number
}

export function RecentlyViewedRow({ title = '최근 본 공간', max = 6 }: Props) {
  const slugs = useRecentlyViewedStore((s) => s.slugs)
  const clear = useRecentlyViewedStore((s) => s.clear)
  const limited = slugs.slice(0, max)
  const { data } = useSpacesBySlugs(limited)
  if (slugs.length === 0 || !data || data.length === 0) return null

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-headline serif flex items-center gap-2">
            <History size={20} className="text-[var(--color-primary)]" />
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            최근 둘러본 순서대로 보여드려요
          </p>
        </div>
        <button
          onClick={clear}
          className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] underline"
        >
          기록 지우기
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {data.map((s) => (
          <SpaceCard key={s.id} space={s} />
        ))}
      </div>
    </section>
  )
}
