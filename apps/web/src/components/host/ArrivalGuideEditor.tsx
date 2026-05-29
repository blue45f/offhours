import { useState } from 'react'
import toast from 'react-hot-toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronRight, Sparkles } from 'lucide-react'
import { ARRIVAL_GUIDE_FIELDS, type ArrivalGuide, type HostVenueArrival } from '@offhours/shared'

import { api, getErrorMessage } from '../../services/api'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field, Input, Textarea } from '../ui/Input'

export function ArrivalGuideEditor() {
  const { data, isLoading } = useQuery({
    queryKey: ['host', 'arrival-guides'],
    queryFn: () => api.get<HostVenueArrival[]>('/host/arrival-guides'),
    staleTime: 30_000,
  })
  const [editing, setEditing] = useState<HostVenueArrival | null>(null)
  if (isLoading || !data || data.length === 0) return null

  const setCount = data.filter((v) => v.hasGuide).length

  return (
    <section className="hairline rounded-[var(--radius-xl)] bg-[var(--color-bg-elevated)] p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold inline-flex items-center gap-1.5">
            <Sparkles size={14} className="text-[var(--color-primary)]" />
            도착 가이드
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--color-fg-muted)]">
            결제 완료 게스트에게 자동 노출 · 카톡 반복 안내가 줄어들어요
            <span className="ml-1 font-semibold text-[var(--color-primary)]">
              ({setCount}/{data.length} 설정)
            </span>
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        {data.map((v) => (
          <button
            key={v.venueId}
            onClick={() => setEditing(v)}
            className="w-full flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-primary-soft)] px-3 py-2.5 transition-colors text-left"
          >
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{v.venueName}</div>
              <div className="text-[11px] text-[var(--color-fg-muted)] mt-0.5">
                공간 {v.spaceCount}개 ·{' '}
                {v.hasGuide ? (
                  <span className="text-[var(--color-primary)] font-semibold">
                    <Check size={10} className="inline" /> 설정됨
                  </span>
                ) : (
                  <span>아직 미설정</span>
                )}
              </div>
            </div>
            <ChevronRight size={14} className="text-[var(--color-fg-muted)]" />
          </button>
        ))}
      </div>

      {editing && (
        <EditDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} venue={editing} />
      )}
    </section>
  )
}

function EditDialog({
  open,
  onOpenChange,
  venue,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  venue: HostVenueArrival
}) {
  const [form, setForm] = useState<ArrivalGuide>(venue.guide ?? {})
  const qc = useQueryClient()
  const save = useMutation({
    mutationFn: () => api.patch(`/host/venues/${venue.venueId}/arrival-guide`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['host', 'arrival-guides'] })
      qc.invalidateQueries({ queryKey: ['reservations'] })
    },
  })

  async function submit() {
    try {
      await save.mutateAsync()
      toast.success('도착 가이드를 저장했어요')
      onOpenChange(false)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${venue.venueName} 도착 가이드`}
      description="결제 완료된 게스트에게 자동 노출돼요"
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ARRIVAL_GUIDE_FIELDS.map((f) => (
          <div key={f.key} className={f.multiline || f.key === 'extraNotes' ? 'md:col-span-2' : ''}>
            <Field label={f.label}>
              {f.multiline ? (
                <Textarea
                  rows={3}
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                />
              ) : (
                <Input
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                />
              )}
            </Field>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          취소
        </Button>
        <Button onClick={submit} loading={save.isPending}>
          저장
        </Button>
      </div>
    </Dialog>
  )
}
