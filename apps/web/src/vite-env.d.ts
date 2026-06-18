/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL override (defaults to `/api` proxy in dev). */
  readonly VITE_API_URL?: string
  /** `'true'`이면 MSW mock 모드로 부팅 (dev:mock 스크립트). 기본 미설정 = 실제 백엔드. */
  readonly VITE_USE_MSW?: string
  /** SurveyDesk 엔드포인트. 설정 시 피드백 위젯 노출, 미설정(기본)이면 위젯 미렌더. */
  readonly VITE_SURVEYDESK_URL?: string

  /* ── DeskCloud 네이티브 통합(@heejun/deskcloud SDK pk_ 브라우저 클라이언트) ──
   * 각 Desk 는 URL env 설정 시에만 활성화되고, 데이터는 앱 자체 컴포넌트로 렌더된다
   * (위젯 임베드 아님). 미설정 시 1st-party 기능/빈 상태로 폴백 — 가역적·무영향. */

  /** ChangelogDesk 엔드포인트. 설정 시 /whats-new 페이지에 업데이트 소식 노출(미설정=안내). */
  readonly VITE_CHANGELOGDESK_URL?: string
  /** ChangelogDesk publishable 키(pk_…). 미설정 시 'pk_demo'. */
  readonly VITE_CHANGELOGDESK_PK?: string
  /** ReviewDesk 엔드포인트. 설정 시 서비스 전반 후기 벽(About 페이지) 노출(미설정=미렌더). */
  readonly VITE_REVIEWDESK_URL?: string
  /** ReviewDesk publishable 키(pk_…). 미설정 시 'pk_demo'. */
  readonly VITE_REVIEWDESK_PK?: string
  /** CommunityDesk 엔드포인트. 설정 시 /community 게시판 노출(미설정=준비 중 안내). */
  readonly VITE_COMMUNITYDESK_URL?: string
  /** CommunityDesk publishable 키(pk_…). 미설정 시 'pk_demo'. */
  readonly VITE_COMMUNITYDESK_PK?: string
  /** ModerationDesk 엔드포인트. 설정 시 공간 상세에 네이티브 신고 버튼 노출(미설정=미렌더). */
  readonly VITE_MODERATIONDESK_URL?: string
  /** ModerationDesk publishable 키(pk_…). 미설정 시 'pk_demo'. */
  readonly VITE_MODERATIONDESK_PK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
