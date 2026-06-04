import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/node_modules/**',
    '**/*.d.ts',
    '**/*.tsbuildinfo',
    'apps/api/prisma/migrations/**',
    '**/*.config.{js,mjs,cjs,ts}',
  ]),

  // Shared TS rules for the whole monorepo.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-useless-escape': 'warn',
    },
  },

  // apps/web — React 19 + Vite (browser).
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // 네이티브 window.confirm/alert/prompt 금지 — 브랜드 ConfirmDialog/PromptDialog/Toast를 쓴다.
      // (useConfirm()/usePrompt() 같은 로컬 변수는 섀도잉이라 영향 없음)
      'no-restricted-globals': [
        'error',
        { name: 'confirm', message: 'useConfirm()/ConfirmDialog를 사용하세요 (window.confirm 금지).' },
        { name: 'alert', message: 'Toast/Dialog를 사용하세요 (window.alert 금지).' },
        { name: 'prompt', message: 'usePrompt()/PromptDialog를 사용하세요 (window.prompt 금지).' },
      ],
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // react-hooks v7 ships experimental React Compiler diagnostics as errors.
      // Keep them as advisory warnings (matching sibling repos) so the gate fails
      // on genuine rules-of-hooks bugs, not on idiomatic effect/render patterns.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },

  // apps/api — NestJS (Node). Decorator-heavy; empty constructors/interfaces are idiomatic.
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },

  // packages/shared — isomorphic (Node).
  {
    files: ['packages/shared/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },

  // Test files — Vitest globals; relax fast-refresh constraint.
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
