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
# usage: emit.sh <slug> <skill> [status]   (default status: ok)
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

SLUG="${1:?usage: emit.sh <slug> <skill> [status]}"
SKILL="${2:?usage: emit.sh <slug> <skill> [status]}"
STATUS="${3:-ok}"
RUN_DIR=".ai/run/$SLUG"
OUT="$RUN_DIR/$SKILL.json"
[ -d "$RUN_DIR" ] || { echo "emit: no such run: $RUN_DIR" >&2; exit 1; }

# artifacts: what this run has produced so far, as of this call - not scoped
# to this one skill (this script has no way to know which file belongs to
# which step), but real and git/filesystem-derived rather than self-reported.
ARTIFACTS=$(find "$RUN_DIR" -maxdepth 1 -type f \( -name '*.md' -o -name '*.json' \) \
  ! -name 'state.json' -exec basename {} \; 2>/dev/null | sort | sed 's/.*/"&"/' | paste -sd, -)

# files_changed: git as truth, same principle as budget.mjs's files_touched -
# a full snapshot of the working tree at call time, not a per-skill delta
# (this script can't know what changed since the *previous* emit without
# tracking state this run doesn't otherwise need).
CHANGED=$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null \
  | sort -u | sed 's/.*/"&"/' | paste -sd, -)

# spent.min: wall-clock since state.json's started_at, if readable. spent.tok
# is deliberately absent - a token count can only come from the agent's own
# self-report, which is exactly the kind of claim this mechanical script
# exists to not need. A field that can only be filled by trusting the thing
# being verified doesn't belong on a mechanical artifact.
MIN="null"
if [ -f "$RUN_DIR/state.json" ]; then
  STARTED=$(node -e "try{const s=require('node:fs').readFileSync('$RUN_DIR/state.json','utf8');console.log(JSON.parse(s).started_at||'')}catch{console.log('')}" 2>/dev/null || true)
  if [ -n "$STARTED" ]; then
    MIN=$(node -e "const t=Date.parse('$STARTED');console.log(isNaN(t)?'null':Math.round((Date.now()-t)/60000))" 2>/dev/null || echo null)
  fi
fi
FILES_COUNT=$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null | sort -u | wc -l | tr -d ' ')

cat > "$OUT" <<EOF
{
  "skill": "$SKILL",
  "status": "$STATUS",
  "artifacts": [$ARTIFACTS],
  "files_changed": [$CHANGED],
  "spent": {"min": $MIN, "files": $FILES_COUNT}
}
EOF

echo "emit: wrote $OUT"
