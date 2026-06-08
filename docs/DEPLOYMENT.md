# Offhours 배포 가이드

이 문서는 Offhours의 **실제 배포 형상**을 기준으로 작성되었습니다. 저장소에 이미 들어 있는 워크플로/Dockerfile/compose 설정을 그대로 따르고, 비어 있던 백엔드 호스팅 부분을 보강했습니다.

## 1. 아키텍처: 어떤 계층이 어디로 가는가

Offhours는 pnpm 모노레포로 구성된 풀스택 앱입니다.

| 계층                     | 패키지            | 런타임                     | 호스팅                                 | 트리거                                                  |
| ------------------------ | ----------------- | -------------------------- | -------------------------------------- | ------------------------------------------------------- |
| **Frontend (web)**       | `apps/web`        | Vite + React SPA (정적)    | **Vercel**                             | Vercel Git 연결(`main`) + `vercel.json`                 |
| **Backend (api)**        | `apps/api`        | NestJS 11 (Node 22)        | **Render** (Docker) — 또는 자체 호스트 | `.github/workflows/deploy-render-api.yml` + render.yaml |
| **Database**             | (관리형)          | PostgreSQL 16              | **Render PostgreSQL** (관리형 DB)      | render.yaml `databases:` 블록                           |
| **공유 패키지 (shared)** | `packages/shared` | Zod 스키마/타입 라이브러리 | 퍼블리시하지 않음(workspace link)      | 빌드 시 `shared → api → web` 위상 정렬                  |

> 정적 SPA(웹)와 API(서버)를 분리 배포합니다. 웹은 빌드 산출물을 CDN에 올리고, API는 컨테이너로 상시 구동하며, DB는 Render 관리형 Postgres를 사용합니다.

### 로컬 인프라: docker-compose

저장소 루트의 `docker-compose.yml`은 **로컬 개발용 인프라**(Postgres 16 + Redis 7)만 띄웁니다. api/web 컨테이너는 포함하지 않으므로, 로컬에서는 호스트에서 `pnpm dev`로 앱을 띄우고 compose는 DB만 제공합니다.

```bash
pnpm docker:up     # docker compose up -d --build  (postgres:5432, redis:6379)
pnpm dev           # web + api + shared watch (호스트에서 실행)
pnpm docker:down
```

---

## 2. 데이터베이스에 대한 중요 사실 (반드시 읽을 것)

런타임은 **Prisma 7 + `@prisma/adapter-pg` 드라이버 어댑터**(`apps/api/src/prisma/prisma.service.ts`)를 사용합니다. **진짜 PostgreSQL**입니다 — `DATABASE_URL`은 `postgresql://` URL이며, SQLite 형제 레포(PromptMarket/rotifolk)처럼 `file:` 경로로 강제되지 않습니다.

- **데이터는 영속적(durable)입니다.** 운영에서는 `render.yaml`이 프로비저닝하는 **Render 관리형 Postgres**에 저장되며, 영구 디스크 위 SQLite 파일이 아니라 관리형 DB이므로 배포·재시작에도 데이터가 보존됩니다. (JSON 파일 스토어나 SQLite 파일을 쓰지 않습니다.)
- `DATABASE_URL`은 대시보드에서 손으로 넣지 않습니다 — render.yaml의 `fromDatabase`가 관리형 DB의 connection string을 서비스에 자동 주입합니다.
- **스키마 동기화는 `prisma db push`로 합니다.** 이 저장소에는 **마이그레이션 히스토리가 없습니다**(`apps/api/prisma/migrations` 디렉토리 없음). 따라서 `prisma migrate deploy`가 아니라 `prisma db push`로 스키마를 DB에 반영합니다(멱등). 향후 `migrate deploy`로 전환하려면 먼저 마이그레이션 히스토리를 생성해야 합니다.

---

## 3. 프론트엔드 배포 (Vercel)

### 운영 배포 경로

형제 운영 프로젝트와 같이 **Vercel Git 연결**을 기본 production 배포 경로로 사용합니다. Vercel 프로젝트는 이 GitHub 저장소를 루트 디렉터리(`.`)로 연결하고, `main` 푸시를 production branch로 배포합니다.

루트 `vercel.json`이 Vercel 빌드 설정을 담당합니다.

