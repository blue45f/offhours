import { BadRequestException } from '@nestjs/common'

/**
 * 외부 캘린더 ICS URL 검증 — 호스트가 제공한 URL을 서버가 fetch 하므로 SSRF 방어가 필요하다.
 * 사설·예약·루프백·링크로컬(클라우드 메타데이터 169.254.169.254 포함) 대역과 localhost 류를
 * 차단한다. 정상 캘린더(Google/Apple/Outlook 등)는 공개 호스트라 영향 없다.
 *
 * 한계(후속 과제): DNS rebinding 및 리다이렉트로 내부 IP에 도달하는 경로는 막지 못한다.
 * 완전 차단은 DNS 해석 시점의 IP 검사 + 리다이렉트 정책이 필요(정상 캘린더 리다이렉트와 트레이드오프).
 */
const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./, // link-local + 클라우드 메타데이터 엔드포인트
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
]

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
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new BadRequestException('내부 주소로는 캘린더를 연결할 수 없어요')
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) && PRIVATE_V4.some((re) => re.test(host))) {
    throw new BadRequestException('내부 주소로는 캘린더를 연결할 수 없어요')
  }
  // IPv6 루프백(::1)·링크로컬(fe80::)·유니크로컬(fc00::/7 → fc/fd)
  if (
    host === '::1' ||
    host.startsWith('fe80:') ||
    host.startsWith('fc') ||
    host.startsWith('fd')
  ) {
    throw new BadRequestException('내부 주소로는 캘린더를 연결할 수 없어요')
  }
  return url
}
