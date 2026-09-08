#!/usr/bin/env sh
# Asserts the PreToolUse hook (.claude/hooks/budget.mjs) actually fires and
# blocks/allows what it claims to. Written because nothing did this before -
# docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md open question 3:
# "is the hooks-fired assertion checking that the hook fired, or that it
# blocked correctly?" Answer, until this script existed: neither existed.
#
# Cases run with no active run present, then a second group with a
# controlled state.json, so blast-radius cases aren't accidentally shadowed
# by whatever run happens to be active on disk.
#
# usage: hook-test.sh
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"
HOOK="node .claude/hooks/budget.mjs"

fail=0
pass=0

# case <name> <expect_exit> <json-payload> [env-prefix]
case_() {
  name=$1; expect=$2; payload=$3; envp=$4
  # set +e inside the substitution: under set -e, the eval's nonzero exit
  # (the whole point of most of these cases) would otherwise abort this
  # subshell before `echo $?` runs, leaving $got empty every time.
  got=$(set +e; printf '%s' "$payload" | eval "$envp$HOOK" >/dev/null 2>&1; echo $?)
  if [ "$got" = "$expect" ]; then
    echo "ok   $name (exit $got)"
    pass=$((pass + 1))
  else
    echo "FAIL $name - expected exit $expect, got $got"
    fail=$((fail + 1))
  fi
}

RUNS_DIR="$ROOT/.ai/run"
STASH="$ROOT/.hook-test-stash"
mkdir -p "$STASH"
moved=""
if [ -d "$RUNS_DIR" ]; then
  for d in "$RUNS_DIR"/*/; do
    [ -f "${d}state.json" ] || continue
    if grep -q '"status": *"active"' "${d}state.json" 2>/dev/null; then
      slug=$(basename "$d")
      mv "${d}state.json" "$STASH/$slug.state.json"
      moved="$moved $slug"
    fi
  done
fi
restore() {
  for slug in $moved; do
    [ -f "$STASH/$slug.state.json" ] && mv "$STASH/$slug.state.json" "$RUNS_DIR/$slug/state.json"
  done
  rmdir "$STASH" 2>/dev/null || true
}
trap restore EXIT INT TERM

# --- no active run ---------------------------------------------------------
case_ "gate-scope Edit blocked (door 7)" 2 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$ROOT/angular.json\"}}"

case_ "gate-scope Edit + HARNESS_DOOR_OPEN passes" 0 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$ROOT/angular.json\"}}" \
  "HARNESS_DOOR_OPEN=1 "

case_ "MODEL.md Edit blocked" 2 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$ROOT/.ai/MODEL.md\"}}"

case_ "ordinary src file, no run, passes" 0 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$ROOT/src/app/app.component.ts\"}}"

case_ "Bash sed -i on jest.config.js blocked" 2 \
  "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"sed -i '' 's/x/y/' jest.config.js\"}}"

case_ "Bash cat (read) on jest.config.js passes" 0 \
  "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"cat jest.config.js\"}}"

case_ "Bash rm of a state.json blocked" 2 \
  "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"rm .ai/run/some-slug/state.json\"}}"

case_ "Bash npm test passes (no blast-radius on Bash by design)" 0 \
  "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"npm test\"}}"

# --- with a controlled active run -------------------------------------------
# max_files is sized against the *live* git diff count, not a fixed small
# number: files_touched is now git-derived (this run's own R1 change), so a
# fixture assuming isolation from the real working tree would be wrong by
# construction - the in-radius case below must stay well under the budget
# regardless of how much this session has already touched.
TESTRUN="$ROOT/.ai/run/hook-test-fixture"
mkdir -p "$TESTRUN"
LIVE_TOUCHED=$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null | sort -u | wc -l | tr -d ' ')
FIXTURE_MAX=$((LIVE_TOUCHED + 5))
cat > "$TESTRUN/state.json" <<EOF
{"status":"active","allowed_paths":["src/app/vehicle/**"],"max_files":$FIXTURE_MAX,
 "max_minutes":45,"files_touched":[],"started_at":"$(date -u '+%Y-%m-%dT%H:%M:%SZ')"}
EOF

case_ "out-of-radius path blocked" 2 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$ROOT/src/app/app.component.ts\"}}"

case_ "in-radius path passes" 0 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$ROOT/src/app/vehicle/x.ts\"}}"

case_ "active run's own directory always passes (not in allowed_paths)" 0 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$ROOT/.ai/run/hook-test-fixture/journal.md\"}}"

case_ "editing an existing state.json directly is blocked" 2 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$ROOT/.ai/run/hook-test-fixture/state.json\"}}"

rm -rf "$TESTRUN"

# Deterministic budget_spent: max_files set to exactly the live count, so a
# brand-new file (not already in the diff) has zero headroom and must block.
TESTRUN2="$ROOT/.ai/run/hook-test-fixture-2"
mkdir -p "$TESTRUN2"
cat > "$TESTRUN2/state.json" <<EOF
{"status":"active","allowed_paths":["src/app/vehicle/**"],"max_files":$LIVE_TOUCHED,
 "max_minutes":45,"files_touched":[],"started_at":"$(date -u '+%Y-%m-%dT%H:%M:%SZ')"}
EOF
case_ "budget_spent fires with zero headroom on a new file" 2 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$ROOT/src/app/vehicle/brand-new-file-not-in-diff.ts\"}}"
rm -rf "$TESTRUN2"

# --- negative control: prove the assertions aren't vacuous -----------------
# Runs against a PATCHED COPY of the hook with the dir/** blast-radius branch
# disabled, and confirms an in-radius edit then wrongly blocks - i.e. this
# suite can actually go red for a real regression, not just print green
# forever. Never touches the real budget.mjs.
BROKEN_HOOK="$ROOT/.hook-test-broken.mjs"
sed "s/pat.endsWith('\/\*\*')/false \&\& pat.endsWith('\/\*\*')/" "$ROOT/.claude/hooks/budget.mjs" > "$BROKEN_HOOK"
TESTRUN3="$ROOT/.ai/run/hook-test-fixture-3"
mkdir -p "$TESTRUN3"
cat > "$TESTRUN3/state.json" <<EOF
{"status":"active","allowed_paths":["src/app/vehicle/**"],"max_files":$((LIVE_TOUCHED + 5)),
 "max_minutes":45,"files_touched":[],"started_at":"$(date -u '+%Y-%m-%dT%H:%M:%SZ')"}
EOF
neg_got=$(set +e; printf '%s' "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$ROOT/src/app/vehicle/deeply/nested/x.ts\"}}" | node "$BROKEN_HOOK" >/dev/null 2>&1; echo $?)
rm -rf "$TESTRUN3" "$BROKEN_HOOK"
if [ "$neg_got" = "2" ]; then
  echo "ok   negative control: breaking dir/** makes an in-radius edit wrongly block (suite can go red)"
  pass=$((pass + 1))
else
  echo "FAIL negative control: breaking dir/** did not change behavior - blast radius is not really being checked"
  fail=$((fail + 1))
fi

echo
if [ "$fail" -gt 0 ]; then
  echo "hook-test: FAILED ($fail of $((pass + fail)))" >&2
  exit 1
fi
echo "hook-test: all $pass cases pass"
