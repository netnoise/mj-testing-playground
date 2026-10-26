#!/usr/bin/env sh
# Builds the baseline and the mutated tree, measures each with ack-state.mjs, reverts the patch, and writes
# ack-state.baseline.json and ack-state.mutated.json. Needs ports 4300 free and a clean src/.
set -eu
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
DIR=.ai/run/no-rollback-ack-finding/mutations
git diff --quiet HEAD -- src e2e || { echo "measure: src/ or e2e/ has uncommitted changes" >&2; exit 2; }
trap 'pkill -f "serve-dist.mjs 4300" 2>/dev/null || true' EXIT INT TERM

measure() {
  npm run build >/dev/null 2>&1
  (node e2e/serve-dist.mjs 4300 >/dev/null 2>&1 &)
  sleep 1
  node "$DIR/ack-state.mjs" http://localhost:4300 >"$DIR/ack-state.$1.json"
  pkill -f "serve-dist.mjs 4300"; sleep 0.5
}

measure baseline
git apply "$DIR/M4-no-rollback.patch"
measure mutated
git apply -R "$DIR/M4-no-rollback.patch"
git diff --quiet HEAD -- src e2e || { echo "measure: tree not restored" >&2; exit 2; }
