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
# docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md §1.4: emits are now
# CUMULATIVE-SINCE-RUN-START snapshots (spent.files/spent.min come from
# lib.mjs's runTouched/started_at as of the call), not per-skill deltas -
# summing them (the old behaviour) double-counted every file across every
# emit in a run, e.g. r3 printing files=45 for a run that touched 24. So:
# per RUN, the total is the emit with the greatest "at" (the latest
# snapshot IS the total, not a sum); per SKILL, the figure shown is that
# emit's OWN delta from the previous emit in the same run by "at" - how
# much that step alone added, not the whole-run count repeated per skill.
#
# A pre-fix emit (no "at" field) or an emit with a negative/null spent.min
# cannot be trusted - printed as "legacy"/"invalid", excluded from every
# total, and the script exits non-zero if any exist. A wrong-but-plausible
# number is worse than an honest failure (HARNESS.md's "never trust ... an
# empty list" applies here in reverse: a full-looking table can be just as
# vacuous as an empty one if some of its rows are fiction).
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

# Everything below runs in one node process: reading every emit file once,
# classifying valid vs legacy/invalid, computing per-run cumulative totals
# and per-skill deltas, and printing both tables. Shelling out per-file (the
# old jq pipeline) can't express "diff against the previous emit by at" as
# a pipeline stage without re-reading the whole corpus per row.
node -e "
const fs = require('node:fs');
const files = \`$FILES\`.split('\n').filter(Boolean);
const flows = $FLOWS_JSON;

const byRun = new Map(); // slug -> { valid: [...], invalid: n, legacy: n }
for (const f of files) {
  const slug = f.split('/')[2];
  if (!byRun.has(slug)) byRun.set(slug, { valid: [], invalid: 0, legacy: 0 });
  const bucket = byRun.get(slug);
  let e;
  try { e = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { bucket.invalid++; continue; }
  if (!e.at) { bucket.legacy++; continue; }
  const atMs = Date.parse(e.at);
  const min = e.spent && e.spent.min;
  if (isNaN(atMs) || min === null || min === undefined || min < 0) { bucket.invalid++; continue; }
  bucket.valid.push({ file: f, skill: e.skill ?? '?', at: e.at, atMs, min, files: (e.spent && e.spent.files) ?? 0 });
}

let anyInvalid = false;
console.log('ledger: per-skill totals (delta from the previous emit in the same run)');
const skillRows = [];
for (const [slug, bucket] of byRun) {
  if (bucket.invalid || bucket.legacy) anyInvalid = true;
  const sorted = [...bucket.valid].sort((a, b) => a.atMs - b.atMs);
  let prev = { min: 0, files: 0 };
  for (const e of sorted) {
    skillRows.push({ skill: e.skill, min: e.min - prev.min, files: e.files - prev.files });
    prev = e;
  }
}
const bySkill = new Map();
for (const r of skillRows) {
  const cur = bySkill.get(r.skill) ?? { emits: 0, min: 0, files: 0 };
  cur.emits++; cur.min += r.min; cur.files += r.files;
  bySkill.set(r.skill, cur);
}
console.log(['skill', 'emits', 'total_min', 'total_files'].join('\t'));
for (const [skill, v] of [...bySkill].sort((a, b) => b[1].min - a[1].min)) {
  console.log([skill, v.emits, v.min, v.files].join('\t'));
}

console.log();
console.log('ledger: per-run flow (inferred) and total spend (latest emit = the run total, not a sum)');
for (const [slug, bucket] of byRun) {
  const skills = [...new Set(bucket.valid.map((e) => e.skill))].sort();
  let best = 'unmatched', bestScore = -1;
  for (const [name, list] of Object.entries(flows)) {
    const set = new Set(list);
    const overlap = skills.filter((s) => set.has(s)).length;
    if (overlap > bestScore && overlap > 0) { best = name; bestScore = overlap; }
  }
  const flow = skills.length ? best : 'unmatched';
  const sorted = [...bucket.valid].sort((a, b) => b.atMs - a.atMs);
  const latest = sorted[0];
  const label = latest
    ? \`min=\${latest.min}   files=\${latest.files}\`
    : 'min=n/a files=n/a';
  const flags = [];
  if (bucket.invalid) flags.push(\`\${bucket.invalid} invalid\`);
  if (bucket.legacy) flags.push(\`\${bucket.legacy} legacy\`);
  const flagStr = flags.length ? \`  [\${flags.join(', ')}]\` : '';
  console.log(\`\${slug.padEnd(28)} flow=\${flow.padEnd(9)} skills=\${(skills.join(',') || '(none valid)').padEnd(28)} \${label}\${flagStr}\`);
}

if (anyInvalid) {
  console.log();
  console.log('ledger: one or more emits were excluded as invalid or legacy - see [brackets] above.');
  process.exitCode = 1;
}
"
