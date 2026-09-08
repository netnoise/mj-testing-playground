#!/usr/bin/env sh
# The only gate contract. exit 0 = safe to hand back. Nothing else.
# usage: verify.sh [fast|full|deep]   (default: full)
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"
TIER="${1:-full}"

# --- preflight: fail loudly, never pass silently -------------------------
if [ ! -d node_modules ]; then
  echo "verify: PREFLIGHT FAIL - node_modules missing. Run 'npm ci' first." >&2
  exit 1
fi

echo "verify: tier=$TIER"
npm run lint
[ "$TIER" = "fast" ] && { echo "verify: OK (fast)"; exit 0; }

npx jest --ci
sh .ai/harness/hook-test.sh
[ "$TIER" = "full" ] && { echo "verify: OK (full)"; exit 0; }

npm run build
# deep is the real runtime oracle now: Playwright boots the app and drives it,
# so a green deep run means something actually executed - not just compiled.
npx playwright test
echo "verify: OK (deep, build + app driven end to end by Playwright)"
