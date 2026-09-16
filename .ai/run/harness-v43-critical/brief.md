# The harness's budget and door-7 numbers are not trustworthy enough to grade a feature run against
run: harness-v43-critical · started 2026-09-10 (16:40Z, from `date -u`, not typed)

Inputs read: the v4.3 delta note (triathlon repo, docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md),
`docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md`, all four retros
(ui-shell-redesign, harness-v42-r3, harness-v42-closeout, harness-v42-landing), `.ai/harness/OWED.md`,
and the landing run's untracked HANDOFF.md. Recall: one bank card (citation drift, not relevant
here), decisions 0001–0005 (none cover this) — no prior art for these defects beyond the reviews.

## Understand

Every delta-note reproduction (§6) was re-run at `1e644ea` in this session. **All of them reproduce.**
The delta is accurate. What follows is triage: which items would corrupt or endanger the *next
feature run*, which is the stated goal after this one.

### Critical — the next feature run would produce wrong numbers or silently lose enforcement

**C1. The file budget can never fire on a run that follows the rules.** The ruler is
`git diff --name-only HEAD` (`.claude/hooks/budget.mjs:182`), which only sees uncommitted work;
the prompts mandate a WIP commit on every green step (`.ai/prompts/implement.md:19`,
`.ai/HARNESS.md:107`). Every commit resets the count. The same ruler is copied into
`.ai/harness/emit.sh:35`, `.ai/harness/emit.sh:50`, `.ai/harness/close-run.sh:36` and
`.ai/harness/hook-test.sh:93`. Also, the run's own paperwork (brief, journal, digest, retro,
emits, patches — all untracked) counts against the budget.

**C2. The wall-clock budget runs from a timestamp the model types.** `.ai/prompts/understand.md:35`
templates `"started_at":"<iso>"`; the hook measures elapsed time from it
(`.claude/hooks/budget.mjs:222`). Verified: 4 of 7 `state.json` files hold round-number times, and
`.ai/run/harness-v42-r3/state.json` says `2026-09-08T23:00:00Z` while that run's first commit
`bfdede0` is `2026-09-08T22:52:11+02:00` = 20:52Z. Local time was written down as UTC, so the
90-minute budget only started counting 2h08m after the run's own first commit. `sh .ai/harness/ledger.sh`
today prints `min=-259 files=45` for r3 and exits 0. Negative minutes, and `files` sums two snapshots of
the same tree (`.ai/harness/ledger.sh:80`).

**C3. `hook-test.sh` can switch enforcement off and leave it off.** It `mv`s the live active run's
`state.json` into a stash (`.ai/harness/hook-test.sh:46`) and relies on `trap` to put it back
(`.ai/harness/hook-test.sh:57`). SIGKILL can't be trapped. A `verify.sh full` killed mid-test (by a
usage limit or a killed container, which is exactly the scenario the durability design plans for)
leaves the run with no `state.json`, and the hook then fails open for the rest of the run. Nothing
repairs it. `verify.sh full` runs this before every commit, so the exposure is on every commit
of a feature run.

**C4. Door 7 via Bash is both leaky and noisy, and the repo's own docs teach the leak.** Probes
(classify-only, nothing executed) at `1e644ea`:

