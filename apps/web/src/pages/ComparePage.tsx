import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import {
  AlcoholPolicyLabel,
  CateringPolicyLabel,
  VenueCategoryLabel,
  formatDistanceKm,
  formatResponseTimeBadge,
  formatTrustTier,
  type SpaceDetail,
} from '@offhours/shared'
import { ArrowRight, Check, GitCompare, Share2, X } from 'lucide-react'
import toast from 'react-hot-toast'

import { api } from '../services/api'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { formatKRW } from '../utils/format'
import { COMPARE_MAX, useCompareStore } from '../store/compare'
import { cn } from '../utils/cn'

const ROWS: Array<{
  key: string
  label: string
  /** 더 좋은 값을 골라 "최적" 라벨을 붙일 때 사용. asc=낮을수록 좋음, desc=클수록 좋음 */
  best?: 'asc' | 'desc'
  render: (s: SpaceDetail) => { value: React.ReactNode; sortKey?: number | null }
}> = [
  {
    key: 'price',
    label: '시간당 가격',
    best: 'asc',
    render: (s) => ({ value: formatKRW(s.basePriceKRW), sortKey: s.basePriceKRW }),
  },
  {
    key: 'cleaning',
    label: '청소비',
    best: 'asc',
    render: (s) => ({
      value: s.cleaningFeeKRW > 0 ? formatKRW(s.cleaningFeeKRW) : '없음',
      sortKey: s.cleaningFeeKRW,
    }),
  },
  {
    key: 'capacity',
    label: '최대 인원',
    best: 'desc',
    render: (s) => ({ value: `${s.capacityMax}명`, sortKey: s.capacityMax }),
  },
  {
    key: 'minHours',
    label: '최소 예약',
    best: 'asc',
    render: (s) => ({ value: `${s.minHours}시간`, sortKey: s.minHours }),
  },
  {
    key: 'rating',
    label: '평점',
    best: 'desc',
    render: (s) => ({
      value: s.ratingCount > 0 ? `${s.ratingAvg.toFixed(1)} (${s.ratingCount})` : '리뷰 없음',
      sortKey: s.ratingCount > 0 ? s.ratingAvg : null,
    }),
  },
  {
    key: 'trust',
    label: '호스트 신뢰',
    best: 'desc',
    render: (s) => {
      const t = formatTrustTier(s.venue.host.trustScore)
      return { value: `${t.label} (${s.venue.host.trustScore})`, sortKey: s.venue.host.trustScore }
    },
  },
  {
    key: 'response',
    label: '응답 속도',
    render: (s) => {
      const badge = formatResponseTimeBadge({
        medianMin: s.avgApprovalMin ?? null,
        rate24h: s.responseRate24h ?? null,
        sampleCount: s.responseSampleCount ?? null,
      })
      return { value: badge ?? '데이터 부족' }
    },
  },
  {
    key: 'instantBook',
    label: '즉시 예약',
    render: (s) => ({
      value: s.instantBook ? (
        <span className="inline-flex items-center gap-1 text-[var(--color-primary)] font-medium">
          <Check size={14} /> 가능
        </span>
      ) : (
        <span className="text-[var(--color-fg-muted)]">호스트 승인</span>
      ),
    }),
  },
  {
    key: 'distance',
    label: '거리',
    best: 'asc',
    render: (s) => ({
      value: s.distanceKm != null ? formatDistanceKm(s.distanceKm) : '—',
      sortKey: s.distanceKm ?? null,
    }),
  },
  {
    key: 'alcohol',
    label: '주류',
    render: (s) => ({ value: AlcoholPolicyLabel[s.alcoholPolicy] }),
  },
  {
    key: 'catering',
    label: '식음료',
    render: (s) => ({ value: CateringPolicyLabel[s.cateringPolicy] }),
  },
  {
    key: 'category',
    label: '카테고리',
    render: (s) => ({ value: VenueCategoryLabel[s.category] }),
  },
]