- `installCommand`: `corepack enable && pnpm install --frozen-lockfile`
- `buildCommand`: `pnpm --filter @offhours/shared build && pnpm --filter @offhours/web build`
- `outputDirectory`: `apps/web/dist`
- `/api/*` rewrite: `https://offhours-api.onrender.com/api/*`

`.github/workflows/deploy-vercel-web.yml`은 선택적 CLI 배포 워크플로입니다. **`VERCEL_TOKEN` 시크릿이 없으면 자동으로 스킵**되므로, Vercel Git 연결만 쓰는 운영에서는 비워 둬도 workflow가 green으로 끝납니다.

### 필요한 GitHub Secret

| Secret         | 용도                          | 없을 때                    |
| -------------- | ----------------------------- | -------------------------- |
| `VERCEL_TOKEN` | 선택적 Vercel CLI 강제 배포용 | CLI 배포 workflow만 스킵됨 |

### Vercel 대시보드에서 직접 해야 하는 설정 (CI가 못 하는 부분)

1. Vercel 프로젝트를 생성하고 이 저장소를 연결합니다. 모노레포이므로 레포 루트에서 배포하고, 루트 `vercel.json`이 `pnpm --filter @offhours/shared build && pnpm --filter @offhours/web build`와 `apps/web/dist` 산출물을 지정합니다.
2. **환경 변수(웹)**: 기본적으로 `vercel.json`이 `VITE_API_URL=/api`와 `/api/*` → `https://offhours-api.onrender.com/api/*` rewrite를 설정합니다. Toss 공개 클라이언트 키 등 추가 웹 환경 변수가 생기면 Vercel Production 환경 변수로 설정하세요.
3. `Settings → Git`에서 Production Branch를 `main`으로 둡니다.
4. Vercel Git 연결을 주 배포 경로로 쓸 때는 GitHub `VERCEL_TOKEN` secret을 등록하지 않아도 됩니다. 등록하면 Actions CLI 배포와 Vercel Git 배포가 중복될 수 있습니다.

---

## 4. 백엔드 배포 (Render, Docker + 관리형 Postgres) — 이번에 보강한 부분

프론트엔드는 GitHub Action으로 배포되고 있었지만 **백엔드는 호스팅 프로바이더 설정과 배포 워크플로가 없었습니다.** 프론트의 "시크릿 없으면 스킵" 패턴을 그대로 백엔드에도 적용해 보강했습니다.

### 추가/변경한 파일

| 파일                                      | 역할                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `apps/api/Dockerfile`                     | 멀티스테이지 프로덕션 이미지(node:22-alpine, **non-root**, prod-only deps, `node dist/src/main.js`) |
| `.dockerignore`                           | 루트 Docker build context에서 `dist`/`node_modules`/`.env`/`*.tsbuildinfo` 제외 — `src`는 포함      |
| `vercel.json`                             | 루트 Vercel 배포 설정 — workspace install/build, `apps/web/dist` output, `/api/*` → Render rewrite  |
| `render.yaml`                             | Render Blueprint — Docker 웹 서비스 + 관리형 Postgres DB, `DATABASE_URL` 자동 주입, 헬스체크        |
| `.github/workflows/deploy-render-api.yml` | CI 성공 후(`workflow_run`) Render Deploy Hook 호출. `RENDER_DEPLOY_HOOK_URL` 시크릿 없으면 스킵     |

### 루트 `.dockerignore`의 `*.tsbuildinfo` 제외 (중요)

`render.yaml`은 `dockerContext: .`로 레포 루트에서 이미지를 빌드합니다. 따라서 Docker가 실제로 읽는 ignore 파일은 `apps/api/.dockerignore`가 아니라 **루트 `.dockerignore`** 입니다.

`apps/api`는 `incremental: true`라 `dist/tsconfig.tsbuildinfo`를 남깁니다. 이 파일이 빌드 컨텍스트로 들어가면 `nest build`가 "이미 최신"이라 판단해 **JS를 한 줄도 내보내지 않고**, 그 결과 `dist/src/main.js`가 없어 컨테이너가 부팅 직후 크래시합니다. 루트 `.dockerignore`가 `**/*.tsbuildinfo`를 제외해 매 빌드마다 깨끗하게 컴파일합니다. (반대로 `src`는 이미지 안에서 TypeScript를 컴파일해야 하므로 **포함**합니다.)

