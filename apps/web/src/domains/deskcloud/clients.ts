/**
 * DeskCloud 네이티브 클라이언트 — 게시된 `@heejun/deskcloud` SDK 의 브라우저(pk_) 진입점만 사용.
 * ──────────────────────────────────────────────────────────────────────────
 * 위젯 임베드/스크립트 주입 없이, 타입드 클라이언트로 데이터만 받아 offhours 자체
 * 컴포넌트·디자인 토큰으로 렌더한다(네이티브 룩앤필). TermsDesk 통합 패턴과 동일하다.
 *
 * 보안: 절대 `@heejun/deskcloud/server`(sk_ 전용)를 import 하지 않는다. 브라우저 번들엔
 * publishable(pk_) 키만 들어간다. 키 미설정 시 데모 경로('pk_demo').
 *
 * 게이트: 각 Desk 는 `VITE_<DESK>DESK_URL` 이 설정된 경우에만 활성. 미설정이면 `null` 을
 * 돌려주고, 호출부는 앱의 1st-party 기능(또는 빈 상태)으로 폴백한다 — 가역적·무영향.
 */
import {
  createAdClient,
  createChangelogClient,
  createCommunityClient,
  createModerationClient,
  createReviewClient,
  type AdClient,
  type ChangelogClient,
  type CommunityClient,
  type ModerationClient,
  type ReviewClient,
} from '@heejun/deskcloud'

const env = import.meta.env

const pk = (value: string | undefined): string => value ?? 'pk_demo'

/** Changelog Desk 클라이언트 — URL env 미설정이면 null(기능 비활성). */
export function changelogClient(): ChangelogClient | null {
  const endpoint = env.VITE_CHANGELOGDESK_URL
  if (!endpoint) return null
  return createChangelogClient({ endpoint, publishableKey: pk(env.VITE_CHANGELOGDESK_PK) })
}

/** Review Desk 클라이언트(서비스 전반 후기 벽) — URL env 미설정이면 null. */
export function reviewClient(): ReviewClient | null {
  const endpoint = env.VITE_REVIEWDESK_URL
  if (!endpoint) return null
  return createReviewClient({ endpoint, publishableKey: pk(env.VITE_REVIEWDESK_PK) })
}

/** Community Desk 클라이언트(커뮤니티 게시판) — URL env 미설정이면 null. */
export function communityClient(): CommunityClient | null {
  const endpoint = env.VITE_COMMUNITYDESK_URL
  if (!endpoint) return null
  return createCommunityClient({ endpoint, publishableKey: pk(env.VITE_COMMUNITYDESK_PK) })
}

/** Moderation Desk 클라이언트(공개 신고 접수) — URL env 미설정이면 null. */
export function moderationClient(): ModerationClient | null {
  const endpoint = env.VITE_MODERATIONDESK_URL
  if (!endpoint) return null
  return createModerationClient({ endpoint, publishableKey: pk(env.VITE_MODERATIONDESK_PK) })
}

/** Ad Desk 클라이언트(추천·스폰서 공간 배너) — URL env 미설정이면 null. */
export function adClient(): AdClient | null {
  const endpoint = env.VITE_ADDESK_URL
  if (!endpoint) return null
  return createAdClient({ endpoint, publishableKey: pk(env.VITE_ADDESK_PK) })
}

/**
 * 홈 "추천(Sponsored)" 공간 레일이 서빙하는 슬롯 키들(슬롯당 1 크리에이티브).
 * `VITE_ADDESK_SLOTS`(콤마 구분)로 배포별 오버라이드. 활성 크리에이티브를 반환하는
 * 슬롯만 렌더되므로, 미설정 슬롯(과 AdDesk OFF 전체)은 보이지 않는다.
 */
export const adSlots: string[] = (
  env.VITE_ADDESK_SLOTS ?? 'home-spotlight-1,home-spotlight-2,home-spotlight-3'
)
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean)

/** 각 Desk 활성 여부 — 라우트 노출/링크 게이트에 사용. */
export const deskEnabled = {
  changelog: (): boolean => Boolean(env.VITE_CHANGELOGDESK_URL),
  review: (): boolean => Boolean(env.VITE_REVIEWDESK_URL),
  community: (): boolean => Boolean(env.VITE_COMMUNITYDESK_URL),
  moderation: (): boolean => Boolean(env.VITE_MODERATIONDESK_URL),
  ad: (): boolean => Boolean(env.VITE_ADDESK_URL),
} as const

/** 서비스 전반 후기 주제 식별자 — 공간별 코어 후기(ReviewThread)와 구분되는 서비스 후기 벽. */
export const REVIEW_SUBJECT_ID = 'offhours'
/** 커뮤니티 위젯이 붙는 기본 게시판 슬러그(데모 시드의 'free' 게시판). */
export const COMMUNITY_BOARD_SLUG = 'free'
