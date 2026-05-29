import { CalendarPlus, Download } from 'lucide-react'

interface Props {
  title: string
  startAt: string
  endAt: string
  location: string
  details: string
}

/** ISO → iCal UTC stamp (YYYYMMDDTHHMMSSZ) */
function stamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/[,;]/g, '\\$&').replace(/\n/g, '\\n')
}

function googleUrl({ title, startAt, endAt, location, details }: Props): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${stamp(startAt)}/${stamp(endAt)}`,
    details,
    location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function icsHref({ title, startAt, endAt, location, details }: Props): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Offhours//Event Hub//KO',
    'BEGIN:VEVENT',
    `DTSTART:${stamp(startAt)}`,
    `DTEND:${stamp(endAt)}`,
    `SUMMARY:${escapeICS(title)}`,
    `LOCATION:${escapeICS(location)}`,
    `DESCRIPTION:${escapeICS(details)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines)}`
}

const linkCls =
  'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] px-3.5 py-1.5 text-[0.8125rem] font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'

export function AddToCalendar(props: Props) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <a className={linkCls} href={googleUrl(props)} target="_blank" rel="noopener noreferrer">
        <CalendarPlus size={14} aria-hidden />
        Google 캘린더에 추가
      </a>
      <a className={linkCls} href={icsHref(props)} download={`${props.title}.ics`}>
        <Download size={14} aria-hidden />
        캘린더 파일(.ics)
      </a>
    </div>
  )
}
