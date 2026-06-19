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
  /** AdDesk 엔드포인트. 설정 시 홈 추천 스폰서 공간 레일 노출(미설정=미렌더). */
  readonly VITE_ADDESK_URL?: string
  /** AdDesk publishable 키(pk_…). 미설정 시 'pk_demo'. */
  readonly VITE_ADDESK_PK?: string
  /** AdDesk 슬롯 키 목록(콤마 구분). 미설정 시 홈 기본 슬롯 3개. */
  readonly VITE_ADDESK_SLOTS?: string

  /* ── 통합 로그인(Firebase Auth) — deskcloud-fleet-auth 단일 프로젝트 ──
   * 리터럴 금지(시크릿 스캔 차단). 로컬 `.env.local`(gitignored) + Vercel env 로만 공급.
   * 미설정이면 isFirebaseAuthConfigured=false 로 런타임 인증을 친절히 비활성화(빌드는 정상). */

  /** Firebase 웹 apiKey(AIza…). 미설정 시 회원 로그인 런타임 비활성화. */
  readonly VITE_FIREBASE_API_KEY?: string
  /** Firebase 웹 appId. 미설정 시 회원 로그인 런타임 비활성화. */
  readonly VITE_FIREBASE_APP_ID?: string
  /** Firebase messagingSenderId. */
  readonly VITE_FIREBASE_SENDER_ID?: string
  /** Firebase storageBucket. */
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  /** authDomain 오버라이드(미설정 시 deskcloud-fleet-auth.firebaseapp.com). */
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  /** projectId 오버라이드(미설정 시 deskcloud-fleet-auth). */
  readonly VITE_FIREBASE_PROJECT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
