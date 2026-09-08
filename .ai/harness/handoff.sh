#!/usr/bin/env sh
# Mechanical handoff. Makes NO model call - this is the path that still works
# when you have hit a usage limit and cannot ask anything to summarise.
#
# v4.2 remediation (docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md,
# workstream R3): the Stop hook fires this on every stop while a run is active,
# not only on a real interruption - the ui-shell-redesign retro recorded two
# auto-generated HANDOFF.mds noticed and deleted as noise mid-session. Deleting
# them is the wrong fix (it's the artifact this harness's own durability layer
# depends on); instead this file is now stamped so a mid-run snapshot can never
# be mistaken for a final state. See HARNESS.md: an auto-generated HANDOFF.md
# during an active run is expected and should never be deleted.
#
# usage: handoff.sh [run-slug]   (default: most recently modified run)
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

SLUG="${1:-}"
if [ -z "$SLUG" ]; then
  SLUG=$(ls -1t .ai/run 2>/dev/null | head -1)
fi
[ -n "$SLUG" ] && [ -d ".ai/run/$SLUG" ] || { echo "handoff: no run directory found" >&2; exit 1; }
OUT=".ai/run/$SLUG/HANDOFF.md"

STATUS=$(node -e "try{console.log(JSON.parse(require('node:fs').readFileSync('.ai/run/$SLUG/state.json','utf8')).status||'?')}catch{console.log('?')}" 2>/dev/null || echo '?')

{
  echo "# HANDOFF - $SLUG"
  echo "generated mechanically $(date -u '+%Y-%m-%dT%H:%M:%SZ') - no model call"
  if [ "$STATUS" = "active" ]; then
    echo
    echo "> **ACTIVE - mid-run snapshot, not a final state.** This run is still"
    echo "> in progress; the Stop hook wrote this automatically, it wasn't"
    echo "> requested. Expected during an active run - do not delete it, and"
    echo "> don't read it as evidence the run ended here."
  fi
  echo
  echo "## Goal"
  sed -n '1,2p' ".ai/run/$SLUG/brief.md" 2>/dev/null || echo "(no brief)"
  echo
  echo "## Journal tail"
  echo '```'
  tail -12 ".ai/run/$SLUG/journal.md" 2>/dev/null || echo "(no journal)"
  echo '```'
  echo
  echo "## Tree state (git is the truth, not any claim above)"
  echo '```'
  echo "branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null)  head: $(git rev-parse --short HEAD 2>/dev/null)"
  git status --short
  echo "--"
  git diff --stat HEAD
  echo '```'
  echo
  echo "## Last emit"
  echo '```'
  LAST_EMIT=$(ls -1t ".ai/run/$SLUG"/*.json 2>/dev/null | grep -v '/state\.json$' | head -1)
  if [ -n "$LAST_EMIT" ]; then cat "$LAST_EMIT"; else echo "(none - emit.sh has not been called for this run)"; fi
  echo '```'
  echo
  echo "## Resume"
  echo '```'
  echo "git checkout $(git rev-parse --abbrev-ref HEAD 2>/dev/null) && /resume $SLUG"
  echo '```'
  echo
  echo "> A clean exit is not evidence of work. Diff the tree before believing"
  echo "> anything the journal claims."
} > "$OUT"

echo "handoff: wrote $OUT"
