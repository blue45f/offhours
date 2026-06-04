import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('render exploded')
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('자식이 정상이면 그대로 렌더한다', () => {
    render(
      <ErrorBoundary>
        <p>정상 콘텐츠</p>
      </ErrorBoundary>
    )

    expect(screen.getByText('정상 콘텐츠')).toBeInTheDocument()
  })

  it('렌더 throw 를 잡아 alert 폴백을 보여준다', () => {
    // React 가 잡은 에러를 console.error 로 흘리므로 테스트 출력만 정리한다.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('문제가 발생했어요')
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '홈으로' })).toBeInTheDocument()
    spy.mockRestore()
  })
})
