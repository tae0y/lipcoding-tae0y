#!/usr/bin/env bash
# 프론트(Vite) 빌드 → backend/static 으로 산출 → FastAPI가 단일 오리진으로 서빙.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> frontend: npm ci && npm run build"
cd "$ROOT/frontend"
if [ -d node_modules ]; then
  npm run build
else
  npm install && npm run build
fi

echo "==> built SPA -> backend/static"
ls -1 "$ROOT/backend/static" | head