### 빌드/실행 방식

`apps/api/Dockerfile`(멀티스테이지)을 사용합니다.

- `node:22-alpine`, `pnpm install --frozen-lockfile`
- `pnpm --filter @offhours/shared build && pnpm --filter @offhours/api db:generate && pnpm --filter @offhours/api build`
- `pnpm --filter @offhours/api --prod --legacy deploy /app`로 **prod 의존성만** 가진 격리 런타임 생성, 생성된 Prisma client(`.prisma/client`)를 `/app`으로 복사
- **non-root**: 런타임 스테이지는 빌트인 `node` 유저로 실행(컨테이너 내 root 없음)
- 시작 명령: `/app/docker-entrypoint.sh`
- 외부 포트: Render는 `PORT` 환경변수(여기선 `10000`)로 트래픽을 라우팅하며, `main.ts`가 `process.env.PORT`를 읽어 바인딩합니다.

### 헬스체크

`render.yaml`의 `healthCheckPath`는 **`/api/health`** 입니다.

> 주의: `main.ts`는 현재 `/api` 전역 prefix를 적용하므로 health 라우트는 `/api/health` 계열로 노출됩니다 (`apps/api/src/common/health.controller.ts`, `GET /api/health`, `GET /api/health/ready`).

### 마이그레이션/스키마 동기화 (배포 시)

운영 이미지는 prod 의존성만 포함하므로 **Prisma CLI(devDependency)가 없습니다.** 따라서 `render.yaml`의 `preDeployCommand`에서 온디맨드로 CLI를 받아 스키마를 반영합니다(이미지에는 `apps/api/prisma`가 포함됨). **마이그레이션 히스토리가 없으므로 `db push`** 를 씁니다.

> 참고: Render의 무료 인스턴스(free plan)에서는 `preDeployCommand` 실행이 제한될 수 있습니다(현재 배포 로그에서 확인됨). 이 경우 배포 직후 `RENDER_DEPLOY_HOOK_URL`로만 자동 트리거되더라도 DB 동기화가 누락될 수 있으므로,
> **운영에서는 모니터링 로그를 확인해 DB 스키마 상태를 검증하고**, 필요 시 CI 또는 수동으로 `prisma db push`를 한 번 실행하세요.

현재 백엔드 컨테이너에는 런타임 폴백으로도 스키마 동기화가 들어있습니다. `apps/api/docker-entrypoint.sh`가 기동 시 `DATABASE_URL`이 존재하면 `npx -y prisma@7 db push --schema ./prisma/schema.prisma --skip-generate`를 실행합니다.

- 기본 동작: 기동 시 자동 `db push`
- 회피 플래그: `SKIP_DB_PUSH=1` (필요할 경우에만 사용)

```yaml
preDeployCommand: npx -y prisma@7 db push --schema ./prisma/schema.prisma --skip-generate
```

`db push`는 멱등이므로 매 배포마다 실행해도 안전합니다.

### 관리형 Postgres (DB)

```yaml
databases:
  - name: offhours-postgres
    databaseName: offhours
    user: offhours
    plan: basic-256mb
    postgresMajorVersion: '16'
```

`DATABASE_URL`은 `fromDatabase`로 이 DB의 connection string에서 자동 주입됩니다(대시보드 입력 불필요). 무료 DB 인스턴스는 시간 제한이 있어 영속 보존을 위해 `basic-256mb`(최소 유료 티어)를 사용합니다.

### 필요한 GitHub Secret

| Secret                   | 용도                                       | 없을 때        |
| ------------------------ | ------------------------------------------ | -------------- |
| `RENDER_DEPLOY_HOOK_URL` | Render 서비스의 Deploy Hook URL(curl 호출) | 배포 단계 스킵 |

### Render 대시보드에서 직접 해야 하는 설정 (CI가 못 하는 부분)

1. **New → Blueprint**로 이 저장소를 연결합니다. Render가 `render.yaml`을 읽어 웹 서비스 + 관리형 Postgres를 프로비저닝하고 `DATABASE_URL`을 연결합니다.
2. `sync: false`로 비워 둔 시크릿을 대시보드에서 입력합니다(아래 표).
   - `dev-secret-change-me` 류의 로컬 dev 값을 절대 재사용하지 말 것.
