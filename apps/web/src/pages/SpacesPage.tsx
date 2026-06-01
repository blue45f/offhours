import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Clock, Filter, MapPin, Navigation, X } from 'lucide-react'
import {
  AMENITY_OPTIONS,
  KOREA_REGIONS,
  PurposeLabel,
  USE_CASE_META,
  VenueCategoryLabel,
  type Purpose,
  type UseCase,
  type VenueCategory,
} from '@offhours/shared'

import { SpaceCardGrid } from '../components/space/SpaceCardGrid'
import { useSpacesSearch, type SpaceSearchParams } from '../features/spaces/api'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { Select } from '../components/ui/Select'
import { Field, Input } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { Dialog } from '../components/ui/Dialog'
import { formatKRWShort } from '../utils/format'
import { useGeolocation } from '../hooks/useGeolocation'
import { cn } from '../utils/cn'

export default function SpacesPage() {
  const [params, setParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)
  const geo = useGeolocation()

  const radiusKm = params.get('radiusKm') ? Number(params.get('radiusKm')) : undefined
  const liveWithinHours = params.get('liveWithinHours')
    ? Number(params.get('liveWithinHours'))
    : undefined
  const useGeo = !!radiusKm && geo.coords != null

  const query: SpaceSearchParams = useMemo(
    () => ({
      q: params.get('q') ?? undefined,
      region: params.get('region') ?? undefined,
      category: (params.get('category') as VenueCategory | null) ?? undefined,
      purpose: (params.get('purpose') as Purpose | null) ?? undefined,
      capacity: params.get('capacity') ? Number(params.get('capacity')) : undefined,
      priceMin: params.get('priceMin') ? Number(params.get('priceMin')) : undefined,
      priceMax: params.get('priceMax') ? Number(params.get('priceMax')) : undefined,
      amenities: params.get('amenities') ?? undefined,
      useCases: params.get('useCases') ?? undefined,
      instantBook: params.get('instantBook') === 'true' ? true : undefined,
      verifiedOnly: params.get('verifiedOnly') === 'true' ? true : undefined,
      lat: useGeo ? geo.coords!.lat : undefined,
      lng: useGeo ? geo.coords!.lng : undefined,
      radiusKm: useGeo ? radiusKm : undefined,
      liveWithinHours,
      sort: (params.get('sort') as SpaceSearchParams['sort']) ?? 'popular',
      page: params.get('page') ? Math.max(1, Number(params.get('page'))) : 1,
      pageSize: 24,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, geo.coords?.lat, geo.coords?.lng, useGeo, radiusKm, liveWithinHours]
  )

  const { data, isLoading } = useSpacesSearch(query)

  function set(key: string, value: string | undefined) {
    const next = new URLSearchParams(params)
    if (!value) next.delete(key)
    else next.set(key, value)
    // 페이지 외 조건이 바뀌면 1페이지로 리셋(현재 페이지가 결과 범위를 벗어나 빈 화면이 되는 것 방지)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  // 여러 파라미터를 한 번의 빌드로 적용 — set() 을 연속 호출하면 둘 다 같은 params 스냅샷에서
  // 출발해 뒤 호출이 앞 변경을 덮어쓴다(예: radiusKm+sort 동시 변경 시 radiusKm 유실). 이를 방지.
  function setMany(patches: Record<string, string | undefined>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patches)) {
      if (!value) next.delete(key)
      else next.set(key, value)
    }
    if (!('page' in patches)) next.delete('page')
    setParams(next, { replace: true })
  }

  function clearAll() {
    setParams(new URLSearchParams(), { replace: true })
  }

  const activeFilters: string[] = []
  if (query.region) activeFilters.push(`지역: ${query.region}`)
  if (query.category) activeFilters.push(`카테고리: ${VenueCategoryLabel[query.category]}`)
  if (query.purpose) activeFilters.push(`용도: ${PurposeLabel[query.purpose]}`)
  if (query.capacity) activeFilters.push(`인원 ${query.capacity}명+`)
  if (query.priceMin || query.priceMax)
    activeFilters.push(
      `${formatKRWShort(query.priceMin ?? 0)}~${query.priceMax ? formatKRWShort(query.priceMax) : '∞'}`
    )
  if (query.amenities) activeFilters.push(`편의 ${query.amenities.split(',').length}개`)
  if (query.useCases) {
    const codes = query.useCases.split(',').filter(Boolean) as UseCase[]
    const labels = codes.map((c) => USE_CASE_META[c]?.label ?? c).join(', ')
    activeFilters.push(`모임: ${labels}`)
  }
  if (query.instantBook) activeFilters.push('즉시 예약')
  if (query.verifiedOnly) activeFilters.push('검증된 사업장')

  const sortOptions = [
    { value: 'popular', label: '인기 순' },
    { value: 'newest', label: '최신 순' },
    { value: 'price-asc', label: '가격 낮은 순' },
    { value: 'price-desc', label: '가격 높은 순' },
    { value: 'rating', label: '평점 순' },
    ...(useGeo ? [{ value: 'distance', label: '거리 순' }] : []),
    ...(liveWithinHours ? [{ value: 'live', label: '곧 시작' }] : []),
  ]
  // URL 의 sort 가 현재 사용할 수 없는 옵션(예: 위치 끈 뒤 distance)이면 Select 가 빈칸이 되므로 popular 로 폴백
  const sortValue = sortOptions.some((o) => o.value === query.sort) ? query.sort! : 'popular'

  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 24
  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1

  function goToPage(p: number) {
    set('page', p <= 1 ? undefined : String(p))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-headline serif">공간 둘러보기</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {data ? `${data.total.toLocaleString()}개의 공간` : '...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={sortValue}
            onValueChange={(v) => set('sort', v)}
            options={sortOptions}
            className="min-w-[160px]"
          />
          <Button
            variant="secondary"
            leading={<Filter size={14} />}
            onClick={() => setFilterOpen(true)}
          >
            필터
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => {
            if (geo.status === 'granted' && useGeo) {
              // 위치 끄면 거리순 정렬도 해제(옵션이 사라져 Select 가 빈칸이 되는 것 방지)
              setMany({
                radiusKm: undefined,
                sort: query.sort === 'distance' ? 'popular' : query.sort,
              })
              return
            }
            if (geo.status !== 'granted') geo.request()
            setMany({ radiusKm: String(radiusKm ?? 3), sort: 'distance' })
          }}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-pill)] px-3.5 text-sm font-medium border transition-colors',
            useGeo
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-transparent'
              : 'bg-[var(--color-bg-elevated)] text-[var(--color-fg)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          )}
        >
          <Navigation size={12} />
          {geo.status === 'pending'
            ? '위치 확인 중...'
            : useGeo
              ? `내 위치 ${radiusKm}km`
              : '내 위치로 보기'}
        </button>
        {useGeo && (
          <div className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--color-bg-subtle)] p-0.5">
            {[1, 3, 5, 10].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set('radiusKm', String(r))}
                className={cn(
                  'rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium',
                  radiusKm === r
                    ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg)] shadow-[var(--shadow-sm)]'
                    : 'text-[var(--color-fg-muted)]'
                )}
              >
                {r}km
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            if (liveWithinHours) {
              setMany({
                liveWithinHours: undefined,
                sort: query.sort === 'live' ? 'popular' : query.sort,
              })
            } else {
              setMany({ liveWithinHours: '24', sort: 'live' })
            }
          }}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-pill)] px-3.5 text-sm font-medium border transition-colors',
            liveWithinHours
              ? 'bg-[var(--color-accent)] text-white border-transparent'
              : 'bg-[var(--color-bg-elevated)] text-[var(--color-fg)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          )}
        >
          <Clock size={12} />
          {liveWithinHours ? `${liveWithinHours}시간 내 예약 가능` : '지금 비어있는 공간'}
        </button>
        {liveWithinHours && (
          <div className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--color-bg-subtle)] p-0.5">
            {[3, 6, 12, 24, 72].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => set('liveWithinHours', String(h))}
                className={cn(
                  'rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium',
                  liveWithinHours === h
                    ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg)] shadow-[var(--shadow-sm)]'
                    : 'text-[var(--color-fg-muted)]'
                )}
              >
                {h}h
              </button>
            ))}
          </div>
        )}
        {geo.status === 'denied' && (
          <span className="text-xs text-[var(--color-error)] inline-flex items-center gap-1">
            <X size={12} /> 위치 권한이 차단됐어요
          </span>
        )}
      </div>

      <div className="space-y-2 mb-6">
        <ChipBar
          options={KOREA_REGIONS.map((r) => ({ value: r, label: r }))}
          value={query.region}
          onChange={(v) => set('region', v)}
          allLabel="전체 지역"
        />
        <UseCaseChipBar value={query.useCases} onChange={(v) => set('useCases', v)} />
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {activeFilters.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-bg-subtle)] px-3 py-1 text-xs"
            >
              {label}
            </span>
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-[var(--color-fg-muted)] underline ml-2"
          >
            초기화
          </button>
        </div>
      )}

      {!isLoading && data?.items.length === 0 ? (
        <EmptyState
          icon={<MapPin size={22} />}
          title="조건에 맞는 공간이 없어요"
          description="필터를 조금 풀어볼까요? 전체 보기로 시작해보세요."
          action={
            <Button onClick={clearAll} variant="secondary">
              필터 초기화
            </Button>
          }
        />
      ) : (
        <SpaceCardGrid spaces={data?.items} loading={isLoading} />
      )}

      {data && totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            이전
          </Button>
          <span className="text-sm text-[var(--color-fg-muted)] tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            다음
          </Button>
        </div>
      )}

      <Dialog open={filterOpen} onOpenChange={setFilterOpen} title="필터" size="md">
        <FilterContent
          query={query}
          onApply={(patches) => {
            const next = new URLSearchParams(params)
            for (const [k, v] of Object.entries(patches)) {
              if (v === undefined || v === '' || v === null) next.delete(k)
              else next.set(k, String(v))
            }
            next.delete('page') // 필터 변경 시 1페이지로
            setParams(next, { replace: true })
            setFilterOpen(false)
          }}
        />
      </Dialog>
    </div>
  )
}

