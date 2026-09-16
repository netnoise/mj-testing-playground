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

# Gate-scope decay check. .ai/harness/gate-scope.json's "missing" field
# (emitted by budget.mjs on every guarded tool call) lists a door-7 pattern
# that no longer resolves to anything - the Angular 9->14 retool proved this
# happens silently. Without this, a missing gate-scope path was only ever
# discovered as whatever confusing error the downstream tool produces (e.g.
# `ng lint` failing with "not available outside a workspace" when
# angular.json is gone) - found live, running the plan's own specified
# negative control for real rather than assuming it worked.
if [ -f .ai/harness/gate-scope.json ]; then
  MISSING=$(node -e "try{const m=JSON.parse(require('node:fs').readFileSync('.ai/harness/gate-scope.json','utf8')).missing||[];console.log(m.join(', '))}catch{}" 2>/dev/null || true)
  if [ -n "$MISSING" ]; then
    echo "verify: PREFLIGHT FAIL - gate-scope path(s) no longer resolve: $MISSING" >&2
    echo "verify: .claude/hooks/budget.mjs's GATE_SCOPE is stale - a human updates it (door 7)" >&2
    exit 1
  fi
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

# --- door-7 disclosure check (workstream R3) ------------------------------
# A crossing an agent logged to a run's door-crossings.md but whose digest
# never mentions the override is a disclosure gap - not silently missed, an
# override that leaves no trace anywhere is genuinely undetectable from git
# alone, so this checks the shape that IS checkable: a crossing that WAS
# recorded but didn't make it into the summary a human actually reads.
# A run with door-crossings.md but no digest yet (still active, or - see
# harness-v14-retool - predates this mechanism) warns, doesn't fail; only a
# digest that exists and omits the disclosure fails the gate.
disclosure_fail=0
for dc in .ai/run/*/door-crossings.md; do
  [ -f "$dc" ] || continue
  slug=$(basename "$(dirname "$dc")")
  digest=".ai/run/$slug/digest.md"
  if [ ! -f "$digest" ]; then
    echo "verify: WARN - $slug has door-crossings.md but no digest.md (active, or predates this check)"
    continue
  fi
  if ! grep -qi "HARNESS_DOOR_OPEN\|door 7\|door-7" "$digest"; then
    echo "verify: undisclosed door-7 crossing - $dc exists but $digest never mentions it" >&2
    disclosure_fail=1
  fi
done
if [ "$disclosure_fail" -eq 1 ]; then
  echo "verify: FAILED - undisclosed door-7 crossing(s), see above" >&2
  exit 1
fi

# --- citations, scoped to the current run's digest only (workstream R3) --
# check-citations.sh gates deep now that bare-path resolution and cite-base
# pinning exist - but only over the newest run's digest.md, not every
# brief.md or every decisions/ record. A brief legitimately cites a tree its
# own run then changes (ui-shell-redesign's brief: 7 correct BAD results for
# exactly this reason); gating that broadly would make deep permanently red.
# Decisions turned out to have the identical problem, found live building
# this check: decisions/0001 cites .ai/conventions.md, deleted on purpose by
# a *later* decision - HARNESS.md itself defines a decision record as "past
# tense, append-only", so checking one against the live tree contradicts its
# own definition the same way a brief does. Only a digest - present-tense,
# written at the moment its run concludes, describing what should currently
# be true - is safe to gate unconditionally.
LATEST_RUN=$(ls -1t .ai/run 2>/dev/null | head -1)
if [ -n "$LATEST_RUN" ] && [ -f ".ai/run/$LATEST_RUN/digest.md" ]; then
  sh .ai/harness/check-citations.sh ".ai/run/$LATEST_RUN/digest.md"
else
  echo "verify: no digest.md yet for the newest run - skipping, not a pass"
fi

echo "verify: OK (deep, build + full e2e suite driven end to end against the production build)"
