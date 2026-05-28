import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { ReservationStatusLabel, type ReservationStatus } from '@offhours/shared'

import { Tabs } from '../components/ui/Tabs'
import { EmptyState } from '../components/ui/EmptyState'
import { Card, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { useMyReservations } from '../features/reservations/api'
import { formatDateTimeKR, formatKRW } from '../utils/format'

const TABS = [
  { value: 'all', label: '전체' },
  { value: 'REQUESTED', label: '요청' },
  { value: 'APPROVED', label: '승인' },
  { value: 'PAID', label: '결제완료' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELED', label: '취소' },
]

const STATUS_TONE: Record<
  ReservationStatus,
  'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info'
> = {
  REQUESTED: 'warning',
  APPROVED: 'info',
  PAID: 'primary',
  CHECKED_IN: 'primary',
  CHECKED_OUT: 'primary',
  COMPLETED: 'success',
  CANCELED: 'error',
  REFUNDED: 'neutral',
}

export default function MyReservationsPage() {
  const [tab, setTab] = useState('all')
  const { data, isLoading } = useMyReservations(
    'guest',
    tab === 'all' ? undefined : (tab as ReservationStatus)
  )

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-headline serif">예약 내역</h1>
      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">내가 예약한 공간을 확인해보세요.</p>
      <div className="mt-6">
        <Tabs value={tab} onValueChange={setTab} items={TABS} />
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[var(--radius-xl)]" />
          ))
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<Calendar size={22} />}
            title="아직 예약이 없어요"
            description="공간을 둘러보고 첫 모임을 계획해보세요."
            action={
              <Link to="/spaces">
                <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-fg)]">
                  공간 둘러보기
                </span>
              </Link>
            }
          />
        ) : (
          data.map((r) => (
            <Link key={r.id} to={`/me/reservations/${r.id}`}>
              <Card interactive className="overflow-hidden">
                <CardBody className="flex flex-col md:flex-row gap-4">
                  {r.spaceThumbnailUrl && (
                    <img
                      src={r.spaceThumbnailUrl}
                      alt={r.spaceTitle}
                      className="size-full md:size-28 rounded-[var(--radius-lg)] object-cover md:shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[var(--color-fg-muted)]">
                        {r.code}
                      </span>
                      <Badge tone={STATUS_TONE[r.status]}>{ReservationStatusLabel[r.status]}</Badge>
                    </div>
                    <h3 className="mt-1 font-semibold line-clamp-1">{r.spaceTitle}</h3>
                    <p className="text-sm text-[var(--color-fg-muted)] mt-1">
                      {formatDateTimeKR(r.startAt)} – {formatDateTimeKR(r.endAt)}
                    </p>
                    <p className="mt-2 font-semibold text-[var(--color-primary)]">
                      {formatKRW(r.totalKRW)}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