function ChipBar({
  options,
  value,
  onChange,
  allLabel,
}: {
  options: { value: string; label: string }[]
  value?: string
  onChange: (v: string | undefined) => void
  allLabel?: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip selected={!value} onClick={() => onChange(undefined)}>
        {allLabel ?? '전체'}
      </Chip>
      {options.map((o) => (
        <Chip
          key={o.value}
          selected={value === o.value}
          onClick={() => onChange(value === o.value ? undefined : o.value)}
        >
          {o.label}
        </Chip>
      ))}
    </div>
  )
}

function UseCaseChipBar({
  value,
  onChange,
}: {
  value?: string
  onChange: (v: string | undefined) => void
}) {
  const selected = new Set((value ?? '').split(',').filter(Boolean))
  const ORDER: UseCase[] = [
    'BIRTHDAY',
    'WEDDING_SMALL',
    'TEAM_BUILDING',
    'CORPORATE_WORKSHOP',
    'GATHERING',
    'BABYSHOWER',
    'CLASS',
    'NETWORKING',
    'PHOTOSHOOT',
    'FILMING',
    'POPUP_EXHIBIT',
    'REHEARSAL',
  ]
  function toggle(c: UseCase) {
    if (selected.has(c)) selected.delete(c)
    else selected.add(c)
    onChange(selected.size === 0 ? undefined : Array.from(selected).join(','))
  }
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      <Chip selected={selected.size === 0} onClick={() => onChange(undefined)}>
        전체 모임
      </Chip>
      {ORDER.map((c) => {
        const meta = USE_CASE_META[c]
        return (
          <Chip key={c} selected={selected.has(c)} onClick={() => toggle(c)} className="shrink-0">
            <span className="mr-1.5">{meta.emoji}</span>
            {meta.label}
          </Chip>
        )
      })}
    </div>
  )
}

