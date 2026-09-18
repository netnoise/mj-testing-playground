# The Klaxon lab has one recorded result and no baseline to compare the regen against
run: old-baseline-findings · intake 2026-09-18

## Intent
Record more measured results on the **existing Angular 14 scaffold**, with zero doors, so the
later regen (0008 milestone 1) has a baseline: run the founding mutations against the e2e layer,
and plant a few defects in the `advanced-form` validators against their existing specs.

> "pick the old baseline first" — chosen from `.ai/run/2026-09-18-next-development-step/ideate.md`
> (Invert's flip). It is 0008 §5's first step, "keep the old baseline".

## Done when
- [ ] `bash .ai/harness/verify.sh deep` is green on the untouched tree, and the baseline commit
      is written down before any mutation runs. If it isn't green, stop: nothing after it is
      trustworthy.
- [ ] `predictions.md` exists and is committed **before** the first mutation is run, with one
      predicted outcome per cell (`caught` / `missed`) and the reason.
- [ ] The three existing founding patches (M1 heading demotion, M2 scss-only rename, M3
      coordinated rename, from `.ai/run/klaxon-claims-correction/mutations/`) are each run
      against the e2e spec `e2e/app.spec.ts`, and each outcome is recorded.
- [ ] At least 3 new planted defects in the `advanced-form` validators (at least one in each of
      `passwordMatchValidator` and `usernameTakenValidator`; `/understand` picks them), each run
      against the existing specs, with the outcome recorded **per spec file**, not per run.
- [ ] Every cell has: baseline commit, mutation patch, test revision, command, environment,
      full failure output (kept as a file), and a status from 0008's vocabulary. A result that
      contradicts its prediction is stated as such.
- [ ] After every mutation the tree is restored: `git diff --stat -- src/ e2e/` is empty and a
      passing run after the last revert is saved.
- [ ] `evidence.md` follows the format of `.ai/run/klaxon-claims-correction/evidence.md`, and a
      `replay.sh` reproduces the recorded outcomes at the recorded commit.

## Out of scope
- No new or edited tests. A better assertion is a *later* iteration row that never overwrites
  the first result (0008 §2), and any `*.spec.ts` edit is door 4.
- No regen, no dependency change, no config under door 7, no `src/` change that survives the run.
- No CI, no capture script, no mutation framework. If hand-recording proves expensive, say so
  in the retro: that is the evidence for the "pre-registration + capture" pitch.
- No edits to the write-up, README, wireframes or the two claude.ai artifacts. Whether the
  recorded count in those docs moves from 1 is a follow-up.
- No fixing what the mutations reveal, including weak specs found in the process.

## Doors
None expected. Mutations are transient edits on a branch (two-way). Stop and write it down if
a mutation needs a change to a spec, a config or a dependency.

## Open decisions
Assumptions, defaults chosen, cheap to reverse:
- **Which layer runs M1–M3.** Default: all three against `e2e/app.spec.ts` (patches already
  exist, so it's cheap). Cost if wrong: about three extra `deep` runs.
- **How long a `deep` run takes.** Unknown; the budget (`open-run.sh`) should be sized once
  `/understand` has measured one baseline run.
- **Blast radius note for `/understand`.** The mutations touch `src/app/app.component.html`,
  `src/app/app.component.scss` and non-spec files in `src/app/advanced-form/`, and revert them.
  Those paths have to be in the run's allowlist for the transient edits, or applied via Bash
  (which the hook does not record, `.ai/HARNESS.md` Budgets), so `/understand` should pick one
  deliberately.

## Understand
- **The baseline is green and fast.** `bash .ai/harness/verify.sh deep` passed at `32e5dc6` in
  about 10.5s wall clock (lint, jest, hook-test, production build, smoke, full e2e). Measured
  during `/understand` with no edits, so Done-when box 1 is already satisfied for this commit;
  `/implement` still re-runs it after opening the run.
- **`deep` drives the production build, not `ng serve`.** `playwright.config.ts:43-45` sets the
  web server to `node e2e/serve-dist.mjs` when `HARNESS_DEEP` is set, with
  `reuseExistingServer` forced false. So a mutation of `src/` is only seen by e2e after
  `npm run build` runs again; a bare `npx playwright test` would serve whatever `dist/` last held.
  Each e2e cell must therefore go through `verify.sh deep`, or rebuild first.
- **The e2e spec has three tests.** The shell test asserts `.app-header h1` text
  (`e2e/app.spec.ts:5`), the redirect (`:6`) and an `Advanced Form` heading by role (`:7`). The
  validation test expects one message, `Must be at least 3 characters.` (`:16`). The submit test
  fills a valid form and asserts the submitted value (`:41-43`).
- **M1–M3 apply to `app.component.html` and `.scss` only** (`.ai/run/klaxon-claims-correction/
  mutations/M1.patch`, `replay.sh`), so they already exist and `replay.sh` is a working template
  for the applying, running and reverting loop. `replay.sh` runs only the Jest spec, so an
  e2e counterpart is new work.
- **Where the validators are tested.** `passwordMatchValidator` is covered by the validators
  spec (`src/app/advanced-form/advanced-form.validators.spec.ts:19-29`) and by the component spec
  (`src/app/advanced-form/advanced-form.component.spec.ts:214-221`). `usernameTakenValidator` is covered by
  `src/app/advanced-form/advanced-form.validators.spec.ts:42-47`, `:56-61` (case-insensitivity) and `src/app/advanced-form/advanced-form.component.spec.ts:83-89`, all
  using `admin`. The e2e spec never types a taken name (`e2e/app.spec.ts:22` uses `e2euser1`)
  and never types mismatching passwords (`:25-26` both `Password1`).
- **The validators are small enough to mutate by hand.** `src/app/advanced-form/advanced-form.validators.ts:5-27`.
  The taken list is `:6`, the empty-confirm guard `:11`, the comparison `:14`, the delay `:22`.
- **`e2e/app.spec.ts:39` still clicks via `evaluate` "under the dev server"** (comment `:35-38`),
  although `deep` now serves the production build. Not this run's job (brief, Out of scope); it
  is noted only because it means the submit test isn't exercising a real click.
- **Prior art:** no bank entry on mutation runs. The relevant record is 0008 §2 and
  `.ai/run/klaxon-claims-correction/evidence.md`.

## Model of the system
*(human-owned — my best guess, correct it in one edit)*
Two layers can see a `src/` mutation: Jest (jsdom, component and unit specs, reads source
directly) and Playwright (real browser, production `dist/`, only after a rebuild). They fail on
different mutations. The unit layer pins validator *logic* by example; the e2e layer pins the
shell and one happy path. A mutation that changes logic a spec never feeds an input for
(`angular` in the taken list, a case-only password difference) is invisible to both, and that
is a statement about those specs' inputs, not about Jest or Playwright.

## Hypothesis
Serves every Done-when box. The predictions to pre-register (final wording goes in
`predictions.md`, committed before any run):

| # | Mutation | Layer | Predicted |
|---|---|---|---|
| M1 | `<h1>` → `<div class="title">` | e2e | **caught** (`.app-header h1` at `e2e/app.spec.ts:5` finds nothing) |
| M2 | scss-only `.app-header` rename | e2e | **missed** (DOM unchanged; nothing asserts styling) |
| M3 | coordinated template+scss rename | e2e | **caught**, same failure as M1 (the locator is a class selector) |
| V1 | delete the `!confirmPassword.value` guard (`src/app/advanced-form/advanced-form.validators.ts:11`) | jest | **caught** by `src/app/advanced-form/advanced-form.validators.spec.ts:19` |
| V2 | compare passwords case-insensitively (`:14`) | jest + e2e | **missed** by every spec (no case-only pair is ever fed) |
| V3 | drop `'angular'` from `TAKEN_USERNAMES` (`:6`) | jest + e2e | **missed** by every spec (only `admin` is tried) |
| V4 | `timer(delayMs)` → `timer(0)` (`:22`) | jest + e2e | **missed** at e2e (a real wait isn't asserted), and unclear in jest (predict **missed**: `tick(delay)` still passes) |

V1–V4 are proposals, not requirements: `/implement` may swap one if it doesn't apply cleanly.
The rule that matters is at least one mutation per validator, and a prediction written before
each run.

Falsified if: the baseline `deep` run at the recorded commit is not green, or a prediction in
the table above is contradicted by a run. The second is not a failure of the run, it is
the result, and is recorded as such (0008 §2). Falsified as a *plan* if a `src/` mutation
cannot be applied and reverted cleanly (`git diff --stat -- src/ e2e/` non-empty afterwards).

## Blast radius
- `src/app/app.component.html`
- `src/app/app.component.scss`
- `src/app/advanced-form/advanced-form.validators.ts`

These are edited transiently and reverted; the run's net diff in `src/` and `e2e/` must be
empty. No `*.spec.ts` and no config path is listed on purpose (door 4 and door 7 stay closed).

**Decision (stated so it is not silent):** apply and revert mutations with `git apply` /
`git apply -R` through Bash, as `replay.sh` does, not with Edit. The hook does not record Bash
edits (`.ai/HARNESS.md`, Budgets), so nothing is hidden by that: `close-run.sh` measures
`files_touched` against `base_commit` at close, when the tree is clean again, and the patches
and outputs under the run directory are the record. The three paths above stay in the
allowlist so an Edit is allowed if a patch needs adjusting.

## Doors
None crossed. Both sides: a mutation that needed a spec edit (door 4), a config change
(door 7) or a new package (door 1) would stop the run; none of V1–V4 or M1–M3 does.
Cost of being wrong: a stray mutation left in `src/`. Mitigation: `replay.sh`-style refusal to
start on a dirty `src/`, and a `git diff --stat -- src/ e2e/` check after every revert.

## Open decisions
None. (Budget resolved by measurement: a `deep` run is ~10s, so 8 runs plus writing is well
inside a 30-minute, 8-file run; suggested `open-run.sh` numbers: 30 minutes, 8 files.)
