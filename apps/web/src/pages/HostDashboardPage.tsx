import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, PlusCircle, Star, Wallet } from 'lucide-react'

import { api } from '../services/api'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { formatKRW, formatKRWShort } from '../utils/format'
import { DemandHeatmap } from '../components/host/DemandHeatmap'
import { ArrivalGuideEditor } from '../components/host/ArrivalGuideEditor'
import { useHostEarnings } from '../features/host/api'

interface HostStats {
  venues: number
  spaces: number
  reservations: number
  revenueKRW: number
  ratingAvg: number
  reviewCount: number
}

export default function HostDashboardPage() {
  const { data } = useQuery({
    queryKey: ['host', 'stats'],
    queryFn: () => api.get<HostStats | null>('/host/stats'),
  })

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline serif">호스트 대시보드</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">우리 가게의 영업 외 시간 성과</p>
        </div>
        <Link to="/host/spaces/new">
          <Button leading={<PlusCircle size={14} />}>공간 등록</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<MapPin size={16} />} label="공간 수" value={data?.spaces ?? 0} />
        <Stat icon={<Calendar size={16} />} label="누적 예약" value={data?.reservations ?? 0} />
        <Stat
          icon={<Wallet size={16} />}
          label="누적 수익"
          value={formatKRW(data?.revenueKRW ?? 0)}
        />
        <Stat
          icon={<Star size={16} />}
          label="평점"
          value={data?.ratingAvg ? `${data.ratingAvg.toFixed(1)} (${data.reviewCount})` : '—'}
        />
      </div>

      <EarningsSection />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <DemandHeatmap />
        <ArrivalGuideEditor />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/host/spaces">
          <Card interactive>
            <CardBody>
              <div className="text-sm text-[var(--color-fg-muted)]">관리</div>
              <div className="mt-1 text-lg font-semibold">내 공간 관리</div>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">사진, 가격, 룰, 슬롯</p>
            </CardBody>
          </Card>
        </Link>
        <Link to="/host/reservations">
          <Card interactive>
            <CardBody>
              <div className="text-sm text-[var(--color-fg-muted)]">예약</div>
              <div className="mt-1 text-lg font-semibold">예약 관리</div>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">요청 승인·체크인</p>
            </CardBody>
          </Card>
        </Link>
      </div>
    </div>
  )
}

function EarningsSection() {
  const { data, isLoading } = useHostEarnings()

  const hasEarnings =
    data &&
    (data.totals.allTimeNetKRW > 0 || data.totals.pendingNetKRW > 0 || data.upcoming.length > 0)

  return (
    <section
      className="mt-8 rounded-[var(--radius-2xl)] bg-[var(--color-bg-elevated)] p-6 md:p-8"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <h2 className="text-base font-semibold text-[var(--color-fg)]">영업 외 수입</h2>
      <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
        플랫폼 수수료 12% 차감 후 순수입 기준
      </p>

      {isLoading && (
        <div className="mt-6 h-20 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)]" />
      )}

      {!isLoading && !hasEarnings && (
        <div className="mt-8 flex flex-col items-center gap-2 py-8 text-center">
          <Wallet size={28} strokeWidth={1.5} className="text-[var(--color-fg-subtle)]" />
          <p className="text-sm font-medium text-[var(--color-fg-muted)]">
            아직 영업 외 수입이 없어요
          </p>
          <p className="text-xs text-[var(--color-fg-subtle)]">
            첫 예약이 완료되면 여기서 정산 현황을 볼 수 있어요
          </p>
        </div>
      )}

      {!isLoading && hasEarnings && data && (
        <>
          {/* Headline figures — editorial style */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-px rounded-[var(--radius-xl)] overflow-hidden bg-[var(--color-border)]">
            <EarningsFigure
              label="이번 달 순수입"
              value={formatKRWShort(data.totals.thisMonthNetKRW)}
              suffix="원"
            />
            <EarningsFigure
              label="정산 예정"
              value={formatKRWShort(data.totals.pendingNetKRW)}
              suffix="원"
              accent
            />
            <EarningsFigure
              label="누적 순수입"
              value={formatKRWShort(data.totals.allTimeNetKRW)}
              suffix="원"
              sub={`완료 ${data.totals.count}건`}
            />
          </div>

          {/* 6-month mini bar chart */}
          {data.byMonth.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-[var(--color-fg-subtle)] mb-3">최근 6개월 순수입</p>
              <MonthlyBarChart months={data.byMonth} />
            </div>
          )}

          {/* Upcoming payout timeline */}
          {data.upcoming.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-medium text-[var(--color-fg-muted)] mb-3">정산 예정</p>
              <ul className="flex flex-col gap-2">
                {data.upcoming.map((item) => (
                  <PayoutRow key={item.reservationId} item={item} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function EarningsFigure({
  label,
  value,
  suffix,
  sub,
  accent,
}: {
  label: string
  value: string
  suffix?: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="bg-[var(--color-bg-elevated)] px-5 py-4">
      <p className="text-xs text-[var(--color-fg-subtle)]">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-0.5">
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: accent ? 'var(--color-accent)' : 'var(--color-fg)' }}
        >
          {value}
        </span>
        {suffix && <span className="text-sm text-[var(--color-fg-muted)]">{suffix}</span>}
      </p>
      {sub && <p className="mt-0.5 text-xs text-[var(--color-fg-subtle)]">{sub}</p>}
    </div>
  )
}

function MonthlyBarChart({ months }: { months: { month: string; netKRW: number }[] }) {
  const maxVal = Math.max(...months.map((m) => m.netKRW), 1)

  return (
    <div className="flex items-end gap-1.5 h-16">
      {months.map(({ month, netKRW }) => {
        const pct = Math.max((netKRW / maxVal) * 100, netKRW > 0 ? 8 : 2)
        const label = month.slice(5) // "MM" from "YYYY-MM"
        return (
          <div key={month} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full rounded-t-[var(--radius-xs)] transition-all"
              style={{
                height: `${pct}%`,
                backgroundColor: netKRW > 0 ? 'var(--color-primary)' : 'var(--color-border)',
                opacity: netKRW > 0 ? 1 : 0.5,
              }}
              title={formatKRW(netKRW)}
            />
            <span className="text-[10px] text-[var(--color-fg-subtle)]">{label}월</span>
          </div>
        )
      })}
    </div>
  )
}

function PayoutRow({
  item,
}: {
  item: {
    reservationId: string
    code: string
    spaceTitle: string
    startAt: string
    netKRW: number
    payoutAt: string
  }
}) {
  const payoutDate = new Date(item.payoutAt)
  const mm = String(payoutDate.getMonth() + 1).padStart(2, '0')
  const dd = String(payoutDate.getDate()).padStart(2, '0')

  return (
    <li
      className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] px-4 py-3"
      style={{ background: 'var(--color-bg-subtle)' }}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--color-fg)]">{item.spaceTitle}</p>
        <p className="text-xs text-[var(--color-fg-subtle)] mt-0.5">{item.code}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-[var(--color-fg)]">{formatKRW(item.netKRW)}</p>
        <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
          {mm}/{dd} 정산 예정
        </p>
      </div>
    </li>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-5">
      <div className="text-xs text-[var(--color-fg-muted)] inline-flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </div>
  )
}
