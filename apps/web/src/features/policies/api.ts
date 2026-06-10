import { useQuery } from '@tanstack/react-query'

export const TERMSDESK_BASE = 'https://termsdesk.vercel.app'
const ORG_SLUG = 'offhours'

export type PolicySlug = 'terms-of-service' | 'privacy-policy' | 'refund-policy'

export interface PublicPolicy {
  orgName: string
  policySlug: string
  name: string
  type: string
  locale: string
  versionLabel: string
  contentHash: string
  body: string
  effectiveAt: string | null
  publishedAt: string | null
  changeSummary: string | null
}

/** TermsDesk 공개 열람 페이지 — 로드 실패 시 폴백·원문 검증 동선으로 안내한다. */
export function policyExternalUrl(slug: PolicySlug): string {
  return `${TERMSDESK_BASE}/p/${ORG_SLUG}/${slug}`
}

export async function fetchPolicy(slug: PolicySlug): Promise<PublicPolicy> {
  // TermsDesk 공개 API(무인증·CORS 허용) — offhours API 클라이언트(axios)는 자격증명·
  // Authorization 헤더를 붙이므로 크로스 오리진 공개 문서에는 평범한 fetch 를 쓴다.
  const res = await fetch(`${TERMSDESK_BASE}/api/public/${ORG_SLUG}/policies/${slug}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`TermsDesk 응답 오류 (${res.status})`)
  return (await res.json()) as PublicPolicy
}

export function usePolicy(slug: PolicySlug) {
  return useQuery({
    queryKey: ['policy', slug] as const,
    queryFn: () => fetchPolicy(slug),
    // 약관은 게시 후 거의 변하지 않는다 — 탭 전환마다 재요청하지 않게 길게 잡는다
    staleTime: 10 * 60_000,
    retry: 1,
  })
}
