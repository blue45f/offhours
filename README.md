# Offhours

> 카페·바·레스토랑의 **영업 외 시간**(휴무일·마감 후)을 파티·스몰웨딩·모임·팝업 공간으로
> 매칭하는 양면시장 플랫폼. "비어 있던 그 시간, 가장 멋진 공간이 됩니다."

## 스택

| 영역     | 기술                                                                     |
| -------- | ------------------------------------------------------------------------ |
| Frontend | React 19 · Vite 8 · TanStack Query 5 · Zustand 5 · React Hook Form + Zod |
| Styling  | Tailwind 4 · Radix UI · lucide-react · Framer Motion                     |
| Backend  | NestJS 11 · Prisma 7 · PostgreSQL 16 · argon2 · nestjs-zod · nestjs-pino |
| Shared   | Zod 4 (DTO/스키마 공유)                                                  |
| Tooling  | pnpm 11 workspaces · TypeScript · Prettier · Husky · Commitlint          |
| Test     | Vitest · Testing Library · Playwright                                    |
| Infra    | Docker Compose (Postgres + Redis) · Cloud Run / Vercel                   |

## 구조

```
offhours/
├── apps/
│   ├── api/        # NestJS 11 + Prisma 7
│   └── web/        # React 19 + Vite 8
├── packages/
│   └── shared/     # Zod 스키마·타입 공유
├── docs/           # PRODUCT / ARCHITECTURE / DESIGN
├── CLAUDE.md
└── README.md
```

## 빠른 시작

```bash
# 1) 의존성 설치 + shared 빌드 (postinstall)
pnpm install

# 2) DB 실행 (Postgres + Redis)
pnpm docker:up

# 3) 환경 변수
cp .env.example .env

# 4) Prisma 스키마 적용 + 시드
pnpm db:push
pnpm seed

# 5) 개발 (pnpm이 web/api/shared 동시 기동)
pnpm dev
```

웹: http://localhost:5173 · API: http://localhost:3000 · Swagger: http://localhost:3000/api/docs

## 주요 스크립트

```bash
pnpm dev               # 전체 dev (web + api + shared watch)
pnpm dev:web           # web만
pnpm dev:api           # api만
pnpm build             # 전체 build
pnpm typecheck         # 타입 검사
pnpm lint              # ESLint (flat config, 루트 eslint.config.mjs)
pnpm test              # 단위 테스트
pnpm format            # Prettier 적용
pnpm verify            # CI (format + lint + typecheck + test + build)

pnpm db:push           # Prisma → DB
pnpm db:generate       # Prisma Client 생성
pnpm db:migrate        # migration
pnpm seed              # 시드 데이터
```

## 문서

- 📋 [PRODUCT.md](./docs/PRODUCT.md) — 기획·페르소나·MVP·KPI
- 🏗️ [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — 모듈·DB·인증·결제
- 🎨 [DESIGN.md](./docs/DESIGN.md) — Quiet Luxury 디자인 시스템
- 🤖 [CLAUDE.md](./CLAUDE.md) — AI 개발 가이드

## 차별화 포인트

1. **영업외 시간 자동 슬롯** — 호스트 영업시간만 입력하면 휴무일/마감후 슬롯이 자동 생성
2. **청소 SLA + 마켓** — 예약 종료 후 청소 윈도우 강제, 제휴 청소 서비스 자동 매칭
3. **BYOB/주류 정책 템플릿** — 일반음식점/휴게음식점 유형별 가이드
4. **동적 가격** — 휴무일 < 야간 < 주말 새벽 프리미엄 자동
5. **Quiet Luxury 무드** — 정보 나열 대신 풀블리드 큐레이션

## 라이선스

UNLICENSED — Private project
