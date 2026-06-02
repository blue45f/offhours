import { randomInt } from 'node:crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const BASE36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function pick(alphabet: string, length: number): string {
  let s = ''
  for (let i = 0; i < length; i++) s += alphabet[randomInt(0, alphabet.length)]
  return s
}

export function randomCode(prefix: string, length = 6): string {
  return `${prefix}-${pick(ALPHABET, length)}`
}

export function randomReferralCode(): string {
  return pick(ALPHABET, 6)
}

/** 체크인 코드 등 대문자 영숫자 포맷(base36 대문자) 코드 — 소유 증명용이라 crypto 보안 필요 */
export function randomUpperCode(length = 6): string {
  return pick(BASE36, length)
}

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const suffix = pick('0123456789abcdefghijklmnopqrstuvwxyz', 6)
  return `${base || 'space'}-${suffix}`
}
