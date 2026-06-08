import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  Calendar,
  CalendarPlus,
  Globe2,
  Plus,
  RefreshCcw,
  Trash2,
} from 'lucide-react'
import { BlockSourceLabel, type ExternalCalendar, type VenueBlock } from '@offhours/shared'

import { Button } from '../components/ui/Button'
import { Card, CardBody } from '../components/ui/Card'
import { useConfirm } from '../components/ui/ConfirmDialog'
import { Dialog } from '../components/ui/Dialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import {
  useConnectExternal,
  useCreateBlock,
  useDeleteBlock,
  useDeleteCalendar,
  useHostCalendars,
  useResyncCalendar,
} from '../features/calendars/api'
import { useMySpaces } from '../features/spaces/api'
import { getErrorMessage } from '../services/api'
import { formatDateTimeKR } from '../utils/format'

export default function HostCalendarPage() {
  const { data, isLoading } = useHostCalendars()
  const { data: spaces } = useMySpaces()
  const venueOptions = uniqueVenues(spaces ?? [])
  const [blockOpen, setBlockOpen] = useState(false)
  const [calOpen, setCalOpen] = useState(false)

  return (
    <div className="container-page py-8 md:py-12 max-w-4xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-headline serif">캘린더 차단</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            카톡으로 받은 외부 예약, 본인 일정, 구글 캘린더 등 다른 채널의 일정을 차단해
            <strong className="text-[var(--color-fg)] mx-1">더블 부킹</strong>을 막아요.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leading={<Globe2 size={14} />}
            onClick={() => setCalOpen(true)}
            disabled={venueOptions.length === 0}
          >
            외부 캘린더 연결
          </Button>
          <Button
            leading={<Plus size={14} />}
            onClick={() => setBlockOpen(true)}
            disabled={venueOptions.length === 0}
          >
            수동 차단 추가
          </Button>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-semibold mb-3 inline-flex items-center gap-2">
          <Globe2 size={16} /> 연결된 외부 캘린더
        </h2>
        {data?.calendars.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">
            아직 연결된 외부 캘린더가 없어요. 구글·네이버 캘린더의 비공개 iCal URL 한 줄이면 돼요.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data?.calendars.map((c) => (
              <CalendarCard key={c.id} cal={c} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-semibold mb-3 inline-flex items-center gap-2">
          <Calendar size={16} /> 다가오는 차단 시간 ({data?.blocks.length ?? 0})
        </h2>
        {isLoading ? (
          <p className="text-sm text-[var(--color-fg-muted)]">불러오는 중…</p>
        ) : data?.blocks.length === 0 ? (
          <EmptyState
            icon={<Calendar size={20} />}
            title="차단된 시간이 없어요"
            description="수동 차단을 추가하거나 외부 캘린더를 연결해보세요."
            action={
              <Button
                leading={<CalendarPlus size={14} />}
                onClick={() => setBlockOpen(true)}
                disabled={venueOptions.length === 0}
              >
                수동 차단 추가
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {data?.blocks.map((b) => (
              <BlockRow key={b.id} block={b} />
            ))}
          </div>
        )}
      </section>

      <CreateBlockDialog open={blockOpen} onOpenChange={setBlockOpen} venues={venueOptions} />
      <ConnectCalendarDialog open={calOpen} onOpenChange={setCalOpen} venues={venueOptions} />
    </div>
  )
}

interface VenueOpt {
  id: string
  name: string
}

function uniqueVenues(spaces: { venueId: string; venue?: { name: string } }[]): VenueOpt[] {
  const map = new Map<string, string>()
  for (const s of spaces) {
    if (!map.has(s.venueId)) map.set(s.venueId, s.venue?.name ?? '내 공간')
  }
  return Array.from(map, ([id, name]) => ({ id, name }))
}

function CalendarCard({ cal }: { cal: ExternalCalendar }) {
  const resync = useResyncCalendar()
  const remove = useDeleteCalendar()
  const confirm = useConfirm()
  const hasError = !!cal.lastError
  async function syncNow() {
    try {
      await resync.mutateAsync(cal.id)
      toast.success('동기화 완료')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }
  async function onDelete() {
    const ok = await confirm({
      title: '캘린더를 해제할까요?',
      description: `"${cal.label}"의 차단된 시간도 함께 사라져요.`,
      confirmLabel: '해제',
      danger: true,
    })
    if (!ok) return
    try {
      await remove.mutateAsync(cal.id)
      toast.success('해제했어요')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }
  return (
    <Card>
      <CardBody className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold truncate">
              <span
                className="inline-block size-2 rounded-full mr-2 align-middle"
                style={{ background: cal.color ?? 'var(--color-primary)' }}
              />
              {cal.label}
            </div>
            <div className="mt-0.5 text-xs text-[var(--color-fg-muted)] truncate">
              {cal.venueName} · {cal.blockCount}개 일정 차단 중
            </div>
            <div className="mt-2 text-[11px] text-[var(--color-fg-muted)] truncate">
              <span className="font-mono">{cal.icsUrl}</span>
            </div>
            {cal.lastSyncedAt && (
              <div className="text-[11px] text-[var(--color-fg-muted)] mt-1">
                마지막 동기화 · {formatDateTimeKR(cal.lastSyncedAt)}
              </div>
            )}
            {hasError && (
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--color-error)]">
                <AlertTriangle size={11} />
                {cal.lastError}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              leading={<RefreshCcw size={12} />}
              loading={resync.isPending}
              onClick={syncNow}
            >
              지금 동기화
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leading={<Trash2 size={12} />}
              onClick={onDelete}
              className="!text-[var(--color-error)]"
            >
              해제
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function BlockRow({ block }: { block: VenueBlock }) {
  const remove = useDeleteBlock()
  const confirm = useConfirm()
  async function onDelete() {
    const ok = await confirm({
      title: '차단을 삭제할까요?',
      description: `"${block.label}"`,
      confirmLabel: '삭제',
      danger: true,
    })
    if (!ok) return
    try {
      await remove.mutateAsync(block.id)
      toast.success('삭제했어요')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }
  return (
    <div className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] hairline px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold truncate">{block.label}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
              block.source === 'EXTERNAL'
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]'
            }`}
          >
            {BlockSourceLabel[block.source]}
            {block.externalCalendarLabel ? ` · ${block.externalCalendarLabel}` : ''}
          </span>
        </div>
        <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">
          {block.venueName} · {formatDateTimeKR(block.startAt)} ~ {formatDateTimeKR(block.endAt)}
        </div>
      </div>
      {block.source === 'MANUAL' && (
        <button
          onClick={onDelete}
          className="text-[var(--color-fg-muted)] hover:text-[var(--color-error)] p-1.5"
          aria-label="삭제"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

function CreateBlockDialog({
  open,
  onOpenChange,
  venues,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  venues: VenueOpt[]
}) {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '')
  const selectedVenueId = venueId || venues[0]?.id || ''
  const [label, setLabel] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const create = useCreateBlock()

  async function submit() {
    if (!selectedVenueId || !label || !startAt || !endAt) return
    try {
      await create.mutateAsync({
        venueId: selectedVenueId,
        label,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      })
      toast.success('차단을 추가했어요')
      onOpenChange(false)
      setLabel('')
      setStartAt('')
      setEndAt('')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="수동 차단 추가" size="md">
      <div className="space-y-4">
        <Field label="공간" required>
          <Select
            value={selectedVenueId}
            onValueChange={setVenueId}
            options={venues.map((v) => ({ value: v.id, label: v.name }))}
          />
        </Field>
        <Field label="이유 / 라벨" required helper="예: 카톡으로 받은 송년회, 본인 일정">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="외부 예약 — 김선영"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="시작" required>
            <Input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </Field>
          <Field label="종료" required>
            <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={submit}
            loading={create.isPending}
            disabled={!selectedVenueId || !label || !startAt || !endAt}
          >
            차단 추가
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function ConnectCalendarDialog({
  open,
  onOpenChange,
  venues,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  venues: VenueOpt[]
}) {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '')
  const selectedVenueId = venueId || venues[0]?.id || ''
  const [label, setLabel] = useState('')
  const [icsUrl, setIcsUrl] = useState('')
  const [color, setColor] = useState('#5b6f55')
  const connect = useConnectExternal()

  async function submit() {
    if (!selectedVenueId || !label || !icsUrl) return
    try {
      await connect.mutateAsync({ venueId: selectedVenueId, label, icsUrl, color })
      toast.success('연결 + 동기화 완료')
      onOpenChange(false)
      setLabel('')
      setIcsUrl('')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="외부 캘린더 연결" size="md">
      <div className="space-y-4">
        <Field label="공간" required>
          <Select
            value={selectedVenueId}
            onValueChange={setVenueId}
            options={venues.map((v) => ({ value: v.id, label: v.name }))}
          />
        </Field>
        <Field label="라벨" required helper="예: 구글 캘린더 (개인), 네이버 비즈니스">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="구글 캘린더 (개인)"
          />
        </Field>
        <Field
          label="iCal URL"
          required
          helper="공개·비공개 URL 모두 가능. 변경되지 않는 정적 URL 권장"
        >
          <Input
            value={icsUrl}
            onChange={(e) => setIcsUrl(e.target.value)}
            placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
          />
        </Field>
        <Field label="시각화 색상">
          <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </Field>
        <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 text-[11px] text-[var(--color-fg-muted)] leading-relaxed">
          연결 시 즉시 동기화를 시도하고, 가져온 일정은 자동으로 차단됩니다. 게스트의 검색 결과에는
          해당 시간대 슬롯이 노출되지 않아요. 동기화에 실패하면 에러가 표시돼요.
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={submit}
            loading={connect.isPending}
            disabled={!selectedVenueId || !label || !icsUrl}
          >
            연결 + 동기화
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
