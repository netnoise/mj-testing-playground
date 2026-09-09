#!/usr/bin/env node
// PreToolUse guard. The frontmatter declares a budget; this makes it real.
// Sole writer of .ai/run/<slug>/state.json - enforced below, not just stated.
// Fails OPEN on anything unexpected - a guard that blocks every edit on a
// schema change is worse than no guard.
//
// v4.2 remediation (docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md,
// workstream R1): the active run's own directory is now always in scope (was
// locking the agent out of its own brief.md, which made `rm state.json` the
// routine workaround - and each deletion silently zeroed the budget it exists
// to enforce); Bash is now scanned, not just Edit/Write/MultiEdit/NotebookEdit;
// files_touched is derived from git, not accumulated from tool interception,
// so it counts deletions and moves; state.json is single-writer in practice,
// not just in the docs.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const ok = () => process.exit(0);
const block = (why) => { console.error(`\n[harness] BLOCKED: ${why}\n`); process.exit(2); };
const DOOR_OPEN = !!process.env.HARNESS_DOOR_OPEN;

let payload = '';
try {
  payload = readFileSync(0, 'utf8');
} catch { ok(); }

let parsed;
try {
  parsed = JSON.parse(payload || '{}');
} catch { ok(); }
if (!parsed) ok();

const toolName = parsed.tool_name ?? '';
const input = parsed.tool_input ?? {};

// glob-lite: dir/**, *.ext, exact
const hit = (pat, p) =>
  pat.endsWith('/**') ? p.startsWith(pat.slice(0, -2))
  : pat.startsWith('*.') ? p.endsWith(pat.slice(1))
  : pat.includes('*') ? new RegExp('^' + pat.replace(/[.]/g, '\\.').replace(/\*/g, '[^/]*') + '$').test(p)
  : p === pat;

// --- Door 7: gate-scope config. Always on, run or no run. ----------------
// The symptom of this failure is a BETTER number, so no gate can catch it.
// Angular 14 toolchain: jest/playwright/eslint replaced karma/tslint (0003).
// .claude/settings.json is included: it decides whether this hook runs at
// all, so it defines a gate's own scope as surely as jest.config.js does.
const GATE_SCOPE = ['jest.config.js', 'setup-jest.ts', 'playwright.config.ts',
                    '.eslintrc.json', 'angular.json', 'tsconfig*.json',
                    '.ai/harness/verify.sh', '.claude/hooks/budget.mjs',
                    '.claude/settings.json'];

