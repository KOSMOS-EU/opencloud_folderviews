#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/DIST"

pnpm config set minimum-release-age 0
pnpm install
npx vite build --mode production
