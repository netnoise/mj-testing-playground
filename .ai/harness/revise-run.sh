#!/usr/bin/env sh
# Mechanical mid-run revision, matching open-run.sh and close-run.sh. Widens a
# run's allowed_paths or raises its budget, as a DISCLOSED event rather than a
# silent edit or a hard stop.
#
# Why this exists. The blast radius is enforced as a prediction (understand.md
# writes the paths it expects to touch; implement.md hardens them into a
# write-once allowlist) but it behaves as a hypothesis: a refactor discovers
# its true radius while working - the next caller, the next import, the next
# spec. Before this script the only sanctioned response to a block was "stop
# and say so" (implement.md), and every real run in this repo routed around it
# instead:
#
#   .ai/run/vehicle-selection/journal.md:9-13   "Fixed via shell anyway ...
#                                                logged as an explicit,
#                                                deliberate scope exception"
#   .ai/run/vehicle-selection/journal.md:19-21  "outside declared blast
#                                                radius, fixed via shell"
#   .ai/run/ui-shell-redesign/brief.md:132      a hand-written section titled
#                                               "Discovered mid-implementation,
#                                                added to blast radius"
#   .ai/run/ui-shell-redesign/journal.md        budget_spent fired at 60 min
#                                               with a one-line fix left ->
#                                               "extended max_minutes to 90
#                                                via shell"
#
# v4.3 closed those routes (state.json is single-writer). Closing the escape
# hatch without adding a sanctioned path means the next refactor hard-stops on
# normal discovery. This is the sanctioned path, and it borrows the pattern the
# harness already trusts: a door-7 crossing is not forbidden, it is disclosed -
# logged, named in the digest, and the gate refuses to pass if the digest never
# mentions it. Radius and budget now get identical treatment - enforced here by
# close-run.sh rather than verify.sh, because the digest does not exist yet at
# verify time (config.yml's flow runs verify before digest).
#
# THE CAP IS THE GUARD. Three revisions per run, then this refuses. Without a
# cap this deletes the guard rather than fixing it; with one, running out of
# revisions is the real signal that the brief's model of the system was wrong,
# which is exactly what blast_radius_exceeded was always trying to say.
#
# One owner per fact: the record lives in state.json's `revisions` array (read
# by close-run.sh's disclosure gate and by ledger.sh). journal.md gets a
# human-readable line because that is the run's narrative timeline, not a
# second copy of the record.
#
# WHY --reason-file EXISTS. The hook's remaining Bash check (budget.mjs:175-187)
# ANDs a write-verb pattern against a `.ai/run/<slug>/state.json` pattern over
# the whole command string, with no relation between them. So a --reason whose
# prose happens to mention a run's state.json AND contains a bare cp/mv/rm/>
# blocks this very command - the escape hatch refusing to open at exactly the
# moment the agent is explaining why it needs the hatch, with a message that
# reads as "you are cheating". Keep --reason short and path-free, or write the
# prose to a file first (the run directory is always writable) and pass
# --reason-file.
#
# usage:
#   revise-run.sh <slug> --add-path <glob> --reason <text>
#   revise-run.sh <slug> --extend files|minutes <n> --reason <text>
#   ... --reason-file <path>   # instead of --reason, for prose that needs it
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

USAGE='usage: revise-run.sh <slug> --add-path <glob> --reason <text>
       revise-run.sh <slug> --extend files|minutes <n> --reason <text>'

SLUG="${1:?$USAGE}"
shift

KIND=""
VALUE=""
REASON=""

while [ $# -gt 0 ]; do
  case "$1" in
    --add-path)
      [ -n "$KIND" ] && { echo "revise-run: one revision per call" >&2; exit 1; }
      KIND="path"
      VALUE="${2:?--add-path needs a glob}"
      shift 2
      ;;
    --extend)
      [ -n "$KIND" ] && { echo "revise-run: one revision per call" >&2; exit 1; }
      case "${2:-}" in
        files) KIND="files" ;;
        minutes) KIND="minutes" ;;
        *) echo "revise-run: --extend takes 'files' or 'minutes'" >&2; exit 1 ;;
      esac
      VALUE="${3:?--extend $2 needs a number}"
      shift 3
      ;;
    --reason)
      REASON="${2:?--reason needs text}"
      shift 2
      ;;
    --reason-file)
      RF="${2:?--reason-file needs a path}"
      [ -f "$RF" ] || { echo "revise-run: no such reason file: $RF" >&2; exit 1; }
      REASON=$(tr '\n' ' ' < "$RF" | sed 's/  */ /g; s/^ //; s/ $//')
      shift 2
      ;;
    *)
      echo "revise-run: unknown argument: $1" >&2
      echo "$USAGE" >&2
      exit 1
      ;;
  esac
done

[ -n "$KIND" ] || { echo "$USAGE" >&2; exit 1; }
# The reason is not optional. A revision with no stated reason is exactly the
# silent scope creep the allowlist exists to make visible.
[ -n "$REASON" ] || { echo "revise-run: --reason is required - a revision nobody can read is a silent expansion" >&2; exit 1; }

P=".ai/run/$SLUG/state.json"
[ -f "$P" ] || { echo "revise-run: no such run: $P" >&2; exit 1; }

node --input-type=module - "$P" "$SLUG" "$KIND" "$VALUE" "$REASON" <<'EOF'
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
const [p, slug, kind, value, reason] = process.argv.slice(2);

const MAX_REVISIONS = 3; // the cap is the guard - see this script's header

const s = JSON.parse(readFileSync(p, 'utf8'));

if (s.status !== 'active') {
  console.error(`revise-run: run ${slug} is '${s.status}', not active - nothing to revise`);
  process.exit(1);
}

const revisions = s.revisions ?? [];
if (revisions.length >= MAX_REVISIONS) {
  console.error(
    `revise-run: ${slug} has already used ${revisions.length}/${MAX_REVISIONS} revisions.\n` +
      `  That is the signal the brief's model of the system was wrong, not a number to raise.\n` +
      `  Stop, write the handoff, and say so in the digest.`
  );
  process.exit(2);
}

const at = new Date().toISOString();
let summary;

if (kind === 'path') {
  if ((s.allowed_paths ?? []).includes(value)) {
    console.error(`revise-run: ${value} is already in allowed_paths - nothing to do`);
    process.exit(1);
  }
  s.allowed_paths = [...(s.allowed_paths ?? []), value];
  summary = `+path ${value}`;
} else {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    console.error(`revise-run: --extend needs a positive number, got: ${value}`);
    process.exit(1);
  }
  const field = kind === 'files' ? 'max_files' : 'max_minutes';
  const before = s[field];
  if (n <= before) {
    console.error(`revise-run: ${field} is already ${before}; ${n} is not an extension`);
    process.exit(1);
  }
  s[field] = n;
  summary = `${field} ${before} -> ${n}`;
}

s.revisions = [...revisions, { at, kind, value, reason }];
writeFileSync(p, JSON.stringify(s, null, 2) + '\n');

// The journal is the run's narrative timeline, so the revision appears where a
// reader is already looking. The record itself stays in state.json (one owner).
const stamp = at.slice(11, 16);
appendFileSync(
  `.ai/run/${slug}/journal.md`,
  `${stamp} revise     ! ${summary} (${s.revisions.length}/${MAX_REVISIONS}) - ${reason}\n`
);

console.log(`revise-run: ${slug} ${summary} [${s.revisions.length}/${MAX_REVISIONS}] - ${reason}`);
console.log(`revise-run: name this in the digest - close-run.sh refuses to close the run if you don't`);
EOF
