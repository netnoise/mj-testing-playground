#!/usr/bin/env sh
# Replays the heading-test mutations from ../evidence.md against src/app/app.component.spec.ts and
# prints each outcome next to the one recorded there. Leaves the tree as it found it.
set -u
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
DIR=.ai/run/klaxon-claims-correction/mutations

# A dirty src/app would make the patches apply to something other than the recorded baseline.
git diff --quiet HEAD -- src/app || { echo "replay: src/app has uncommitted changes, refusing to run" >&2; exit 2; }

outcome() { npx jest src/app/app.component.spec.ts --ci >/dev/null 2>&1 && echo PASS || echo FAIL; }

printf '%-9s %-5s (recorded: PASS)\n' baseline "$(outcome)"
for pair in M1:FAIL M2:PASS M3:FAIL; do
  m=${pair%%:*}
  git apply "$DIR/$m.patch" || { echo "replay: $m.patch does not apply" >&2; exit 2; }
  printf '%-9s %-5s (recorded: %s)\n' "$m" "$(outcome)" "${pair##*:}"
  git apply -R "$DIR/$m.patch"
done
