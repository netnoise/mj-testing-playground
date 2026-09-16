#!/usr/bin/env sh
# Asserts the PreToolUse hook (.claude/hooks/budget.mjs) actually fires and
# blocks/allows what it claims to. Written because nothing did this before -
# docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md open question 3:
# "is the hooks-fired assertion checking that the hook fired, or that it
# blocked correctly?" Answer, until this script existed: neither existed.
#
# v4.3 (docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md §1.6): every case
# now runs inside a fresh `mktemp -d` git repo, never the live `.ai/run`. The
# old version stashed the live active run's state.json with a `trap ... EXIT
# INT TERM` restore - SIGKILL can't be trapped, so a `verify.sh full` killed
# mid-test (a usage limit, a killed container - exactly the scenario the
# durability design plans for) left the live run with no state.json, and the
# hook then failed open for the rest of the run with nothing to repair it.
# This version can't do that: it never touches anything outside its own
# mktemp directory. The LIVE_TOUCHED budget-sizing workaround is gone too -
# it existed only because the old fixtures shared a working tree with the
# real session; a repo of one file has no ambient diff to size around.
#
# usage: hook-test.sh [hook-path]   (default: .claude/hooks/budget.mjs)
#   hook-path lets a PROPOSED hook (not yet applied - door 7) be tested
#   before a human applies it, same fixture repo either way.
set -e
# git rev-parse, not dirname "$0"/../.. - this script needs to work both at
# its eventual home (.ai/harness/hook-test.sh, two levels deep) and staged
# inside a run directory for pre-application testing (three levels deep,
# the exact trap .ai/run/harness-v42-landing/HANDOFF.md's "Traps" section
# names: "a copy staged three levels deep resolves the wrong root").
ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
HOOK_SRC="${1:-$ROOT/.claude/hooks/budget.mjs}"
[ -f "$HOOK_SRC" ] || { echo "hook-test: no such hook file: $HOOK_SRC" >&2; exit 1; }
case "$HOOK_SRC" in
  /*) : ;;
  *) HOOK_SRC="$(pwd)/$HOOK_SRC" ;;
esac

fail=0
pass=0

# --- fixture repo: one file, one commit, nothing shared with the live tree -
FIX=$(mktemp -d)
cd "$FIX"
# pwd -P, not the raw mktemp path: on macOS /var is a symlink to /private/var,
# and node's process.cwd() returns the resolved path after chdir - a fixture
# path built from the unresolved mktemp string never matches ROOT inside the
# hook, so every rel = file.startsWith(ROOT) ? ... check silently takes the
# "no match" branch and nothing ever blocks. Found live building this test.
FIX=$(pwd -P)
git init -q
git config user.email hook-test@local
git config user.name hook-test
mkdir -p .ai/harness .ai/run .claude/hooks
cp "$ROOT/.ai/harness/lib.mjs" .ai/harness/lib.mjs
cp "$HOOK_SRC" .claude/hooks/budget.mjs
echo '{}' > angular.json
echo 'x' > jest.config.js
mkdir -p src/app
echo 'export const x = 1;' > src/app/app.component.ts
git add -A
git commit -q -m init
HOOK="node $FIX/.claude/hooks/budget.mjs"

case_() {
  name=$1; expect=$2; payload=$3; envp=$4
  # set +e inside the substitution: under set -e, the eval's nonzero exit
  # (the whole point of most of these cases) would otherwise abort this
  # subshell before `echo $?` runs, leaving $got empty every time.
  got=$(cd "$FIX" && set +e; printf '%s' "$payload" | eval "$envp$HOOK" >/dev/null 2>&1; echo $?)
  if [ "$got" = "$expect" ]; then
    echo "ok   $name (exit $got)"
    pass=$((pass + 1))
  else
    echo "FAIL $name - expected exit $expect, got $got"
    fail=$((fail + 1))
  fi
}

# --- no active run -----------------------------------------------------------
case_ "gate-scope Edit blocked (door 7)" 2 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/angular.json\"}}"

case_ "gate-scope Edit + HARNESS_DOOR_OPEN passes" 0 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/angular.json\"}}" \
  "HARNESS_DOOR_OPEN=1 "

case_ "ordinary src file, no run, passes" 0 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/src/app/app.component.ts\"}}"

case_ "Bash sed -i on jest.config.js NOT blocked by the Bash branch itself" 0 \
  "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"sed -i '' 's/x/y/' jest.config.js\"}}"

case_ "Bash cat (read) on jest.config.js passes" 0 \
  "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"cat jest.config.js\"}}"

case_ "Bash rm of a state.json blocked" 2 \
  "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"rm .ai/run/some-slug/state.json\"}}"

case_ "Bash npm test passes (no blast-radius on Bash by design)" 0 \
  "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"npm test\"}}"

echo "ok   [KNOWN GAP] Bash writing state.json via a non-listed verb (node -e) is not blocked - documented, not fixed by this patch:"
case_ "  node -e writeFileSync on a run's state.json" 0 \
  "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"node -e \\\"require('fs').writeFileSync('.ai/run/x/state.json','{}')\\\"\"}}"

echo "ok   [FIXED] previously-allowed Bash bypasses of gate-scope files (delta table, §1.1):"
for cmd in \
  "node -e \"require('fs').writeFileSync('jest.config.js','x')\"" \
  "python3 -c \"open('angular.json','w')\"" \
  "npx prettier --write angular.json" \
  ; do
  case_ "  bash bypass no longer matters at the Bash-check stage (still passes there; caught below by the sweep instead)" 0 \
    "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"$cmd\"}}"
done

# --- with a controlled active run, isolated from any live session ---------
mkdir -p .ai/run/myrun
cat > .ai/run/myrun/state.json <<STATE
{"status":"active","opened_by":"open-run.sh","started_at":"$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
 "base_commit":"$(cd "$FIX" && git rev-parse HEAD)","dirty_at_start":[],
 "allowed_paths":["src/app/vehicle/**"],"max_files":30,"max_minutes":45,"files_touched":[]}
STATE

case_ "out-of-radius path blocked" 2 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/src/app/app.component.ts\"}}"

case_ "in-radius path passes" 0 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/src/app/vehicle/x.ts\"}}"

case_ "active run's own directory always passes (not in allowed_paths)" 0 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/.ai/run/myrun/journal.md\"}}"

case_ "editing an existing state.json directly is blocked" 2 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/.ai/run/myrun/state.json\"}}"

rm -rf .ai/run/myrun

# --- budget survives a WIP commit (the actual bug, delta §1.3) -------------
# Old ruler: git diff --name-only HEAD - resets to ~0 on every commit, so a
# run following the harness's own "commit WIP on green" rule could never hit
# budget_spent. New ruler: diff from base_commit, doesn't move. This is the
# one case in the whole suite that is EXPECTED TO FAIL against the unpatched
# live hook and PASS against the proposed one - run it against both when
# comparing, not just the target.
mkdir -p .ai/run/budgetrun src/app/vehicle
BASE=$(cd "$FIX" && git rev-parse HEAD)
cat > .ai/run/budgetrun/state.json <<STATE
{"status":"active","opened_by":"open-run.sh","started_at":"$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
 "base_commit":"$BASE","dirty_at_start":[],
 "allowed_paths":["src/app/vehicle/**"],"max_files":1,"max_minutes":45,"files_touched":[]}
STATE
echo "x" > src/app/vehicle/already-touched.ts
(cd "$FIX" && git add -A && git commit -q -m "WIP: simulate a green-step commit mid-run")

case_ "budget_spent still fires after a WIP commit (base_commit ruler)" 2 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/src/app/vehicle/brand-new-file.ts\"}}"

rm -rf .ai/run/budgetrun

# --- protected-diff sweep: catches a Bash-mediated bypass on the NEXT call -
mkdir -p .ai/run/sweeprun
SWEEP_BASE=$(cd "$FIX" && git rev-parse HEAD)
cat > .ai/run/sweeprun/state.json <<STATE
{"status":"active","opened_by":"open-run.sh","started_at":"$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
 "base_commit":"$SWEEP_BASE","dirty_at_start":[],
 "allowed_paths":["src/**"],"max_files":30,"max_minutes":45,"files_touched":[]}
STATE

# Simulate the effect of an allowed-at-the-Bash-check bypass command by
# actually mutating the tracked gate-scope file, uncommitted - this is
# exactly the tree state `python3 -c "open('angular.json','w')"` would leave.
echo '{"changed": true}' > angular.json

case_ "sweep blocks an unrelated Edit once an undisclosed gate-scope diff exists" 2 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/src/app/app.component.ts\"}}"

case_ "sweep does NOT block edits inside the active run's own directory" 0 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/.ai/run/sweeprun/journal.md\"}}"

echo "This run edited angular.json via Bash. See ${FIX}. door-7." > .ai/run/sweeprun/door-crossings.md

case_ "disclosing in door-crossings.md un-blocks the sweep" 0 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/src/app/app.component.ts\"}}"

(cd "$FIX" && git checkout -q -- angular.json)
rm -f .ai/run/sweeprun/door-crossings.md

case_ "reverting the file (git checkout) also un-blocks the sweep" 0 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/src/app/app.component.ts\"}}"

rm -rf .ai/run/sweeprun

# No active run: the sweep is scoped OUT deliberately (nowhere to disclose
# into) - documented gap, not a regression. Confirms the hook's own Scope
# note in its header matches actual behaviour.
echo '{"changed": true}' > angular.json
case_ "[KNOWN GAP, by design] no active run: an undisclosed gate-scope diff does not block other edits" 0 \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/src/app/app.component.ts\"}}"
(cd "$FIX" && git checkout -q -- angular.json)

# --- negative controls: prove the assertions aren't vacuous -----------------
# Each patches a file IN PLACE inside the fixture (never the real source
# under test), runs the case, then restores the original bytes - not a
# separately-located copy, because both the hook and lib.mjs resolve their
# counterpart by a RELATIVE import path (budget.mjs -> ../../.ai/harness/
# lib.mjs), so a broken copy dropped at the wrong depth just fails to import
# instead of exercising the intended broken branch. Confirms the suite can
# actually go red for a real regression, not just print green forever.
neg_case() {
  # expect_broken: the exit code this payload SHOULD flip to once the
  # mechanism is neutered - 2 when breaking it makes something wrongly
  # block (the blast-radius case), 0 when breaking it makes something that
  # should block wrongly pass through (the sweep case). Different bugs flip
  # the outcome in different directions; a single hard-coded expectation
  # silently "passed" the sweep's own negative control for the wrong reason.
  label=$1; target=$2; sed_expr=$3; payload=$4; expect_broken=$5
  cp "$target" "$target.orig"
  sed "$sed_expr" "$target.orig" > "$target"
  got=$(cd "$FIX" && set +e; printf '%s' "$payload" | node "$FIX/.claude/hooks/budget.mjs" >/dev/null 2>&1; echo $?)
  mv "$target.orig" "$target"
  if [ "$got" = "$expect_broken" ]; then
    echo "ok   negative control: $label (suite can go red)"
    pass=$((pass + 1))
  else
    echo "FAIL negative control: $label did not change behavior - not really being checked"
    fail=$((fail + 1))
  fi
}

mkdir -p .ai/run/negrun src/app/vehicle
NEG_BASE=$(cd "$FIX" && git rev-parse HEAD)
cat > .ai/run/negrun/state.json <<STATE
{"status":"active","opened_by":"open-run.sh","started_at":"$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
 "base_commit":"$NEG_BASE","dirty_at_start":[],
 "allowed_paths":["src/app/vehicle/**"],"max_files":45,"max_minutes":45,"files_touched":[]}
STATE
neg_case "breaking dir/** in lib.mjs makes an in-radius edit wrongly block" \
  "$FIX/.ai/harness/lib.mjs" \
  "s/pat.endsWith('\/\*\*')/false \&\& pat.endsWith('\/\*\*')/" \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/src/app/vehicle/deeply/nested/x.ts\"}}" \
  2
rm -rf .ai/run/negrun

mkdir -p .ai/run/negrun2
NEG2_BASE=$(cd "$FIX" && git rev-parse HEAD)
cat > .ai/run/negrun2/state.json <<STATE
{"status":"active","opened_by":"open-run.sh","started_at":"$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
 "base_commit":"$NEG2_BASE","dirty_at_start":[],
 "allowed_paths":["src/**"],"max_files":30,"max_minutes":45,"files_touched":[]}
STATE
echo '{"changed": true}' > angular.json
neg_case "gutting the sweep's crossed-list (always empty) makes an undisclosed crossing wrongly pass" \
  "$FIX/.claude/hooks/budget.mjs" \
  "s/const crossed = gateDiff/const crossed = (()=>\[\])(); \/\/neutered\/\/ const _unused = gateDiff/" \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/src/app/app.component.ts\"}}" \
  0
(cd "$FIX" && git checkout -q -- angular.json)
rm -rf .ai/run/negrun2

rm -rf "$FIX"

echo
if [ "$fail" -gt 0 ]; then
  echo "hook-test: FAILED ($fail of $((pass + fail)))" >&2
  exit 1
fi
echo "hook-test: all $pass cases pass"
