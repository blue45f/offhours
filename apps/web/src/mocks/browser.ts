import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

/**
 * VITE_USE_MSW=true 일 때만 main.tsx에서 동적 import되어 시작된다.
 * onUnhandledRequest: 'bypass' — mock하지 않은 요청(결제/정산 등 money-movement 포함)은
 * 실제 네트워크로 그대로 통과시킨다.
 */
export async function startMockServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
  console.info('🧪 MSW 활성화 — Offhours mock 모드 (READ 전용, 결제 흐름 제외)')
}
