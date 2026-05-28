import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CHECKOUT_ITEMS, type CheckoutItemKey } from '@offhours/shared'
import { Check, Sparkles } from 'lucide-react'

import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Field, Textarea } from '../ui/Input'
import { api } from '../../services/api'
import { getErrorMessage } from '../../services/api'
import { cn } from '../../utils/cn'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservationId: string
  reservationCode: string
  spaceTitle: string
}

type Checklist = Record<CheckoutItemKey, boolean>

const INITIAL: Checklist = {
  restored: false,
  trash: false,
  audio: false,
  lights: false,
  lock: false,
  lost: false,
}

export function CheckOutDialog({
  open,
  onOpenChange,
  reservationId,
  reservationCode,
  spaceTitle,
}: Props) {
  const [checklist, setChecklist] = useState<Checklist>(INITIAL)
  const [note, setNote] = useState('')
  const qc = useQueryClient()

  const requiredOk = CHECKOUT_ITEMS.filter((i) => i.required).every((i) => checklist[i.key])

  const checkout = useMutation({
    mutationFn: () =>
      api.patch(`/reservations/${reservationId}/check-out`, {
        checklist,
        note: note || undefined,
      }),
    onSuccess: () => {
      toast.success('체크아웃 완료 — 청소 SLA 통과')
      qc.invalidateQueries({ queryKey: ['reservations'] })
      onOpenChange(false)
      setChecklist(INITIAL)
      setNote('')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  function toggle(k: CheckoutItemKey) {
    setChecklist((c) => ({ ...c, [k]: !c[k] }))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`체크아웃 — ${reservationCode}`}
      description={`${spaceTitle} · 청소 SLA 5개 항목을 모두 확인하면 다음 게스트가 안심하고 입장할 수 있어요.`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            나중에
          </Button>
          <Button
            onClick={() => checkout.mutate()}
            loading={checkout.isPending}
            disabled={!requiredOk}
          >
            체크아웃 처리
          </Button>
        </>
      }
    >
      <ul className="space-y-2">
        {CHECKOUT_ITEMS.map((item) => {
          const on = checklist[item.key]
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => toggle(item.key)}
                className={cn(
                  'w-full flex items-center justify-between rounded-[var(--radius-lg)] border p-3.5 text-left transition-colors',
                  on
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex size-6 items-center justify-center rounded-full border-2',
                      on
                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                        : 'border-[var(--color-border-strong)] text-transparent'
                    )}
                  >
                    <Check size={14} />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </span>
                {item.required ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-fg-muted)]">
                    필수
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-[var(--color-fg-subtle)]">
                    선택
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 text-xs text-[var(--color-fg-muted)] inline-flex items-start gap-2">
        <Sparkles size={12} className="text-[var(--color-accent)] mt-0.5" />
        체크아웃이 처리되면 호스트 신뢰 점수가 즉시 갱신되고, 다음 영업 외 슬롯이 자동으로 예약 가능
        상태로 전환돼요.
      </div>

      <Field label="추가 메모 (선택)" className="mt-4">
        <Textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="분실물·다음 호스트에 알려야 할 사항 등"
        />
      </Field>
    </Dialog>
  )
}
