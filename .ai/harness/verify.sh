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
if [ -z "${CHROME_BIN:-}" ]; then
  for c in chromium chromium-browser google-chrome "Google Chrome"; do
    p=$(command -v "$c" 2>/dev/null) && { CHROME_BIN="$p"; export CHROME_BIN; break; }
  done
fi

echo "verify: tier=$TIER"
npm run lint
[ "$TIER" = "fast" ] && { echo "verify: OK (fast)"; exit 0; }

if [ -z "${CHROME_BIN:-}" ]; then
  echo "verify: PREFLIGHT FAIL - no Chrome for headless specs. Set CHROME_BIN." >&2
  exit 1
fi
npx ng test --watch=false --browsers=ChromeHeadless
[ "$TIER" = "full" ] && { echo "verify: OK (full)"; exit 0; }

npm run build
# Door 7 / vacuous-pass guard: deep must never read as runtime-verified.
echo "verify: RUNTIME: NOT CONFIGURED (unverified_at_runtime)" >&2
echo "verify: OK (deep, static only - nothing proved the app boots)"
