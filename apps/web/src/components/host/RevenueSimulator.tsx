import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Coins, TrendingUp } from 'lucide-react'
import { VenueCategoryLabel, type VenueCategory } from '@offhours/shared'

import { Button } from '../ui/Button'
import { formatKRW, formatKRWShort } from '../../utils/format'

// 카테고리별 영업 외 시간당 기준 단가 (KRW/h) — seed 시장가와 동일 선상.
const HOURLY_BY_CATEGORY: Record<VenueCategory, number> = {
  CAFE: 80000,
  BAR: 130000,
  RESTAURANT: 150000,
  STUDIO: 90000,
  GALLERY: 160000,
  ROOFTOP: 200000,
  HOUSE: 110000,
  FITNESS: 45000,
  DANCE: 35000,
  PRACTICE: 28000,
  WORKSHOP: 60000,
  MEETING: 50000,
  ETC: 60000,
}

const FEE_RATE = 0.12
const WEEKS_PER_MONTH = 4.3

const PICKABLE: VenueCategory[] = [
  'CAFE',
  'BAR',
  'RESTAURANT',
  'ROOFTOP',
  'STUDIO',
  'GALLERY',
  'HOUSE',
  'MEETING',
]

/**
 * 영업 외 시간 추가 수익 시뮬레이터.
 * "영업시간엔 매출, 영업 외엔 0원이던 데드 타임"을 월 추가 수입 숫자로 환산해 보여준다.
 */
export function RevenueSimulator() {
  const [category, setCategory] = useState<VenueCategory>('CAFE')
  const [weeklyHours, setWeeklyHours] = useState(16)
  const [occupancy, setOccupancy] = useState(55)
  const [hourly, setHourly] = useState(HOURLY_BY_CATEGORY.CAFE)

  function pickCategory(c: VenueCategory) {
    setCategory(c)
    setHourly(HOURLY_BY_CATEGORY[c])
  }

  const { net, yearly } = useMemo(() => {
    const g = Math.round(weeklyHours * hourly * (occupancy / 100) * WEEKS_PER_MONTH)
    const n = Math.round(g * (1 - FEE_RATE))
    return { net: n, yearly: n * 12 }
  }, [weeklyHours, hourly, occupancy])

  return (
    <div className="hairline rounded-[var(--radius-2xl)] bg-[var(--color-bg-elevated)] p-6 md:p-8 shadow-[var(--shadow-md)]">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">
        <Coins size={13} /> 영업 외 시간 수익 계산기
      </div>

      {/* 결과 — 데드 타임이 만든 추가 수입 */}
      <div className="mt-4 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-accent-soft)]/40 p-5">
        <div className="text-sm text-[var(--color-fg-muted)]">
          영업 외 짜투리 시간으로 매달 더 버는 돈
        </div>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-4xl md:text-5xl font-bold serif text-[var(--color-primary)]">
            +{formatKRWShort(net)}원
          </span>
          <span className="mb-1.5 text-sm text-[var(--color-fg-muted)]">/ 월</span>
        </div>
        <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)]">
          <TrendingUp size={12} className="text-[var(--color-primary)]" />연 환산 약{' '}
          <span className="font-semibold text-[var(--color-fg)]">{formatKRWShort(yearly)}원</span>
          {' · '}수수료 {Math.round(FEE_RATE * 100)}% 제외 실수령
        </div>
      </div>

      {/* 카테고리 */}
      <div className="mt-5">
        <label className="text-xs font-semibold text-[var(--color-fg-muted)]">우리 가게 업종</label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PICKABLE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => pickCategory(c)}
              className={`rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium transition-colors ${
                category === c
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
                  : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
              }`}
            >
              {VenueCategoryLabel[c]}
            </button>
          ))}
        </div>
      </div>

      {/* 슬라이더들 */}
      <div className="mt-5 space-y-4">
        <SliderRow
          label="주당 영업 외 개방 시간"
          hint="휴무일·마감 후 빌려줄 수 있는 시간"
          value={weeklyHours}
          min={4}
          max={48}
          step={2}
          onChange={setWeeklyHours}
          display={`${weeklyHours}시간`}
        />
        <SliderRow
          label="시간당 대관가"
          value={hourly}
          min={20000}
          max={300000}
          step={5000}
          onChange={setHourly}
          display={formatKRW(hourly)}
        />
        <SliderRow
          label="예상 예약 점유율"
          hint="개방 시간 중 실제 예약되는 비율"
          value={occupancy}
          min={20}
          max={90}
          step={5}
          onChange={setOccupancy}
          display={`${occupancy}%`}
        />
      </div>

      <div className="mt-5 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 text-[11px] text-[var(--color-fg-muted)] leading-relaxed">
        임대료·인건비는 영업시간에 이미 지출돼요. 영업 외 시간은{' '}
        <span className="font-semibold text-[var(--color-fg)]">추가 비용 거의 없이</span> 순수익에
        가깝습니다. (월 {weeklyHours}시간 × {formatKRW(hourly)} × 점유 {occupancy}% × 4.3주 기준)
      </div>

      <Link to="/signup?as=host" className="mt-5 block">
        <Button size="lg" full>
          내 가게로 월 {formatKRWShort(net)}원 더 벌기
        </Button>
      </Link>
    </div>
  )
}

function SliderRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  display: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">
          {label}
          {hint && <span className="ml-1 text-[11px] text-[var(--color-fg-muted)]">· {hint}</span>}
        </span>
        <span className="text-sm font-bold text-[var(--color-primary)]">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuetext={display}
        className="mt-1.5 w-full accent-[var(--color-primary)]"
      />
    </div>
  )
}
