import type { SpaceCard as SpaceCardType } from '@offhours/shared'

import { SpaceCard } from './SpaceCard'
import { Skeleton } from '../ui/Skeleton'

interface Props {
  spaces?: SpaceCardType[]
  loading?: boolean
}

export function SpaceCardGrid({ spaces = [], loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-xl)]" />
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {spaces.map((s) => (
        <SpaceCard key={s.id} space={s} />
      ))}
    </div>
  )
}
