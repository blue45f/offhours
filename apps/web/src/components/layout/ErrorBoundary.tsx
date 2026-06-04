import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '../ui/Button'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

/**
 * 컴포넌트 레벨 에러 바운더리 — 라우터 errorElement(RouteError)가 잡지 못하는 렌더 throw
 * (lazy 청크 로드 실패, 프로바이더 트리 예외 등)가 전체 SPA 를 백스크린으로 만드는 것을 막는다.
 * 에러 바운더리는 클래스 컴포넌트로만 구현되므로 여기만 예외적으로 클래스를 쓴다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // 사용자에겐 원문 노출하지 않되, 운영 모니터링 전송 지점 + 디버깅을 위해 콘솔엔 남긴다.
    console.error('Unhandled render error:', error, info.componentStack)
  }

  private handleReset = (): void => {
    this.setState({ error: null })
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <main role="alert" className="container-page py-20 text-center">
          <h1 className="text-headline serif">문제가 발생했어요</h1>
          <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
            예상치 못한 오류로 화면을 표시하지 못했어요. 다시 시도하거나 홈으로 돌아가 주세요.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button onClick={this.handleReset}>다시 시도</Button>
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = '/'
              }}
            >
              홈으로
            </Button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
