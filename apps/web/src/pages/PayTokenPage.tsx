import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle2, Clock, MapPin, Users, Wallet } from 'lucide-react'
import { SplitMemberStatusLabel } from '@offhours/shared'

import { PageLoader } from '../components/layout/PageLoader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useConfirmSplitPayment, usePublicSplit } from '../features/splits/api'
import { getErrorMessage } from '../services/api'
import { formatDateTimeKR, formatKRW } from '../utils/format'

export default function PayTokenPage() {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading, error } = usePublicSplit(token)
  const confirm = useConfirmSplitPayment()
  const navigate = useNavigate()

  if (isLoading) return <PageLoader />
  if (error || !data) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<MapPin size={20} />}
          title="청구 링크를 찾을 수 없어요"
          description="만료됐거나 잘못된 링크일 수 있어요."
        />
      </div>
    )
  }

  const isPaid = data.member.status === 'PAID'
  const progress = data.memberCount > 0 ? data.paidCount / data.memberCount : 0

  async function pay() {
    if (!token) return
    try {
      const res = await confirm.mutateAsync(token)
      if (res.alreadyPaid) toast.success('이미 송금된 청구예요')
      else toast.success('송금이 완료됐어요! 친구에게 알려주세요.')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div className="container-page py-8 md:py-12 max-w-xl">
      <button
        onClick={() => navigate('/')}
        className="text-sm text-[var(--color-fg-muted)] hover:underline mb-4"
      >
        ← 홈으로
      </button>

      <div className="rounded-[var(--radius-2xl)] bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-accent-soft)]/40 p-7 md:p-10">
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-bg-elevated)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
          <Wallet size={10} /> 1/N 분담 결제
        </span>
        <h1 className="mt-3 text-headline serif">{data.spaceTitle}</h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          <span className="font-semibold text-[var(--color-fg)]">{data.payerName}</span>님이 만든{' '}
          {data.memberCount}명 분담 결제예요.
        </p>

        <div className="mt-6 rounded-[var(--radius-xl)] bg-[var(--color-bg-elevated)] p-5">
          <div className="text-xs text-[var(--color-fg-muted)]">
            내가 보낼 금액 ({data.member.idx}/{data.memberCount}번 멤버
            {data.member.label ? ` · ${data.member.label}` : ''})
          </div>
          <div className="mt-1 text-4xl font-bold text-[var(--color-primary)]">
            {formatKRW(data.perMemberKRW)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[var(--color-fg-muted)]">
            <div className="flex items-start gap-1.5">
              <Clock size={12} className="mt-0.5" />
              <div>
                <div className="font-medium text-[var(--color-fg)]">이용 시간</div>
                <div>
                  {formatDateTimeKR(data.startAt)}
                  <br />~ {formatDateTimeKR(data.endAt)}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <Users size={12} className="mt-0.5" />
              <div>
                <div className="font-medium text-[var(--color-fg)]">총 인원</div>
                <div>{data.headcount}명</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-1.5 text-sm">
            <span className="text-[var(--color-fg-muted)]">전체 정산 진척</span>
            <span className="font-semibold">
              {data.paidCount} / {data.memberCount}명
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--color-bg-elevated)]/60 overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-7">
          {isPaid ? (
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-success)]/10 p-4 inline-flex items-center gap-2 text-[var(--color-success)]">
              <CheckCircle2 size={16} />
              송금 완료 — {data.member.paidAt && formatDateTimeKR(data.member.paidAt)}
            </div>
          ) : (
            <Button
              full
              size="lg"
              leading={<Wallet size={16} />}
              onClick={pay}
              loading={confirm.isPending}
            >
              토스로 송금하기 (모의)
            </Button>
          )}
          <p className="mt-3 text-[11px] text-[var(--color-fg-muted)] leading-relaxed">
            데모 환경에서는 실제 송금이 발생하지 않아요. 실 운영에서는 토스페이먼츠 송금 API 로 바로
            연결됩니다. 송금 후 결제자({data.payerName}님)의 예약 페이지에 자동으로 반영돼요.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[var(--radius-lg)] hairline p-5">
        <div className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-widest mb-2">
          예약 정보
        </div>
        <div className="text-sm space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[var(--color-fg-muted)]">예약 번호</span>
            <span className="font-mono">{data.reservationCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-fg-muted)]">호스트</span>
            <span>{data.hostName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-fg-muted)]">총 결제액</span>
            <span className="font-semibold">{formatKRW(data.totalKRW)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-fg-muted)]">내 상태</span>
            <span
              className={isPaid ? 'text-[var(--color-success)]' : 'text-[var(--color-fg-muted)]'}
            >
              {SplitMemberStatusLabel[data.member.status]}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
