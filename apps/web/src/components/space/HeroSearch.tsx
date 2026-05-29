import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Search, Sparkles, Users } from 'lucide-react'
import {
  KOREA_REGIONS,
  PurposeLabel,
  describeParse,
  parseSmartQuery,
  toSearchParams,
  type Purpose,
} from '@offhours/shared'

import { Button } from '../ui/Button'

const purposes: { value: Purpose; label: string }[] = (Object.keys(PurposeLabel) as Purpose[]).map(
  (p) => ({ value: p, label: PurposeLabel[p] })
)

const SMART_PLACEHOLDERS = [
  '예: 강남 야간 와인 30명',
  '예: 마포 카페 베이비샤워 20명',
  '예: 성수 갤러리 팝업',
  '예: 강남 헬스 1:1 PT',
]

export function HeroSearch() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'smart' | 'detail'>('smart')
  const [smart, setSmart] = useState('')
  const [region, setRegion] = useState('')
  const [purpose, setPurpose] = useState<Purpose | ''>('')
  const [capacity, setCapacity] = useState(20)

  const parsed = useMemo(() => (mode === 'smart' ? parseSmartQuery(smart) : null), [mode, smart])
  const chips = useMemo(() => (parsed ? describeParse(parsed) : []), [parsed])
  const placeholder = useMemo(
    () => SMART_PLACEHOLDERS[Math.floor(Date.now() / 1000 / 10) % SMART_PLACEHOLDERS.length],
    []
  )

  function go() {
    if (mode === 'smart' && parsed) {
      const sp = toSearchParams(parsed)
      navigate(`/spaces?${sp.toString()}`)
      return
    }
    const params = new URLSearchParams()
    if (region) params.set('region', region)
    if (purpose) params.set('purpose', purpose)
    if (capacity) params.set('capacity', String(capacity))
    navigate(`/spaces?${params.toString()}`)
  }

  return (
    <div className="hairline rounded-[var(--radius-2xl)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-md)] p-2 md:p-3">
      <div className="flex items-center gap-1 mb-2 px-2">
        <ModeToggle active={mode === 'smart'} onClick={() => setMode('smart')}>
          <Sparkles size={12} /> 자유롭게 검색
        </ModeToggle>
        <ModeToggle active={mode === 'detail'} onClick={() => setMode('detail')}>
          <Search size={12} /> 상세 검색
        </ModeToggle>
      </div>

      {mode === 'smart' ? (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <div className="rounded-[var(--radius-xl)] hover:bg-[var(--color-bg-subtle)] px-4 py-3">
            <div className="text-xs font-semibold text-[var(--color-fg-muted)] inline-flex items-center gap-1.5 mb-1">
              <Sparkles size={12} className="text-[var(--color-accent)]" />
              자유 검색
            </div>
            <input
              autoFocus
              value={smart}
              onChange={(e) => setSmart(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && go()}
              placeholder={placeholder}
              className="bg-transparent w-full font-medium text-[var(--color-fg)] focus:outline-none"
            />
            {chips.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {chips.map((c) => (
                  <span
                    key={c.key}
                    className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] px-2 py-0.5 text-[11px] font-medium"
                  >
                    {c.emoji && <span aria-hidden>{c.emoji}</span>}
                    {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button
            size="xl"
            onClick={go}
            className="md:rounded-[var(--radius-xl)]"
            leading={<Search size={16} />}
          >
            검색
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <FieldButton label="지역" icon={<Search size={14} />}>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="appearance-none bg-transparent w-full font-medium text-[var(--color-fg)] focus:outline-none"
            >
              <option value="">전체</option>
              {KOREA_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FieldButton>
          <FieldButton label="용도" icon={<Calendar size={14} />}>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as Purpose | '')}
              className="appearance-none bg-transparent w-full font-medium text-[var(--color-fg)] focus:outline-none"
            >
              <option value="">전체</option>
              {purposes.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </FieldButton>
          <FieldButton label="인원" icon={<Users size={14} />}>
            <input
              type="number"
              min={1}
              max={500}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="bg-transparent w-full font-medium text-[var(--color-fg)] focus:outline-none"
            />
          </FieldButton>
          <Button
            size="xl"
            onClick={go}
            className="md:rounded-[var(--radius-xl)]"
            leading={<Search size={16} />}
          >
            검색
          </Button>
        </div>
      )}
    </div>
  )
}

function ModeToggle({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold transition-colors ${
        active
          ? 'bg-[var(--color-fg)] text-[var(--color-bg)]'
          : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
      }`}
    >
      {children}
    </button>
  )
}

function FieldButton({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[var(--radius-xl)] px-4 py-3 hover:bg-[var(--color-bg-subtle)] cursor-pointer transition-colors">
      <span className="text-xs font-semibold text-[var(--color-fg-muted)] inline-flex items-center gap-1.5">
        {icon} {label}
      </span>
      <div className="text-sm">{children}</div>
    </div>
  )
}
