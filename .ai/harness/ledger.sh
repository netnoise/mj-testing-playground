#!/usr/bin/env sh
# Spend roll-up over the emits emit.sh writes. jq, already present in this
# repo's toolchain - no new dependency (config.yml's own reason for not
# having a YAML parser applies just as much to inventing a JSON one).
#
# docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md 1.6: the
# design page's spend-ledger row assumed emits already existed and only the
# roll-up was missing. They didn't - see emit.sh's own header. This script
# is deliberately built second, after emit.sh, so it has something real to
# read; run before this exists over an empty corpus and it says so plainly
# rather than printing a clean-looking zero.
#
# "grouped by flow" - an emit doesn't record which flow it ran under, so a
# run's flow is inferred: the config.yml flow whose skill set is the closest
# superset of the skills that actually emitted in that run directory. This
# is a best-effort label for a human reading the ledger, not itself a claim
# anything downstream should rely on - printed as "(inferred)" for that
# reason.
#
# usage: ledger.sh
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

if ! command -v jq >/dev/null 2>&1; then
  echo "ledger: jq not found - required, not adding a dependency to avoid one" >&2
  exit 1
fi

FILES=$(find .ai/run -mindepth 2 -maxdepth 2 -name '*.json' ! -name 'state.json' 2>/dev/null | sort)
if [ -z "$FILES" ]; then
  echo "ledger: no emits found under .ai/run/*/*.json - this is not a pass, it's the truth."
  echo "ledger: emit.sh has not been called for any run yet. Nothing to roll up."
  exit 1
fi

echo "ledger: per-skill totals"
echo "$FILES" | xargs -I{} sh -c 'jq -c "{skill: (.skill // \"?\"), min: (.spent.min // 0), files: (.spent.files // 0)}" "{}" 2>/dev/null' \
  | jq -s '
      group_by(.skill)
      | map({skill: .[0].skill, emits: length,
             total_min: (map(.min) | add), total_files: (map(.files) | add)})
      | sort_by(-.total_min)
      | (["skill","emits","total_min","total_files"] | @tsv),
        (.[] | [.skill, (.emits|tostring), (.total_min|tostring), (.total_files|tostring)] | @tsv)
    ' -r

echo
echo "ledger: per-run flow (inferred) and total spend"
FLOWS_JSON=$(node -e "
const fs = require('node:fs');
const y = fs.readFileSync('.ai/harness/config.yml', 'utf8');
const m = y.match(/^flows:\n([\s\S]*?)(?:\n[a-z_]+:|\$)/m);
const out = {};
if (m) {
  for (const line of m[1].split('\n')) {
    const fm = line.match(/^\s*([a-z_]+):\s*\[([^\]]*)\]/);
    if (fm) out[fm[1]] = fm[2].split(',').map((s) => s.trim()).filter(Boolean);
  }
}
console.log(JSON.stringify(out));
")

for d in .ai/run/*/; do
  slug=$(basename "$d")
  skills=$(find "$d" -maxdepth 1 -name '*.json' ! -name 'state.json' -exec basename {} .json \; 2>/dev/null | sort | paste -sd, -)
  [ -z "$skills" ] && continue
  flow=$(node -e "
    const flows = $FLOWS_JSON;
    const have = new Set('$skills'.split(',').filter(Boolean));
    let best = 'unmatched', bestScore = -1;
    for (const [name, list] of Object.entries(flows)) {
      const set = new Set(list);
      const overlap = [...have].filter((s) => set.has(s)).length;
      if (overlap > bestScore && overlap > 0) { best = name; bestScore = overlap; }
    }
    console.log(best);
  ")
  totals=$(find "$d" -maxdepth 1 -name '*.json' ! -name 'state.json' -exec cat {} \; 2>/dev/null \
    | jq -s '{min: (map(.spent.min // 0) | add), files: (map(.spent.files // 0) | add)}')
  min=$(echo "$totals" | jq -r '.min')
  files=$(echo "$totals" | jq -r '.files')
  printf '%-28s flow=%-8s skills=%-30s min=%-6s files=%s\n' "$slug" "$flow" "$skills" "$min" "$files"
done
