import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  MapPin,
  Phone,
  Recycle,
  Sparkles,
  Wifi,
} from 'lucide-react'
import type { ArrivalGuide } from '@offhours/shared'

interface Props {
  guide: ArrivalGuide
  venueAddressRoad: string | null
}

export function ArrivalKitCard({ guide, venueAddressRoad }: Props) {
  const [showPw, setShowPw] = useState(false)
  const items: Array<{
    icon: React.ReactNode
    label: string
    value: string
    actions?: React.ReactNode
  }> = []

  if (venueAddressRoad) {
    items.push({
      icon: <MapPin size={14} />,
      label: '주소 (결제 완료 게스트 공개)',
      value: venueAddressRoad,
      actions: <CopyBtn text={venueAddressRoad} label="주소" />,
    })
  }
  if (guide.parkingNote) {
    items.push({
      icon: <MapPin size={14} />,
      label: '주차 안내',
      value: guide.parkingNote,
    })
  }
  if (guide.entryCode) {
    items.push({
      icon: <KeyRound size={14} />,
      label: '출입문 코드',
      value: guide.entryCode,
      actions: <CopyBtn text={guide.entryCode} label="출입 코드" />,
    })
  }
  if (guide.wifiSsid || guide.wifiPassword) {
    items.push({
      icon: <Wifi size={14} />,
      label: 'Wi-Fi',
      value:
        (guide.wifiSsid ?? '—') +
        (guide.wifiPassword ? ` · ${showPw ? guide.wifiPassword : '••••••'}` : ''),
      actions: (
        <div className="flex items-center gap-1">
          {guide.wifiPassword && (
            <button
              onClick={() => setShowPw((s) => !s)}
              className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] p-1"
              aria-label={showPw ? '숨기기' : '보기'}
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
          {guide.wifiPassword && <CopyBtn text={guide.wifiPassword} label="Wi-Fi 비밀번호" />}
        </div>
      ),
    })
  }
  if (guide.sortingNote) {
    items.push({
      icon: <Recycle size={14} />,
      label: '분리수거·정리',
      value: guide.sortingNote,
    })
  }
  if (guide.emergencyContact) {
    items.push({
      icon: <Phone size={14} />,
      label: '비상 연락처',
      value: guide.emergencyContact,
      actions: <CopyBtn text={guide.emergencyContact} label="연락처" />,
    })
  }
  if (guide.extraNotes) {
    items.push({
      icon: <AlertTriangle size={14} />,
      label: '기타 안내',
      value: guide.extraNotes,
    })
  }

  if (items.length === 0) return null

  return (
    <section className="rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-accent-soft)]/30 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-[var(--color-primary)]" />
        <h3 className="font-semibold">도착 가이드</h3>
        <span className="text-[11px] text-[var(--color-fg-muted)] ml-auto">호스트 제공</span>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] px-3 py-2.5"
          >
            <span className="mt-0.5 text-[var(--color-primary)]">{it.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-widest">
                {it.label}
              </div>
              <div className="mt-0.5 text-sm whitespace-pre-line break-words">{it.value}</div>
            </div>
            {it.actions && <div className="shrink-0">{it.actions}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        navigator.clipboard?.writeText(text)
        toast.success(`${label}를 복사했어요`)
      }}
      className="text-[var(--color-fg-muted)] hover:text-[var(--color-primary)] p-1"
      aria-label={`${label} 복사`}
    >
      <Copy size={14} />
    </button>
  )
}
