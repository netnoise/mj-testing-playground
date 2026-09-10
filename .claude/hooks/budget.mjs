#!/usr/bin/env node
// PreToolUse guard. The frontmatter declares a budget; this makes it real.
// Sole writer of .ai/run/<slug>/state.json - enforced below, not just stated.
// Fails OPEN on anything unexpected - a guard that blocks every edit on a
// schema change is worse than no guard.
//
// v4.2 remediation (docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md):
// R1 - the active run's own directory is now always in scope (was locking the
// agent out of its own brief.md, which made `rm state.json` the routine
// workaround - and each deletion silently zeroed the budget it exists to
// enforce); Bash is now scanned, not just Edit/Write/MultiEdit/NotebookEdit;
// files_touched is derived from git, not accumulated from tool interception,
// so it counts deletions and moves; state.json is single-writer in practice,
// not just in the docs.
// R3 - GATE_SCOPE is now emitted to .ai/harness/gate-scope.json on every
// invocation: one owner for a list that had drifted to six hand-kept copies,
// one of them (the cheatsheet) already missing an entry silently.
//
// v4.3 remediation (docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md §1.1/
// §1.3): the Bash guard used to scan the whole command string for a write
// verb ANYWHERE plus a protected name ANYWHERE - so `node -e "...writeFile
// Sync('jest.config.js', ...)"`, `python3 -c "open('angular.json','w')"`,
// `git apply` and a dozen other shapes went straight through (verified live,
// six of six), while `cp angular.json /tmp/x` (a READ) or a command that
// merely *mentioned* a protected path in prose got blocked. That check is
// gone. In its place: .ai/harness/lib.mjs's gateDiff() compares the actual
// tree against the run's base_commit (or HEAD with no run) and flags any
// protected path that changed and isn't named in the run's door-crossings.md
// - this is a git-diff, so it sees a write from ANY tool, not just the verbs
// a regex happened to list. It can't prevent the write (this hook runs
// before the tool call, and a Bash command's effect isn't knowable without
// running it), so instead: once an undisclosed protected diff exists, every
// subsequent Edit/Write/MultiEdit/NotebookEdit OUTSIDE the active run's own
// directory is refused until it's disclosed (door-crossings.md) or reverted
// (git checkout -- <path>, via Bash - Bash itself is never blocked by this
// sweep, since it's the only tool that can revert). verify.sh's preflight
// (companion patch) turns an undisclosed diff into a hard failure before any
// tier runs, so a crossing that slips through a single missed hook call
// still can't produce a green gate.
// Also fixed: budget.mjs's own files-touched ruler now comes from lib.mjs's
// runTouched(state), which counts from the run's base_commit and excludes
// run artifacts - the old `git diff --name-only HEAD` reset to near-zero on
// every WIP commit, which the harness itself mandates on every green step,
// so a compliant run could never hit budget_spent (delta §1.3).
// Scope note: the protected-diff sweep only runs while a run is genuinely
// ACTIVE - there's nowhere to disclose a crossing without a run directory,
// and "tiny"/ad-hoc work with no run open was never meant to carry this
// machinery. The direct per-file checks below (an Edit/Write whose OWN
// target is a protected path) are unconditional either way, run or no run -
// that part of door 7 doesn't change.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { hit, runTouched, gateDiff } from '../../.ai/harness/lib.mjs';

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

// --- Door 7: gate-scope config. Always on, run or no run. ----------------
// The symptom of this failure is a BETTER number, so no gate can catch it.
// Angular 14 toolchain: jest/playwright/eslint replaced karma/tslint (0003).
// .claude/settings.json is included: it decides whether this hook runs at
// all, so it defines a gate's own scope as surely as jest.config.js does.
// .ai/harness/lib.mjs is included as of v4.3: it now decides what counts
// toward every budget and every door-7 crossing, so it defines a gate's
// scope as much as the hook itself does.
//
// This array is the single source of truth for the door-7 list - everything
// else (docs, HARNESS.md, the design page) reads .ai/harness/gate-scope.json,
// emitted below, rather than hand-keeping its own copy.
const GATE_SCOPE = ['jest.config.js', 'setup-jest.ts', 'playwright.config.ts',
                    '.eslintrc.json', 'angular.json', 'tsconfig*.json',
                    '.ai/harness/verify.sh', '.claude/hooks/budget.mjs',
                    '.claude/settings.json', '.ai/harness/lib.mjs'];

