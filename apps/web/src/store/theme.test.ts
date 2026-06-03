import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveInitialTheme, useThemeStore } from './theme'

function stubMatchMedia(prefersDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('dark') ? prefersDark : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  )
}

describe('resolveInitialTheme', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark')
  })

  afterEach(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark')
    vi.unstubAllGlobals()
  })

  it('no-FOUC 스크립트가 적용한 <html> 클래스를 1차 소스로 읽는다 (dark)', () => {
    document.documentElement.classList.add('theme-dark')
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('명시적 라이트 고정 클래스를 존중한다', () => {
    document.documentElement.classList.add('theme-light')
    stubMatchMedia(true) // 시스템이 다크여도 라이트 클래스가 우선
    expect(resolveInitialTheme()).toBe('light')
  })

  it('클래스가 없으면 시스템 선호(prefers-color-scheme: dark)를 따른다', () => {
    stubMatchMedia(true)
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('클래스도 시스템 선호도 없으면 light 로 폴백한다', () => {
    stubMatchMedia(false)
    expect(resolveInitialTheme()).toBe('light')
  })
})

describe('useThemeStore', () => {
  it('toggle 은 light↔dark 를 왕복한다', () => {
    useThemeStore.getState().set('light')
    expect(useThemeStore.getState().theme).toBe('light')

    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe('dark')

    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe('light')
  })
})
