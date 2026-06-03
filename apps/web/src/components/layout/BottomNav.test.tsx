import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { BottomNav } from './BottomNav'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav />
    </MemoryRouter>
  )
}

describe('BottomNav 접근성', () => {
  it('이름 있는 nav 랜드마크로 노출된다', () => {
    renderAt('/')
    expect(screen.getByRole('navigation', { name: '주요 메뉴' })).toBeInTheDocument()
  })

  it('모든 탭이 접근 가능한 링크로 노출된다', () => {
    renderAt('/')
    for (const label of ['홈', '둘러보기', '찜', '채팅', '마이']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('현재 경로 탭에 aria-current="page" 가 설정된다 (색상만으로 활성 표시하지 않음)', () => {
    renderAt('/spaces')
    const active = screen.getByRole('link', { name: '둘러보기' })
    expect(active).toHaveAttribute('aria-current', 'page')

    // 다른 탭은 current 가 아니어야 함
    const inactive = screen.getByRole('link', { name: '찜' })
    expect(inactive).not.toHaveAttribute('aria-current', 'page')
  })

  it('홈 탭은 정확히 / 에서만 활성된다 (end 매칭)', () => {
    renderAt('/spaces')
    const home = screen.getByRole('link', { name: '홈' })
    expect(home).not.toHaveAttribute('aria-current', 'page')
  })
})
