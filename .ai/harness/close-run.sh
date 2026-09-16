#!/usr/bin/env sh
# Mechanical run closer. No model call - the status transition is a fact,
# not a judgment. Exists because state.json's write-once guard
# (.claude/hooks/budget.mjs) correctly blocks every direct edit to an
# existing state.json, including the legitimate "mark this run done" case -
# without a sanctioned closer, every close would reach for HARNESS_DOOR_OPEN,
# which is exactly the routine-override pattern this run's own fix removes
# for the mid-run case. This script is invoked as a single Bash command
# (`sh .ai/harness/close-run.sh <slug> <status>`); the hook only scans the
# outer command text, so a wrapper script's internal write is not itself a
# gap the hook needs to special-case - it's the same shape handoff.sh
# already relies on to write HANDOFF.md from the Stop hook.
#
# It is also where disclosure is enforced. A run that widened its own blast
# radius or budget (revise-run.sh) or crossed door 7 has to name that in the
# digest - the one screen a human actually reads - and closing is the only
# moment where that is checkable: the digest exists by then (config.yml's flow
# puts digest before close) and there is exactly one run in question. The
# obvious alternative, a verify.sh preflight, fails on both counts - it runs
# before every tier including the mid-loop `fast` calls where no digest exists
# yet, and verify.sh is gate-scope, so it would cost a door-7 patch round to
# add a check that then fires at the wrong time.
#
# It is also where the refactor falsifier lives: a run opened with
# `open-run.sh --type refactor` claims its change is behaviour-preserving, and
# the mechanically checkable version of that claim is "no test file moved" -
# same "not gate-scope, and the whole run's diff only exists at the end"
# reasoning as the disclosure gate above. Gives door 4
# (test_deleted_or_weakened, config.yml:8) its first tooth: nothing anywhere
# else enforces it.
#
# usage: close-run.sh <slug> [done|dead] [--no-disclosure-check] [--skip-refactor-check]
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

USAGE='usage: close-run.sh <slug> [done|dead] [--no-disclosure-check] [--skip-refactor-check]'

SLUG="${1:?$USAGE}"
shift
STATUS="done"
case "${1:-}" in
  done|dead) STATUS="$1"; shift ;;
esac
CHECK=1
SKIP_REFACTOR=0
while [ $# -gt 0 ]; do
  case "$1" in
    --no-disclosure-check) CHECK=0; shift ;;
    --skip-refactor-check) SKIP_REFACTOR=1; shift ;;
    *) echo "close-run: unknown argument: $1" >&2; echo "$USAGE" >&2; exit 1 ;;
  esac
done

P=".ai/run/$SLUG/state.json"
[ -f "$P" ] || { echo "close-run: no such run: $P" >&2; exit 1; }

case "$STATUS" in
  done|dead) ;;
  *) echo "close-run: status must be done or dead, got: $STATUS" >&2; exit 1 ;;
esac

# Disclosure gate. `dead` runs are exempt: an abandoned run has nothing to
# disclose to anyone, and forcing a digest out of one is ceremony for its own
# sake.
if [ "$CHECK" = "1" ] && [ "$STATUS" = "done" ]; then
  D=".ai/run/$SLUG/digest.md"
  NEEDS=""
  node -e "
    const fs = require('node:fs');
    const s = JSON.parse(fs.readFileSync('$P', 'utf8'));
    process.exit((s.revisions ?? []).length > 0 ? 0 : 1);
  " 2>/dev/null && NEEDS="revision"
  [ -f ".ai/run/$SLUG/door-crossings.md" ] && NEEDS="${NEEDS:+$NEEDS and }door-7 crossing"

  if [ -n "$NEEDS" ]; then
    if [ ! -f "$D" ]; then
      echo "close-run: $SLUG recorded a $NEEDS but has no digest.md." >&2
      echo "close-run: run /digest first - an undisclosed widening is the thing this records against." >&2
      exit 1
    fi
    if ! grep -qi "widened\|revis\|door 7\|door-7\|HARNESS_DOOR_OPEN" "$D"; then
      echo "close-run: $SLUG recorded a $NEEDS and $D never mentions it." >&2
      echo "close-run: add the digest's 'What I widened or crossed' section (see .ai/prompts/digest.md)." >&2
      echo "close-run: deliberate exception? re-run with --no-disclosure-check." >&2
      exit 1
    fi
  fi
