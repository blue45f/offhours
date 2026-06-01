import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CANCELLATION_POLICIES,
  CleaningJobStatusLabel,
  DisputeStatusLabel,
  PurposeLabel,
  ReservationStatusLabel,
  calcRefundRate,
  payableKRW,
} from '@offhours/shared'
import { Building2, Clock, MessageCircle, ShieldCheck, Share2, Sparkles, X } from 'lucide-react'
import { CorporateTaxTypeLabel } from '@offhours/shared'

import {
  useCancelReservation,
  useExtendReservation,
  useExtensionQuote,
  useFileClaim,
  useReservationDetail,
} from '../features/reservations/api'
import { useMe } from '../store/auth'
import { useOpenChat } from '../features/chat/api'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card'
import { Dialog } from '../components/ui/Dialog'
import { Field, Input, Textarea } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
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
  const fileClaim = useFileClaim()
  const extend = useExtendReservation()
  const openChat = useOpenChat()
  const me = useMe()
  const [claimOpen, setClaimOpen] = useState(false)
  const [claimAmount, setClaimAmount] = useState(0)
  const [claimReason, setClaimReason] = useState('')
  const [claimDesc, setClaimDesc] = useState('')
  const [extendOpen, setExtendOpen] = useState(false)
  const [extendHours, setExtendHours] = useState(1)
  const extQuote = useExtensionQuote(id ?? '', extendHours, extendOpen)

  if (isLoading) return <div className="container-page py-12">불러오는 중...</div>
  // 쿼리가 끝났는데 데이터가 없으면(404/403/삭제) 무한 로딩 대신 안내 + 복귀 동선
  if (!data)
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-headline serif">예약을 찾을 수 없어요</h1>
        <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
          이미 취소됐거나 접근 권한이 없는 예약일 수 있어요.
        </p>
        <Button className="mt-6" onClick={() => navigate('/me/reservations')}>
          내 예약 목록으로
        </Button>
      </div>
    )

  const reservation = data
  const refundRate = calcRefundRate(reservation.startAt, new Date(), reservation.cancellationPolicy)
  const refundKRW = Math.round(reservation.totalKRW * refundRate)
  const isHost = !!me && me.id === reservation.hostId
  const payable = payableKRW(reservation)

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
        amount: payable,
        orderName: reservation.spaceTitle,
      })
      toast.success('결제가 완료됐어요!')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  async function onShareEvent() {
    const url = `${window.location.origin}/event/${reservation.code}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('초대 링크를 복사했어요')
    } catch {
      toast.error('링크 복사에 실패했어요')
    }
  }

  async function onClaim() {
    if (claimReason.trim().length < 2 || claimDesc.trim().length < 10) {
      toast.error('사유(2자 이상)와 상세 설명(10자 이상)을 입력해주세요')
      return
    }
    try {
      await fileClaim.mutateAsync({
        id: reservation.id,
        input: { amountClaimedKRW: claimAmount, reason: claimReason, description: claimDesc },
      })
      toast.success('파손 청구가 접수됐어요')
      setClaimOpen(false)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  async function onOpenChat() {
    try {
      const chat = await openChat.mutateAsync(reservation.id)
      navigate(`/chat?c=${chat.id}`)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  async function onExtend() {
    try {
      const res = await extend.mutateAsync({ id: reservation.id, hours: extendHours })
      toast.success(`${extendHours}시간 연장됐어요 (+${formatKRW(res.additionalKRW)})`)
      setExtendOpen(false)
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
        {reservation.corporateSnapshot && (
          <Badge tone="accent" soft>
            <Building2 size={10} className="inline mr-0.5" />
            법인 결제
          </Badge>
        )}
      </div>
      <h1 className="text-headline serif">{reservation.spaceTitle}</h1>
      <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
        {formatDateTimeKR(reservation.startAt)} – {formatDateTimeKR(reservation.endAt)}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link to={`/event/${reservation.code}`}>
          <Button variant="secondary" size="sm" leading={<Share2 size={14} />}>
            모임 허브 공유
          </Button>
        </Link>
        <button
          type="button"
          onClick={onShareEvent}
          className="text-sm text-[var(--color-fg-muted)] underline-offset-4 hover:text-[var(--color-fg)] hover:underline"
        >
          초대 링크 복사
        </button>
      </div>

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
            <Row label="용도" value={PurposeLabel[reservation.purpose]} />
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
            {reservation.addons?.map((a) => (
              <Row
                key={a.addonId}
                label={`${a.name}${a.qty > 1 ? ` × ${a.qty}` : ''}`}
                value={formatKRW(a.amountKRW)}
              />
            ))}
            {reservation.protectionFeeKRW > 0 && (
              <Row label="안심 보장" value={formatKRW(reservation.protectionFeeKRW)} />
            )}
            <hr className="border-[var(--color-border-subtle)] my-2" />
            <Row label="총 금액" value={formatKRW(reservation.totalKRW)} strong />
            {(reservation.creditAppliedKRW > 0 ||
              reservation.pointsAppliedKRW > 0 ||
              reservation.depositKRW > 0) && (
              <>
                {reservation.depositKRW > 0 && (
                  <Row
                    label={
                      reservation.depositReleasedAt ? '보증금 (환급 완료)' : '보증금 (환급 예정)'
                    }
                    value={`+${formatKRW(reservation.depositKRW)}`}
                  />
                )}
                {reservation.creditAppliedKRW > 0 && (
                  <Row
                    label="법인 크레딧 차감"
                    value={`-${formatKRW(reservation.creditAppliedKRW)}`}
                  />
                )}
                {reservation.pointsAppliedKRW > 0 && (
                  <Row
                    label="적립 포인트 사용"
                    value={`-${formatKRW(reservation.pointsAppliedKRW)}`}
                  />
                )}
                <Row label="실 결제액" value={formatKRW(payable)} strong />
              </>
            )}
          </CardBody>
        </Card>

        {reservation.corporateSnapshot && (
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 size={14} className="text-[var(--color-primary)]" />
                  법인 결제 · 세금계산서
                </span>
              </CardTitle>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                {CorporateTaxTypeLabel[reservation.corporateSnapshot.taxPayer]}
              </span>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <Row label="회사명" value={reservation.corporateSnapshot.companyName} />
              <Row label="사업자번호" value={reservation.corporateSnapshot.businessNumber} />
              <Row label="대표자명" value={reservation.corporateSnapshot.ceoName} />
              <Row label="세금계산서 수신" value={reservation.corporateSnapshot.billingEmail} />
              <p className="text-[11px] text-[var(--color-fg-muted)] mt-1 leading-relaxed">
                결제 완료 시점에 등록된 법인 정보로 세금계산서가 자동 발행돼요. 정보 수정은 새
                예약부터 적용됩니다.
              </p>
            </CardBody>
          </Card>
        )}

        {reservation.protectionTier !== 'NONE' && (
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[var(--color-primary)]" />
                  안심 보장
                </span>
              </CardTitle>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                최대 {formatKRW(reservation.protectionCoverageKRW)}
              </span>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <p className="text-[var(--color-fg-muted)] leading-relaxed">
                이 예약은 기물 파손·도난을 최대 {formatKRW(reservation.protectionCoverageKRW)}까지
                보장해요. 체크아웃 사진이 증빙으로 함께 보관됩니다.
              </p>
              {reservation.dispute ? (
                <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">파손 보장 청구</span>
                    <Badge
                      tone={
                        reservation.dispute.status === 'RESOLVED_FAVOR_HOST'
                          ? 'primary'
                          : reservation.dispute.status === 'RESOLVED_FAVOR_GUEST' ||
                              reservation.dispute.status === 'DISMISSED'
                            ? 'neutral'
                            : 'accent'
                      }
                    >
                      {DisputeStatusLabel[reservation.dispute.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[var(--color-fg-muted)]">
                    {reservation.dispute.reason}
                    {reservation.dispute.amountClaimedKRW != null &&
                      ` · ${formatKRW(reservation.dispute.amountClaimedKRW)} 청구`}
                  </p>
                </div>
              ) : (
                isHost &&
                ['CHECKED_OUT', 'COMPLETED'].includes(reservation.status) && (
                  <Button variant="secondary" size="sm" onClick={() => setClaimOpen(true)}>
                    파손 청구하기
                  </Button>
                )
              )}
            </CardBody>
          </Card>
        )}

        {reservation.cleaningJob && (
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[var(--color-primary)]" />
                  청소 대행
                </span>
              </CardTitle>
              <Badge tone={reservation.cleaningJob.status === 'DONE' ? 'primary' : 'accent'} soft>
                {CleaningJobStatusLabel[reservation.cleaningJob.status]}
              </Badge>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <Row label="제휴 업체" value={reservation.cleaningJob.partnerName} />
              <Row
                label="청소 예정"
                value={formatDateTimeKR(reservation.cleaningJob.scheduledAt)}
              />
              <Row label="청소비" value={formatKRW(reservation.cleaningJob.feeKRW)} />
              <p className="text-[11px] text-[var(--color-fg-muted)] leading-relaxed">
                이용 종료 후 제휴 청소업체가 원상복구를 진행해 다음 영업 전 공간이 깔끔하게
                정리돼요.
              </p>
            </CardBody>
          </Card>
        )}

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

        {['PAID', 'CHECKED_IN'].includes(reservation.status) && !isHost && (
          <Button
            variant="secondary"
            size="lg"
            leading={<Clock size={14} />}
            onClick={() => setExtendOpen(true)}
          >
            이용 시간 연장
          </Button>
        )}

        {['REQUESTED', 'APPROVED', 'PAID'].includes(reservation.status) && (
          <div className="flex flex-wrap gap-2">
            {reservation.status === 'APPROVED' && (
              <Button size="lg" onClick={onPay}>
                결제하기 ({formatKRW(payable)})
              </Button>
            )}
            <Button
              variant="secondary"
              size="lg"
              leading={<MessageCircle size={14} />}
              loading={openChat.isPending}
              onClick={onOpenChat}
            >
              {isHost ? '게스트와 채팅' : '호스트와 채팅'}
            </Button>
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
        description={`${CANCELLATION_POLICIES[reservation.cancellationPolicy].label} 취소 정책 — 현재 시점 환불률은 ${Math.round(refundRate * 100)}% (${formatKRW(refundKRW)}) 입니다.`}
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

      <Dialog
        open={claimOpen}
        onOpenChange={setClaimOpen}
        title="파손 보장 청구"
        description={`보장 한도 ${formatKRW(reservation.protectionCoverageKRW)} 안에서 청구할 수 있어요. 체크아웃 사진이 증빙으로 자동 첨부됩니다.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setClaimOpen(false)}>
              닫기
            </Button>
            <Button onClick={onClaim} loading={fileClaim.isPending}>
              청구 접수
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="청구 금액 (원)">
            <Input
              type="number"
              value={claimAmount}
              onChange={(e) => setClaimAmount(Number(e.target.value))}
            />
          </Field>
          <Field label="사유">
            <Input
              value={claimReason}
              onChange={(e) => setClaimReason(e.target.value)}
              placeholder="예: 테이블 상판 파손"
            />
          </Field>
          <Field label="상세 설명">
            <Textarea
              value={claimDesc}
              onChange={(e) => setClaimDesc(e.target.value)}
              rows={3}
              placeholder="파손 경위와 상태를 적어주세요 (10자 이상)"
            />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={extendOpen}
        onOpenChange={setExtendOpen}
        title="이용 시간 연장"
        description="다음 영업 준비를 위한 안전 경계 안에서만 연장돼요. 추가 요금은 동적 가격으로 계산됩니다."
        footer={
          <>
            <Button variant="ghost" onClick={() => setExtendOpen(false)}>
              닫기
            </Button>
            <Button onClick={onExtend} loading={extend.isPending}>
              {extendHours}시간 연장
            </Button>
          </>
        }
      >
        <Field label="연장 시간">
          <Select
            value={String(extendHours)}
            onValueChange={(v) => setExtendHours(Number(v))}
            options={[1, 2, 3, 4, 5, 6].map((h) => ({ value: String(h), label: `${h}시간` }))}
          />
        </Field>
        <div className="mt-3 flex items-center justify-between rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] px-3.5 py-2.5 text-sm">
          <span className="text-[var(--color-fg-muted)]">예상 추가 요금 (동적 가격)</span>
          <span className="font-semibold">
            {extQuote.isLoading
              ? '계산 중…'
              : extQuote.data
                ? `+${formatKRW(extQuote.data.additionalKRW)}`
                : '—'}
          </span>
        </div>
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
