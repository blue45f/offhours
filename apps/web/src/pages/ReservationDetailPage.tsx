import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ReservationStatusLabel, calcRefundRate } from '@offhours/shared'
import { MessageCircle, X } from 'lucide-react'

import { useCancelReservation, useReservationDetail } from '../features/reservations/api'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card'
import { Dialog } from '../components/ui/Dialog'
import { Field, Textarea } from '../components/ui/Input'
import { formatDateTimeKR, formatKRW, formatTimeRange } from '../utils/format'
import { getErrorMessage } from '../services/api'
import { useTossPayment } from '../features/payments/useTossPayment'
import { SplitPaymentPanel } from '../components/reservation/SplitPaymentPanel'
import { ArrivalKitCard } from '../components/reservation/ArrivalKitCard'

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useReservationDetail(id)
  const cancelMutation = useCancelReservation()
  const navigate = useNavigate()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const startPay = useTossPayment()

  if (isLoading || !data) return <div className="container-page py-12">불러오는 중...</div>

  const reservation = data
  const refundRate = calcRefundRate(reservation.startAt)
  const refundKRW = Math.round(reservation.totalKRW * refundRate)

  async function onCancel() {
    if (cancelReason.trim().length < 2) {
      toast.error('취소 사유를 입력해주세요')
      return
    }
    try {
      await cancelMutation.mutateAsync({ id: reservation.id, reason: cancelReason })
      toast.success(`취소됐어요 (환불률 ${Math.round(refundRate * 100)}%)`)
      setCancelOpen(false)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  async function onPay() {
    try {
      await startPay({
        reservationId: reservation.id,
        amount: reservation.totalKRW,
        orderName: reservation.spaceTitle,
      })
      toast.success('결제가 완료됐어요!')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div className="container-page py-8 md:py-12 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-[var(--color-fg-muted)] hover:underline mb-4"
      >
        ← 돌아가기
      </button>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="font-mono text-sm text-[var(--color-fg-muted)]">{reservation.code}</span>
        <Badge tone={reservation.status === 'CANCELED' ? 'error' : 'primary'}>
          {ReservationStatusLabel[reservation.status]}
        </Badge>
      </div>
      <h1 className="text-headline serif">{reservation.spaceTitle}</h1>
      <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
        {formatDateTimeKR(reservation.startAt)} – {formatDateTimeKR(reservation.endAt)}
      </p>

      <div className="mt-8 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>예약 정보</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <Row
              label="이용 일시"
              value={`${formatDateTimeKR(reservation.startAt)} ${formatTimeRange(reservation.startAt, reservation.endAt)}`}
            />
            <Row label="인원" value={`${reservation.headcount}명`} />
            <Row label="용도" value={reservation.purpose} />
            {reservation.note && <Row label="요청 메시지" value={reservation.note} />}
            {reservation.checkInCode && reservation.status === 'PAID' && (
              <div className="rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)] p-4 flex flex-col sm:flex-row gap-4 items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent(`offhours-checkin:${reservation.checkInCode}`)}`}
                  alt="체크인 QR"
                  className="size-32 rounded-[var(--radius-md)] bg-white p-1.5"
                />
                <div className="flex-1 text-center sm:text-left">
                  <div className="text-xs font-semibold text-[var(--color-primary)]">
                    체크인 QR + 코드
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold tracking-widest text-[var(--color-fg)]">
                    {reservation.checkInCode}
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-fg-muted)] leading-relaxed">
                    당일 호스트에게 QR을 보여주거나 위 6자리 코드를 알려주세요. 호스트가 스캔하면
                    바로 체크인 완료돼요.
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>결제 정보</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="공간 이용료" value={formatKRW(reservation.baseAmountKRW)} />
            {reservation.cleaningFeeKRW > 0 && (
              <Row label="청소비" value={formatKRW(reservation.cleaningFeeKRW)} />
            )}
            {reservation.depositKRW > 0 && (
              <Row label="보증금" value={formatKRW(reservation.depositKRW)} />
            )}
            <hr className="border-[var(--color-border-subtle)] my-2" />
            <Row label="총 금액" value={formatKRW(reservation.totalKRW)} strong />
          </CardBody>
        </Card>

        {reservation.arrivalGuide && (
          <ArrivalKitCard
            guide={reservation.arrivalGuide}
            venueAddressRoad={reservation.venueAddressRoad}
          />
        )}

        {['APPROVED', 'PAID', 'CHECKED_IN', 'COMPLETED'].includes(reservation.status) && (
          <SplitPaymentPanel
            reservationId={reservation.id}
            totalKRW={reservation.totalKRW}
            spaceTitle={reservation.spaceTitle}
          />
        )}

        {['REQUESTED', 'APPROVED', 'PAID'].includes(reservation.status) && (
          <div className="flex flex-wrap gap-2">
            {reservation.status === 'APPROVED' && (
              <Button size="lg" onClick={onPay}>
                결제하기 ({formatKRW(reservation.totalKRW)})
              </Button>
            )}
            <Link to="/chat">
              <Button variant="secondary" size="lg" leading={<MessageCircle size={14} />}>
                호스트와 채팅
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="lg"
              leading={<X size={14} />}
              onClick={() => setCancelOpen(true)}
              className="text-[var(--color-error)]"
            >
              예약 취소
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="예약을 취소할까요?"
        description={`현재 시점 환불률은 ${Math.round(refundRate * 100)}% (${formatKRW(refundKRW)}) 입니다.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              돌아가기
            </Button>
            <Button variant="destructive" onClick={onCancel} loading={cancelMutation.isPending}>
              예약 취소
            </Button>
          </>
        }
      >
        <Field label="취소 사유">
          <Textarea
            placeholder="간단히 사유를 입력해주세요"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </Field>
      </Dialog>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${strong ? 'font-semibold text-base' : ''}`}
    >
      <span className="text-[var(--color-fg-muted)]">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}
