# Offhours — 개발 가이드

상업 시설의 영업 외 시간을 파티·스몰웨딩·모임·팝업 공간으로 매칭하는 양면시장 플랫폼.
제품 범위는 [PRODUCT.md](./PRODUCT.md), 구조/DB는 [ARCHITECTURE.md](./ARCHITECTURE.md),
디자인 시스템은 [DESIGN.md](./DESIGN.md), 빠른 컨텍스트는 루트 `CLAUDE.md`를 참고하세요.
포트폴리오 공통 컨벤션은 상위 워크스페이스 루트의 `DEVELOPMENT.md`·`CONTRIBUTING.md`를 따릅니다.

## 스택

- **Frontend** (`apps/web`): React 19(React Compiler 활성화) · Vite 8 · TypeScript 6 · Tailwind 4 · Radix UI
- **Backend** (`apps/api`): NestJS 11 · Prisma 7 · PostgreSQL · argon2 · helmet · throttler
- **Shared** (`packages/shared`): Zod 스키마 → 타입 추론(API·Web 공유)
- **Monorepo**: pnpm 11 workspace (`apps/*`, `packages/*`)
- **품질**: ESLint 10(flat config) + Prettier · Vitest(+Playwright e2e) · husky + lint-staged + commitlint

## 라이브러리 (용도별)

> apps/web 기준. 새 날짜·시간 포맷은 직접 구현 금지 — `date-fns` + `locale/ko` 사용.

- **date-fns (+locale/ko)** — 날짜·시간·상대시간·그리드 주차 계산
- **@tanstack/react-query** — 서버 상태(쿼리·뮤테이션·캐시)
- **zustand** — 클라이언트 UI 상태(auth, compare 보드)
- **zod** — 스키마/검증(packages/shared 공유)
- **react-hook-form + @hookform/resolvers** — 폼(zod resolver)
- **react-router-dom** — 라우팅(createBrowserRouter)
- **@radix-ui/\*** — 접근성 프리미티브
- **tailwindcss + clsx + tailwind-merge** — 스타일(`cn()` 헬퍼)
- **framer-motion** — 모션(reduced-motion 분기) · **lucide-react** — 아이콘 · **react-hot-toast** — 토스트
- **axios** — HTTP 클라이언트 · **@tosspayments/payment-widget-sdk** — 결제 위젯

## 셋업 & 실행

```bash
corepack enable          # pnpm 11.4.0
pnpm install
pnpm dev                 # web + api + shared watch 동시
pnpm dev:web             # web만 · pnpm dev:api — api만
pnpm db:push             # Prisma 스키마 → DB · pnpm db:generate · pnpm seed
pnpm docker:up           # postgres + api + web
```

dev 포트: web `5173`, api `3000`. `.env`는 각 앱 `.env.example` 기준으로 복사.

## 검증 게이트

```bash
pnpm verify              # validate:architecture → ci(format:check → lint → typecheck → test:run → build)
pnpm verify:push         # = verify (pre-push)
```

- **pre-commit**: lint-staged(prettier). **commit-msg**: commitlint(conventional, 헤더 ≤100자).
- 훅 우회(`--no-verify`/`HUSKY=0`) 금지 — 실패는 근본 원인을 수정.
- API 계약/a11y 감사(`audit:api-contracts`/`audit:frontend-a11y`)가 ci에 포함됩니다.

## 코드 컨벤션

- **Prettier**: `.prettierrc` — no semi · singleQuote · trailingComma es5 · printWidth 100.
- **ESLint**: 루트 `eslint.config.mjs` 하나로 모노레포 전체 커버(`pnpm lint` = `eslint .`).
  - 게이트 정책: 진짜 버그(rules-of-hooks 등)만 error, 나머지(`no-explicit-any`, react-refresh,
    React Compiler 실험 진단 `set-state-in-effect`/`purity` 등)는 advisory `warn`. `verify` 통과 = 0 error.
- **React Compiler**: 컴포넌트 자동 메모이즈 — 순수 메모이제이션용 `useMemo`/`useCallback`/`React.memo`
  추가 금지, Rules of React 위반 금지. 배선은 `apps/web/vite.config.ts`(`reactCompilerPreset()`).
- **컴포넌트**: forwardRef + compound(`Card.Header`/`Card.Body`), className은 `cn(...)`.
- **상태 분리**: TanStack Query(서버) / Zustand(클라이언트 UI) / URL(공유 가능). 공유 스키마는 Zod로 packages/shared.
- **커밋**: Conventional(`feat(spaces):`, `fix(reservations):`). 한국어 주석 허용, 식별자/문서 헤더는 영문.

## 디렉터리 핵심

```text
apps/web/src/   app/(Providers·queryClient) · router/ · features/<domain>/ · components/ · pages/ · services/ · store/ · styles/
apps/api/src/   common/(guards·filters·pipes) · prisma/ · <module>/(controller·service·dto)
packages/shared/src/  <domain>.ts (Zod schema → infer type)
```

## 테스트 · 보안 · 배포

- **테스트**: Unit(Vitest — 슬롯 엔진/가격 계산) · Component(@testing-library/react) · E2E(Playwright, 검색→예약→결제 golden path).
- **보안**: argon2id 비밀번호, JWT 15m + Refresh 30d(httpOnly cookie), helmet + throttler, 입력은 Zod로 전부 검증.
  자금 이동(refund/정산/캡처)은 결정만 기록하고 실제 이체는 wiring 결정 전까지 mock 유지.
- **헬스 체크**: liveness `GET /health` + readiness `/ready`(DB 프로브, 503).
- **배포**: Web → Vercel, API → Render(`render.yaml`, Docker + 관리형 Postgres). 상세는 [DEPLOYMENT.md](./DEPLOYMENT.md).
