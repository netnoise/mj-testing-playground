# Testing techniques: adoption roadmap

The sequence for adopting what [`testing-techniques.md`](./testing-techniques.md)
catalogues. Phases are ordered by **prerequisite, not by appeal** — the most
interesting techniques are not first, because several of them are worthless
without CI underneath.

Each phase states: scope · files · doors · verification · exit criteria.

## The doors, up front

This repo treats some decisions as one-way and requires a human to make them
(`.ai/HARNESS.md`). Two recur here, and they are listed per phase so they can be
approved in batch rather than discovered mid-run:

- **Door 1 — dependency add.** Phases 3, 4, 5.
- **Door 7 — gate-scope config edit.** Enforced in code at
  `.claude/hooks/budget.mjs:43` over `jest.config.js`, `setup-jest.ts`,
  `playwright.config.ts`, `.eslintrc.json`, `angular.json`, `tsconfig*.json`,
  and `.ai/harness/verify.sh`. Possibly phase 2, definitely phase 7.

Neither `docs/**` nor `.github/**` is in that scope, so phases 1 and this
document are door-free.

One rule outranks the sequence: **never weaken an existing test or widen a gate's
own config to make a phase pass.** That is door 4 and door 7 respectively, and
it is the failure mode every phase below is vulnerable to, because the symptom
is a better number.

---

## Phase 0 — Close the free gaps

**Why first** — Everything here is already paid for. No dependency, no door, no
CI. It is also the honest baseline: phase 4 audits these specs, and auditing the
current ones would mostly report that they assert too little.

**Scope**

1. Strengthen the existing specs against known gaps:
   - `src/app/app.component.spec.ts:24` — `expect(app).toBeTruthy()` passes for
     any component that constructs. Replace with an assertion that could fail.
   - `src/app/vehicle/model-list.component.spec.ts` uses
     `expect.arrayContaining`, so a *missing* model still passes. Assert exact
     contents.
   - Only Toyota is ever asserted. Honda and Ford exist in `BRAND_MODELS`
     (`src/app/vehicle/vehicle.service.ts:6-8`) and are never tested.
   - The reset path is untested: `selectBrand(null)` and the `value || null`
     empty-string coercion at `src/app/vehicle/brand-select.component.ts:16`.
2. Add `play()` interaction tests. `@storybook/addon-interactions` is already
   installed (`package.json:46`) and no story uses it.
3. Add the missing `brand-select` story, and a `moduleMetadata` override so
   `ModelListComponent` can render a populated state — today its only export is
   `Empty` because it has no way to be anything else.

**Files** — `src/**/*.spec.ts`, `src/**/*.stories.ts`
**Doors** — None.
**Verification** — `verify.sh full`.
**Exit criteria** — Every brand asserted; the reset path covered; at least one
story asserting through `play()`; no spec remaining whose failure is impossible.

---

## Phase 1 — CI

**Why second** — It is the prerequisite for phases 2 and 4, and it converts the
whole suite from "runs when someone remembers" to "runs". Visual-regression
baselines are OS- and browser-dependent, so a baseline generated on a laptop
will not match a CI runner; mutation scores and flaky detection both need run
history to mean anything.

**Scope** — A workflow running `.ai/harness/verify.sh`, which is already the
repo's single gate contract and needs no new definition of "passing". Match the
tier to the trigger: the cheap tier on push, the full tier on pull request.
Note `node_modules` must be installed first — `verify.sh` preflight-fails
without it.

**Files** — `.github/workflows/` (new)
**Doors** — None. `.github/**` is outside `GATE_SCOPE`.
**Verification** — A deliberately failing commit on a branch must go red.
A workflow that has never failed has not been shown to work.
**Exit criteria** — Every push runs a gate; the deep tier runs before merge;
dependency scanning enabled at the same time (free, and the catalog's one
immediately-applicable security entry).

---

## Phase 2 — Visual regression

**Why here** — Catches the class of defect the suite is structurally blind to:
`src/app/app.component.html` is ~500 lines of inline-styled markup that no test
touches. Zero new dependencies — Playwright's `toHaveScreenshot()` is built in.

**Scope** — Screenshot assertions on the app's states (welcome, empty selection,
populated selection). Commit baselines generated *by CI*, not locally. Adopt the
cross-browser/viewport matrix in the same change, since both want
`playwright.config.ts` and one door crossing is better than two.

**Files** — `e2e/**`, committed baseline images, `playwright.config.ts` *if*
thresholds or `snapshotPathTemplate` prove necessary
**Doors** — Door 7 **only if** `playwright.config.ts` is touched. The assertion
works unconfigured; confirm before assuming the crossing is needed. Adding
projects to the matrix *does* require it.
**Verification** — A one-pixel CSS change must fail the run. Untested baselines
are decoration.
**Exit criteria** — Baselines committed and stable across two consecutive CI
runs (an unstable baseline is a flake generator, not a gate).

---

## Phase 3 — Accessibility

**Why here** — Highest genuine quality gain per line of setup, and independent
of every other phase, so it can move earlier if priorities shift.

**Scope** — `AxeBuilder` against the app's states inside the existing e2e specs.

**Files** — `e2e/**`, `package.json`
**Doors** — **Door 1** (`@axe-core/playwright`).
**Verification** — Introduce a contrast or unlabelled-control violation and
confirm it fails.
**Exit criteria** — Runs in CI on every PR. Record explicitly that automated
tooling catches roughly a third of real accessibility defects, so the green
check is not mistaken for compliance.

---

## Phase 4 — Mutation testing

