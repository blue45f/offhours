import { Minus, Plus, Sparkles } from 'lucide-react'
import { AddonUnitLabel, addonAmount } from '@offhours/shared'

import { useSpaceAddons } from '../../features/addons/api'
import { formatKRW } from '../../utils/format'
import { cn } from '../../utils/cn'

interface Props {
  spaceId: string
  /** 현재 선택된 예약 시간(시간) — PER_HOUR 옵션 금액 프리뷰에 사용 */
  hours: number
  value: Record<string, number>
  onChange: (updater: (prev: Record<string, number>) => Record<string, number>) => void
}

/**
 * 유료 옵션(애드온) 선택기 — 호스트가 영업 외 대관에 끼워 파는 장비·케이터링·세팅.
 * 같은 짜투리 시간에 공간 + 옵션까지 팔아 호스트 객단가를 올리는 차별점의 게스트 표면.
 */
export function AddonPicker({ spaceId, hours, value, onChange }: Props) {
  const { data: addons } = useSpaceAddons(spaceId)
  if (!addons || addons.length === 0) return null

  function bumpQty(id: string, delta: number) {
    onChange((prev) => {
      const qty = Math.min(99, Math.max(0, (prev[id] ?? 0) + delta))
      const next = { ...prev }
      if (qty <= 0) delete next[id]
      else next[id] = qty
      return next
    })
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <Sparkles size={14} className="text-[var(--color-accent)]" />
        옵션 추가
        <span className="text-[11px] font-normal text-[var(--color-fg-muted)]">
          호스트가 제공하는 유료 옵션
        </span>
      </div>
      <div className="space-y-1.5">
        {addons.map((a) => {
          const qty = value[a.id] ?? 0
          const active = qty > 0
          const amount = addonAmount(a.unit, a.priceKRW, Math.max(1, qty), hours)
          return (
            <div
              key={a.id}
              className={cn(
                'flex items-center gap-2 rounded-[var(--radius-lg)] p-2.5 transition-colors hairline',
                active && 'bg-[var(--color-primary-soft)]'
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{a.name}</div>
                <div className="text-[11px] text-[var(--color-fg-muted)]">
                  {formatKRW(a.priceKRW)} · {AddonUnitLabel[a.unit]}
                  {active && (
                    <span className="text-[var(--color-primary)] font-medium">
                      {' · '}
                      {formatKRW(amount)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="옵션 수량 감소"
                  onClick={() => bumpQty(a.id, -1)}
                  disabled={qty <= 0}
                  className="grid size-7 place-items-center rounded-full hairline transition-colors hover:bg-[var(--color-bg-subtle)] disabled:opacity-30"
                >
                  <Minus size={13} />
                </button>
                <span className="w-5 text-center text-sm font-semibold tabular-nums">{qty}</span>
                <button
                  type="button"
                  aria-label="옵션 수량 증가"
                  onClick={() => bumpQty(a.id, 1)}
                  className="grid size-7 place-items-center rounded-full hairline transition-colors hover:bg-[var(--color-bg-subtle)]"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
