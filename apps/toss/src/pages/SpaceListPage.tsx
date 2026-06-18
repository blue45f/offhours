import { Top } from '@toss/tds-mobile'
import { useMemo, useState } from 'react'

import { getSpaces, won, type Space } from '../lib/api'
import { navigate } from '../router'
import { theme, pageShell } from '../theme'
import { SearchBar, Chips, Badge, Cover } from '../ui'

const ALL = '전체'

export function SpaceListPage() {
  const items = getSpaces()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(ALL)

  const cats = useMemo(() => {
    const c = new Map<string, number>()
    for (const s of items) c.set(s.categoryLabel, (c.get(s.categoryLabel) || 0) + 1)
    return [
      ALL,
      ...[...c.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k)
        .slice(0, 7),
    ]
  }, [items])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return items.filter((s) => {
      const okC = cat === ALL || s.categoryLabel === cat
      const okQ =
        !query ||
        [s.title, s.summary, s.district, s.categoryLabel]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      return okC && okQ
    })
  }, [items, q, cat])

  const open = (s: Space) => navigate(`/space/${encodeURIComponent(s.id)}`)

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      <Top
        title={<Top.TitleParagraph size={22}>🌙 오프아워스</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>영업외 시간, 통째로 빌리는 공간</Top.SubtitleParagraph>
        }
      />
      <div style={pageShell}>
        <div className="rise" style={{ marginBottom: 12 }}>
          <SearchBar value={q} onChange={setQ} placeholder="지역·공간 검색" />
        </div>
        <div className="rise" style={{ animationDelay: '60ms', marginBottom: 18 }}>
          <Chips items={cats} active={cat} onPick={setCat} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => open(s)}
              className="pressable rise"
              style={{
                animationDelay: `${90 + i * 25}ms`,
                width: '100%',
                textAlign: 'left',
                padding: 0,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radius + 2,
                overflow: 'hidden',
                background: theme.surface,
                color: theme.text,
                cursor: 'pointer',
              }}
            >
              <Cover src={s.photos[0]} alt={s.title} height={160} radius={0} seed={s.title} />
              <div style={{ padding: '12px 14px 14px' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  <Badge accent>{s.categoryLabel}</Badge>
                  {s.district && <Badge>{s.district}</Badge>}
                  {s.rating ? <Badge>★ {s.rating.toFixed(1)}</Badge> : null}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{s.title}</div>
                {s.summary && (
                  <div
                    style={{ fontSize: 13, color: theme.textMuted, marginTop: 4, lineHeight: 1.5 }}
                  >
                    {s.summary}
                  </div>
                )}
                <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: theme.accent }}>
                  {won(s.basePriceKRW)}
                  <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500 }}>
                    {' '}
                    /시간~
                  </span>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: theme.textMuted, padding: '40px 0' }}>
              ‘{q || cat}’ 결과가 없어요.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
