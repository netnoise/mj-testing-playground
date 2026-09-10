#!/usr/bin/env sh
# Exercises preflight-check.mjs (a standalone copy of patch-verify.sh's
# DISCLOSURE_FAIL preflight logic) against controlled fixtures - same
# discipline as harness-v42-landing's patch-verify-widen-citations.sh.
set -e
ROOT=$(git rev-parse --show-toplevel)
CHECK="$ROOT/.ai/run/harness-v43-critical/preflight-check.mjs"

fail=0; pass=0
check() {
  name=$1; expect=$2
  set +e
  (cd "$FIX" && LIB_ROOT="$ROOT" node "$CHECK" >/tmp/preflight-out.txt 2>&1)
  got=$?
  set -e
  if [ "$got" = "$expect" ]; then
    echo "ok   $name (exit $got)"; pass=$((pass+1))
  else
    echo "FAIL $name - expected $expect got $got"; cat /tmp/preflight-out.txt; fail=$((fail+1))
  fi
}

FIX=$(mktemp -d); cd "$FIX"; FIX=$(pwd -P)
git init -q; git config user.email t@t; git config user.name t
mkdir -p .ai/harness .ai/run
cp "$ROOT/.ai/harness/lib.mjs" .ai/harness/lib.mjs
echo '{}' > angular.json
node -e "console.log(JSON.stringify({patterns:['angular.json','jest.config.js']}))" > .ai/harness/gate-scope.json
git add -A && git commit -q -m init

check "no run, no diff -> passes" 0

BASE=$(git rev-parse HEAD)
mkdir -p .ai/run/r1
cat > .ai/run/r1/state.json <<STATE
{"status":"active","base_commit":"$BASE","dirty_at_start":[]}
STATE
check "active run, no diff -> passes" 0

echo '{"x":1}' > angular.json
check "active run, undisclosed diff -> fails" 1

echo "touched angular.json, door 7, see journal" > .ai/run/r1/door-crossings.md
check "active run, disclosed diff -> passes" 0

rm .ai/run/r1/door-crossings.md
git checkout -q -- angular.json
rm -rf .ai/run/r1
check "no run again, no diff -> passes" 0

echo '{"x":1}' > angular.json
git add -A && git commit -q -m "commit the drift (simulating a Bash bypass that got committed with no run open)"
check "no run, HEAD itself already has the drift -> passes (base=HEAD, nothing UNCOMMITTED)" 0

echo
if [ "$fail" -gt 0 ]; then echo "preflight-test: FAILED ($fail of $((pass+fail)))" >&2; exit 1; fi
echo "preflight-test: all $pass cases pass"
