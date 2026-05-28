import { Link } from 'react-router-dom'
import { Clock, Heart, MapPin, MessageCircle, Navigation, Users } from 'lucide-react'
import type { SpaceCard as SpaceCardType } from '@offhours/shared'
import { VenueCategoryLabel, formatDistanceKm, formatResponseTimeBadge } from '@offhours/shared'

import { Badge } from '../ui/Badge'
import { StarRating } from '../ui/StarRating'
import { formatKRW } from '../../utils/format'
import { cn } from '../../utils/cn'
import { useToggleFavorite, useFavoriteIds } from '../../features/favorites/api'
import { useIsAuthed } from '../../store/auth'
import { useNavigate } from 'react-router-dom'

interface Props {
  space: SpaceCardType
  layout?: 'card' | 'list'
}

export function SpaceCard({ space, layout = 'card' }: Props) {
  const isAuthed = useIsAuthed()
  const navigate = useNavigate()
  const { data: favoriteIds = [] } = useFavoriteIds()
  const toggle = useToggleFavorite()
  const isFavorited = favoriteIds.includes(space.id)

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthed) {
      navigate('/login')
      return
    }
    toggle.mutate(space.id)
  }

  if (layout === 'list') {
    return (
      <Link
        to={`/spaces/${space.slug}`}
        className="group flex gap-4 rounded-[var(--radius-xl)] p-3 transition-colors hover:bg-[var(--color-bg-subtle)]"
      >
        <Thumbnail space={space} className="size-32 shrink-0 rounded-[var(--radius-lg)]" />
        <div className="flex-1 min-w-0">
          <Header space={space} />
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/spaces/${space.slug}`} className="group block focus:outline-none">
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-bg-subtle)] aspect-[4/3]">
        <Thumbnail space={space} className="absolute inset-0 size-full" />
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isFavorited ? '찜 해제' : '찜하기'}
          className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-transform hover:scale-105"
        >
          <Heart
            size={16}
            className={cn(isFavorited && 'fill-[var(--color-accent)] text-[var(--color-accent)]')}
          />
        </button>
        {space.instantBook && (
          <Badge
            tone="accent"
            soft={false}
            className="absolute left-3 top-3 !bg-[var(--color-bg-elevated)] !text-[var(--color-fg)] !shadow-[var(--shadow-sm)]"
          >
            즉시 예약
          </Badge>
        )}
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-meta">
          <MapPin size={12} />
          <span>
            {space.region} {space.district}
          </span>
          <span>·</span>
          <span>{VenueCategoryLabel[space.category]}</span>
          {space.distanceKm != null && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5 text-[var(--color-primary)] font-medium">
                <Navigation size={10} /> {formatDistanceKm(space.distanceKm)}
              </span>
            </>
          )}
        </div>
        <h3 className="font-semibold text-[var(--color-fg)] line-clamp-1 group-hover:underline underline-offset-4 decoration-1">
          {space.title}
        </h3>
        <p className="text-sm text-[var(--color-fg-muted)] line-clamp-1">{space.summary}</p>
        {space.nextAvailableAt && (
          <div className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] px-2 py-0.5 text-[11px] font-semibold">
            <Clock size={10} />
            {formatNextSlot(space.nextAvailableAt)}
            {space.lastMinuteDiscount ? (
              <span className="ml-1">· -{Math.round(space.lastMinuteDiscount * 100)}%</span>
            ) : null}
          </div>
        )}
        {(() => {
          const badge = formatResponseTimeBadge({
            medianMin: space.avgApprovalMin ?? null,
            rate24h: space.responseRate24h ?? null,
            sampleCount: space.responseSampleCount ?? null,
          })
          return badge ? (
            <div className="inline-flex items-center gap-1 text-meta">
              <MessageCircle size={11} />
              {badge}
            </div>
          ) : null
        })()}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-meta">
            <Users size={12} />
            최대 {space.capacityMax}인
          </div>
          {space.ratingCount > 0 && <StarRating value={space.ratingAvg} size={12} showValue />}
        </div>
        <div className="text-sm font-semibold text-[var(--color-fg)] pt-1">
          시간당{' '}
          <span className="text-[var(--color-primary)]">{formatKRW(space.basePriceKRW)}</span>
        </div>
      </div>
    </Link>
  )
}

function formatNextSlot(iso: string): string {
  const start = new Date(iso)
  const diffH = (start.getTime() - Date.now()) / (1000 * 60 * 60)
  const hh = String(start.getHours()).padStart(2, '0')
  const mm = String(start.getMinutes()).padStart(2, '0')
  if (diffH < 0) return `방금 ${hh}:${mm} 가능`
  if (diffH < 1) return `${Math.max(1, Math.round(diffH * 60))}분 뒤 ${hh}:${mm} 가능`
  if (diffH < 24) return `${Math.round(diffH)}시간 뒤 ${hh}:${mm} 가능`
  return `${Math.round(diffH / 24)}일 뒤 ${hh}:${mm} 가능`
}

function Header({ space }: { space: SpaceCardType }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-meta">
        <span>{space.region}</span>
        <span>·</span>
        <span>{VenueCategoryLabel[space.category]}</span>
      </div>
      <h3 className="font-semibold line-clamp-1">{space.title}</h3>
      <p className="text-sm text-[var(--color-fg-muted)] line-clamp-2">{space.summary}</p>
      <div className="flex items-center gap-3 pt-1 text-meta">
        <span className="inline-flex items-center gap-1">
          <Users size={12} />
          최대 {space.capacityMax}인
        </span>
        {space.ratingCount > 0 && <StarRating value={space.ratingAvg} size={12} showValue />}
        <span className="ml-auto font-semibold text-[var(--color-fg)]">
          시간당 {formatKRW(space.basePriceKRW)}
        </span>
      </div>
    </div>
  )
}

function Thumbnail({ space, className }: { space: SpaceCardType; className?: string }) {
  if (!space.thumbnailUrl) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-bg-subtle)]',
          className
        )}
      />
    )
  }
  return (
    <img
      src={space.thumbnailUrl}
      alt={space.title}
      loading="lazy"
      className={cn(
        'object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--easing-standard)] group-hover:scale-[1.04]',
        className
      )}
    />
  )
}
