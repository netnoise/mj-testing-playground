#!/usr/bin/env node
// PreToolUse guard. The frontmatter declares a budget; this makes it real.
// Sole writer of .ai/run/<slug>/state.json.
// Fails OPEN on anything unexpected - a guard that blocks every edit on a
// schema change is worse than no guard.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ok = () => process.exit(0);
const block = (why) => { console.error(`\n[harness] BLOCKED: ${why}\n`); process.exit(2); };

let payload = '';
try {
  payload = readFileSync(0, 'utf8');
} catch { ok(); }

let file;
try {
  const t = JSON.parse(payload || '{}').tool_input ?? {};
  file = t.file_path ?? t.path ?? t.notebook_path;
} catch { ok(); }
if (!file) ok();

const rel = file.startsWith(ROOT) ? file.slice(ROOT.length + 1) : file;

// glob-lite: dir/**, *.ext, exact
const hit = (pat, p) =>
  pat.endsWith('/**') ? p.startsWith(pat.slice(0, -2))
  : pat.startsWith('*.') ? p.endsWith(pat.slice(1))
  : pat.includes('*') ? new RegExp('^' + pat.replace(/[.]/g, '\\.').replace(/\*/g, '[^/]*') + '$').test(p)
  : p === pat;

// --- Door 7: gate-scope config. Always on, run or no run. ----------------
// The symptom of this failure is a BETTER number, so no gate can catch it.
const GATE_SCOPE = ['karma.conf.js', 'angular.json', 'tslint.json', 'tsconfig*.json',
                    '.ai/harness/verify.sh'];
if (!process.env.HARNESS_DOOR_OPEN && GATE_SCOPE.some((g) => hit(g, rel))) {
  block(`one-way door 7 - ${rel} defines a gate's own scope.
  Editing it can make a metric improve without the code improving.
  A human changes this file, or re-run with HARNESS_DOOR_OPEN=1 and say so in the digest.`);
}

// --- Budgets: only while a run is active ---------------------------------
const runs = join(ROOT, '.ai', 'run');
if (!existsSync(runs)) ok();

let statePath, state;
for (const slug of readdirSync(runs)) {
  const p = join(runs, slug, 'state.json');
  if (!existsSync(p)) continue;
  try {
    const s = JSON.parse(readFileSync(p, 'utf8'));
    if (s.status === 'active') { statePath = p; state = s; break; }
  } catch { /* unreadable state is not a reason to block */ }
}
if (!state) ok();

const touched = new Set(state.files_touched ?? []);
const allowed = state.allowed_paths ?? [];
const max = state.max_files ?? 12;
const mins = state.max_minutes ?? 45;

if (allowed.length && !allowed.some((a) => hit(a, rel))) {
  block(`blast_radius_exceeded - ${rel} is not in the brief's declared paths.
  The brief's model of the system was wrong. Stop, write the handoff, say so.`);
}
if (!touched.has(rel) && touched.size >= max) {
  block(`budget_spent - ${max} files already touched. Write the handoff and stop.`);
}
if (state.started_at && (Date.now() - Date.parse(state.started_at)) / 60000 > mins) {
  block(`budget_spent - ${mins} minute budget elapsed. Write the handoff and stop.`);
}

touched.add(rel);
try {
  writeFileSync(statePath, JSON.stringify({ ...state, files_touched: [...touched] }, null, 2) + '\n');
} catch { /* never block on a write failure */ }
ok();
