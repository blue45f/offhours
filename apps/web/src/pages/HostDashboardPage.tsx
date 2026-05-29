import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, PlusCircle, Star, Wallet } from 'lucide-react'

import { api } from '../services/api'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { formatKRW } from '../utils/format'
import { DemandHeatmap } from '../components/host/DemandHeatmap'
import { ArrivalGuideEditor } from '../components/host/ArrivalGuideEditor'

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