// MODEL.md is a separate, older door (human-owned structure doc, not a
// gate's own scope), but it's protected by the same mechanism below and
// deserves the same tree-diff coverage - a Bash bypass of MODEL.md is just
// as real as a Bash bypass of jest.config.js. Kept out of GATE_SCOPE proper
// (and out of gate-scope.json's emitted list) because it isn't what door 7
// itself is about; PROTECTED_PATHS is the union used only by the sweep.
const PROTECTED_PATHS = [...GATE_SCOPE, '.ai/MODEL.md'];

// --- Emit gate-scope.json. Fails open - never blocks on this. ------------
// missing: a listed pattern that resolves to nothing now - the Angular 9->14
// retool proved this happens silently (Karma/Protractor/tslint paths simply
// stopped existing). verify.sh fails on this, naming what's missing, so
// decay becomes a failed preflight instead of a silent hole.
// observed_unlisted: a config-shaped path NOT in GATE_SCOPE - reported into
// the digest, never blocked. Blocking on an unknown would contradict this
// hook's own fail-open principle; reporting doesn't.
try {
  const missing = GATE_SCOPE.filter((pat) => {
    if (!pat.includes('*')) return !existsSync(join(ROOT, pat));
    let entries = [];
    try { entries = readdirSync(ROOT); } catch { /* fail open */ }
    return !entries.some((name) => hit(pat, name));
  });

  const UNLISTED_RE = /config|\.rc\.|rc\.[a-z]+$/i;
  const LOCKFILE_RE = /^(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/;
  const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.angular', 'coverage']);
  const observedUnlisted = [];
  const scanDir = (dir, relPrefix) => {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue;
      if (!e.isFile()) continue;
      const rel = relPrefix ? `${relPrefix}/${e.name}` : e.name;
      if (GATE_SCOPE.some((g) => hit(g, rel))) continue;
      if (LOCKFILE_RE.test(e.name) || UNLISTED_RE.test(e.name)) observedUnlisted.push(rel);
    }
  };
  scanDir(ROOT, '');
  scanDir(join(ROOT, 'ci'), 'ci');
  scanDir(join(ROOT, '.github', 'workflows'), '.github/workflows');
  scanDir(join(ROOT, 'verify'), 'verify');

  writeFileSync(
    join(ROOT, '.ai', 'harness', 'gate-scope.json'),
    JSON.stringify({ patterns: GATE_SCOPE, missing, observed_unlisted: observedUnlisted.sort() }, null, 2) + '\n'
  );
} catch { /* never block on this - it's a report, not a gate */ }

// --- Find the active run once, up front. Everything below needs it. ------
// Deliberately NOT lib.mjs's currentRun() here: that function falls back to
// the latest started_at when nothing is active, which is right for a human-
// facing picker (handoff.sh, check-citations.sh) but wrong for enforcement -
// a DONE run should never gate a live session. This stays a strict "status
// is literally active" scan, same as before v4.3.
const runsDir = join(ROOT, '.ai', 'run');
let statePath, state, slug;
if (existsSync(runsDir)) {
  for (const s of readdirSync(runsDir)) {
    const p = join(runsDir, s, 'state.json');
    if (!existsSync(p)) continue;
    try {
      const st = JSON.parse(readFileSync(p, 'utf8'));
      if (st.status === 'active') { statePath = p; state = st; slug = s; break; }
    } catch { /* unreadable state is not a reason to block */ }
  }
}