export default function ComparePage() {
  const [params, setParams] = useSearchParams()
  const compareSlugs = useCompareStore((s) => s.slugs)
  const removeSlug = useCompareStore((s) => s.remove)

  // URL 쿼리(공유 링크용)와 로컬 store 중 URL 우선. 공유 받은 사람은 store 비어있어도 보임.
  const slugs = useMemo(() => {
    const q = params.get('spaces')
    if (q) return q.split(',').filter(Boolean).slice(0, COMPARE_MAX)
    return compareSlugs
  }, [params, compareSlugs])

  const queries = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ['spaces', 'detail', slug],
      queryFn: () => api.get<SpaceDetail>(`/spaces/slug/${slug}`),
      staleTime: 60_000,
    })),
  })

  const spaces = queries.map((q) => q.data).filter((d): d is SpaceDetail => !!d)

  const isLoading = queries.some((q) => q.isLoading)

  function copyShareLink() {
    const url = `${window.location.origin}/compare?spaces=${slugs.join(',')}`
    navigator.clipboard?.writeText(url).then(
      () => toast.success('공유 링크를 복사했어요'),
      () => toast.error('복사에 실패했어요')
    )
  }

  if (slugs.length === 0) {
    return (
      <div className="container-page py-12 md:py-20">
        <EmptyState
          icon={<GitCompare size={20} />}
          title="비교할 공간이 없어요"
          description="카드의 비교 아이콘으로 최대 4개 공간을 골라 한눈에 비교해보세요."
          action={
            <Link to="/spaces">
              <Button>공간 둘러보기</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
            <GitCompare size={12} /> 비교 보드
          </span>
          <h1 className="mt-2 text-headline serif">{spaces.length}개 공간 한눈에 비교</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            가격·인원·신뢰까지 행마다 가장 좋은 값엔 강조 표시가 붙어요. 모임원에게 링크 한 줄로
            공유할 수 있어요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leading={<Share2 size={14} />} onClick={copyShareLink}>
            공유 링크 복사
          </Button>
        </div>
      </div>

      {isLoading && spaces.length === 0 ? (
        <Skeleton className="h-80 w-full rounded-[var(--radius-xl)]" />
      ) : (
        <CompareTable
          spaces={spaces}
          onRemove={(slug) => {
            removeSlug(slug)
            const next = slugs.filter((s) => s !== slug)
            if (next.length === 0) setParams({}, { replace: true })
            else setParams({ spaces: next.join(',') }, { replace: true })
          }}
        />
      )}
    </div>
  )
}

function CompareTable({
  spaces,
  onRemove,
}: {
  spaces: SpaceDetail[]
  onRemove: (slug: string) => void
}) {
  /** 행마다 "최적" 값을 가진 spaceId 집합 — 동률 시 여러 개 강조 */
  const winnersByRow = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const row of ROWS) {
      if (!row.best) continue
      const rendered = spaces.map((s) => ({ id: s.id, sortKey: row.render(s).sortKey }))
      const valid = rendered.filter((r) => r.sortKey != null) as { id: string; sortKey: number }[]
      if (valid.length === 0) continue
      const winnerKey =
        row.best === 'asc'
          ? Math.min(...valid.map((v) => v.sortKey))
          : Math.max(...valid.map((v) => v.sortKey))
      map.set(row.key, new Set(valid.filter((v) => v.sortKey === winnerKey).map((v) => v.id)))
    }
    return map
  }, [spaces])

  return (
    <div className="hairline rounded-[var(--radius-xl)] overflow-hidden bg-[var(--color-bg-elevated)]">
      <div
        className="grid"
        style={{ gridTemplateColumns: `160px repeat(${spaces.length}, minmax(180px, 1fr))` }}
      >
        {/* 헤더 — 빈 셀 + 공간 카드 */}
        <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4 text-xs font-semibold text-[var(--color-fg-muted)]">
          비교 항목
        </div>
        {spaces.map((s) => (
          <div
            key={s.id}
            className="border-b border-[var(--color-border)] border-l border-[var(--color-border-subtle)] p-4 relative"
          >
            <button
              type="button"
              onClick={() => onRemove(s.slug)}
              aria-label="비교에서 빼기"
              className="absolute right-2 top-2 size-7 inline-flex items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)]"
            >
              <X size={14} />
            </button>
            {s.thumbnailUrl ? (
              <img
                src={s.thumbnailUrl}
                alt={s.title}
                className="aspect-[4/3] w-full rounded-[var(--radius-md)] object-cover mb-2"
              />
            ) : (
              <div className="aspect-[4/3] w-full rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] mb-2" />
            )}
            <div className="text-meta">
              {s.region} {s.district}
            </div>
            <Link
              to={`/spaces/${s.slug}`}
              className="mt-1 block font-semibold line-clamp-2 hover:underline"
            >
              {s.title}
            </Link>
          </div>
        ))}

        {/* 행마다 항목 라벨 + 각 공간의 값 */}
        {ROWS.map((row) => (
          <RowGroup
            key={row.key}
            label={row.label}
            cells={spaces.map((s) => {
              const r = row.render(s)
              const isBest = winnersByRow.get(row.key)?.has(s.id) ?? false
              return { value: r.value, isBest, key: s.id }
            })}
          />
        ))}

        <div className="bg-[var(--color-bg-subtle)] p-4 text-xs font-semibold text-[var(--color-fg-muted)]">
          예약
        </div>
        {spaces.map((s) => (
          <div
            key={`cta-${s.id}`}
            className="border-l border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] p-3"
          >
            <Link
              to={`/spaces/${s.slug}`}
              className="inline-flex w-full items-center justify-center gap-1 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-3 py-2 text-sm font-semibold"
            >
              예약하러 가기 <ArrowRight size={12} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

function RowGroup({
  label,
  cells,
}: {
  label: string
  cells: Array<{ value: React.ReactNode; isBest: boolean; key: string }>
}) {
  return (
    <>
      <div className="border-t border-[var(--color-border-subtle)] p-4 text-sm text-[var(--color-fg-muted)] font-medium bg-[var(--color-bg-subtle)]/40">
        {label}
      </div>
      {cells.map((c) => (
        <div
          key={c.key}
          className={cn(
            'border-t border-l border-[var(--color-border-subtle)] p-4 text-sm flex items-center',
            c.isBest &&
              'bg-[var(--color-primary-soft)]/60 font-semibold text-[var(--color-primary)]'
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            {c.value}
            {c.isBest && (
              <span className="inline-flex items-center justify-center size-4 rounded-full bg-[var(--color-primary)] text-white">
                <Check size={10} />
              </span>
            )}
          </span>
        </div>
      ))}
    </>
  )
}
