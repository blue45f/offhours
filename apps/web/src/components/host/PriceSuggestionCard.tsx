import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  KOREA_REGIONS,
  VenueCategoryLabel,
  type PriceSuggestion,
  type VenueCategory,
} from '@offhours/shared'
import { Sparkles, TrendingDown, TrendingUp, Wand2 } from 'lucide-react'

import { api } from '../../services/api'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Field, Input } from '../ui/Input'
import { Skeleton } from '../ui/Skeleton'
import { formatKRW } from '../../utils/format'

interface Props {
  basePriceKRW: number
  onApply: (price: number) => void
  /** 호스트가 이미 정한 venue 정보가 있으면 prefill */
  defaultCategory?: VenueCategory
  defaultRegion?: string
  defaultDistrict?: string
  defaultCapacityMax?: number
}

export function PriceSuggestionCard({
  basePriceKRW,
  onApply,
  defaultCategory = 'CAFE',
  defaultRegion = '서울',
  defaultDistrict,
  defaultCapacityMax = 30,
}: Props) {
  const [category, setCategory] = useState<VenueCategory>(defaultCategory)
  const [region, setRegion] = useState(defaultRegion)
  const [district, setDistrict] = useState(defaultDistrict ?? '')
  const [capacityMax, setCapacityMax] = useState(defaultCapacityMax)

  const { data, isFetching } = useQuery({
    queryKey: ['price-suggestion', category, region, district, capacityMax] as const,
    queryFn: () =>
      api.get<PriceSuggestion>('/spaces/price-suggestion', {
        params: {
          category,
          region: region || undefined,
          district: district || undefined,
          capacityMax: capacityMax || undefined,
        },
      }),
    staleTime: 60_000,
  })

  const diff = data?.suggested != null ? data.suggested - basePriceKRW : null
  const diffPct = diff != null && basePriceKRW > 0 ? Math.round((diff / basePriceKRW) * 100) : null

  return (
    <div className="rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-accent-soft)]/40 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-bg-elevated)]/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
            <Sparkles size={12} /> 시장가 제안
          </span>
          <h4 className="mt-2 font-semibold">우리 동네는 얼마 받을까요?</h4>
          <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
            같은 카테고리·지역의 실제 시장가 분포와 슬롯 점유율을 합쳐 추천해드려요.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <Field label="카테고리">
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as VenueCategory)}
            options={(Object.keys(VenueCategoryLabel) as VenueCategory[]).map((c) => ({
              value: c,
              label: VenueCategoryLabel[c],
            }))}
          />
        </Field>
        <Field label="지역">
          <Select
            value={region}
            onValueChange={setRegion}
            options={KOREA_REGIONS.map((r) => ({ value: r, label: r }))}
          />
        </Field>
        <Field label="동·구">
          <Input
            placeholder="예: 마포구"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </Field>
        <Field label="최대 인원">
          <Input
            type="number"
            value={capacityMax}
            onChange={(e) => setCapacityMax(Number(e.target.value))}
          />
        </Field>
      </div>

      {isFetching ? (
        <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
      ) : !data || data.suggested == null ? (
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] p-4 text-sm text-[var(--color-fg-muted)]">
          {data?.hint ?? '계산 중…'}
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-[var(--color-fg-muted)]">추천 시간당 가격</div>
              <div className="mt-0.5 text-2xl font-bold text-[var(--color-primary)]">
                {formatKRW(data.suggested)}
              </div>
            </div>
            {diff != null && diffPct != null && (
              <div
                className={`inline-flex items-center gap-1 rounded-[var(--radius-md)] px-2.5 py-1 text-xs font-semibold ${
                  diff > 0
                    ? 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'
                    : diff < 0
                      ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                      : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]'
                }`}
              >
                {diff > 0 ? <TrendingUp size={12} /> : diff < 0 ? <TrendingDown size={12} /> : null}
                내 가격 {diff > 0 ? '+' : ''}
                {formatKRW(Math.abs(diff))} ({diffPct > 0 ? '+' : ''}
                {diffPct}%)
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <Bucket label="하위 25%" value={data.p25} />
            <Bucket label="중앙값" value={data.median} highlight />
            <Bucket label="상위 25%" value={data.p75} />
          </div>
          <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">{data.hint}</p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            full
            className="mt-3"
            leading={<Wand2 size={14} />}
            onClick={() => onApply(data.suggested!)}
          >
            추천가 {formatKRW(data.suggested)} 적용
          </Button>
        </div>
      )}
    </div>
  )
}

function Bucket({
  label,
  value,
  highlight,
}: {
  label: string
  value: number | null
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-[var(--radius-md)] p-2 ${
        highlight
          ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
          : 'bg-[var(--color-bg-subtle)]'
      }`}
    >
      <div className="text-[10px] font-medium opacity-70">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold ${highlight ? '' : 'text-[var(--color-fg)]'}`}>
        {value != null ? formatKRW(value) : '—'}
      </div>
    </div>
  )
}
