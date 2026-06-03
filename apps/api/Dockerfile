# syntax=docker/dockerfile:1
#
# Production image for the Offhours backend (@offhours/api — NestJS 11 + Prisma 7).
#
# This is the BACKEND counterpart to the existing frontend deploy
# (.github/workflows/deploy-vercel-web.yml ships apps/web to Vercel). The web
# SPA is hosted on Vercel; this image hosts the API and is what render.yaml /
# .github/workflows/deploy-render-api.yml deploy.
#
# DATABASE: real PostgreSQL via Prisma 7's @prisma/adapter-pg driver adapter
# (apps/api/src/prisma/prisma.service.ts). DATABASE_URL is a postgresql:// URL —
# in production it comes from the Render managed Postgres database (render.yaml),
# NOT a SQLite file on a disk. Schema is synced with `prisma db push` (this repo
# has no migration history) — see docs/DEPLOYMENT.md.
#
# Build from the REPO ROOT (the build context must be the monorepo root so the
# workspace + packages/shared are available):
#   docker build -f apps/api/Dockerfile -t offhours-api .
#   docker run -p 3000:3000 -e DATABASE_URL=postgresql://... -e JWT_SECRET=... offhours-api

# --------------------------------------------------------------------------
# 1. deps — install the full workspace (native modules need a build toolchain)
# --------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /repo
RUN corepack enable
# argon2 may compile from source on alpine/musl.
RUN apk add --no-cache python3 make g++ libc6-compat
# Workspace manifests + lockfile first (better layer caching).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
# `postinstall` builds @offhours/shared; provide its source so install succeeds.
COPY packages/shared packages/shared
RUN pnpm install --frozen-lockfile

# --------------------------------------------------------------------------
# 2. build — compile shared + api, generate Prisma client, prune to prod
# --------------------------------------------------------------------------
FROM deps AS build
WORKDIR /repo
COPY apps/api apps/api
# shared is already built by postinstall; rebuild to be safe, then api.
RUN pnpm --filter @offhours/shared build \
 && pnpm --filter @offhours/api db:generate \
 && pnpm --filter @offhours/api build
# `pnpm deploy` produces a self-contained, prod-only bundle at /app
# (node_modules with the compiled Prisma client + native argon2/pg).
# --legacy: @offhours/shared is a workspace dep consumed via its dist; pnpm 10+
# requires the legacy deploy path for workspace links.
RUN pnpm --filter @offhours/api --prod --legacy deploy /app
# The generated Prisma client (node_modules/.prisma/client) lives in the pnpm
# store after db:generate and is NOT carried into the pruned /app bundle by
# `pnpm deploy`. @prisma/client re-exports '.prisma/client', so copy the
# generated client next to the deployed @prisma/client in /app.
RUN GEN_SRC=$(node -e "const p=require.resolve('@prisma/client',{paths:['/repo/apps/api']});const m=p.match(/(.*\/node_modules)\/@prisma\/client/);process.stdout.write(m[1]+'/.prisma')") \
 && DEST=$(node -e "const p=require.resolve('@prisma/client',{paths:['/app']});const m=p.match(/(.*\/node_modules)\/@prisma\/client/);process.stdout.write(m[1]+'/.prisma')") \
 && echo "copying generated client: $GEN_SRC -> $DEST" \
 && rm -rf "$DEST" && cp -R "$GEN_SRC" "$DEST"

# --------------------------------------------------------------------------
# 3. runtime — minimal prod image, non-root
# --------------------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# libc6-compat: prebuilt native binaries (argon2/pg) expect glibc shims.
RUN apk add --no-cache libc6-compat
# Prod bundle: package.json, node_modules (incl. .prisma client), dist/, prisma/.
COPY --from=build /app ./
# Run as the built-in unprivileged `node` user (no root in the container).
RUN chown -R node:node /app
USER node
# main.ts reads process.env.PORT (default 3000) and binds the Nest server.
# Render injects PORT (render.yaml sets 10000); locally defaults to 3000.
ENV PORT=3000
EXPOSE 3000
# Entrypoint is dist/src/main.js (apps/api tsconfig: rootDir ./, include src).
# Schema sync (`prisma db push`) is run by render.yaml preDeployCommand / the
# manual deploy flow in docs/DEPLOYMENT.md — not baked here so the image stays a
# pure app server. main.ts binds the port from process.env.PORT.
CMD ["node", "dist/src/main.js"]
