# Ideate: the next development step

## 1. Frame

**Question:** With the Klaxon design written and corrected (0006–0008) but nothing of it in
`src/`, what single piece of work should the repo do next?

**What a good answer lets us decide:** the one pitch to hand `/intake` — including which doors
(1, 7) it asks a human to open and whether it opens them at all.

Facts checked before writing, because they shape the ideas:

- `src/` is still the Angular 14 scaffold: `AppComponent` (header + outlet) and
  `AdvancedFormComponent`, whose validators (27 lines) and specs are the only real logic.
- 0008 already fixes a sequence for milestone 1: keep the old baseline → pinned regen → board
  only → healthy baseline → plant heading demotion → finding record. Regen needs doors 1 and 7.
- Exactly one result is recorded today (heading demotion vs `app.component.spec.ts`).
  `e2e/app.spec.ts:5` uses the same `.app-header h1` locator and was **not run** under that
  mutation. The findings matrix has 30 hypotheses.
- There is no `.github/`: the gate runs when someone remembers. `docs/testing-roadmap.md`
  Phase 1 (CI) is marked door-free.
- `docs/testing-roadmap.md` Phase 0 names `src/app/vehicle/**` and a ~500-line
  `app.component.html`. Neither exists any more (`ls src/app/vehicle` fails), so the roadmap is
  stale against the code.
- Two open forks already on disk: the landing-page ideate
  (`.ai/run/2026-09-15-landing-page/ideate.md`, never picked), and three untracked run
  artifacts in `git status`.

## 2. Generate

### Obvious: start milestone 1 as 0008 wrote it
Pitch         — Open a run for the pinned Angular regen and the board-only slice (fixture, text
severity, selection/details, one filter, table semantics, states), then the healthy baseline
and the heading-demotion finding.
Must be true  — A human will approve doors 1 and 7 up front, and there is a pinned Angular
version whose toolchain (Jest, Playwright, Storybook, ESLint) all still work on it.
Cheapest test — In the scratchpad, not the repo, run `ng new` at the candidate version and
`npm ls` the tooling peers. If any of Jest, `jest-preset-angular`, Storybook or
`@angular-eslint` has no compatible release, the regen isn't ready.

### Invert: guarantee we learn nothing
Pitch         — Regenerate first and count the old baseline as "kept" because the files are in
git. Then plant a defect on a board with no comparison point. Any result is a blend of "new
Angular" and "new mutation", so it proves nothing. Flip: **finish the old baseline before
touching the regen.** Run the mutations that need only the existing scaffold: heading demotion
against `e2e/app.spec.ts` under `verify deep`, and 3–4 planted defects in the `advanced-form`
validators against their existing specs. The regen then has something to be compared with.
Must be true  — Results on the Angular 14 scaffold are a usable baseline for the rebuilt app,
not just a curiosity about a form nobody will ship.
Cheapest test — Plant `passwordMatchValidator` returning `null` on mismatch, run
`npx jest src/app/advanced-form`. If it's red, the method works on this codebase. If it's
green, that's already a finding.

### Drop a constraint: don't regenerate
Pitch         — Drop "modern Angular". Build the board slice inside the current 14.3 scaffold
with `ng generate`. No door 1, no door 7, no toolchain migration. The lab's subject is test
quality, and nothing in milestone 1's list (table semantics, focus, states) needs signals or
standalone components. **This reopens 0006 item 2**, so it needs the human to say so.
Must be true  — The findings that matter for the lab don't depend on the Angular version, or
at least the milestone-1 ones don't.
Cheapest test — Read the milestone-1 list in 0008 §5 line by line and mark each item that
genuinely needs v15+. If the list comes back empty, the regen is deferrable.

