#!/usr/bin/env sh
# Throwaway proof that close-run.sh refuses a `done` close on a BAD citation, accepts a clean
# digest, and honours the escape flag. Built in a temp copy so no live run is touched.
set -e
SRC=$(git rev-parse --show-toplevel)
T=$(mktemp -d)
mkdir -p "$T/.ai/harness" "$T/.ai/run/r1"
cp "$SRC/.ai/harness/close-run.sh" "$SRC/.ai/harness/check-citations.sh" "$SRC/.ai/harness/lib.mjs" "$T/.ai/harness/"
cd "$T"
git init -q && git config user.email t@t && git config user.name t
echo hi > real.txt && git add -A && git commit -qm init
echo '{"status":"active","base_commit":"'"$(git rev-parse HEAD)"'","dirty_at_start":[],"allowed_paths":[],"max_files":30,"max_minutes":90,"files_touched":[]}' > .ai/run/r1/state.json

printf 'see `real.txt` and `no/such/file.ts`\n' > .ai/run/r1/digest.md
if sh .ai/harness/close-run.sh r1 done >/dev/null 2>&1; then echo "FAIL: closed on a BAD citation"; exit 1; else echo "ok   refused a BAD citation"; fi

printf 'see `real.txt`\n' > .ai/run/r1/digest.md
sh .ai/harness/close-run.sh r1 done >/dev/null 2>&1 && echo "ok   closed a clean digest"

echo '{"status":"active","base_commit":"'"$(git rev-parse HEAD)"'","dirty_at_start":[],"allowed_paths":[],"max_files":30,"max_minutes":90,"files_touched":[]}' > .ai/run/r1/state.json
printf 'no citations at all here\n' > .ai/run/r1/digest.md
sh .ai/harness/close-run.sh r1 done >/dev/null 2>&1 && echo "ok   a digest with no citations still closes"

echo '{"status":"active","base_commit":"'"$(git rev-parse HEAD)"'","dirty_at_start":[],"allowed_paths":[],"max_files":30,"max_minutes":90,"files_touched":[]}' > .ai/run/r1/state.json
printf 'see `no/such/file.ts`\n' > .ai/run/r1/digest.md
sh .ai/harness/close-run.sh r1 done --skip-citation-check >/dev/null 2>&1 && echo "ok   --skip-citation-check closes anyway"
rm -rf "$T"
