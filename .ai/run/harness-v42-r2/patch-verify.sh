#!/usr/bin/env sh
# The only gate contract. exit 0 = safe to hand back. Nothing else.
# usage: verify.sh [fast|full|smoke|deep]   (default: full)
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
# smoke/deep both drive the PRODUCTION build (dist/), not `ng serve` -
# HARNESS_DEEP points playwright.config.ts's webServer at e2e/serve-dist.mjs
# and disables server reuse, so a green run here means what `npm run build`
# produced actually executed in a real browser, not a dev server of
# possibly unknown provenance.
# docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md 1.2.
export HARNESS_DEEP=1

# smoke is the generic runtime oracle: every route mounts, no uncaught
# error, no console error, non-empty root, no horizontal overflow. It
# breaks only when the app is actually broken, which is what makes it
# cheap enough to sit inside the fix loop (see implement.md) rather than
# only at hand-back.
npx playwright test e2e/smoke.spec.ts --reporter=line
[ "$TIER" = "smoke" ] && { echo "verify: OK (smoke, build + generic runtime oracle)"; exit 0; }

# deep adds the feature-driving spec (app.spec.ts): a real acceptance test,
# and a much narrower regression net than smoke - see HARNESS.md's tier
# table for why the two are kept separate.
npx playwright test --reporter=line
echo "verify: OK (deep, build + full e2e suite driven end to end against the production build)"