### 10× smaller (a): one hour, zero doors, one finding
Pitch         — Run the founding mutation against `e2e/app.spec.ts` (`.app-header h1` at line 5)
via `verify deep`, revert, and append the result to the existing evidence format. That takes
recorded cells from 1 of 31 to 2. It is the single hypothesis that already has a runnable
experiment.
Must be true  — `verify deep` runs cleanly on this machine (no stale server, port free).
Cheapest test — Run `bash .ai/harness/verify.sh deep` unmodified first. If it isn't green,
nothing else in this idea is trustworthy.

### 10× smaller (b): CI on push
Pitch         — A workflow that installs, then runs `verify.sh fast` on push and `full` on PR.
Roadmap Phase 1, door-free (`.github/**` is outside `GATE_SCOPE`). Converts the gate from
"someone remembers" to "runs".
Must be true  — `verify.sh full` is deterministic on a clean runner, and a workflow that has
never gone red has been shown to work.
Cheapest test — Push a branch with a deliberately failing spec and see the run go red. Also
check whether `verify.sh` preflight needs anything a fresh runner lacks.

### Borrow: pre-registration and a lab notebook
Pitch         — Clinical trials commit predictions before results, so an overturned prediction is
visible in the history. Do that for mutations: a `predictions.md` committed **before** any run,
then a script that captures the required record fields (baseline commit, patch, test revision,
command, seed, environment, failure output) mechanically, the way `emit.sh` and `handoff.sh`
already do. The next 30 cells become cheap and can't be back-filled.
Must be true  — Hand-typing those fields, not running the mutations, is what makes a finding
expensive, and 0008's "a result counts only when it names…" list can be captured by a script.
Cheapest test — Open `.ai/run/klaxon-claims-correction/evidence.md` and count which required
fields were typed by hand. If it's most of them, the script pays back on the second finding.

### Do nothing: what breaks?
Pitch         — Skip a build step and only tidy: commit or discard the three untracked run
artifacts, pick or drop the landing-page ideate, fix the stale roadmap.
Must be true  — Nothing external is waiting, and the stale roadmap will mislead the *next*
run before it misleads a person (agents read `docs/testing-roadmap.md` as a plan).
Cheapest test — Grep for who reads the roadmap (`grep -rn testing-roadmap .ai docs`). If a
prompt or decision cites it as the plan, the drift is live and doing nothing has a cost.

## 3. Judge

**Shortlist**

1. **Invert's flip — finish the old baseline, then regen.** This is 0008's own first step
   ("keep the old baseline") made concrete, it uses only doors already open, and it is where
   the repo's strongest asset is: results that can overturn a prediction. The e2e coupling
   check is the one cell with a ready experiment. It also makes the eventual regen
   measurable, which the obvious plan doesn't.
2. **Borrow — pre-registration plus mechanical capture.** It's the only idea that lowers the
   cost of *every* later finding rather than adding one. Together with the flip it would be a
   third idea, and it would need its own "must be true": that the record fields are capturable
   by script. Stands on its own as a separate pick.

**Why the obvious idea lost:** milestone 1 is right in order but wrong in timing. Starting it
now spends two doors on a build whose only comparison point is a single recorded cell. It wins
again the moment the flip has produced a baseline to compare against.

**Not shortlisted, but open:** *Drop a constraint* is the biggest lever and the only one that
contradicts a settled decision, so it's a question for the human, not a default. *CI* is good
and door-free; it lost only because it doesn't advance the lab's actual mechanism. It composes
with either shortlisted idea and could go first if a red gate would have saved a run.
*Do nothing* isn't free: the stale roadmap sends an agent looking for `src/app/vehicle/`.

## 4. Hand back

Pick one of:
- **Old baseline first** (Invert's flip), as-is,
- **Pre-registration + capture script** (Borrow), as-is,
- **combine** them — a third idea, needing its own "must be true" before `/intake`,
- **none** — say what the frame is missing.

Separately from the pick, two questions I can't resolve from the repo: is the landing-page
ideate still wanted, and do you want 0006 item 2 (regenerate on newer Angular) reopened?
A picked pitch is valid `/intake` input as-is.
