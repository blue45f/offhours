import { Button } from '@toss/tds-mobile'
import { useEffect, useState } from 'react'

import { getSpace, won, AMENITY_LABEL, ALCOHOL_LABEL, CATERING_LABEL } from '../lib/api'
import { shareMessage } from '../lib/toss'
import { navigate } from '../router'
import { theme } from '../theme'
import { Badge, Cover, StatStrip } from '../ui'

export function SpaceDetailPage({ id = '' }: { id?: string }) {
  const s = getSpace(id)
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const x = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(x)
  }, [toast])

  const Header = (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 56,
        padding: '0 8px',
        paddingTop: 'env(safe-area-inset-top)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: `color-mix(in oklab, ${theme.bg} 84%, transparent)`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <button
        type="button"
        aria-label="뒤로"
        onClick={() => navigate('/')}
        className="pressable"
        style={{
          width: 44,
          height: 44,
          background: 'none',
          border: 'none',
          color: theme.text,
          fontSize: 24,
          cursor: 'pointer',
        }}
      >
        ←
      </button>
    </header>
  )
  if (!s)
    return (
      <div style={{ background: theme.bg, minHeight: '100dvh' }}>
        {Header}
        <p style={{ textAlign: 'center', color: theme.textMuted, paddingTop: 40 }}>
          공간을 찾을 수 없어요.
        </p>
      </div>
    )

  const share = async () => {
    const r = await shareMessage(`[오프아워스] ${s.title}\n${s.summary}`)
    if (r === 'clipboard') setToast('클립보드에 복사했어요.')
  }
  const stats = [
    s.rating ? { label: '평점', value: '★ ' + s.rating.toFixed(1) } : null,
    s.capacity ? { label: '수용', value: s.capacity + '인' } : null,
    s.basePriceKRW ? { label: '시간당', value: won(s.basePriceKRW) } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      {Header}
      <div className="rise" style={{ padding: '0 0 110px' }}>
        {s.photos.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              padding: '0 16px',
              scrollbarWidth: 'none',
            }}
            className="chips"
          >
            {s.photos.map((p, i) => (
              <div key={i} style={{ width: s.photos.length > 1 ? '82%' : '100%', flexShrink: 0 }}>
                <Cover
                  src={p}
                  alt={`${s.title} ${i + 1}`}
                  height={210}
                  radius={16}
                  seed={s.title}
                />
              </div>
            ))}
          </div>
        )}
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <Badge accent>{s.categoryLabel}</Badge>
            {s.district && <Badge>{s.district}</Badge>}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.32 }}>{s.title}</h1>
          {s.summary && (
            <p
              style={{
                margin: '8px 0 0',
                color: theme.textMuted,
                fontSize: 14.5,
                lineHeight: 1.55,
              }}
            >
              {s.summary}
            </p>
          )}

          {stats.length ? (
            <div style={{ marginTop: 18 }}>
              <StatStrip stats={stats} />
            </div>
          ) : null}

          {s.description && (
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.78,
                color: theme.text,
                margin: '20px 0 0',
                maxWidth: '72ch',
              }}
            >
              {s.description}
            </p>
          )}

          {s.amenities.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>편의시설</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {s.amenities.map((a) => (
                  <Badge key={a}>{AMENITY_LABEL[a] || a}</Badge>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 14,
              color: theme.textMuted,
            }}
          >
            {s.addressRoad && <div>📍 {s.addressRoad}</div>}
            {s.alcohol && <div>🍷 {ALCOHOL_LABEL[s.alcohol] || s.alcohol}</div>}
            {s.catering && <div>🍽️ {CATERING_LABEL[s.catering] || s.catering}</div>}
          </div>

          <div style={{ marginTop: 22 }}>
            <button
              type="button"
              onClick={share}
              className="pressable"
              style={{
                width: '100%',
                minHeight: 52,
                borderRadius: 14,
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                color: theme.text,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              공유하기
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '12px 20px calc(12px + env(safe-area-inset-bottom))',
          background: `linear-gradient(to top, ${theme.bg} 72%, transparent)`,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>
            {won(s.basePriceKRW)}
          </div>
          <div style={{ fontSize: 11, color: theme.textMuted }}>시간당~</div>
        </div>
        <Button
          style={{ flex: 1 }}
          onClick={() => setToast('예약 문의는 토스 심사 후 토스페이로 연결돼요.')}
        >
          예약 문의
        </Button>
      </div>
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 'calc(88px + env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.86)',
            color: theme.text,
            padding: '10px 18px',
            borderRadius: 999,
            fontSize: 13.5,
            maxWidth: '90%',
            textAlign: 'center',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
