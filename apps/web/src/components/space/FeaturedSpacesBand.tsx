import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { SpaceCard as SpaceCardType } from '@offhours/shared'

import { SpaceCard } from './SpaceCard'
import { Skeleton } from '../ui/Skeleton'

interface Props {
  spaces?: SpaceCardType[]
  loading?: boolean
}

/**
 * 인기 공간 밴드 — 동일 4-up 그리드 대신 비대칭 에디토리얼 레이아웃.
 * 가장 사랑받는 한 곳을 큰 lead 타일로 세우고, 나머지를 오른쪽 일반 카드로 받친다.
 * "한 곳에 시선이 먼저 앉는" 포컬을 만들어 페이지에 리듬을 준다.
 */
export function FeaturedSpacesBand({ spaces = [], loading }: Props) {
  if (loading) return <FeaturedSkeleton />
  if (spaces.length === 0) return null

  const [lead, ...rest] = spaces
  const side = rest.slice(0, 3)

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-[1.35fr_1fr]">
      <SpaceCard space={lead} layout="featured" />
      <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-1">
        {side.map((s) => (
          <SpaceCard key={s.id} space={s} />
        ))}
        <Link
          to="/spaces?sort=popular"
          className="hidden items-center justify-between gap-2 rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-subtle)] px-5 py-4 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)] lg:flex"
        >
          더 많은 인기 공간 둘러보기
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}

function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-[1.35fr_1fr]">
      <Skeleton className="min-h-[22rem] w-full rounded-[var(--radius-2xl)]" />
      <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-xl)]" />
            <Skeleton variant="text" className="w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
