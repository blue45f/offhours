import { defineConfig } from '@apps-in-toss/web-framework/config'

// 영업외 시간 공간 예약. 비게임=partner. 결제는 토스페이(실물 거래) 연동 대상.
export default defineConfig({
  appName: 'offhours',
  brand: { displayName: '오프아워스', primaryColor: '#D98B63', icon: '' },
  web: { host: 'localhost', port: 5184, commands: { dev: 'vite', build: 'vite build' } },
  permissions: [
    { name: 'clipboard', access: 'read' },
    { name: 'clipboard', access: 'write' },
  ],
  outdir: 'dist',
  webViewProps: { type: 'partner' },
  navigationBar: { withBackButton: true, withHomeButton: true },
})
