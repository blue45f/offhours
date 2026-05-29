import { useQuery } from '@tanstack/react-query'
import { WEEKDAY_KO, type DemandHeatmap as DemandHeatmapData } from '@offhours/shared'
import { TrendingUp } from 'lucide-react'

import { api } from '../../services/api'
import { cn } from '../../utils/cn'

export function DemandHeatmap() {
  const { data, isLoading } = useQuery({
    queryKey: ['host', 'demand-heatmap'],
    queryFn: () => api.get<DemandHeatmapData>('/host/demand-heatmap'),
    staleTime: 5 * 60_000,
  })

  if (isLoading || !data) return null

  if (data.totalBookings === 0) {
    return (
      <Card>
        <Header
          title="수요 패턴"
          hint="최근 60일 PAID 이상 예약 기준 · 데이터가 쌓이면 자동 활성화"
        />
        <p className="text-sm text-[var(--color-fg-muted)] py-6 text-center">
          아직 분석할 예약이 부족해요. 첫 PAID 예약부터 패턴이 그려집니다.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <Header
        title="수요 패턴"
        hint={`최근 60일 ${data.totalBookings.toLocaleString()}건 기준 · 짙은 칸일수록 인기 시간대`}
      />

      <div className="mt-3 overflow-x-auto">
        <div className="grid grid-cols-[28px_repeat(24,1fr)] gap-0.5 min-w-[640px]">
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className={cn(
                'text-[9px] text-[var(--color-fg-muted)] text-center',
                h % 3 === 0 ? '' : 'opacity-0'
              )}
            >
              {h}
            </div>
          ))}
          {WEEKDAY_KO.map((wd, wdIdx) => (
            <ContentsRow key={wdIdx} weekday={wdIdx} label={wd} cells={data.cells} />
          ))}
        </div>
      </div>

      {data.topSlots.length > 0 && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {data.topSlots.map((s, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] px-3 py-2 text-xs"
            >
              <div className="text-[var(--color-primary)] font-bold">
                #{i + 1} · {WEEKDAY_KO[s.weekday]} {s.hour}시
              </div>
              <div className="mt-0.5 text-[var(--color-fg-muted)]">
                점유율 {Math.round(s.occupancy * 100)}% · {s.bookings}건 예약
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] text-[var(--color-fg-muted)] leading-relaxed">
        인기 시간대는 동적 가격으로 자동 인상하거나, 슬롯을 추가해 매출을 늘릴 수 있어요.
      </p>
    </Card>
  )
}

function ContentsRow({
  weekday,
  label,
  cells,
}: {
  weekday: number
  label: string
  cells: number[]
}) {
  return (
    <>
      <div className="text-[10px] text-[var(--color-fg-muted)] flex items-center font-semibold">
        {label}
      </div>
      {Array.from({ length: 24 }, (_, h) => {
        const value = cells[weekday * 24 + h]
        return (
          <div
            key={h}
            className="aspect-square rounded-[2px]"
            title={`${label} ${h}시 · 점유율 ${Math.round(value * 100)}%`}
            style={{
              background:
                value > 0
                  ? `oklch(0.62 0.07 130 / ${0.18 + value * 0.82})`
                  : 'var(--color-bg-subtle)',
            }}
          />
        )
      })}
    </>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="hairline rounded-[var(--radius-xl)] bg-[var(--color-bg-elevated)] p-5">
      {children}
    </section>
  )
}

function Header({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold inline-flex items-center gap-1.5">
        <TrendingUp size={14} className="text-[var(--color-primary)]" />
        {title}
      </h3>
      <p className="mt-0.5 text-[11px] text-[var(--color-fg-muted)]">{hint}</p>
    </div>
  )
}