3. 서비스의 **Deploy Hook URL**을 복사해 GitHub `RENDER_DEPLOY_HOOK_URL` 시크릿에 저장하면 push-to-deploy가 연결됩니다. `render.yaml`은 형제 운영 프로젝트처럼 `autoDeploy: false`로 두어 GitHub Actions의 CI 통과 후 deploy hook만 배포를 트리거하게 합니다.

### 운영에 필요한 백엔드 환경 변수 요약

| 변수                  | 예시/기본값                         | 출처                             | 시크릿?        |
| --------------------- | ----------------------------------- | -------------------------------- | -------------- |
| `NODE_ENV`            | `production`                        | render.yaml                      | 아니오         |
| `PORT`                | `10000`                             | render.yaml (Render 라우팅 포트) | 아니오         |
| `DATABASE_URL`        | `postgresql://...` (자동)           | `fromDatabase` (관리형 DB)       | 아니오(자동)   |
| `JWT_SECRET`          | (대시보드에서 입력)                 | `sync: false`                    | **예**         |
| `JWT_REFRESH_SECRET`  | (대시보드에서 입력)                 | `sync: false`                    | **예**         |
| `JWT_ACCESS_TTL`      | `15m`                               | render.yaml                      | 아니오         |
| `JWT_REFRESH_TTL`     | `30d`                               | render.yaml                      | 아니오         |
| `APP_URL`             | `https://<web-domain>`              | `sync: false` (CORS origin)      | 값은 비밀 아님 |
| `API_URL`             | `https://offhours-api.onrender.com` | `sync: false`                    | 값은 비밀 아님 |
| `TOSS_CLIENT_KEY`     | (대시보드에서 입력)                 | `sync: false`                    | **예**         |
| `TOSS_SECRET_KEY`     | (대시보드에서 입력)                 | `sync: false`                    | **예**         |
| `TOSS_WEBHOOK_SECRET` | (대시보드에서 입력)                 | `sync: false`                    | **예**         |

> **CORS 주의**: `main.ts`의 `app.enableCors`는 `APP_URL`(콤마 아닌 단일 origin) + `http://localhost:5174`를 허용합니다. 운영에서는 `APP_URL`에 Vercel 웹 도메인을 넣으세요.

---

## 5. 미리보기 vs 운영 차이 한눈에

| 항목         | Preview                                    | Production                          |
| ------------ | ------------------------------------------ | ----------------------------------- |
| Web (Vercel) | Vercel Git 통합 시 PR마다 Preview URL      | `main` 푸시 → Vercel Git production |
| API (Render) | (선택) PR Preview Environments 활성화 가능 | CI 성공 후 → Deploy Hook            |
| 시크릿       | 프로바이더별 Preview 스코프 값 사용        | Production 스코프 값                |
| DB           | 별도 미리보기 DB 권장                      | 관리형 Postgres `offhours-postgres` |

---

## 6. 배포 전 점검 (게이트)

배포 전에 항상 저장소의 통합 게이트를 통과시킵니다.

```bash
pnpm run verify   # validate:architecture + format:check + lint + typecheck + test:run + build
```

CI에서도 `.github/workflows/ci.yml`이 `pnpm run verify`를 실행하며, `deploy-render-api.yml`은 **이 CI 워크플로가 성공해야(`workflow_run` conclusion == success)** 배포를 트리거합니다.

---

## 7. 수동 배포 치트시트

```bash
# 프론트엔드(로컬에서 강제 운영 배포 — 보통은 Vercel Git 연결 사용)
pnpm install --frozen-lockfile
pnpm --filter @offhours/shared build
vercel deploy --prod --token "$VERCEL_TOKEN"

# 백엔드(Render Deploy Hook 직접 호출)
curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"

# 백엔드 이미지 로컬 빌드/실행 (레포 루트에서)
docker build -f apps/api/Dockerfile -t offhours-api .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://offhours:offhours@host.docker.internal:5432/offhours?schema=public" \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e JWT_REFRESH_SECRET="$(openssl rand -hex 32)" \
  offhours-api

# 운영 스키마 동기화 (히스토리 없으므로 migrate가 아니라 push)
pnpm --filter @offhours/api db:push
```