**Why here** — It audits phases 0–3. Running it before them would measure specs
already known to be weak; running it after answers the only question that
matters — do these tests assert anything?

**Scope** — Stryker over the Jest suite. Start by *reporting* the score, not
gating on it. Read the surviving mutants: each one is a change to the source
that no test noticed, and they are the actual deliverable. A threshold, if any,
comes after a baseline exists.

**Files** — `stryker.conf.json` (new), `package.json`
**Doors** — **Door 1** (`@stryker-mutator/core`, `@stryker-mutator/jest-runner`).
Not door 7 — `stryker.conf.json` is a new file, outside `GATE_SCOPE`.
**Verification** — The score is self-verifying; the trap is different. A rising
score achieved by *weakening a mutant list* is exactly the door-7 failure mode
in another costume. Never narrow what is mutated to improve the number.
**Exit criteria** — Baseline score recorded, surviving mutants triaged, and any
that reveal a genuinely untested behaviour turned into specs.

---

## Phase 5 — Property-based testing

**Scope** — `fast-check` against `VehicleService` invariants. The first property
is `src/app/vehicle/vehicle.service.ts:18` — `(brand && BRAND_MODELS[brand]) || []`
indexes a `Record<string, …>` by arbitrary string, and `tsconfig.json` enables
neither `strict` nor `noUncheckedIndexedAccess`. The invariant: `models$` emits
an array, never `undefined`, for any string whatsoever.

**Files** — `src/**/*.spec.ts`, `package.json`
**Doors** — **Door 1** (`fast-check`).
**Verification** — A deliberately broken implementation must be caught, and the
shrunk counter-example must be minimal enough to read.
**Exit criteria** — At least one property covering the unchecked index path.

---

## Phase 6 — Playground showcase

**Why last** — These are demonstrations rather than protections, which is a
legitimate goal in a repo named "testing playground" but not a reason to
prioritise them over gates that catch real regressions.

**Scope**

- **Metamorphic** — `models$` is a *cold* pipe (`src/app/vehicle/vehicle.service.ts:17`),
  so every subscriber re-runs `map`. Assert N subscribers see identical
  sequences, and that A → B → A yields the same list both times.
- **Model-based** — the `null → brand → null` state machine, seeded at
  `src/app/vehicle/vehicle.service.ts:13`. Note there is no
  `distinctUntilChanged`, so re-selecting the same brand re-emits; pin that
  deliberately rather than leaving it accidental. Rides on phase 5's
  `fast-check`, so no new door.
- **Approval testing** — characterise the stock welcome markup as illustration.

**Files** — `src/**/*.spec.ts`
**Doors** — None, given phase 5.
**Verification** — `verify.sh full`.
**Exit criteria** — Each technique represented by one readable example whose
`it(...)` names the invariant it protects.

---

## Phase 7 — Static analysis (opportunistic)

Not a testing technique as such, but it removes whole defect classes that tests
would otherwise have to catch. `tsconfig.json` enables `strictTemplates`,
`strictInjectionParameters` and `strictInputAccessModifiers`, but **not**
`strict` — so `strictNullChecks` is off, and the unchecked index at
`vehicle.service.ts:18` that phase 5 writes a property for would largely be a
compile error under `noUncheckedIndexedAccess`.

Also unlinted and untype-checked: `e2e/` appears in neither `.eslintrc.json`'s
scope nor `tsconfig.spec.json`'s includes, so the Playwright specs are checked
by nothing.

**Doors** — **Door 7**, unavoidably (`tsconfig*.json`, `.eslintrc.json`,
`angular.json`). Enabling `strict` on existing code surfaces errors that must be
fixed in the same change, so this is a real piece of work, not a flag flip.
**Verdict** — Worth doing, worth doing deliberately, and not worth smuggling
into another phase's diff.

---

## Deferred, with triggers

Not scheduled, because the condition that would make them meaningful does not
hold. Each is listed with the trigger to watch for.

| Technique | Trigger |
|---|---|
| Schema validation | An API appears — do this *first*, ahead of contract testing |
| Record/replay (VCR) | An API appears and its responses are worth freezing |
| Service virtualization (MSW) | An API appears; also solves the Storybook populated-state gap |
| Contract testing (Pact) | An API appears **and** is owned by another team or release cycle |
| Differential testing | A refactor or migration creates a second implementation |
| Canary / feature flags | Anything is deployed — then it is the highest-value item here |
| Shadow traffic | Deployed, with meaningful traffic |
| Synthetic monitoring | Deployed — the existing `e2e/` specs are already close to reusable |
| Observability-driven testing | Deployed, with telemetry |
| Flaky quarantine | CI has enough run history to mine (note `playwright.config.ts` sets `retries: 2`, which hides flakes rather than surfacing them) |
| Lighthouse CI | After CI, if runtime metrics matter more than the score noise costs |
| Load testing | A server-side component exists |
| Test impact analysis | The suite is slow enough that selecting a subset saves more than it costs |
| Chaos engineering | Distributed infrastructure exists |

Techniques judged not worth adopting at all — snapshot testing, fuzzing,
combinatorial/pairwise, A/B testing, bug bars, SAST/DAST — are argued in the
catalog rather than listed here.

## Sequencing at a glance

```
Phase 0  free gaps ─────────────┐
                                ├──> Phase 4  mutation testing (audits 0-3)
Phase 1  CI ────────────────────┤
   │                            │
   ├──> Phase 2  visual regression + browser matrix
   └──> dependency scanning

Phase 3  accessibility  (independent — can move earlier)
Phase 5  property-based ──> Phase 6  showcase (metamorphic, model-based)
Phase 7  static analysis (opportunistic, door 7)
```
