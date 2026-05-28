import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Search, Users } from 'lucide-react'
import { KOREA_REGIONS, PurposeLabel, type Purpose } from '@offhours/shared'

import { Button } from '../ui/Button'

const purposes: { value: Purpose; label: string }[] = (Object.keys(PurposeLabel) as Purpose[]).map(
  (p) => ({ value: p, label: PurposeLabel[p] })
)

export function HeroSearch() {
  const navigate = useNavigate()
  const [region, setRegion] = useState('')
  const [purpose, setPurpose] = useState<Purpose | ''>('')
  const [capacity, setCapacity] = useState(20)

  function go() {
    const params = new URLSearchParams()
    if (region) params.set('region', region)
    if (purpose) params.set('purpose', purpose)
    if (capacity) params.set('capacity', String(capacity))
    navigate(`/spaces?${params.toString()}`)
  }

  return (
    <div className="hairline rounded-[var(--radius-2xl)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-md)] p-2 md:p-3">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2">
        <FieldButton label="지역" icon={<Search size={14} />} value={region || '어디서 모일까요'}>
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
        <FieldButton
          label="용도"
          icon={<Calendar size={14} />}
          value={purpose ? PurposeLabel[purpose] : '어떤 모임인가요'}
        >
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
        <FieldButton label="인원" icon={<Users size={14} />} value={`${capacity}명`}>
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
    </div>
  )
}

interface FieldButtonProps {
  label: string
  icon: React.ReactNode
  value: string
  children: React.ReactNode
}

function FieldButton({ label, icon, children }: FieldButtonProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[var(--radius-xl)] px-4 py-3 hover:bg-[var(--color-bg-subtle)] cursor-pointer transition-colors">
      <span className="text-xs font-semibold text-[var(--color-fg-muted)] inline-flex items-center gap-1.5">
        {icon} {label}
      </span>
      <div className="text-sm">{children}</div>
    </div>
  )
}