// --- Bash: only the state.json single-writer regex remains here. ---------
// The whole-command-string door-7/MODEL.md scans are gone (see header) -
// replaced by the protected-diff sweep below, which runs for every tool
// including the Bash call that comes AFTER whichever command did the write.
// This regex stays narrow and path-specific enough that the delta note
// recommended keeping it as-is; it has the same "only fires behind a write-
// verb match" gap as the checks that were removed (e.g. a plain `node -e
// "...writeFileSync('.../state.json', ...)"` isn't caught here), which is a
// known, documented limitation - not fixed by this patch. A deliberate
// tamper via a non-listed write verb is out of reach of a command-text
// check regardless; the real backstop for state.json is that nothing else
// reads it as evidence without cross-checking git (HARNESS.md's own "never
// trust" section).
const WRITE_VERB_RE = /(^|[\s;&|`(])(>{1,2}|tee\b|sed\s+-i|mv\b|cp\b|rm\b|truncate\b|dd\b|git\s+checkout\s+--|git\s+restore\b)/;

if (toolName === 'Bash') {
  const cmd = input.command ?? '';
  if (cmd && WRITE_VERB_RE.test(cmd) && /\.ai\/run\/[^/\s]+\/state\.json/.test(cmd)) {
    if (!DOOR_OPEN) {
      block(`state.json is single-writer (this hook) - a shell command targets it:
      ${cmd.trim()}
      Deleting state.json to get past the blast-radius guard silently zeroes the
      budget it exists to enforce - the run directory is always allowed below,
      so editing brief.md or journal.md directly no longer needs this.`);
    }
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
  The human applies it, or ask the human to re-run with HARNESS_DOOR_OPEN=1
  set for the whole session (there is no working per-command override - see
  the door-7 block below for where that instruction actually works).`);
}

if (!DOOR_OPEN && GATE_SCOPE.some((g) => hit(g, rel))) {
  block(`one-way door 7 - ${rel} defines a gate's own scope.
  Editing it can make a metric improve without the code improving.
  A human changes this file. There is no working per-command override for
  this hook - HARNESS_DOOR_OPEN only does anything when the HUMAN sets it for
  the whole session before it starts, or when THEY run
  \`HARNESS_DOOR_OPEN=1 sh .ai/harness/verify.sh\` themselves; a value set
  mid-conversation or prefixed onto one Bash call is invisible to this
  process.`);
}

// --- state.json: single writer is this hook, enforced not just stated. ---
// Created once by open-run.sh; never edited by any other tool call after.
if (!DOOR_OPEN && /^\.ai\/run\/[^/]+\/state\.json$/.test(rel) && existsSync(file)) {
  block(`state.json is single-writer (this hook) - ${rel} already exists.
  Edit brief.md or journal.md instead; the run directory is always inside the
  blast radius below. If the budget itself is genuinely wrong, say so in the
  digest rather than rewriting this file.`);
}

// --- Protected-diff sweep: catches a Bash-mediated bypass of the checks ---
// above, on the next Edit/Write call after the tree already changed. Only
// while a run is genuinely active - see the header's Scope note.
if (!DOOR_OPEN && state && slug) {
  const crossed = gateDiff(PROTECTED_PATHS, { ...state, slug }, ROOT);
  if (crossed.length && !rel.startsWith(`.ai/run/${slug}/`)) {
    block(`undisclosed protected-path crossing - the working tree already differs
    from this run's base_commit in a way this hook can't prevent after the fact:
    ${crossed.join(', ')}
    Something (very likely a Bash command) wrote to a file door 7 or MODEL.md
    protects. Either disclose it - write .ai/run/${slug}/door-crossings.md
    naming the file and why - or revert it (git checkout -- <path>) before any
    other edit outside this run's own directory. verify.sh's preflight will
    fail on this too until one of those happens.`);
  }
}

// --- Budgets: only while a run is active ---------------------------------
if (!state) ok();

function recordAndExit() {
  try {
    const finalTouched = runTouched(state);
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
// state.json open-run.sh writes sets them explicitly.
const max = state.max_files ?? 30;
const mins = state.max_minutes ?? 90;
// runTouched(state) is the ruler: git diff from base_commit (not a moving
// HEAD), run artifacts excluded. Fixes the WIP-commit reset (delta §1.3) -
// the old `git diff --name-only HEAD` shrank to near-zero on every commit
// the harness itself tells the agent to make.
const touched = runTouched(state);
const willTouch = new Set(touched);
willTouch.add(rel);

if (willTouch.size > max) {
  block(`budget_spent - ${max} files already touched (${touched.size} so far, since base_commit). Write the handoff and stop.`);
}
if (state.started_at && (Date.now() - Date.parse(state.started_at)) / 60000 > mins) {
  block(`budget_spent - ${mins} minute budget elapsed. Write the handoff and stop.`);
}

recordAndExit();
