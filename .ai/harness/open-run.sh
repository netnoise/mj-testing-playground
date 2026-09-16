#!/usr/bin/env sh
# Mechanical run opener, matching close-run.sh. Stamps the fields the model
# cannot be trusted to type: started_at (the clock, not a guess formatted as
# ISO-8601), base_commit (the ruler every count in this run measures from),
# and dirty_at_start (pre-existing uncommitted work, so it isn't charged to
# this run). docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md §1.2.
#
# implement.md calls this (moved from understand.md in harness-v44-intake, so
# the clock starts when questions stop) instead of writing state.json's
# opening fields by hand. The hook still refuses any *edit* to an existing state.json (write-
# once, unchanged); this script refuses to *create* a second one for the
# same slug, so "the hook is state.json's sole writer" now also covers the
# open, not just every write after it.
#
# --type feature|refactor|redesign (default feature), stored as state.type.
# Inert for every existing reader (budget.mjs and lib.mjs use named field
# access; the hook's recordAndExit spreads state, so an unknown key survives
# every round-trip) and read directly from state.json by ledger.sh and by
# close-run.sh's refactor falsifier - not put in config.yml's flows, because
# ledger.sh infers a run's flow by matching emitted skill names against those
# lists, and refactor/redesign would run the identical skill set fix does:
# every run would silently resolve to whichever flow key appears first.
#
# usage: open-run.sh <slug> [--type feature|refactor|redesign] <max_files> <max_minutes> <allowed_path>...
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

USAGE='usage: open-run.sh <slug> [--type feature|refactor|redesign] <max_files> <max_minutes> <allowed_path>...'

SLUG="${1:?$USAGE}"
shift

# --type must be pulled out here, before max_files/max_minutes/allowed_paths
# are assigned from position - it can appear anywhere after the slug, and
# leaving it in the positional stream would either be swallowed into
# allowed_paths (silently misinterpreted as a glob) or shift every later
# argument by one.
TYPE="feature"
REST=""
while [ $# -gt 0 ]; do
  case "$1" in
    --type)
      TYPE="${2:?--type needs a value: feature, refactor or redesign}"
      case "$TYPE" in
        feature|refactor|redesign) ;;
        *) echo "open-run: --type must be feature, refactor or redesign, got: $TYPE" >&2; exit 1 ;;
      esac
      shift 2
      ;;
    *)
      # deliberate word-splitting: slugs and path globs in this repo never
      # contain spaces (verify.sh's check-citations invocation already relies
      # on the same property) - this restores the remaining positional
      # arguments with --type removed, regardless of where it appeared.
      REST="$REST $1"
      shift
      ;;
  esac
done
# set -f (noglob) around the reconstruction below: `set -- $REST` performs
# both word-splitting AND pathname expansion on an unquoted variable, and an
# allowed-path argument like `src/app/**` is a glob PATTERN meant for
# lib.mjs's hit() to match later, not something to expand against the
# filesystem right now. Without this, "src/app/**" silently became the list
# of files currently in that directory instead of staying a wildcard - caught
# live, not theoretical.
set -f
set -- $REST
set +f

MAXF="${1:?$USAGE}"
MAXM="${2:?$USAGE}"
shift 2
P=".ai/run/$SLUG/state.json"
[ -f "$P" ] && { echo "open-run: $P exists - a run opens once" >&2; exit 1; }
mkdir -p ".ai/run/$SLUG"

node --input-type=module - "$P" "$SLUG" "$MAXF" "$MAXM" "$TYPE" "$@" <<'EOF'
import { writeFileSync } from 'node:fs';
const [p, slug, maxf, maxm, type, ...allowed] = process.argv.slice(2);
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
      type, // feature | refactor | redesign - see this script's header
    },
    null,
    2
  ) + '\n'
);
EOF

echo "open-run: $SLUG active"
