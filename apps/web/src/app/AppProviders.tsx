import { useEffect } from 'react'
import { QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { MotionConfig } from 'motion/react'

import { appQueryClient } from './queryClient'
import { router } from '../router'
import { bootstrapAuth } from '../store/auth'
import { useThemeStore } from '../store/theme'
import { ConfirmProvider } from '../components/ui/ConfirmDialog'
import { PromptProvider } from '../components/ui/PromptDialog'
import { ErrorBoundary } from '../components/layout/ErrorBoundary'

export function AppProviders() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    void bootstrapAuth()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('theme-dark', theme === 'dark')
    root.classList.toggle('theme-light', theme === 'light')
  }, [theme])

  return (
    <QueryClientProvider client={appQueryClient}>
      {/* reducedMotion="user": Framer 진입/리빌 모션 전체가 prefers-reduced-motion 을 자동 존중
          (transform 애니메이션은 opacity-only 로 축약). CSS 토큰 분기만으론 JS 모션이 안 잡힌다. */}
      <MotionConfig reducedMotion="user">
        {/* QueryErrorResetBoundary: "다시 시도" 시 throw 된 쿼리의 에러 상태를 비워 refetch 를 허용한다. */}
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary onReset={reset}>
              <ConfirmProvider>
                <PromptProvider>
                  <RouterProvider router={router} />
                </PromptProvider>
              </ConfirmProvider>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </MotionConfig>
      <Toaster
        position="top-center"
        gutter={10}
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-fg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 14px',
            fontSize: '0.9375rem',
          },
        }}
      />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
