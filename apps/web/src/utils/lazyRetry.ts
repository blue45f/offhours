import { lazy, type ComponentType } from 'react'

const RETRY_KEY = 'offhours-chunk-retry'

/**
 * React.lazy + 1회 자동 복구. 배포 직후 stale 청크(해시 교체)로 동적 import 가
 * 실패하면 전체 새로고침으로 새 매니페스트를 받는다. 가드는 reload 너머로
 * sessionStorage 에 유지하고 "성공 로드 시"에만 해제한다 — 즉시 해제하면
 * 무한 reload 루프가 될 수 있다. 두 번째 실패는 그대로 throw 되어 라우터의
 * ErrorBoundary(RouteError)로 노출된다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- React.lazy 제약과 동일하게 props 타입 보존
export function lazyRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy<T>(async () => {
    try {
      const mod = await factory()
      sessionStorage.removeItem(RETRY_KEY)
      return mod
    } catch (err) {
      if (!sessionStorage.getItem(RETRY_KEY)) {
        sessionStorage.setItem(RETRY_KEY, '1')
        window.location.reload()
        // reload 가 끝날 때까지 Suspense 폴백을 유지한다
        return new Promise<{ default: T }>(() => {})
      }
      throw err
    }
  })
}
