import { AlertTriangle } from 'lucide-react'
import { useRouteError } from 'react-router-dom'

import { Button } from '../ui/Button'

/**
 * 라우트 에러 바운더리 — 렌더 중 throw(또는 lazy 청크 로드 실패)가 전체 SPA 를 백스크린으로
 * 만드는 것을 막고, 친절한 폴백 + 복구 동선을 보여준다. createBrowserRouter 루트의 errorElement.
 */
export function RouteError() {
  const error = useRouteError()
  // 사용자에겐 원문 노출하지 않되, 디버깅을 위해 콘솔엔 남긴다
  console.error('Route render error:', error)

  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-warning)_14%,transparent)] text-[var(--color-warning)] ring-1 ring-[var(--color-border)]">
        <AlertTriangle size={26} strokeWidth={1.5} aria-hidden />
      </div>
      <h1 className="text-headline serif text-balance">문제가 발생했어요</h1>
      <p className="mt-3 max-w-[46ch] text-pretty text-sm leading-relaxed text-[var(--color-fg-muted)]">
        페이지를 표시하는 중 오류가 났어요. 잠시 후 다시 시도하거나 홈으로 돌아가 주세요.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2">
        <Button onClick={() => globalThis.location.reload()}>다시 시도</Button>
        <Button
          variant="secondary"
          onClick={() => {
            globalThis.location.href = '/'
          }}
        >
          홈으로
        </Button>
      </div>
    </div>
  )
}
