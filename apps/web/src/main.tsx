import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles/global.css'
import { AppProviders } from './app/AppProviders'

async function bootstrap() {
  if (import.meta.env.VITE_USE_MSW === 'true') {
    const { startMockServiceWorker } = await import('./mocks/browser')
    await startMockServiceWorker()
  }

  const root = document.getElementById('root')
  if (!root) throw new Error('root element not found')

  createRoot(root).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>
  )
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }
}

void bootstrap()
