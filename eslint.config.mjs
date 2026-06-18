import { base, react, plugin, boundaries, defineConfig } from '@heejun/eslint-config'
import { globalIgnores } from 'eslint/config'
import globals from 'globals'

export default defineConfig(
  globalIgnores([
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/node_modules/**',
    '**/.vercel/**',
    '**/*.d.ts',
    '**/*.tsbuildinfo',
    'apps/api/prisma/migrations/**',
    '**/*.config.{js,mjs,cjs,ts}',

    'apps/toss/**',
  ]),

  // 공유 베이스(TS + import 위생 + 커스텀 규칙 + prettier 충돌 비활성).
  base({ files: ['**/*.{ts,tsx}'] }),

  // apps/web — React 19 + Vite + RC + jsx-a11y.
  react({ files: ['apps/web/**/*.{ts,tsx}'] }),

  // heejun 개인 테스트/목 컨벤션 규칙은 비활성 — 횡단 일관성 대상이 아니라
  // offhours 자체 테스트 스타일과 충돌한다(shared base 의 일반 규칙만 채택).
  {
    plugins: { '@heejun': plugin },
    rules: {
      '@heejun/vitest-mock-import': 'off',
      '@heejun/vitest-mock-import-original': 'off',
      '@heejun/mock-response-naming': 'off',
      '@heejun/no-js-interface-direct-access': 'off',
    },
  },

  // apps/web 레포 정책: 네이티브 confirm/alert/prompt 금지 + 추가 export 허용.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'confirm',
          message: 'useConfirm()/ConfirmDialog를 사용하세요 (globalThis.confirm 금지).',
        },
        { name: 'alert', message: 'Toast/Dialog를 사용하세요 (globalThis.alert 금지).' },
        {
          name: 'prompt',
          message: 'usePrompt()/PromptDialog를 사용하세요 (globalThis.prompt 금지).',
        },
      ],
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true, allowExportNames: ['router', 'useConfirm', 'usePrompt'] },
      ],
      // 오버레이(Dialog/CommandPalette)는 열릴 때 주 컨트롤로 포커스를 옮기는 것이
      // 올바른 모달 접근성 동작이라 autoFocus 를 의도적으로 사용한다.
      'jsx-a11y/no-autofocus': 'off',
    },
  },

  // 라우트 테이블은 lazy 컴포넌트 + router export 혼재.
  {
    files: ['apps/web/src/router/index.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // apps/web 계층 경계 — 개발가이드의 app/domains/shared/infrastructure 4계층.
  // components/hooks/utils/store/lib/styles 는 물리적으로 옮기지 않고 shared 로 매핑한다.
  ...boundaries({
    files: ['apps/web/src/**/*.{ts,tsx}'],
    elements: [
      { type: 'app', pattern: 'apps/web/src/{app,router,pages}/**/*', mode: 'full' },
      { type: 'domains', pattern: 'apps/web/src/domains/*/**/*', mode: 'full' },
      {
        type: 'shared',
        pattern: 'apps/web/src/{components,hooks,utils,store,lib,styles}/**/*',
        mode: 'full',
      },
      { type: 'infrastructure', pattern: 'apps/web/src/infrastructure/**/*', mode: 'full' },
    ],
    rules: [
      { from: ['app'], allow: ['app', 'domains', 'shared', 'infrastructure'] },
      { from: ['domains'], allow: ['domains', 'shared', 'infrastructure'] },
      { from: ['infrastructure'], allow: ['shared', 'infrastructure'] },
      { from: ['shared'], allow: ['shared'] },
    ],
  }),
  // boundaries 는 TS 임포트를 분류하려면 리졸버가 필요하다(없으면 조용히 no-op).
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    settings: {
      'import/resolver': { typescript: { project: 'apps/web/tsconfig.json' }, node: true },
    },
  },
  // 기술부채 완화(차기 패스에서 도메인으로 이동 예정): components/ 아래 일부 폴더는
  // 사실상 도메인 결합 피처 컴포넌트라 domains/infrastructure 를 직접 import 한다
  // (chat·host·reservation·space 피처 컴포넌트, layout 헤더의 알림 상태,
  // deskcloud DeskCloud SDK 데이터 훅 소비, ui/AttachmentInput 의 chat 첨부 변환).
  // 이들을 도메인으로 물리 이동하는 것은 SpaceCard 같은 공용 빌딩블록까지 얽힌
  // 대규모 리팩터라 이번 파일럿 범위 밖이다.
  // pure shared(ui 의 나머지·hooks·utils·store·styles)는 계속 strict 하게 강제한다.
  {
    files: [
      'apps/web/src/components/{chat,host,reservation,space,layout,deskcloud}/**/*.{ts,tsx}',
      'apps/web/src/components/ui/AttachmentInput.tsx',
    ],
    rules: { 'boundaries/element-types': 'off' },
  },
  // store/ 는 전역 클라이언트 상태 계층으로 매핑상 shared 지만, auth 부트스트랩처럼
  // infrastructure(api 클라이언트)를 오케스트레이션하는 것이 자연스럽다. ui/utils 같은
  // 순수 shared 는 strict 를 유지하되 store→infrastructure 만 의도적으로 허용한다.
  {
    files: ['apps/web/src/store/**/*.{ts,tsx}'],
    rules: { 'boundaries/element-types': 'off' },
  },

  // apps/api — NestJS (Node). 데코레이터 + 빈 생성자/클래스 관용.
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },

  // packages/shared — isomorphic (Node).
  {
    files: ['packages/shared/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  // 테스트 — Vitest globals; fast-refresh 제약 완화.
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
    },
  }
)
