import { useState } from 'react'
import toast from 'react-hot-toast'
import { ReservationStatusLabel, type ReservationStatus } from '@offhours/shared'

import { Tabs } from '../components/ui/Tabs'
import { Card, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import {
  useApproveReservation,
  useMyReservations,
  useRejectReservation,
} from '../features/reservations/api'
import { formatDateTimeKR, formatKRW } from '../utils/format'
import { getErrorMessage } from '../services/api'

const TABS = [
  { value: 'REQUESTED', label: '요청' },
  { value: 'APPROVED', label: '승인' },
  { value: 'PAID', label: '결제완료' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELED', label: '취소' },
]

export default function HostReservationsPage() {
  const [tab, setTab] = useState<ReservationStatus>('REQUESTED')
  const { data } = useMyReservations('host', tab)
  const approve = useApproveReservation()
  const reject = useRejectReservation()

  async function onApprove(id: string) {
    try {
      await approve.mutateAsync(id)
      toast.success('승인했어요')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  async function onReject(id: string) {
    const reason = prompt('거절 사유를 입력해주세요')
    if (!reason || reason.length < 2) return
    try {
      await reject.mutateAsync({ id, reason })
      toast.success('거절했어요')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-headline serif">예약 관리</h1>
      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">게스트의 예약 요청을 처리하세요.</p>
      <div className="mt-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ReservationStatus)} items={TABS} />
      </div>
      <div className="mt-6 space-y-3">
        {!data || data.length === 0 ? (
          <EmptyState
            title="이 상태의 예약이 없어요"
            description="새 요청이 들어오면 여기서 알려드릴게요."
          />
        ) : (
          data.map((r) => (
            <Card key={r.id}>
              <CardBody>
                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{r.code}</span>
                      <Badge>{ReservationStatusLabel[r.status]}</Badge>
                    </div>
                    <h3 className="mt-1 font-semibold">{r.spaceTitle}</h3>
                    <p className="text-sm text-[var(--color-fg-muted)]">
                      {formatDateTimeKR(r.startAt)} – {formatDateTimeKR(r.endAt)} · {r.headcount}명
                      · {r.guestName}
                    </p>
                    {r.note && (
                      <p className="mt-2 text-sm bg-[var(--color-bg-subtle)] rounded-[var(--radius-md)] p-3">
                        {r.note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-semibold text-[var(--color-primary)]">
                      {formatKRW(r.totalKRW)}
                    </span>
                    {r.status === 'REQUESTED' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => onReject(r.id)}>
                          거절
                        </Button>
                        <Button size="sm" onClick={() => onApprove(r.id)}>
                          승인
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
