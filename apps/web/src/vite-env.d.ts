/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL override (defaults to `/api` proxy in dev). */
  readonly VITE_API_URL?: string
  /** `'true'`이면 MSW mock 모드로 부팅 (dev:mock 스크립트). 기본 미설정 = 실제 백엔드. */
  readonly VITE_USE_MSW?: string
  /** SurveyDesk 엔드포인트. 설정 시 피드백 위젯 노출, 미설정(기본)이면 위젯 미렌더. */
  readonly VITE_SURVEYDESK_URL?: string
  /** ChangelogDesk 엔드포인트. 설정 시 변경 이력 위젯 노출(미설정=비활성). */
  readonly VITE_CHANGELOGDESK_URL?: string
  /** ChangelogDesk publishable 키(pk_…). 미설정 시 'pk_demo'. */
  readonly VITE_CHANGELOGDESK_PK?: string
  /** NotifyDesk 엔드포인트. 설정 시 알림 인박스 위젯 노출(로그인 사용자 한정, 미설정=비활성). */
  readonly VITE_NOTIFYDESK_URL?: string
  /** NotifyDesk publishable 키(pk_…). 미설정 시 'pk_demo'. */
  readonly VITE_NOTIFYDESK_PK?: string
  /** SearchDesk 엔드포인트. 설정 시 ⌘/ 검색 팔레트 노출(미설정=비활성). */
  readonly VITE_SEARCHDESK_URL?: string
  /** SearchDesk publishable 키(pk_…). 미설정 시 'pk_demo'. */
  readonly VITE_SEARCHDESK_PK?: string
  /** ReviewDesk 엔드포인트. 설정 시 후기 위젯(플로팅 런처) 노출(미설정=비활성). */
  readonly VITE_REVIEWDESK_URL?: string
  /** ReviewDesk publishable 키(pk_…). 미설정 시 'pk_demo'. */
  readonly VITE_REVIEWDESK_PK?: string
  /** ChatDesk 엔드포인트. 설정 시 채팅 위젯 노출(로그인 사용자 한정, 미설정=비활성). */
  readonly VITE_CHATDESK_URL?: string
  /** ChatDesk publishable 키(pk_…). 미설정 시 'pk_demo'. */
  readonly VITE_CHATDESK_PK?: string
  /** MediaDesk 엔드포인트. 설정 시 미디어 업로더·갤러리 위젯(플로팅 런처) 노출(미설정=비활성). */
  readonly VITE_MEDIADESK_URL?: string
  /** MediaDesk publishable 키(pk_…). 미설정 시 'pk_demo'. */
  readonly VITE_MEDIADESK_PK?: string
  /** CommunityDesk 엔드포인트. 설정 시 커뮤니티 게시판 위젯(플로팅 런처) 노출(미설정=비활성). */
  readonly VITE_COMMUNITYDESK_URL?: string
  /** CommunityDesk publishable 키(pk_…). 미설정 시 'pk_demo'. */
  readonly VITE_COMMUNITYDESK_PK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