// --- Bash: heuristic scan, not path-based. -------------------------------
// Blocks a write verb touching a gate-scope file's name, MODEL.md, or an
// existing run's state.json. Deliberately does NOT apply blast-radius or
// the file budget to Bash - too heuristic (it would block `npm test`), and
// the git-derived count below catches the files regardless of which tool
// wrote them.
const WRITE_VERB_RE = /(^|[\s;&|`(])(>{1,2}|tee\b|sed\s+-i|mv\b|cp\b|rm\b|truncate\b|dd\b|git\s+checkout\s+--|git\s+restore\b)/;
const bashNeedle = (pat) => (pat.includes('*') ? pat.split('*')[0] : pat);

if (toolName === 'Bash') {
  const cmd = input.command ?? '';
  if (!cmd || !WRITE_VERB_RE.test(cmd)) ok();

  if (!DOOR_OPEN && cmd.includes('.ai/MODEL.md')) {
    block(`.ai/MODEL.md is human-owned - propose the diff in the digest instead.
    The human applies it, or re-run with HARNESS_DOOR_OPEN=1 on their say-so.`);
  }
  if (!DOOR_OPEN && GATE_SCOPE.some((g) => cmd.includes(bashNeedle(g)))) {
    block(`one-way door 7 (via Bash) - this command writes to a gate-scope file:
    ${cmd.trim()}
    A human changes this file, or re-run with HARNESS_DOOR_OPEN=1 and say so in the digest.`);
  }
  if (/\.ai\/run\/[^/\s]+\/state\.json/.test(cmd)) {
    block(`state.json is single-writer (this hook) - a shell command targets it:
    ${cmd.trim()}
    Deleting state.json to get past the blast-radius guard silently zeroes the
    budget it exists to enforce - the run directory is always allowed below,
    so editing brief.md or journal.md directly no longer needs this.`);
  }
  ok();
}

// --- Everything below is file-path-based (Edit/Write/MultiEdit/NotebookEdit) ---
const file = input.file_path ?? input.path ?? input.notebook_path;
if (!file) ok();
const rel = file.startsWith(ROOT) ? file.slice(ROOT.length + 1) : file;

// --- MODEL.md is human-owned: agents propose diffs, never write it -------
if (!DOOR_OPEN && rel === '.ai/MODEL.md') {
  block(`.ai/MODEL.md is human-owned - propose the diff in the digest instead.
  The human applies it, or re-run with HARNESS_DOOR_OPEN=1 on their say-so.`);
}

if (!DOOR_OPEN && GATE_SCOPE.some((g) => hit(g, rel))) {
  block(`one-way door 7 - ${rel} defines a gate's own scope.
  Editing it can make a metric improve without the code improving.
  A human changes this file, or re-run with HARNESS_DOOR_OPEN=1 and say so in the digest.`);
}

// --- state.json: single writer is this hook, enforced not just stated. ---
// Created once by /understand; never edited by any other tool call after.
if (!DOOR_OPEN && /^\.ai\/run\/[^/]+\/state\.json$/.test(rel) && existsSync(file)) {
  block(`state.json is single-writer (this hook) - ${rel} already exists.
  Edit brief.md or journal.md instead; the run directory is always inside the
  blast radius below. If the budget itself is genuinely wrong, say so in the
  digest rather than rewriting this file.`);
}

// --- Budgets: only while a run is active ---------------------------------
const runs = join(ROOT, '.ai', 'run');
if (!existsSync(runs)) ok();

let statePath, state, slug;
for (const s of readdirSync(runs)) {
  const p = join(runs, s, 'state.json');
  if (!existsSync(p)) continue;
  try {
    const st = JSON.parse(readFileSync(p, 'utf8'));
    if (st.status === 'active') { statePath = p; state = st; slug = s; break; }
  } catch { /* unreadable state is not a reason to block */ }
}
if (!state) ok();

// files_touched is derived from git, not accumulated from tool interception,
// so it counts deletions, moves and shell edits. Fails open to the old
// recorded set if git itself errors (e.g. no HEAD yet).
function gitTouchedFiles() {
  try {
    const tracked = execSync('git diff --name-only HEAD', { cwd: ROOT, encoding: 'utf8' });
    const untracked = execSync('git ls-files --others --exclude-standard', { cwd: ROOT, encoding: 'utf8' });
    return new Set([...tracked.split('\n'), ...untracked.split('\n')].map((s) => s.trim()).filter(Boolean));
  } catch {
    return null;
  }
}

function recordAndExit() {
  try {
    const finalTouched = gitTouchedFiles() ?? new Set([...(state.files_touched ?? []), rel]);
    writeFileSync(statePath, JSON.stringify({ ...state, files_touched: [...finalTouched].sort() }, null, 2) + '\n');
  } catch { /* never block on a write failure */ }
  ok();
}

// The active run's own directory is always in scope. This removes the
// incentive to delete state.json just to edit the brief or journal - the
// three-times-in-one-session workaround the audit found in ui-shell-redesign.
if (rel.startsWith(`.ai/run/${slug}/`)) recordAndExit();

const allowed = state.allowed_paths ?? [];
if (allowed.length && !allowed.some((a) => hit(a, rel))) {
  block(`blast_radius_exceeded - ${rel} is not in the brief's declared paths.
  The brief's model of the system was wrong. Stop, write the handoff, say so.`);
}

// 30/90 fallback matches config.yml's default - sized to the largest real run
// on record (ui-shell-redesign: 30 files, ~90 minutes), not a round number.
// This fallback only matters if a state.json is missing these fields; every
// state.json /understand writes sets them explicitly.
const max = state.max_files ?? 30;
const mins = state.max_minutes ?? 90;
const touched = gitTouchedFiles() ?? new Set(state.files_touched ?? []);
const willTouch = new Set(touched);
willTouch.add(rel);

if (willTouch.size > max) {
  block(`budget_spent - ${max} files already touched (git: ${touched.size}). Write the handoff and stop.`);
}
if (state.started_at && (Date.now() - Date.parse(state.started_at)) / 60000 > mins) {
  block(`budget_spent - ${mins} minute budget elapsed. Write the handoff and stop.`);
}

recordAndExit();
