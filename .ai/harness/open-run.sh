#!/usr/bin/env sh
# Mechanical run opener, matching close-run.sh. Stamps the fields the model
# cannot be trusted to type: started_at (the clock, not a guess formatted as
# ISO-8601), base_commit (the ruler every count in this run measures from),
# and dirty_at_start (pre-existing uncommitted work, so it isn't charged to
# this run). docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md §1.2.
#
# understand.md calls this instead of writing state.json's opening fields by
# hand. The hook still refuses any *edit* to an existing state.json (write-
# once, unchanged); this script refuses to *create* a second one for the
# same slug, so "the hook is state.json's sole writer" now also covers the
# open, not just every write after it.
#
# usage: open-run.sh <slug> <max_files> <max_minutes> <allowed_path>...
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

SLUG="${1:?usage: open-run.sh <slug> <max_files> <max_minutes> <allowed_path>...}"
MAXF="${2:?usage: open-run.sh <slug> <max_files> <max_minutes> <allowed_path>...}"
MAXM="${3:?usage: open-run.sh <slug> <max_files> <max_minutes> <allowed_path>...}"
shift 3
P=".ai/run/$SLUG/state.json"
[ -f "$P" ] && { echo "open-run: $P exists - a run opens once" >&2; exit 1; }
mkdir -p ".ai/run/$SLUG"

node --input-type=module - "$P" "$SLUG" "$MAXF" "$MAXM" "$@" <<'EOF'
import { writeFileSync } from 'node:fs';
const [p, slug, maxf, maxm, ...allowed] = process.argv.slice(2);
const { runTouched, gitHead } = await import(process.cwd() + '/.ai/harness/lib.mjs');

const explicit = allowed.filter((a) => !a.includes('*'));
if (explicit.length > +maxf) {
  console.error(`open-run: ${explicit.length} explicit paths exceed max_files=${maxf} - sanity check only, the real budgeting question is per-run judgment`);
  process.exit(1);
}

const base = gitHead();
const dirty = [...runTouched({ base_commit: base, dirty_at_start: [] })].sort();

writeFileSync(
  p,
  JSON.stringify(
    {
      status: 'active',
      opened_by: 'open-run.sh',
      started_at: new Date().toISOString(), // the clock, not the model
      base_commit: base, // the ruler for every count this run makes (lib.mjs runTouched/gateDiff)
      dirty_at_start: dirty, // pre-existing, not this run's work
      allowed_paths: [...allowed, `.ai/run/${slug}/**`],
      max_files: +maxf,
      max_minutes: +maxm,
      files_touched: [],
    },
    null,
    2
  ) + '\n'
);
EOF

echo "open-run: $SLUG active"
