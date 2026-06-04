import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { appQueryClient } from './queryClient'
import { router } from '../router'
import { bootstrapAuth } from '../store/auth'
import { useThemeStore } from '../store/theme'
import { ConfirmProvider } from '../components/ui/ConfirmDialog'

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
      <ConfirmProvider>
        <RouterProvider router={router} />
      </ConfirmProvider>
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
