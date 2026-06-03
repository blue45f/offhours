/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL override (defaults to `/api` proxy in dev). */
  readonly VITE_API_URL?: string
  /** `'true'`이면 MSW mock 모드로 부팅 (dev:mock 스크립트). 기본 미설정 = 실제 백엔드. */
  readonly VITE_USE_MSW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
