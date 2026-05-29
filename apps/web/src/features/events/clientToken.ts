const TOKEN_KEY = 'offh.rsvp-token'
const NAME_KEY = 'offh.rsvp-name'

/** 공유 링크 1인 1표를 위한 익명 토큰 — 최초 응답 시점에 생성·고정한다 */
export function getClientToken(): string {
  try {
    const existing = localStorage.getItem(TOKEN_KEY)
    if (existing) return existing
    const fresh = crypto.randomUUID()
    localStorage.setItem(TOKEN_KEY, fresh)
    return fresh
  } catch {
    return crypto.randomUUID()
  }
}

export function readSavedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {
    /* storage 차단 환경은 무시 */
  }
}
