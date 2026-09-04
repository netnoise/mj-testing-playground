#!/usr/bin/env sh
# Mechanical handoff. Makes NO model call - this is the path that still works
# when you have hit a usage limit and cannot ask anything to summarise.
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

{
  echo "# HANDOFF - $SLUG"
  echo "generated mechanically $(date -u '+%Y-%m-%dT%H:%M:%SZ') - no model call"
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
  ls -1t ".ai/run/$SLUG"/*.json 2>/dev/null | head -1 | xargs cat 2>/dev/null || echo "(none)"
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
