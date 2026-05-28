import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Filter, MapPin } from 'lucide-react'
import {
  AMENITY_OPTIONS,
  KOREA_REGIONS,
  PurposeLabel,
  VenueCategoryLabel,
  type Purpose,
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

export default function SpacesPage() {
  const [params, setParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)

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
      instantBook: params.get('instantBook') === 'true' ? true : undefined,
      sort: (params.get('sort') as SpaceSearchParams['sort']) ?? 'popular',
      page: 1,
      pageSize: 24,
    }),
    [params]
  )

  const { data, isLoading } = useSpacesSearch(query)

  function set(key: string, value: string | undefined) {
    const next = new URLSearchParams(params)
    if (!value) next.delete(key)
    else next.set(key, value)
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
  if (query.instantBook) activeFilters.push('즉시 예약')

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
            value={query.sort ?? 'popular'}
            onValueChange={(v) => set('sort', v)}
            options={[
              { value: 'popular', label: '인기 순' },
              { value: 'newest', label: '최신 순' },
              { value: 'price-asc', label: '가격 낮은 순' },
              { value: 'price-desc', label: '가격 높은 순' },
              { value: 'rating', label: '평점 순' },
            ]}
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

      <div className="flex flex-wrap gap-2 mb-6">
        <ChipBar
          options={KOREA_REGIONS.map((r) => ({ value: r, label: r }))}
          value={query.region}
          onChange={(v) => set('region', v)}
          allLabel="전체 지역"
        />
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

      <Dialog open={filterOpen} onOpenChange={setFilterOpen} title="필터" size="md">
        <FilterContent
          query={query}
          onApply={(patches) => {
            const next = new URLSearchParams(params)
            for (const [k, v] of Object.entries(patches)) {
              if (v === undefined || v === '' || v === null) next.delete(k)
              else next.set(k, String(v))
            }
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
  const [instantBook, setInstantBook] = useState(query.instantBook ?? false)
  const [category, setCategory] = useState<VenueCategory | undefined>(query.category)
  const [purpose, setPurpose] = useState<Purpose | undefined>(query.purpose)

  function toggleAmenity(a: string) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  return (
    <div className="space-y-6">
      <Field label="용도">
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
      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          onClick={() =>
            onApply({
              capacity: undefined,
              priceMin: undefined,
              priceMax: undefined,
              amenities: undefined,
              instantBook: undefined,
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
              instantBook: instantBook ? 'true' : undefined,
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
