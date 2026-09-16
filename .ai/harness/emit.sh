#!/usr/bin/env sh
# Mechanical emit. Makes NO model call - same reason as handoff.sh: an emit
# that trusted the agent's own self-report would be exactly the "self-report
# is not evidence" failure this harness exists to avoid.
#
# docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md 1.4.1: every
# prompt's frontmatter has declared writes: [... <skill>.json] since Phase 0,
# and across every run this repo has ever had, not one has ever been written.
# The design page's structured-emit bus and spend ledger both assume this
# corpus exists; it doesn't, so nothing downstream of it can be built honestly
# before this script exists and is actually called.
#
# docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md §1.4: files_changed and
# spent.files now come from lib.mjs's runTouched (git diff from base_commit,
# run artifacts excluded), the same ruler budget.mjs enforces, not a raw
# `git diff --name-only HEAD` that resets on every WIP commit and counts a
# run's own paperwork against itself. "at" (an actual timestamp, not just an
# elapsed-minutes guess) and "base_commit" are new fields so ledger.sh can
# tell which emit in a run is newest and compute a real per-skill delta
# instead of summing whole-tree snapshots.
#
# usage: emit.sh <slug> <skill> [status]   (default status: ok)
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

SLUG="${1:?usage: emit.sh <slug> <skill> [status]}"
SKILL="${2:?usage: emit.sh <slug> <skill> [status]}"
STATUS="${3:-ok}"
RUN_DIR=".ai/run/$SLUG"
OUT="$RUN_DIR/$SKILL.json"
STATE="$RUN_DIR/state.json"
[ -d "$RUN_DIR" ] || { echo "emit: no such run: $RUN_DIR" >&2; exit 1; }

# artifacts: what this run has produced so far, as of this call - not scoped
# to this one skill (this script has no way to know which file belongs to
# which step), but real and git/filesystem-derived rather than self-reported.
ARTIFACTS=$(find "$RUN_DIR" -maxdepth 1 -type f \( -name '*.md' -o -name '*.json' \) \
  ! -name 'state.json' -exec basename {} \; 2>/dev/null | sort | sed 's/.*/"&"/' | paste -sd, -)

node -e "
const fs = require('node:fs');
(async () => {
  const lib = await import('$ROOT/.ai/harness/lib.mjs');
  const statePath = '$STATE';
  let state = {};
  try { state = JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch {}
  const touched = [...lib.runTouched(state)].sort();
  const startedAt = state.started_at;
  let min = null;
  if (startedAt) {
    const t = Date.parse(startedAt);
    if (!isNaN(t)) min = Math.round((Date.now() - t) / 60000);
  }
  const artifacts = '$ARTIFACTS' ? JSON.parse('[$ARTIFACTS]') : [];
  // spent.tok is deliberately absent - a token count can only come from the
  // agent's own self-report, which is exactly the kind of claim this
  // mechanical script exists to not need. Unchanged by this pass; see
  // docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md §3.
  const out = {
    skill: '$SKILL',
    status: '$STATUS',
    at: new Date().toISOString(),
    base_commit: state.base_commit ?? null,
    artifacts,
    files_changed: touched,
    spent: { min, files: touched.length },
  };
  fs.writeFileSync('$OUT', JSON.stringify(out, null, 2) + '\n');
})();
"

echo "emit: wrote $OUT"
