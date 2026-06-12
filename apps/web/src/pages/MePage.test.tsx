import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Me } from '@offhours/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import MePage from './MePage'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'
import { ConfirmProvider } from '../components/ui/ConfirmDialog'

// RecentlyViewedRow 는 react-query 훅을 쓰므로 페이지 단위 테스트에서는 잘라낸다
vi.mock('../components/space/RecentlyViewedRow', () => ({
  RecentlyViewedRow: () => null,
}))

const me: Me = {
  id: 'u1',
  name: '김오프',
  avatarUrl: null,
  role: 'USER',
  trustScore: 50,
  createdAt: '2026-01-01T00:00:00.000Z',
  email: 'me@offhours.test',
  phone: null,
  isVerified: true,
  isSuspended: false,
  marketingOptIn: false,
  referralCode: 'OFFH01',
  pointsKRW: 0,
}

function renderPage() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <MemoryRouter initialEntries={['/me']}>
          <MePage />
        </MemoryRouter>
      </ConfirmProvider>
    </QueryClientProvider>
  )
}

describe('MePage 다크 모드 토글', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth('test-token', me)
    useThemeStore.getState().set('light')
  })

  afterEach(() => {
    useAuthStore.getState().clear()
    useThemeStore.getState().set('light')
  })

  it('switch 로 노출되고 현재 상태를 aria-checked 와 상태 문구로 알린다', () => {
    renderPage()
    const sw = screen.getByRole('switch', { name: '다크 모드' })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    expect(sw).toHaveTextContent('밝은 테마 사용 중')
  })

  it('클릭하면 테마가 토글되고 상태 표기가 갱신된다', () => {
    renderPage()
    const sw = screen.getByRole('switch', { name: '다크 모드' })

    fireEvent.click(sw)
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(sw).toHaveAttribute('aria-checked', 'true')
    expect(sw).toHaveTextContent('어두운 테마 사용 중')

    fireEvent.click(sw)
    expect(useThemeStore.getState().theme).toBe('light')
    expect(sw).toHaveAttribute('aria-checked', 'false')
  })

  it('기존 메뉴 카드 링크가 그대로 유지된다', () => {
    renderPage()
    for (const [pattern, href] of [
      ['예약 내역', '/me/reservations'],
      ['찜한 공간', '/favorites'],
      ['채팅', '/chat'],
      ['법인 결제', '/me/corporate'],
      ['알림', '/notifications'],
    ] as const) {
      expect(screen.getByRole('link', { name: new RegExp(pattern) })).toHaveAttribute('href', href)
    }
    expect(screen.getByRole('button', { name: '계정 탈퇴' })).toBeInTheDocument()
  })
})
