## Scaffold the vibe harness (Phase 0 + 1)
   branch claude/ai-harness-vibe-coding-jwi4yx · 33 files · verify ✗ (see below)

### One decision for you
`docs/vibe-harness.html` is v3 of the design page and **predates the TriTrack
review**. It still says six doors, one flat `verify.sh`, and budgets-as-frontmatter
— all three of which the code now contradicts. You asked me not to redo it before
we agreed, so it is committed as-is. Reconcile it, or let it stand as a dated
snapshot and diff future versions against it. Default if you say nothing: leave it,
because a dated design doc is honest and a silently-patched one is not.

### What surprised me
The repo already ships the runtime oracle the review's Svelte incident needed.
`e2e/src/app.e2e-spec.ts:19` loads the app *and* asserts no SEVERE browser console
entries — the exact "green but never executed" backstop. It is Protractor 5.4 (EOL),
so it is not wired into `verify`, but the intent was scaffolded in 2020 and never used.

### What I learned about your system
1. `CLAUDE.md:21` already owns the conventions. Writing `.ai/conventions.md` would
   have created the review's four-drifting-tables failure on day one, in a repo with
   no history. That file is deleted from the plan.
2. `angular.json:83` (test) and `angular.json:100` (lint) mean one file defines the
   scope of two different gates — the highest-value door-7 target here.
3. `src/app/app.component.spec.ts:20` is `expect(app).toBeTruthy()`. The repo's only
   spec opens with the exact vacuous shape the review names.

### Concept: the measuring instrument is not the measurement
Door 7 exists because editing a gate's scope makes the number improve while the code
does not. Distinct from weakening a test, and invisible to every gate — a narrower
glob still passes green. Recurs wherever config defines coverage: `karma.conf.js`,
`tslint.json` rule lists, `tsconfig*.json` strictness.

### What I did
Wrote 33 files: 3 core, 4 scripts, 9 prompts, 10 Claude wiring, 4 memory, 3 docs.
Door 7 is **enforced** by `.claude/hooks/budget.mjs`, not advisory — 8/8 pipe-tests
pass, including fail-open on garbage input.

### unverified_at_runtime — read this before believing the above
- **`verify.sh` has never run green.** Node 22 against Angular CLI 9.1 (`build-angular
  ~0.901` → `node-sass` 4.x) cannot install here. Proven only that its preflight fails
  honestly: exit 1, clear message, no silent pass.
- **The hook has never fired.** Hook files load at session start, so `budget.mjs` was
  never live in the session that wrote it (review §1.4). Its logic is pipe-tested;
  its integration is not. Restart the session before trusting it.
- Nothing has executed this app. There is still no runtime oracle.
