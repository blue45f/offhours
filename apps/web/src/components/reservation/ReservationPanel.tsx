import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreateReservationSchema,
  PurposeLabel,
  type AddonSelection,
  type CreateReservationInput,
  type Purpose,
  type SpaceDetail,
} from '@offhours/shared'
import toast from 'react-hot-toast'
import { Clock, RefreshCw, Users } from 'lucide-react'

import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Input'
import { Select } from '../ui/Select'
import { Card } from '../ui/Card'
import { useCreateReservation, useCreateRecurring } from '../../features/reservations/api'
import { useQuote } from '../../features/spaces/api'
import { AvailabilityCalendar } from './AvailabilityCalendar'
import { AddonPicker } from './AddonPicker'
import { useCorporateProfile } from '../../features/corporate/api'
import { useIsAuthed } from '../../store/auth'
import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { WaitlistButton } from '../space/WaitlistButton'
import { formatKRW } from '../../utils/format'
import { getErrorMessage } from '../../services/api'

interface Props {
  space: SpaceDetail
}

export function ReservationPanel({ space }: Props) {
  const navigate = useNavigate()
  const isAuthed = useIsAuthed()
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [headcount, setHeadcount] = useState<number>(Math.max(space.capacityMin, 10))
  const [purpose, setPurpose] = useState<Purpose>('PARTY')
  const [note, setNote] = useState('')
  const [useCorporate, setUseCorporate] = useState(false)
  const [addonQty, setAddonQty] = useState<Record<string, number>>({})
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringWeeks, setRecurringWeeks] = useState(4)
  const { data: corporate } = useCorporateProfile()

  const { startAt, endAt } = useMemo(() => {
    if (!date || !startTime || !endTime) return { startAt: undefined, endAt: undefined }
    const start = new Date(`${date}T${startTime}:00+09:00`)
    let end = new Date(`${date}T${endTime}:00+09:00`)
    // 영업 외 슬롯은 자정을 넘기는 경우가 많다 (예: 23:00→06:00). 종료가 시작 이하면 익일로 본다.
    if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000)
    return { startAt: start.toISOString(), endAt: end.toISOString() }
  }, [date, startTime, endTime])

  const hours = useMemo(() => {
    if (!startAt || !endAt) return 1
    return Math.max(
      1,
      Math.ceil((new Date(endAt).getTime() - new Date(startAt).getTime()) / 3_600_000)
    )
  }, [startAt, endAt])

  const addonSelections = useMemo<AddonSelection[]>(
    () => Object.entries(addonQty).map(([addonId, qty]) => ({ addonId, qty })),
    [addonQty]
  )

  const { data: quote } = useQuote(space.id, startAt, endAt, addonSelections)
  const createMutation = useCreateReservation()
  const recurringMutation = useCreateRecurring()

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CreateReservationInput>({
    resolver: zodResolver(CreateReservationSchema),
  })

  async function onSubmit() {
    if (!isAuthed) {
      navigate('/login')
      return
    }
    if (!startAt || !endAt) {
      toast.error('이용 시간을 선택해주세요')
      return
    }

    const baseInput = {
      spaceId: space.id,
      startAt,
      endAt,
      headcount,
      purpose,
      note: note || undefined,
      useCorporateBilling: useCorporate && !!corporate,
      addons: addonSelections.length > 0 ? addonSelections : undefined,
    }

    if (isRecurring) {
      try {
        const result = await recurringMutation.mutateAsync({ ...baseInput, weeks: recurringWeeks })
        const { created, skipped } = result
        const msg = `${created.length}주 예약 요청 완료${skipped.length ? `, ${skipped.length}주는 이미 예약돼 건너뛰었어요` : ''}`
        toast.success(msg)
        if (created.length > 0) {
          navigate(`/me/reservations/${created[0].id}`)
        }
      } catch (e) {
        toast.error(getErrorMessage(e, '반복 예약에 실패했어요'))
      }
      return
    }

    try {
      const reservation = await createMutation.mutateAsync(baseInput)
      toast.success(space.instantBook ? '예약이 확정됐어요!' : '예약 요청을 보냈어요')
      navigate(`/me/reservations/${reservation.id}`)
    } catch (e) {
      toast.error(getErrorMessage(e, '예약에 실패했어요'))
    }
  }

  return (
    <Card elevated className="p-0 overflow-hidden">
      <div className="p-6 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[var(--color-primary)]">
            {formatKRW(space.basePriceKRW)}
          </span>
          <span className="text-sm text-[var(--color-fg-muted)]">/시간</span>
        </div>
        {space.cleaningFeeKRW > 0 && (
          <div className="mt-1 text-xs text-[var(--color-fg-muted)]">
            청소비 별도 {formatKRW(space.cleaningFeeKRW)}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <Field label="가능한 날짜" required>
          <AvailabilityCalendar
            spaceId={space.id}
            value={date}
            onPickDate={(d) => setDate(d)}
            onPickSlot={(s, e) => {
              setStartTime(s)
              setEndTime(e)
            }}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="시작" required>
            <Input
              type="time"
              leading={<Clock size={14} />}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </Field>
          <Field label="종료" required>
            <Input
              type="time"
              leading={<Clock size={14} />}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </Field>
        </div>

        {/* 매주 반복 예약 */}
        <div className="rounded-[var(--radius-lg)] hairline p-3 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            <span className="inline-flex items-center gap-1 text-sm font-semibold">
              <RefreshCw size={12} className="text-[var(--color-primary)]" />
              매주 반복 예약
            </span>
          </label>
          {isRecurring && (
            <Field label="반복 횟수">
              <Select
                value={String(recurringWeeks)}
                onValueChange={(v) => setRecurringWeeks(Number(v))}
                options={Array.from({ length: 11 }, (_, i) => i + 2).map((w) => ({
                  value: String(w),
                  label: `${w}주`,
                }))}
              />
            </Field>
          )}
        </div>

        <Field label="인원" required>
          <Input
            type="number"
            leading={<Users size={14} />}
            min={space.capacityMin}
            max={space.capacityMax}
            value={headcount}
            onChange={(e) => setHeadcount(Number(e.target.value))}
          />
        </Field>
        <Field label="용도">
          <Select
            value={purpose}
            onValueChange={(v) => setPurpose(v as Purpose)}
            options={(Object.keys(PurposeLabel) as Purpose[]).map((p) => ({
              value: p,
              label: PurposeLabel[p],
            }))}
          />
        </Field>
        <Field label="요청 메시지">
          <Textarea
            placeholder="모임의 성격, 필요한 셋업 등을 자유롭게 적어주세요"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        <AddonPicker spaceId={space.id} hours={hours} value={addonQty} onChange={setAddonQty} />

        {isAuthed && (
          <div className="rounded-[var(--radius-lg)] hairline p-3">
            {corporate ? (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCorporate}
                  onChange={(e) => setUseCorporate(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--color-primary)]"
                />
                <span className="flex-1 text-sm">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Building2 size={12} className="text-[var(--color-primary)]" />
                    법인 결제 (세금계산서)
                  </span>
                  <span className="block text-[11px] text-[var(--color-fg-muted)] mt-0.5">
                    {corporate.companyName} ({corporate.businessNumber}) · {corporate.billingEmail}
                  </span>
                </span>
              </label>
            ) : (
              <div className="text-xs text-[var(--color-fg-muted)] flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  <Building2 size={12} /> 사내 워크샵·팀빌딩은 법인 결제로 세금계산서 자동 발행
                </span>
                <Link
                  to="/me/corporate"
                  className="text-[var(--color-primary)] font-semibold hover:underline"
                >
                  법인 등록 →
                </Link>
              </div>
            )}
          </div>
        )}

        {quote && (
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] p-4 space-y-2 text-sm">
            <Row
              label={`${formatKRW(quote.hourlyRate)} × ${quote.hours}시간`}
              value={formatKRW(quote.baseAmountKRW)}
            />
            {quote.discountRate > 0 && (
              <Row
                label={`라스트미닛 할인 -${Math.round(quote.discountRate * 100)}%`}
                value={`-${formatKRW(quote.discountKRW)}`}
                accent
              />
            )}
            {quote.cleaningFeeKRW > 0 && (
              <Row label="청소비" value={formatKRW(quote.cleaningFeeKRW)} />
            )}
            {quote.addons?.map((a) => (
              <Row
                key={a.addonId}
                label={`${a.name}${a.qty > 1 ? ` × ${a.qty}` : ''}`}
                value={formatKRW(a.amountKRW)}
              />
            ))}
            <div className="h-px bg-[var(--color-border)] my-2" />
            <Row label="총 결제 금액" value={formatKRW(quote.totalKRW)} strong />
            {quote.discountRate > 0 && (
              <p className="text-[11px] text-[var(--color-accent)]">
                ⚡ 시작 임박 슬롯 자동 할인 — 비어 있는 시간이 더 빨리 채워져 호스트도, 게스트도
                이득이에요.
              </p>
            )}
          </div>
        )}

        <Button type="submit" size="lg" full loading={isSubmitting || recurringMutation.isPending}>
          {isRecurring
            ? `${recurringWeeks}주 반복 예약 요청하기`
            : space.instantBook
              ? '즉시 예약하기'
              : '예약 요청하기'}
        </Button>
        <p className="text-xs text-[var(--color-fg-subtle)] text-center">
          취소·환불 정책은 결제 전에 확인할 수 있어요.
        </p>

        <WaitlistButton spaceId={space.id} />
      </form>
    </Card>
  )
}

function Row({
  label,
  value,
  strong,
  accent,
}: {
  label: string
  value: string
  strong?: boolean
  accent?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between ${strong ? 'font-semibold' : ''} ${
        accent ? 'text-[var(--color-accent)] font-medium' : ''
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
