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
# usage: handoff.sh [run-slug]   (default: the one active run, via lib.mjs's
#                                  currentRun - falls back to the run with
#                                  the greatest started_at if none is active)
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

SLUG="${1:-}"
if [ -z "$SLUG" ]; then
  # docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md §1.5: "most recently
  # modified" (mtime) picked the wrong run whenever an old run's file was
  # edited while another run was active - exactly the shape that sent the
  # Stop hook's auto-handoff to a stale run during the harness-v42-landing
  # correction. lib.mjs's currentRun() is status-based, not mtime-based.
  SLUG=$(node .ai/harness/lib.mjs current-run 2>/dev/null || true)
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
  # Picked by the emit's own "at" field (real timestamp, docs/reviews/vibe-
  # harness-v4.3-delta-2026-09-10.md §1.4), not by file mtime - an emit
  # rewritten or copied by a later step would otherwise outrank a newer one
  # that simply wasn't touched again.
  LAST_EMIT=$(node -e "
    const fs=require('node:fs');
    const dir='.ai/run/$SLUG';
    let best=null, bestAt='';
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json') || f === 'state.json') continue;
      try {
        const e = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
        if (e.at && e.at > bestAt) { bestAt = e.at; best = dir + '/' + f; }
      } catch {}
    }
    if (best) console.log(best);
  " 2>/dev/null || true)
  if [ -n "$LAST_EMIT" ]; then cat "$LAST_EMIT"; else echo "(none with an \"at\" field - emit.sh hasn't been called since this fix, or not at all for this run)"; fi
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
