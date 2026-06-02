import type { SpaceCard as SpaceCardType } from '@offhours/shared'

import { SpaceCard } from './SpaceCard'
import { Skeleton } from '../ui/Skeleton'

interface Props {
  spaces?: SpaceCardType[]
  loading?: boolean
}

/**
 * 라이브 인근 밴드 — 정적 그리드 대신 가로 스냅 레일.
 * "지금·가까이·비어있는" 즉시성을 옆으로 흘러가는 움직임으로 표현한다.
 * 카드 폭은 고정, 스냅으로 멈춘다. prefers-reduced-motion은 전역 토큰에서 스무스 스크롤을 끈다.
 */
export function LiveNearbyRail({ spaces = [], loading }: Props) {
  if (loading) {
    return (
      <div className="-mx-4 flex gap-5 overflow-x-auto scrollbar-hide px-4 md:mx-0 md:px-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[78%] shrink-0 space-y-3 sm:w-[20rem]">
            <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-xl)]" />
            <Skeleton variant="text" className="w-3/4" />
          </div>
        ))}
      </div>
    )
  }
  if (spaces.length === 0) return null

  return (
    <div
      className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth scrollbar-hide px-4 pb-2 md:mx-0 md:px-0"
      role="list"
      aria-label="지금 인근에서 비어있는 공간 가로 목록"
    >
      {spaces.map((s) => (
        <div key={s.id} role="listitem" className="w-[78%] shrink-0 snap-start sm:w-[20rem]">
          <SpaceCard space={s} />
        </div>
      ))}
    </div>
  )
}
