import { describe, expect, it } from 'vitest'

import { assertSafeIcsUrl } from './ics-url'

/**
 * ICS URL SSRF 방어 회귀 테스트 — 호스트 제공 URL을 서버가 fetch 하므로 내부 주소를 막아야 한다.
 * 공개 호스트(정상 캘린더)는 통과, 사설·예약·메타데이터·localhost 류는 거부.
 */
describe('assertSafeIcsUrl', () => {
  it.each([
    'https://calendar.google.com/calendar/ical/abc/basic.ics',
    'http://calendar.example.com/feed.ics',
    'https://8.8.8.8/public.ics', // 공개 IP 리터럴은 허용
  ])('공개 http(s) URL 허용: %s', (url) => {
    expect(() => assertSafeIcsUrl(url)).not.toThrow()
  })

  it.each([
    'ftp://example.com/cal.ics', // 비 http(s)
    'file:///etc/passwd',
    'http://localhost/cal.ics',
    'http://127.0.0.1/cal.ics',
    'http://169.254.169.254/latest/meta-data/', // 클라우드 메타데이터
    'http://10.0.0.5/cal.ics',
    'http://192.168.1.1/cal.ics',
    'http://172.16.0.9/cal.ics',
    'http://0.0.0.0/cal.ics',
    'http://[::1]/cal.ics', // IPv6 루프백
    'http://[::]/cal.ics', // IPv6 unspecified
    'http://[::ffff:127.0.0.1]/cal.ics', // IPv4-mapped 루프백
    'http://intranet.local/cal.ics',
    'http://svc.internal/cal.ics',
    'http://100.64.0.1/cal.ics', // CGNAT 100.64/10
    'http://224.0.0.1/cal.ics', // multicast
    'http://240.0.0.1/cal.ics', // reserved
    'http://198.18.0.1/cal.ics', // 벤치마킹
    'http://192.0.2.1/cal.ics', // TEST-NET-1
    'https://user:pass@cal.example.com/x.ics', // 자격증명 포함
    'https://user@cal.example.com/x.ics', // 자격증명(user만)
    'not-a-url',
  ])('내부/비정상 URL 거부: %s', (url) => {
    expect(() => assertSafeIcsUrl(url)).toThrow()
  })

  it('정상 URL 은 파싱된 URL 객체를 반환', () => {
    const u = assertSafeIcsUrl('https://cal.example.com/x.ics')
    expect(u.hostname).toBe('cal.example.com')
  })
})