| command | hook exit |
|---|---|
| `node -e "…writeFileSync('jest.config.js',…)"`, `python3 -c "open('angular.json','w')"`, `perl -pi … playwright.config.ts`, `npx prettier --write angular.json`, `sh .ai/run/x/fix.sh` | 0 (allowed) |
| **new:** `git apply .ai/run/x/budget.patch`, `npx eslint --fix .eslintrc.json` | 0 (allowed) |
| **new:** `node -e "…writeFileSync('.ai/run/x/state.json','{}')"` | 0 (allowed) |
| `cp angular.json /tmp/x`, `echo see .ai/harness/verify.sh > notes.md`, `diff jest.config.js a; rm tmp.txt` | 2 (blocked) |
| `git diff --no-index .claude/hooks/budget.mjs … > x.patch` (the delta's recommended patch form) | 2 (blocked) |

Mechanism: the hook returns early unless a listed write verb appears somewhere in the command
(`.claude/hooks/budget.mjs:115`), then blocks if a protected name appears anywhere in it
(`.claude/hooks/budget.mjs:121`). **New finding, not in the delta:** the `state.json`
single-writer check (`.claude/hooks/budget.mjs:126`) sits *behind* that same early return, so it
has the same bypass. The delta's §3 advice to "keep the narrow state.json regex" doesn't account
for this. The documented workaround for the false positives, "copy with Python"
(`.ai/harness/OWED.md:30`), is itself one of the bypasses. Each retro since R1 names this guard as
the top cost (`.ai/run/harness-v42-r3/retro.md:47`, `.ai/run/harness-v42-closeout/retro.md:59`).
The Edit/Write path (`.claude/hooks/budget.mjs:147`) is sound, and it's the path the original
Stryker incident took.

**C5. New finding, not in any review: the `smoke` oracle won't see a new feature's route.** `smoke`
visits a hand-kept list, `const ROUTES = ['/', '/advanced-form']` (`e2e/smoke.spec.ts:15`), which
copies the router config (`src/app/app-routing.module.ts:6`). A feature that adds a route and
doesn't also edit the spec gets a green `smoke`/`deep` over a route that never mounted. That's
HARNESS.md's "an empty list" vacuous pass, and it hits the first thing a feature run does. It
also breaks "one owner per fact".

### Cheap, and needed to *measure* the feature run (not integrity, but the reason to run it)

**M1. `currentRun` picks by mtime in three places.** `.ai/harness/verify.sh:111`,
`.ai/harness/check-citations.sh:21`, `.ai/harness/handoff.sh:21`, plus "last emit" by mtime at
`.ai/harness/handoff.sh:57`. The Stop hook calls `handoff.sh` with no slug
(`.claude/settings.json:21`), so editing an old run's file mid-run sends the handoff to the wrong run.
In a feature run the new run is usually the newest, so this is low-risk. It's nearly free once
`lib.mjs` exists, and `verify.sh` is being patched anyway.

**M2. Emits carry no timestamp.** The ledger can't compute deltas, and it adds snapshots together
as if they were separate work (see C2).

**M3. Nothing records what a run cost the human** (delta §1.8). That is the design's headline
promise, and the only thing a feature-dev test run can actually test. One field in
`.ai/prompts/retro.md`.

**M4. Four hook messages say "re-run with HARNESS_DOOR_OPEN=1"** (e.g. `.claude/hooks/budget.mjs:124`).
That instruction can't work: the hook reads its own environment, not the environment of the command
it's checking. This goes in the door-7 patch at no extra cost.

### Deferred — real, but not critical for a feature test (go to OWED.md at close, with reasons)

- The design page still says v4.1 (`docs/vibe-harness.html:261`), and so does the published artifact.
  That's documentation, not mechanism. It gets a v4.3 pass once this run's changes have settled.
- The trunk-ancestry check, and `close-run.sh` refusing while plan items are unticked (delta §1.9).
  These are arc-level. A single feature run doesn't have the stacked-PR shape.
- `observed_unlisted` noise, per-flow budgets (delta §4.1), capping HARNESS.md's length, and the
  content hash from the citation-drift card.
- **Re-tuning 30/90.** Explicitly *not* this run. The ruler is changing, so re-measure over 3+
  runs first (delta §2).
- Already fixed and verified, so no action: the jest worktree sweep from the ui-shell retro
  (`jest.config.js:12` now ignores `/.claude/`).

## Model of the system

← human-owned. Correct in one edit.

- One PreToolUse hook (`.claude/hooks/budget.mjs`) is the only enforcer. It fails open on
  anything unexpected, including a failed import. That's correct and stays. Everything else is
  scripts the agent calls or `verify.sh` runs.
- "Git is truth" is applied to *counting* files but not to *door 7* and not to *the run's
  anchor* (start time, base commit). Every critical item above is one of those two gaps. The fix
  is two primitives:
  1. a **run anchor** stamped by a script: `open-run.sh` writes `started_at` from the clock,
     `base_commit`, and `dirty_at_start`;
  2. a **single ruler module**, `lib.mjs`, with `runTouched(state)` (diff from `base_commit`,
     minus this run's own dir, minus `dirty_at_start`), `currentRun()` (exactly one active run,
     otherwise an error, otherwise fall back to the latest `started_at`), `hit()`, and
     `gateDiff(state)` (gate-scope paths that differ from `base_commit` and aren't named in the
     run's `door-crossings.md`).
- Door 7 becomes a **tree check**, not a string scan. `verify.sh` fails before any tier while
  `gateDiff` is non-empty. The hook refuses Edit/Write outside the run directory while it's
  non-empty. Disclosing (writing `door-crossings.md`) and reverting stay possible, so it can't
  lock the session. This detects a write after the fact instead of preventing it. Git makes that
  revertible, and it's the only version that catches `python3`/`node`/`git apply`.
- **Where I'm least sure:**
  - With **no active run** (the `tiny` flow, or ad-hoc work) the tree check can only compare
    against `HEAD`, so a Bash write that gets committed with no run open goes unseen. The
    Edit/Write door-7 block is unaffected. I'd tag that one case `advisory:` rather than invent
    a no-run disclosure store.
  - A gate-scope file **already dirty at run start** is *not* excused by `dirty_at_start`. It
    fails as undisclosed until it's committed or disclosed.
  - A `state.json` written by Bash (`node -e …`) stays a known gap, `advisory:`. Once the budget
    is derived from `base_commit`, the incentive that drove `rm state.json` is gone. A deliberate
    tamper is out of reach of a PreToolUse string check anyway.
- Once `budget.mjs` imports `lib.mjs`, `lib.mjs` is gate-scope (it decides what counts) and joins
  `GATE_SCOPE`. So `lib.mjs` must be finished *before* the door-7 patch, because after it lands
  the agent can no longer edit it.

## Hypothesis

C1–C4 and M1–M2 all come from the two missing primitives above. Adding `lib.mjs` and
`open-run.sh`, then routing the hook, `verify.sh`, `emit.sh`, `close-run.sh`, `handoff.sh`,
`check-citations.sh`, `ledger.sh` and `hook-test.sh` through them, closes all of these with *one*
human door-7 patch, and removes more checking code (the string scans, 5 ruler copies, 4 run
pickers, the stash) than it adds. C5 is independent: a jest spec that fails when a router path is
missing from smoke's route list, with the list in one shared module.

**Falsified if** any of these holds after the change:
- (a) In a throwaway `mktemp` repo, a fixture run that makes a WIP commit mid-run does *not* hit
  `budget_spent` at its declared limit.
- (b) The tree check can't tell a disclosed gate edit from an undisclosed one, or it still
  blocks any of the four false-positive commands in the C4 table.
- (c) `ledger.sh` still prints a negative or summed-snapshot figure for any run instead of
  marking it `legacy`/`invalid`.
- (d) Adding a route to `src/app/app-routing.module.ts` without touching the smoke list leaves
  `verify.sh full` green.
- (e) Deleting a gate-scope case from the new `hook-test.sh` doesn't turn its negative control red.

## Blast radius

Allowlisted, agent-written:
- new files (written unquoted because they don't exist yet, so they aren't citations):
  .ai/harness/lib.mjs, .ai/harness/open-run.sh
- `.ai/harness/emit.sh`, `.ai/harness/ledger.sh`, `.ai/harness/close-run.sh`,
  `.ai/harness/handoff.sh`, `.ai/harness/check-citations.sh`, `.ai/harness/hook-test.sh`,
  `.ai/harness/OWED.md`
- `.ai/prompts/understand.md` (call `open-run.sh`; delete the `<iso>` template) and
  `.ai/prompts/retro.md` (`human_touches`)
- `.ai/HARNESS.md`: the Budgets section (the ruler, the Bash guard, override semantics)
- `src/app/app-routing.module.ts` (export `routes`), `e2e/smoke.spec.ts`, plus two new files:
  e2e/smoke-routes.ts and src/app/smoke-routes.spec.ts

Door 7, human-applied (proposed in this run's directory, delivered as unified diffs):
- `.claude/hooks/budget.mjs`
- `.ai/harness/verify.sh`

**Order.** It matters because of the `lib.mjs` point in the model:
1. `lib.mjs` + `open-run.sh`
2. the non-gate consumers
3. C5
4. the proposed hook and `verify.sh`, tested by the new `hook-test.sh <hook-path>` in a `mktemp`
   repo against the *proposed* hook, including negative controls
5. unified diffs out, disclosure in `door-crossings.md` → human applies → the new `hook-test.sh`
   moves into place
6. docs + OWED, then `deep`, digest, retro

The new `hook-test.sh` can't land before the patch: its tree-check cases would fail against the
live hook, and that would turn `full` red.

**Budget:** 30 files; **150 minutes, above the 90 default.** The wall clock includes one human
review-and-apply round trip for the door-7 patch, and this run shouldn't spend its own budget
waiting on that. Stated here so it isn't a silent raise.

## Doors

- **Door 7: crossed, by design.** `budget.mjs` and `verify.sh`, plus adding `lib.mjs` to
  `GATE_SCOPE`. The two sides are:
  - (a) *leave Bash door 7 as a string scan, tagged `advisory:`*. Zero human patch, but the
    guard stays leaky and noisy through the feature test.
  - (b) *the tree check*. One patch to review.

  Default is (b), delivered as **one** unified diff per file, with a disclosure in
  `door-crossings.md` written *before* handover. Cost of being wrong: a bug in the new hook could
  refuse edits wrongly. That's bounded because the run directory and the revert path always stay
  open, the hook fails open on errors, and the proposed hook is tested in a throwaway repo before
  you see it.
- **Door 4: crossed, as a replacement, not a weakening.** `hook-test.sh`'s Bash string-scan cases
  (e.g. `.ai/harness/hook-test.sh:73`, "sed -i on jest.config.js blocked") stop being true once the
  scan is deleted. They are replaced by tree-check cases (edit a gate file in the fixture repo →
  the next non-run edit blocks → disclose → it passes), plus the delta's bypass commands as
  expected-caught cases and a negative control. I'll list the before/after case table in the digest.
- None of doors 1, 2, 3, 5 or 6. No dependencies: `lib.mjs` uses only `node:` built-ins.

## Open decisions

**One: include the tree check (C4) in this run, or defer it?**
- **Default: include it.** It shares the only human patch this run needs, and running the feature
  test against a guard already known to be leaky *and* noisy would mean measuring the harness's
  friction with its biggest known source of friction still in it.
- **Alternative: defer it.** Ship C1–C3, C5 and M1–M4 now, and tag Bash door 7 `advisory:` in
  HARNESS.md, with the bypasses recorded as `KNOWN GAP` cases in `hook-test.sh`. The door-7 patch
  gets smaller, and a second patch comes later.

Cost of taking the default when you'd have chosen the alternative: roughly 60–80 more lines to
review in the patch.
