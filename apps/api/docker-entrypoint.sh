#!/bin/sh
set -eu

SKIP_DB_PUSH=${SKIP_DB_PUSH:-0}
case "${SKIP_DB_PUSH}" in
  1|[Tt][Rr][Uu][Ee]|[Yy]|[Yy][Ee][Ss]|[Oo][Nn])
    SKIP_DB_PUSH=1
    ;;
  *)
    SKIP_DB_PUSH=0
    ;;
esac

if [ "${SKIP_DB_PUSH:-0}" != "1" ] && [ -n "${DATABASE_URL:-}" ] && [ -f "./prisma/schema.prisma" ]; then
  echo "[startup] Running prisma db push (skip-generate)"
  npx -y prisma@7 db push --schema ./prisma/schema.prisma --skip-generate
fi

exec node dist/src/main.js
