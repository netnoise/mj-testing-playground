#!/usr/bin/env sh
# Applies the heading-demotion patch, runs every layer against it, reverts, and records or checks the
# per-test outcome.
#   replay.sh --record   run baseline and M1, write results.tsv and output/*
#   replay.sh            run baseline and M1, compare with results.tsv; EXIT 1 ON ANY DIFFERENCE
#   RESULTS=<file> replay.sh   compare against another file (used for the negative control)
# Layers run directly, not through `verify.sh deep`, because deep stops at its first failing tier
# and would hide every layer after the one that catches the mutation.
set -u
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
DIR=.ai/run/klaxon-heading-finding/mutations
RESULTS=${RESULTS:-$DIR/results.tsv}
MODE=${1:-compare}
export HARNESS_DEEP=1

lsof -nP -iTCP:4200 -sTCP:LISTEN >/dev/null 2>&1 && { echo "replay: port 4200 is in use; the e2e layer needs it free" >&2; exit 2; }
# A dirty tree would make the patch apply to something other than the recorded baseline.
git diff --quiet HEAD -- src e2e || { echo "replay: src/ or e2e/ has uncommitted changes, refusing to run" >&2; exit 2; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT INT TERM
OUT="$TMP/out.tsv"
: > "$OUT"

# record_output <cell> <layer> <file>: keeps the raw output only when recording
keep() { [ "$MODE" = "--record" ] && cp "$3" "$DIR/output/$1.$2.txt"; return 0; }
# status_row <cell> <layer> <file> <test> <exit>
status_row() { printf '%s\t%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$4" "$([ "$5" -eq 0 ] && echo pass || echo fail)" >>"$OUT"; }

run_cell() {
  cell=$1

  npm run lint >"$TMP/lint.txt" 2>&1; status_row "$cell" lint eslint - $?; keep "$cell" lint "$TMP/lint.txt"

  if npm run build >"$TMP/build.txt" 2>&1; then
    status_row "$cell" build ng - 0; keep "$cell" build "$TMP/build.txt"
  else
    status_row "$cell" build ng - 1; keep "$cell" build "$TMP/build.txt"
    echo "replay: $cell did not build; the e2e layer is skipped" >&2
  fi

  npx jest --ci --json --outputFile="$TMP/jest.json" >"$TMP/jest.txt" 2>&1
  keep "$cell" jest "$TMP/jest.txt"
  node "$DIR/collect.mjs" jest "$TMP/jest.json" | while IFS=$(printf '\t') read -r file test status; do
    printf '%s\tjest\t%s\t%s\t%s\n' "$cell" "$file" "$test" "$status" >>"$OUT"
  done

  PLAYWRIGHT_JSON_OUTPUT_NAME="$TMP/pw.json" npx playwright test --reporter=list,json >"$TMP/pw.txt" 2>&1
  keep "$cell" e2e "$TMP/pw.txt"
  node "$DIR/collect.mjs" pw "$TMP/pw.json" | while IFS=$(printf '\t') read -r file test status; do
    printf '%s\te2e\t%s\t%s\t%s\n' "$cell" "$file" "$test" "$status" >>"$OUT"
  done
}

run_cell baseline

git apply "$DIR/M1-heading-demotion.patch" || { echo "replay: the patch does not apply" >&2; exit 2; }
# A control that silently did nothing reads as a pass (found in old-baseline-findings): prove it took.
git diff --stat -- src | grep -q . || { echo "replay: the patch applied but changed nothing" >&2; exit 2; }
run_cell M1
git apply -R "$DIR/M1-heading-demotion.patch"
git diff --quiet HEAD -- src e2e || { echo "replay: tree not restored after M1" >&2; exit 2; }

sort -o "$OUT" "$OUT"

if [ "$MODE" = "--record" ]; then
  cp "$OUT" "$RESULTS"
  git diff --stat -- src e2e >"$DIR/restored-diffstat.txt"
  bash .ai/harness/verify.sh deep >"$DIR/output/restored.deep.txt" 2>&1
  echo "exit=$?" >>"$DIR/output/restored.deep.txt"
  echo "recorded $(wc -l <"$RESULTS" | tr -d ' ') cells to $RESULTS"
  exit 0
fi

if diff "$RESULTS" "$OUT"; then
  echo "replay: every outcome matches $RESULTS"
  exit 0
fi
echo "replay: outcomes differ from $RESULTS (diff above)" >&2
exit 1
