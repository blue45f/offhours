import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { Me } from '@offhours/shared'

import { Header } from './Header'
import { useAuthStore } from '../../store/auth'
import { useThemeStore } from '../../store/theme'

// Radix popper(DropdownMenu.Content)가 요구하는 ResizeObserver 는 jsdom 에 없다
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)

vi.mock('../../features/notifications/useUnreadNotifications', () => ({
  useUnreadNotifications: () => ({ data: 0 }),
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

function LocationProbe() {
  const loc = useLocation()
  return <output data-testid="loc">{loc.pathname}</output>
}

function renderHeader() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Header />
      <LocationProbe />
    </MemoryRouter>
  )
}

function openMenu() {
  const trigger = screen.getByRole('button', { name: '내 계정 메뉴' })
  fireEvent.keyDown(trigger, { key: 'Enter' })
  return trigger
}

describe('Header 계정 메뉴 접근성', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth('test-token', me)
  })

  afterEach(() => {
    useAuthStore.getState().clear()
  })

  it('트리거가 menu 팝업 버튼으로 노출되고 열기 전에는 menu 가 없다', () => {
    renderHeader()
    const trigger = screen.getByRole('button', { name: '내 계정 메뉴' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('키보드(Enter)로 열면 role=menu 와 menuitem 으로 노출된다', async () => {
    renderHeader()
    const trigger = openMenu()
    expect(await screen.findByRole('menu')).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    for (const label of ['마이페이지', '예약 내역', '찜한 공간', '내 컬렉션', '채팅', '로그아웃']) {
      expect(screen.getByRole('menuitem', { name: label })).toBeInTheDocument()
    }
  })

  it('USER 역할에는 호스트/관리자 항목이 노출되지 않는다', async () => {
    renderHeader()
    openMenu()
    await screen.findByRole('menu')
    expect(screen.queryByRole('menuitem', { name: '호스트 대시보드' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: '관리자' })).toBeNull()
  })

  it('화살표 키로 항목 간 포커스가 이동한다', async () => {
    renderHeader()
    openMenu()
    const first = await screen.findByRole('menuitem', { name: '마이페이지' })
    await waitFor(() => expect(first).toHaveFocus())
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    // Radix RovingFocus 는 포커스 이동을 setTimeout 으로 지연시킨다
    await waitFor(() => expect(screen.getByRole('menuitem', { name: '예약 내역' })).toHaveFocus())
  })

  it('Esc 로 닫히고 트리거로 포커스가 복귀한다', async () => {
    renderHeader()
    const trigger = openMenu()
    const menu = await screen.findByRole('menu')
    fireEvent.keyDown(menu, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(trigger).toHaveFocus()
  })

  it('항목 선택 시 해당 경로로 이동하고 메뉴가 닫힌다', async () => {
    renderHeader()
    openMenu()
    const item = await screen.findByRole('menuitem', { name: '마이페이지' })
    fireEvent.click(item)
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(screen.getByTestId('loc').textContent).toBe('/me')
  })
})

describe('Header 중간 브레이크포인트(768~1023) 레이아웃 가드', () => {
  it('GNB 한국어 라벨은 한 줄을 유지한다 (whitespace-nowrap — 좁은 태블릿 폭에서 2줄 접힘 방지)', () => {
    renderHeader()
    for (const label of ['공간 둘러보기', '호스트 되기', '서비스 소개']) {
      expect(screen.getByRole('link', { name: label })).toHaveClass('whitespace-nowrap')
    }
  })

  it('로고·액션 존은 shrink-0 으로 고정되어 중간 폭에서 찌부러지지 않는다', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Offhours' })).toHaveClass('shrink-0')
    const actions = screen.getByRole('button', { name: '검색 (⌘K)' }).parentElement
    expect(actions).toHaveClass('shrink-0')
  })
})

describe('Header 테마 토글', () => {
  beforeEach(() => {
    useThemeStore.getState().set('light')
  })

  afterEach(() => {
    useThemeStore.getState().set('light')
  })

  it('aria-label 이 현재 상태 기준 전환 방향을 알리고 클릭으로 테마가 바뀐다', () => {
    renderHeader()
    const toggle = screen.getByRole('button', { name: '다크 모드로 전환' })

    fireEvent.click(toggle)
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(screen.getByRole('button', { name: '라이트 모드로 전환' })).toBe(toggle)

    fireEvent.click(toggle)
    expect(useThemeStore.getState().theme).toBe('light')
    expect(screen.getByRole('button', { name: '다크 모드로 전환' })).toBe(toggle)
  })
})
