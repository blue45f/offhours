import { useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Copy, Send, Share2, Users } from 'lucide-react'
import { SplitMemberStatusLabel, type SplitDetail } from '@offhours/shared'

import { Button } from '../ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '../ui/Card'
import { Dialog } from '../ui/Dialog'
import { Field, Input, Textarea } from '../ui/Input'
import { useCreateSplit, useReservationSplit } from '../../features/splits/api'
import { getErrorMessage } from '../../services/api'
import { formatKRW } from '../../utils/format'

interface Props {
  reservationId: string
  totalKRW: number
  spaceTitle: string
}

export function SplitPaymentPanel({ reservationId, totalKRW, spaceTitle }: Props) {
  const { data: split, isLoading } = useReservationSplit(reservationId)
  if (isLoading) return null
  if (split) return <SplitProgress split={split} spaceTitle={spaceTitle} />
  return <SplitCreate reservationId={reservationId} totalKRW={totalKRW} />
}

function SplitCreate({ reservationId, totalKRW }: { reservationId: string; totalKRW: number }) {
  const [open, setOpen] = useState(false)
  const [memberCount, setMemberCount] = useState(4)
  const [note, setNote] = useState('')
  const create = useCreateSplit(reservationId)
  const perMember = Math.ceil(totalKRW / memberCount)

  async function submit() {
    try {
      await create.mutateAsync({ memberCount, note: note || undefined })
      toast.success(`${memberCount}명 청구 링크를 만들었어요`)
      setOpen(false)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-accent-soft)]/40">
        <CardBody className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-primary)]">
              <Users size={16} />
            </span>
            <div className="flex-1">
              <h3 className="font-semibold">친구·동료와 1/N 분담하기</h3>
              <p className="mt-1 text-xs text-[var(--color-fg-muted)] leading-relaxed">
                내가 한 번에 결제하고, 멤버 수만큼 자동으로 청구 링크를 만들어 카톡으로 공유. 각자
                본인 부담분만 토스로 송금하면 정산 진척이 실시간으로 보여요.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="primary"
              leading={<Users size={14} />}
              onClick={() => setOpen(true)}
            >
              분담 링크 만들기
            </Button>
          </div>
        </CardBody>
      </Card>

      <Dialog open={open} onOpenChange={setOpen} title="1/N 분담 결제 만들기" size="md">
        <div className="space-y-4">
          <Field
            label="총 멤버 수 (본인 포함)"
            helper={`총 ${formatKRW(totalKRW)}을 N분의 1로 나눠요`}
          >
            <Input
              type="number"
              min={2}
              max={20}
              value={memberCount}
              onChange={(e) =>
                setMemberCount(Math.min(20, Math.max(2, Number(e.target.value) || 2)))
              }
            />
          </Field>
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] p-4">
            <div className="text-xs text-[var(--color-fg-muted)]">1인당 부담</div>
            <div className="mt-1 text-2xl font-bold text-[var(--color-primary)]">
              {formatKRW(perMember)}
            </div>
            <div className="mt-2 text-[11px] text-[var(--color-fg-muted)]">
              ※ 결제는 본인이 한 번에 진행하고, 멤버는 송금만 하는 방식이에요. 끝자리는 본인이
              부담해요.
            </div>
          </div>
          <Field label="메모 (선택)" helper="청구 링크 페이지에 노출돼요">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="예: 토요일 연남 와인바 통대관 — 8/15 19시"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={submit} loading={create.isPending}>
              {memberCount}개 청구 링크 만들기
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}

function SplitProgress({ split, spaceTitle }: { split: SplitDetail; spaceTitle: string }) {
  const progress = split.memberCount > 0 ? split.paidCount / split.memberCount : 0
  const remaining = split.memberCount - split.paidCount
  return (
    <Card>
      <CardHeader>
        <CardTitle>1/N 분담 정산</CardTitle>
        <span className="text-xs text-[var(--color-fg-muted)]">
          {split.paidCount} / {split.memberCount}명
        </span>
      </CardHeader>
      <CardBody className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-[var(--color-fg-muted)]">
              1인당{' '}
              <span className="font-semibold text-[var(--color-fg)]">
                {formatKRW(split.perMemberKRW)}
              </span>
            </span>
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--color-bg-subtle)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          {remaining > 0 ? (
            <p className="mt-2 text-xs text-[var(--color-fg-muted)]">
              {remaining}명이 아직 송금 전이에요. 링크를 다시 공유해보세요.
            </p>
          ) : (
            <p className="mt-2 text-xs inline-flex items-center gap-1 text-[var(--color-success)]">
              <Check size={12} /> 모든 멤버가 정산했어요
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          {split.members.map((m) => (
            <MemberRow key={m.id} idx={m.idx} member={m} spaceTitle={spaceTitle} />
          ))}
        </div>

        <Button
          full
          variant="secondary"
          size="sm"
          leading={<Share2 size={14} />}
          onClick={() => {
            const urls = split.members
              .filter((m) => m.status !== 'PAID')
              .map(
                (m, i) => `${i + 1}/${split.memberCount}: ${window.location.origin}/pay/${m.token}`
              )
              .join('\n')
            navigator.clipboard?.writeText(urls)
            toast.success('미송금 멤버 링크를 한 번에 복사했어요')
          }}
        >
          미송금 멤버 링크 전체 복사
        </Button>
      </CardBody>
    </Card>
  )
}

function MemberRow({
  idx,
  member,
  spaceTitle,
}: {
  idx: number
  member: SplitDetail['members'][number]
  spaceTitle: string
}) {
  const url = `${window.location.origin}/pay/${member.token}`
  function copy() {
    navigator.clipboard?.writeText(url)
    toast.success(`${idx}번 멤버 링크를 복사했어요`)
  }
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${spaceTitle} 1/N 분담 결제`,
          text: '오프아워스 분담 결제 링크에요!',
          url,
        })
        return
      } catch {
        /* user cancelled */
      }
    }
    copy()
  }
  const isPaid = member.status === 'PAID'
  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] px-3 py-2">
      <span
        className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${
          isPaid
            ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
            : 'bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)]'
        }`}
      >
        {idx}
      </span>
      <span className="text-xs flex-1 truncate text-[var(--color-fg-muted)]">
        {member.label ?? `멤버 ${idx}`}{' '}
        <span className={isPaid ? 'text-[var(--color-success)]' : ''}>
          · {SplitMemberStatusLabel[member.status]}
        </span>
      </span>
      {!isPaid && (
        <>
          <button
            onClick={copy}
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-primary)] p-1"
            aria-label="링크 복사"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={share}
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-primary)] p-1"
            aria-label="공유"
          >
            <Send size={14} />
          </button>
        </>
      )}
    </div>
  )
}
