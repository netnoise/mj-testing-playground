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

# Undisclosed protected-path crossing check (v4.3, docs/reviews/vibe-harness-
# v4.3-delta-2026-09-10.md §1.1). The hook's own sweep only stops the NEXT
# Edit/Write after a Bash-mediated bypass - it can't undo one that already
# happened and was never followed by another guarded call before hand-back.
# This is the check that makes that shape unable to produce a green gate
# regardless: same protected-path list (gate-scope.json's "patterns", plus
# .ai/MODEL.md - the hook's PROTECTED_PATHS), same door-crossings.md
# disclosure rule, run BEFORE any tier so a crossing can never hide behind a
# passing lint/test/build.
#
# Base is the active run's base_commit when one exists (status: active,
# found the same way the hook finds it - NOT lib.mjs's currentRun(), which
# deliberately falls back to a DONE run for human-facing pickers below; a
# done run's door-crossings.md is not "the current run"), else HEAD.
DISCLOSURE_FAIL=$(node -e "
(async () => {
  const fs = require('node:fs');
  const { gateDiff } = await import('$ROOT/.ai/harness/lib.mjs');
  let patterns = [];
  try { patterns = JSON.parse(fs.readFileSync('.ai/harness/gate-scope.json', 'utf8')).patterns || []; } catch {}
  const protectedPaths = [...patterns, '.ai/MODEL.md'];

  let slug = null, state = {};
  const runsDir = '.ai/run';
  if (fs.existsSync(runsDir)) {
    for (const s of fs.readdirSync(runsDir)) {
      const p = runsDir + '/' + s + '/state.json';
      if (!fs.existsSync(p)) continue;
      try {
        const st = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (st.status === 'active') { slug = s; state = st; break; }
      } catch {}
    }
  }
  const crossed = gateDiff(protectedPaths, { ...state, slug }, process.cwd());
  if (crossed.length) {
    console.error('verify: PREFLIGHT FAIL - undisclosed protected-path crossing(s): ' + crossed.join(', '));
    if (slug) {
      console.error('verify: disclose in .ai/run/' + slug + '/door-crossings.md naming the file and why, or revert (git checkout -- <path>)');
    } else {
      console.error('verify: no active run to disclose into - revert (git checkout -- <path>), or open a run and disclose there');
    }
    process.exit(1);
  }
})();
" 2>&1) || { echo "$DISCLOSURE_FAIL" >&2; exit 1; }

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
# own definition the same way a brief does.
#
# digest.md and retro.md are both present-tense, both written as their run
# concludes, both describing what should currently be true - so both are gated.
# Checking only the digest meant a run that produced a retro and no digest got
# no citation checking at all: found live when the harness-v42-landing retro's
# own gate run printed "skipping, not a pass" and nothing was examined.
#
# The empty case stays non-fatal deliberately: the documented loop runs verify
# BEFORE digest, so at deep time a digest legitimately may not exist yet. It
# reports that nothing was checked rather than letting silence read as green.
#
# LATEST_RUN (v4.3): picked via lib.mjs's currentRun() - status-based, with a
# fallback to the greatest started_at - not "most recently modified" (ls
# -1t), which is the mechanism that pulled a two-day-old run into this gate
# when only its digest had been edited in place (docs/reviews/vibe-harness-
# v4.3-delta-2026-09-10.md §1.5).
LATEST_RUN=$(node .ai/harness/lib.mjs current-run 2>/dev/null || true)
CITE_DOCS=""
for f in digest.md retro.md; do
  # explicit if, not `[ -f x ] && VAR=y`: under set -e a false test as the last
  # command in a loop body aborts the script.
  if [ -f ".ai/run/$LATEST_RUN/$f" ]; then
    CITE_DOCS="$CITE_DOCS .ai/run/$LATEST_RUN/$f"
  fi
done
if [ -n "$CITE_DOCS" ]; then
  # deliberate word-splitting: run-directory paths contain no spaces
  sh .ai/harness/check-citations.sh $CITE_DOCS
else
  echo "verify: newest run (${LATEST_RUN:-none}) has no digest.md or retro.md - nothing checked, not a pass"
fi

echo "verify: OK (deep, build + full e2e suite driven end to end against the production build)"