function FilterContent({
  query,
  onApply,
}: {
  query: SpaceSearchParams
  onApply: (patches: Record<string, string | number | undefined>) => void
}) {
  const [capacity, setCapacity] = useState<number | undefined>(query.capacity)
  const [priceMin, setPriceMin] = useState<number | undefined>(query.priceMin)
  const [priceMax, setPriceMax] = useState<number | undefined>(query.priceMax)
  const [amenities, setAmenities] = useState<string[]>(
    query.amenities ? query.amenities.split(',') : []
  )
  const [useCases, setUseCases] = useState<UseCase[]>(
    query.useCases ? (query.useCases.split(',').filter(Boolean) as UseCase[]) : []
  )
  const [instantBook, setInstantBook] = useState(query.instantBook ?? false)
  const [verifiedOnly, setVerifiedOnly] = useState(query.verifiedOnly ?? false)
  const [category, setCategory] = useState<VenueCategory | undefined>(query.category)
  const [purpose, setPurpose] = useState<Purpose | undefined>(query.purpose)

  function toggleAmenity(a: string) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }
  function toggleUseCase(c: UseCase) {
    setUseCases((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  return (
    <div className="space-y-6">
      <Field label="모임 유형" helper="여러 개 선택 가능">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(USE_CASE_META) as UseCase[]).map((c) => {
            const meta = USE_CASE_META[c]
            return (
              <Chip key={c} selected={useCases.includes(c)} onClick={() => toggleUseCase(c)}>
                <span className="mr-1.5">{meta.emoji}</span>
                {meta.label}
              </Chip>
            )
          })}
        </div>
      </Field>
      <Field label="용도(레거시)">
        <ChipBar
          options={(Object.keys(PurposeLabel) as Purpose[]).map((p) => ({
            value: p,
            label: PurposeLabel[p],
          }))}
          value={purpose}
          onChange={(v) => setPurpose(v as Purpose | undefined)}
        />
      </Field>
      <Field label="카테고리">
        <ChipBar
          options={(Object.keys(VenueCategoryLabel) as VenueCategory[]).map((p) => ({
            value: p,
            label: VenueCategoryLabel[p],
          }))}
          value={category}
          onChange={(v) => setCategory(v as VenueCategory | undefined)}
        />
      </Field>
      <Field label="인원">
        <Input
          type="number"
          min={1}
          max={500}
          placeholder="20"
          value={capacity ?? ''}
          onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : undefined)}
        />
      </Field>
      <Field label="가격 (원/시간)">
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="최소"
            value={priceMin ?? ''}
            onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : undefined)}
          />
          <Input
            type="number"
            placeholder="최대"
            value={priceMax ?? ''}
            onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </Field>
      <Field label="편의시설">
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((a) => (
            <Chip
              key={a.value}
              selected={amenities.includes(a.value)}
              onClick={() => toggleAmenity(a.value)}
            >
              {a.label}
            </Chip>
          ))}
        </div>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={instantBook}
          onChange={(e) => setInstantBook(e.target.checked)}
          className="size-4 accent-[var(--color-primary)]"
        />
        즉시 예약 가능한 공간만 보기
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={verifiedOnly}
          onChange={(e) => setVerifiedOnly(e.target.checked)}
          className="size-4 accent-[var(--color-primary)]"
        />
        검증된 사업장만 보기 (사업자 인증 완료)
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          onClick={() =>
            onApply({
              capacity: undefined,
              priceMin: undefined,
              priceMax: undefined,
              amenities: undefined,
              useCases: undefined,
              instantBook: undefined,
              verifiedOnly: undefined,
              category: undefined,
              purpose: undefined,
            })
          }
        >
          초기화
        </Button>
        <Button
          onClick={() =>
            onApply({
              capacity,
              priceMin,
              priceMax,
              amenities: amenities.length ? amenities.join(',') : undefined,
              useCases: useCases.length ? useCases.join(',') : undefined,
              instantBook: instantBook ? 'true' : undefined,
              verifiedOnly: verifiedOnly ? 'true' : undefined,
              category,
              purpose,
            })
          }
        >
          적용
        </Button>
      </div>
    </div>
  )
}
