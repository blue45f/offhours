import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

/**
 * 첫 실행(저장값 없음)에서 사용할 테마를 결정한다.
 * index.html 의 no-FOUC 스크립트가 이미 적용해 둔 <html> 클래스를 1차 소스로 읽고,
 * 없으면 시스템 선호(prefers-color-scheme)를, 그것도 없으면 light 로 폴백한다.
 * persist 가 'offh.theme' 저장값을 찾으면 이 초기값은 무시된다.
 */
export function resolveInitialTheme(): Theme {
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    if (root.classList.contains('theme-dark')) return 'dark'
    if (root.classList.contains('theme-light')) return 'light'
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

interface ThemeState {
  theme: Theme
  toggle: () => void
  set: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: resolveInitialTheme(),
      toggle: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      set: (theme) => set({ theme }),
    }),
    { name: 'offh.theme' }
  )
)
