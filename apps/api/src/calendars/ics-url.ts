import { BadRequestException } from '@nestjs/common'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/**
 * 외부 캘린더 ICS URL 검증 — 호스트가 제공한 URL을 서버가 fetch 하므로 SSRF 방어가 필요하다.
 * 사설·예약·루프백·링크로컬(클라우드 메타데이터 169.254.169.254 포함)·CGNAT·멀티캐스트 대역과
 * localhost 류, URL 내 자격증명을 차단한다. 정상 캘린더(Google/Apple/Outlook 등)는 공개
 * 호스트라 영향 없다.
 *
 * 두 단계 방어:
 * 1) assertSafeIcsUrl — URL 문자열/IP 리터럴 기반 동기 검증 (저장/등록 시점 입력 차단)
 * 2) fetchIcsSafely — DNS 해석된 실제 IP 재검증 + 리다이렉트 매 홉 재검증 (DNS rebinding /
 *    리다이렉트로 내부망에 도달하는 경로 차단). 정상 캘린더의 공개 호스트 리다이렉트는 영향 없다.
 */
const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./, // link-local + 클라우드 메타데이터 엔드포인트
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT 100.64/10
  /^192\.0\./, // 192.0.0/24(IETF) · 192.0.2/24(TEST-NET-1)
  /^198\.1[89]\./, // 198.18/15 벤치마킹
  /^(22[4-9]|23\d|24\d|25[0-5])\./, // multicast(224/4) + reserved(240/4)
]

/** IPv4-mapped IPv6(::ffff:a.b.c.d 또는 정규화된 ::ffff:7f00:1)에서 내장 IPv4를 점표기로 추출. */
function mappedIpv4(host: string): string | null {
  const m = /^::ffff:(.+)$/i.exec(host)
  if (!m) return null
  const rest = m[1]
  if (isIP(rest) === 4) return rest // ::ffff:127.0.0.1 형태
  // 정규화된 16진 형태 ::ffff:7f00:0001 → 두 16비트 그룹을 옥텟으로 분해
  const groups = rest.split(':')
  if (groups.length !== 2) return null
  const [hi, lo] = groups.map((g) => parseInt(g, 16))
  if (Number.isNaN(hi) || Number.isNaN(lo)) return null
  return `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`
}

function isPrivateIpLiteral(host: string): boolean {
  const v = isIP(host)
  if (v === 4) return PRIVATE_V4.some((re) => re.test(host))
  if (v === 6) {
    // IPv4-mapped (::ffff:a.b.c.d) — 매핑된 IPv4가 사설이면 차단
    const mapped = mappedIpv4(host)
    if (mapped) return isPrivateIpLiteral(mapped)
    return (
      host === '::1' ||
      host === '::' || // unspecified
      host.startsWith('fe80:') ||
      host.startsWith('fc') ||
      host.startsWith('fd')
    )
  }
  return false
}

function normalizeHost(url: URL): string {
  return url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
}

export function assertSafeIcsUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new BadRequestException('유효한 캘린더 URL이 아니에요')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BadRequestException('http/https 캘린더 URL만 연결할 수 있어요')
  }
  // URL 내 자격증명(user:pass@host) 거부 — credential 누출 + 파서 우회 방지
  if (url.username || url.password) {
    throw new BadRequestException('자격증명이 포함된 URL은 연결할 수 없어요')
  }
  const host = normalizeHost(url)
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === 'localhost.localdomain' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new BadRequestException('내부 주소로는 캘린더를 연결할 수 없어요')
  }
  if (isIP(host) && isPrivateIpLiteral(host)) {
    throw new BadRequestException('내부 주소로는 캘린더를 연결할 수 없어요')
  }
  return url
}

/**
 * 호스트명이 DNS 해석 후 실제로 사설/예약 IP로 향하는지 재검증한다(DNS rebinding 방어).
 * 해석 실패는 통과(오프라인/NXDOMAIN — 어차피 fetch 도 불가). IP 리터럴은 assertSafeIcsUrl 이
 * 이미 처리하므로 여기선 이름 기반만 해석한다.
 */
export async function assertResolvedHostIsPublic(url: URL): Promise<void> {
  const host = normalizeHost(url)
  if (isIP(host)) return // 리터럴은 assertSafeIcsUrl 단계에서 검증됨
  let addrs: { address: string }[]
  try {
    addrs = await lookup(host, { all: true })
  } catch {
    return // best-effort: 해석 실패는 통과(오프라인/NXDOMAIN — fetch 도 불가)
  }
  if (addrs.some((a) => isPrivateIpLiteral(a.address))) {
    throw new BadRequestException('내부 주소로는 캘린더를 연결할 수 없어요')
  }
}

const MAX_REDIRECTS = 5
const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308])

/**
 * SSRF-안전 fetch — 매 홉마다 URL 문자열 검증 + DNS 해석 IP 재검증을 거치며 리다이렉트를
 * 수동 추적한다. 리다이렉트로 내부 IP에 도달하는 경로를 차단한다.
 */
export async function fetchIcsSafely(
  rawUrl: string,
  init: { signal?: AbortSignal } = {}
): Promise<Response> {
  let current = assertSafeIcsUrl(rawUrl)
  await assertResolvedHostIsPublic(current)

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(current, { signal: init.signal, redirect: 'manual' })
    if (!REDIRECT_STATUS.has(res.status)) return res
    const loc = res.headers.get('location')
    if (!loc) return res
    current = assertSafeIcsUrl(new URL(loc, current).toString())
    await assertResolvedHostIsPublic(current)
  }
  throw new BadRequestException('리다이렉트가 너무 많아요')
}