fi

# Refactor falsifier. A run opened with `open-run.sh --type refactor` claims
# its change is behaviour-preserving; the checkable version of that claim is
# "no test file moved". Two failure modes are treated as "can't tell" rather
# than "passes", because a rubber stamp is worse than no check: a spec file
# already dirty before this run opened (runTouched's dirty_at_start exclusion
# would hide it either way it went), and git itself not answering (runTouched
# swallows git errors as "nothing changed" - correct for budgets, where
# undercounting only makes a run look cheap; wrong for a falsifier, where the
# same silence would read as proof). `dead` runs are exempt for the same
# reason disclosure is: an abandoned run proved nothing to abandon.
if [ "$STATUS" = "done" ] && [ "$SKIP_REFACTOR" = "0" ]; then
  node --input-type=module -e "
    import { readFileSync } from 'node:fs';
    import { execSync } from 'node:child_process';
    const s = JSON.parse(readFileSync('$P', 'utf8'));
    if (s.type !== 'refactor') process.exit(0);

    let gitOk = true;
    try { execSync('git rev-parse --is-inside-work-tree', { cwd: '$ROOT', stdio: 'ignore' }); }
    catch { gitOk = false; }
    if (!gitOk) {
      console.error(\"close-run: git isn't answering - can't verify the refactor claim (no test moved) either way.\");
      console.error('close-run: fix git access, or re-run with --skip-refactor-check to close anyway (disclosed).');
      process.exit(1);
    }

    const { runTouched } = await import('$ROOT/.ai/harness/lib.mjs');
    const isSpec = (f) => /\.spec\.ts$/.test(f);

    const dirtySpecs = (s.dirty_at_start ?? []).filter(isSpec);
    if (dirtySpecs.length) {
      console.error(\`close-run: \${dirtySpecs.length} spec file(s) were already dirty before this run opened (\${dirtySpecs.join(', ')}) - can't tell whether this run touched them.\`);
      console.error('close-run: revert them to their committed state, or re-run with --skip-refactor-check to close anyway (disclosed).');
      process.exit(1);
    }

    const specTouched = [...runTouched(s)].filter(isSpec);
    if (specTouched.length) {
      console.error(\`close-run: \${'$SLUG'} is type:refactor but changed \${specTouched.length} test file(s): \${specTouched.join(', ')}\`);
      console.error('close-run: a behaviour-preserving change does not need a new or edited test. If this is real feature work, it is not a refactor.');
      console.error('close-run: revert the test file(s), or re-run with --skip-refactor-check to close anyway (disclosed).');
      process.exit(1);
    }
  "
fi

node -e "
const fs = require('node:fs');
(async () => {
  const p = '$P';
  const s = JSON.parse(fs.readFileSync(p, 'utf8'));
  s.status = '$STATUS';
  try {
    // Same ruler budget.mjs enforces (base_commit, run artifacts excluded) -
    // not a raw git diff --name-only HEAD, which is the ruler that let
    // files_touched read 5 against a real 30-file change (docs/reviews/
    // vibe-harness-v4.3-delta-2026-09-10.md §1.3).
    const { runTouched, gitHead } = await import('$ROOT/.ai/harness/lib.mjs');
    s.files_touched = [...runTouched(s)].sort();
    s.head_commit = gitHead();
  } catch { /* keep whatever files_touched already held */ }
  fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n');
})();
"
echo "close-run: $SLUG -> $STATUS"
