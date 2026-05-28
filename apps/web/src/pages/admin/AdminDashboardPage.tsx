import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Calendar, Flame, Users, Wallet } from 'lucide-react'
import type { DashboardKpi, TimeSeriesPoint, CategoryShare } from '@offhours/shared'

import { api } from '../../services/api'
import { AdminShell } from '../../components/admin/AdminShell'
import { Card, CardBody } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatKRW, formatKRWShort } from '../../utils/format'
import { cn } from '../../utils/cn'

export default function AdminDashboardPage() {
  const kpi = useQuery({
    queryKey: ['admin', 'kpi'],
    queryFn: () => api.get<DashboardKpi & { activeSpaces: number }>('/admin/kpi'),
  })
  const gmv = useQuery({
    queryKey: ['admin', 'gmv'],
    queryFn: () => api.get<TimeSeriesPoint[]>('/admin/charts/gmv'),
  })
  const cat = useQuery({
    queryKey: ['admin', 'category'],
    queryFn: () => api.get<CategoryShare[]>('/admin/charts/category'),
  })

  return (
    <AdminShell title="대시보드" description="오늘의 주요 지표">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<Wallet size={16} />}
          label="오늘 GMV"
          value={kpi.data ? formatKRW(kpi.data.gmvTodayKRW) : '—'}
          delta={kpi.data ? deltaPct(kpi.data.gmvTodayKRW, kpi.data.gmvYesterdayKRW) : 0}
          loading={kpi.isLoading}
        />
        <KpiCard
          icon={<Calendar size={16} />}
          label="오늘 예약"
          value={kpi.data?.reservationsToday ?? '—'}
          loading={kpi.isLoading}
        />
        <KpiCard
          icon={<Users size={16} />}
          label="신규 가입"
          value={kpi.data ? `${kpi.data.newGuestsToday}/${kpi.data.newHostsToday}` : '—'}
          hint="게스트/호스트"
          loading={kpi.isLoading}
        />
        <KpiCard
          icon={<Flame size={16} />}
          label="진행중 예약"
          value={kpi.data?.reservationsActive ?? '—'}
          loading={kpi.isLoading}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="text-sm font-semibold mb-1">GMV 추이 (최근 30일)</div>
            <LineChart points={gmv.data ?? []} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm font-semibold mb-1">카테고리별 매출</div>
            <BarChart bars={cat.data ?? []} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniStat label="활성 공간" value={kpi.data?.activeSpaces ?? '—'} />
        <MiniStat label="진행 분쟁" value={kpi.data?.disputesOpen ?? '—'} tone="warning" />
        <MiniStat label="미처리 신고" value={kpi.data?.openReports ?? '—'} tone="error" />
      </div>
    </AdminShell>
  )
}

function deltaPct(a: number, b: number) {
  if (!b) return 0
  return Math.round(((a - b) / b) * 100)
}

function KpiCard({
  icon,
  label,
  value,
  delta,
  hint,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  delta?: number
  hint?: string
  loading?: boolean
}) {
  return (
    <div className="rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-5">
      <div className="text-xs text-[var(--color-fg-muted)] inline-flex items-center gap-1.5">
        {icon} {label}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <>
          <div className="mt-2 text-xl font-bold">{value}</div>
          <div className="text-xs text-[var(--color-fg-muted)] mt-1 inline-flex items-center gap-1">
            {delta !== undefined && delta !== 0 && (
              <span
                className={cn(
                  'inline-flex items-center',
                  delta > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                )}
              >
                {delta > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />} {Math.abs(delta)}%
              </span>
            )}
            {hint && <span>{hint}</span>}
          </div>
        </>
      )}
    </div>
  )
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string
  value: React.ReactNode
  tone?: 'warning' | 'error'
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] p-5',
        tone === 'warning' &&
          'bg-[color-mix(in_srgb,var(--color-warning)_8%,var(--color-bg-elevated))]',
        tone === 'error' &&
          'bg-[color-mix(in_srgb,var(--color-error)_8%,var(--color-bg-elevated))]',
        !tone && 'hairline bg-[var(--color-bg-elevated)]'
      )}
    >
      <div className="text-xs text-[var(--color-fg-muted)]">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  )
}

function LineChart({ points }: { points: TimeSeriesPoint[] }) {
  if (!points.length)
    return (
      <div className="h-32 grid place-items-center text-xs text-[var(--color-fg-muted)]">
        데이터 없음
      </div>
    )
  const max = Math.max(...points.map((p) => p.value), 1)
  return (
    <svg viewBox="0 0 320 100" className="w-full h-32 mt-2">
      <polyline
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        points={points
          .map(
            (p, i) => `${(i / Math.max(points.length - 1, 1)) * 320},${100 - (p.value / max) * 95}`
          )
          .join(' ')}
      />
    </svg>
  )
}

function BarChart({ bars }: { bars: CategoryShare[] }) {
  if (!bars.length)
    return (
      <div className="h-32 grid place-items-center text-xs text-[var(--color-fg-muted)]">
        데이터 없음
      </div>
    )
  const max = Math.max(...bars.map((b) => b.value), 1)
  return (
    <ul className="mt-2 space-y-2">
      {bars.map((b) => (
        <li key={b.category} className="text-sm">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>{b.category}</span>
            <span className="text-[var(--color-fg-muted)]">{formatKRWShort(b.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-bg-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)]"
              style={{ width: `${(b.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
