#!/usr/bin/env sh
# Applies each harmless-refactor patch, runs every layer and a layout snapshot against it, reverts,
# and records or checks the per-test outcome. Template: .ai/run/klaxon-heading-finding/mutations/replay.sh.
#   replay.sh --record   run baseline, R1, R2, R3; write results.tsv and output/*
#   replay.sh            run them and compare with results.tsv; EXIT 1 ON ANY DIFFERENCE
#   RESULTS=<file> replay.sh   compare against another file (the negative control)
# Layers run directly, not through `verify.sh deep`, which stops at the first failing tier.
set -u
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
DIR=.ai/run/klaxon-refactor-check/mutations
COLLECT=.ai/run/klaxon-heading-finding/mutations/collect.mjs
RESULTS=${RESULTS:-$DIR/results.tsv}
MODE=${1:-compare}
export HARNESS_DEEP=1

for port in 4200 4300; do
  lsof -nP -iTCP:$port -sTCP:LISTEN >/dev/null 2>&1 && { echo "replay: port $port is in use" >&2; exit 2; }
done
git diff --quiet HEAD -- src e2e || { echo "replay: src/ or e2e/ has uncommitted changes, refusing to run" >&2; exit 2; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"; pkill -f "serve-dist.mjs 4300" 2>/dev/null' EXIT INT TERM
OUT="$TMP/out.tsv"
: > "$OUT"

keep() { [ "$MODE" = "--record" ] && cp "$3" "$DIR/output/$1.$2.txt"; return 0; }
row() { printf '%s\t%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$4" "$([ "$5" -eq 0 ] && echo pass || echo fail)" >>"$OUT"; }

snapshot() {
  (node e2e/serve-dist.mjs 4300 >"$TMP/serve.txt" 2>&1 &)
  sleep 1
  node "$DIR/layout-snapshot.mjs" http://localhost:4300 >"$TMP/snap.json" 2>"$TMP/snap.err"
  pkill -f "serve-dist.mjs 4300"; sleep 0.5
}

run_cell() {
  cell=$1
  npm run lint >"$TMP/lint.txt" 2>&1; row "$cell" lint eslint - $?; keep "$cell" lint "$TMP/lint.txt"
  if npm run build >"$TMP/build.txt" 2>&1; then
    row "$cell" build ng - 0; keep "$cell" build "$TMP/build.txt"
    snapshot
    if [ "$cell" = baseline ]; then cp "$TMP/snap.json" "$TMP/baseline.snap.json"; fi
    cmp -s "$TMP/snap.json" "$TMP/baseline.snap.json"; row "$cell" layout snapshot - $?
    [ "$MODE" = "--record" ] && cp "$TMP/snap.json" "$DIR/output/$cell.snapshot.json"
  else
    row "$cell" build ng - 1; keep "$cell" build "$TMP/build.txt"
    echo "replay: $cell did not build; snapshot and e2e are skipped" >&2
  fi
  npx jest --ci --json --outputFile="$TMP/jest.json" >"$TMP/jest.txt" 2>&1
  keep "$cell" jest "$TMP/jest.txt"
  node "$COLLECT" jest "$TMP/jest.json" | while IFS=$(printf '\t') read -r file test status; do
    printf '%s\tjest\t%s\t%s\t%s\n' "$cell" "$file" "$test" "$status" >>"$OUT"
  done
  PLAYWRIGHT_JSON_OUTPUT_NAME="$TMP/pw.json" npx playwright test --reporter=list,json >"$TMP/pw.txt" 2>&1
  keep "$cell" e2e "$TMP/pw.txt"
  node "$COLLECT" pw "$TMP/pw.json" | while IFS=$(printf '\t') read -r file test status; do
    printf '%s\te2e\t%s\t%s\t%s\n' "$cell" "$file" "$test" "$status" >>"$OUT"
  done
}

run_cell baseline
for cell in R1-class-rename R2-selector-rename R3-signal-rename; do
  git apply "$DIR/$cell.patch" || { echo "replay: $cell.patch does not apply" >&2; exit 2; }
  # a control that silently did nothing reads as a pass (found in old-baseline-findings)
  git diff --stat -- src | grep -q . || { echo "replay: $cell applied but changed nothing" >&2; exit 2; }
  run_cell "$cell"
  git apply -R "$DIR/$cell.patch"
  git diff --quiet HEAD -- src e2e || { echo "replay: tree not restored after $cell" >&2; exit 2; }
done
sort -o "$OUT" "$OUT"

if [ "$MODE" = "--record" ]; then
  cp "$OUT" "$RESULTS"
  git diff --stat -- src e2e >"$DIR/restored-diffstat.txt"
  bash .ai/harness/verify.sh deep >"$DIR/output/restored.deep.txt" 2>&1
  echo "exit=$?" >>"$DIR/output/restored.deep.txt"
  echo "recorded $(wc -l <"$RESULTS" | tr -d ' ') rows to $RESULTS"
  exit 0
fi
if diff "$RESULTS" "$OUT"; then
  echo "replay: every outcome matches $RESULTS"
  exit 0
fi
echo "replay: outcomes differ from $RESULTS (diff above)" >&2
exit 1
