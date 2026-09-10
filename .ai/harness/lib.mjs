#!/usr/bin/env node
// One owner for the ruler, the run picker, and the glob matcher - all three
// were copied by hand into five-plus files and had started to drift.
// docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md §1.3/§1.5/§1.1.
//
// This file is gate-scope (.claude/hooks/budget.mjs's GATE_SCOPE, once the
// hook imports it): it decides what counts toward every budget and what
// counts as a door-7 crossing, so it needs the same human-owned protection
// as the hook and verify.sh themselves.
//
// Node built-ins only - no new dependency, same reasoning as ledger.sh's jq
// comment.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

export function sh(cmd, cwd) {
  try {
    return execSync(cmd, { cwd: cwd ?? process.cwd(), encoding: 'utf8' });
  } catch {
    return '';
  }
}

export function gitHead(cwd) {
  const out = sh('git rev-parse HEAD', cwd).trim();
  return out || null;
}

// glob-lite: dir/**, *.ext, exact. Copied verbatim from budget.mjs's own
// copy rather than the other way around, because budget.mjs is gate-scope
// and this file has to be importable by scripts that run before any patch
// to the hook is applied.
export function hit(pat, p) {
  if (pat.endsWith('/**')) return p.startsWith(pat.slice(0, -2));
  if (pat.startsWith('*.')) return p.endsWith(pat.slice(1));
  if (pat.includes('*')) return new RegExp('^' + pat.replace(/[.]/g, '\\.').replace(/\*/g, '[^/]*') + '$').test(p);
  return p === pat;
}

// The ruler. docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md §1.3: the old
// ruler (git diff --name-only HEAD) resets on every WIP commit, which the
// harness itself mandates on every green step - so a run that follows the
// durability rule could never hit budget_spent. Counting from base_commit
// (stamped once, at run open, never a moving target) fixes that.
//
// Run artifacts are excluded from the count entirely (not just this run's
// own directory) - a brief, journal, digest, retro, emits and a handoff are
// all untracked paperwork, not the change being budgeted.
//
// A file already dirty before the run started doesn't count even if this
// run edits it further - an acceptable undercount, the trade for not
// charging a run for work it didn't do.
export function runTouched(state) {
  const cwd = state?.cwd;
  const base = state?.base_commit ?? 'HEAD'; // legacy runs (no base_commit) keep old behaviour
  const tracked = sh(`git diff --name-only ${base}`, cwd).split('\n');
  const untracked = sh('git ls-files --others --exclude-standard', cwd).split('\n');
  const pre = new Set(state?.dirty_at_start ?? []);
  const out = new Set();
  for (const raw of [...tracked, ...untracked]) {
    const f = raw.trim();
    if (!f) continue;
    if (pre.has(f)) continue;
    if (f.startsWith('.ai/run/')) continue; // run artifacts are always excluded, not budgeted
    out.add(f);
  }
  return out;
}

// Exactly one status:active run -> its slug. More than one is an error (an
// ambiguous state a hook should fail open on, but verify.sh's preflight
// should fail on). None -> fall back to the greatest started_at, and say so.
// docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md §1.5.
export function currentRun(root) {
  const runsDir = join(root ?? process.cwd(), '.ai', 'run');
  if (!existsSync(runsDir)) return { slug: null, fallback: false, error: null };

  const active = [];
  const started = [];
  let entries = [];
  try {
    entries = readdirSync(runsDir);
  } catch {
    return { slug: null, fallback: false, error: null };
  }
  for (const slug of entries) {
    const p = join(runsDir, slug, 'state.json');
    if (!existsSync(p)) continue;
    let st;
    try {
      st = JSON.parse(readFileSync(p, 'utf8'));
    } catch {
      continue; // unreadable state is not a reason to error the picker
    }
    if (st.status === 'active') active.push(slug);
    if (st.started_at) started.push({ slug, started_at: st.started_at });
  }

  if (active.length === 1) return { slug: active[0], fallback: false, error: null };
  if (active.length > 1) {
    return { slug: null, fallback: false, error: `multiple active runs: ${active.sort().join(', ')}` };
  }
  if (started.length === 0) return { slug: null, fallback: false, error: null };
  started.sort((a, b) => (a.started_at < b.started_at ? 1 : -1));
  return { slug: started[0].slug, fallback: true, error: null };
}

// Gate-scope paths that differ from base (base_commit when a run is active,
// HEAD otherwise - door 7 is always on, not tied to a run) and are not named
// in the active run's door-crossings.md. docs/reviews/vibe-harness-v4.3-
// delta-2026-09-10.md §1.1: this replaces the whole-command-string Bash scan
// with a tree check, so it catches any tool (node, python, perl, git apply,
// ...) that wrote the file, not just the write verbs a regex happened to
// list.
export function gateDiff(gateScope, state, root) {
  const cwd = root ?? process.cwd();
  const base = state?.base_commit ?? 'HEAD';
  const tracked = sh(`git diff --name-only ${base}`, cwd).split('\n');
  const untracked = sh('git ls-files --others --exclude-standard', cwd).split('\n');
  const changed = new Set(
    [...tracked, ...untracked].map((s) => s.trim()).filter(Boolean)
  );
  const hitScope = [...changed].filter((f) => gateScope.some((g) => hit(g, f)));

  let disclosed = '';
  if (state?.slug) {
    const dc = join(cwd, '.ai', 'run', state.slug, 'door-crossings.md');
    if (existsSync(dc)) {
      try {
        disclosed = readFileSync(dc, 'utf8');
      } catch {
        disclosed = '';
      }
    }
  }
  return hitScope.filter((f) => !disclosed.includes(f));
}

// Callable from sh scripts too, so verify.sh/handoff.sh/check-citations.sh
// share this file's code instead of re-implementing the picker.
// usage: node .ai/harness/lib.mjs current-run
if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2];
  if (cmd === 'current-run') {
    const { slug, fallback, error } = currentRun(process.cwd());
    if (error) {
      console.error(`lib: ${error}`);
      process.exit(1);
    }
    if (!slug) {
      process.exit(0); // print nothing - "no run" is a valid, silent answer
    }
    if (fallback) console.error(`lib: no active run, falling back to latest started_at: ${slug}`);
    console.log(slug);
  } else {
    console.error(`lib: unknown command '${cmd}'. Usage: node lib.mjs current-run`);
    process.exit(1);
  }
}
