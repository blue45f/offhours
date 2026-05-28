/**
 * iCalendar(RFC 5545) 최소 파서. VEVENT 의 SUMMARY/UID/DTSTART/DTEND 만 추출.
 * RRULE/EXDATE 등 반복은 미지원(추후) — 단발 이벤트 시간 차단 용도로 충분.
 */
export interface IcsEvent {
  uid?: string
  summary?: string
  startAt?: Date
  endAt?: Date
}

export function parseIcs(text: string): IcsEvent[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)
  const events: IcsEvent[] = []
  let current: IcsEvent | null = null
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {}
      continue
    }
    if (line === 'END:VEVENT') {
      if (current) events.push(current)
      current = null
      continue
    }
    if (!current) continue
    const colon = line.indexOf(':')
    if (colon < 0) continue
    const left = line.slice(0, colon)
    const value = line.slice(colon + 1)
    const [name] = left.split(';')
    switch (name) {
      case 'UID':
        current.uid = value
        break
      case 'SUMMARY':
        current.summary = decodeIcsText(value)
        break
      case 'DTSTART':
        current.startAt = parseIcsDate(left, value) ?? undefined
        break
      case 'DTEND':
        current.endAt = parseIcsDate(left, value) ?? undefined
        break
      default:
        break
    }
  }
  return events
}

function decodeIcsText(s: string) {
  return s.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/gi, '\n').replace(/\\\\/g, '\\')
}

function parseIcsDate(left: string, value: string): Date | null {
  // 전체 종일: VALUE=DATE → "20260815"
  if (left.includes('VALUE=DATE')) {
    const y = +value.slice(0, 4)
    const m = +value.slice(4, 6) - 1
    const d = +value.slice(6, 8)
    return new Date(Date.UTC(y, m, d))
  }
  // "20260815T190000Z" 또는 "20260815T190000"
  const utc = value.endsWith('Z')
  const v = utc ? value.slice(0, -1) : value
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(v)
  if (!m) return null
  const [, y, mo, d, h, mi, se] = m
  if (utc) return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +se))
  return new Date(+y, +mo - 1, +d, +h, +mi, +se)
}
