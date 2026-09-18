#!/usr/bin/env sh
# Applies each mutation patch, runs the named test layers against it, reverts, and records or
# checks the outcome per spec file. Leaves the tree as it found it.
#   replay.sh --record   run everything, write results.tsv and output/<cell>.<layer>.<spec>.txt
#   replay.sh            run everything, print each outcome next to the one in results.tsv
# e2e cells run `npm run build` then playwright directly, not `verify.sh deep`: deep runs lint and
# jest first and would stop before e2e for any mutation jest catches, hiding the e2e result.
set -u
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
DIR=.ai/run/old-baseline-findings/mutations
RESULTS="$DIR/results.tsv"
MODE=${1:-compare}
export HARNESS_DEEP=1

# A dirty tree would make the patches apply to something other than the recorded baseline.
git diff --quiet HEAD -- src e2e || { echo "replay: src/ or e2e/ has uncommitted changes, refusing to run" >&2; exit 2; }

JEST_SPECS="src/app/advanced-form/advanced-form.validators.spec.ts src/app/advanced-form/advanced-form.component.spec.ts"
E2E_SPECS="e2e/app.spec.ts e2e/smoke.spec.ts"
OUT=$(mktemp)

# emit <cell> <layer> <target> <exit> <logfile>
emit() {
  outcome=$([ "$4" -eq 0 ] && echo pass || echo fail)
  [ "$MODE" = "--record" ] && cp "$5" "$DIR/output/$1.$2.$(basename "$3").txt"
  printf '%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$outcome" >>"$OUT"
}

run_layers() {
  cell=$1
  case "$cell" in
    V*)
      for s in $JEST_SPECS; do
        npx jest "$s" --ci >"$OUT.log" 2>&1; emit "$cell" jest "$s" $? "$OUT.log"
      done ;;
  esac
  if npm run build >"$OUT.build" 2>&1; then
    for s in $E2E_SPECS; do
      npx playwright test "$s" --reporter=list >"$OUT.log" 2>&1; emit "$cell" e2e "$s" $? "$OUT.log"
    done
  else
    emit "$cell" e2e build 1 "$OUT.build"   # a mutation that breaks the build is an infrastructure result, not a catch
  fi
}

run_layers baseline
for cell in M1 M2 M3 V1 V2 V3 V4; do
  git apply "$DIR/$cell.patch" || { echo "replay: $cell.patch does not apply" >&2; exit 2; }
  run_layers "$cell"
  git apply -R "$DIR/$cell.patch"
  git diff --quiet HEAD -- src e2e || { echo "replay: tree not restored after $cell" >&2; exit 2; }
done

if [ "$MODE" = "--record" ]; then
  cp "$OUT" "$RESULTS"
  # the tree is clean again; prove the suite is green on it
  npm run build >/dev/null 2>&1 && npx playwright test --reporter=list >"$DIR/output/restored.e2e.txt" 2>&1; echo "exit=$?" >>"$DIR/output/restored.e2e.txt"
  git diff --stat -- src e2e >"$DIR/restored-diffstat.txt"
  echo "recorded $(wc -l <"$RESULTS") cells to $RESULTS"
else
  diff "$RESULTS" "$OUT" && echo "replay: every outcome matches results.tsv"
fi
rm -f "$OUT" "$OUT.log" "$OUT.build"
