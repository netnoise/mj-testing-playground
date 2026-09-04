# Vehicle brand/model selection
run: vehicle-selection · started 2026-09-04

## Understand
- Repo has no domain code: `src/app/app.module.ts:1`, `src/app/app.component.ts:8`
  (title-only component). This is the first real feature (`.ai/MODEL.md`).
- `.eslintrc.json:13` requires camelCase `app` attribute directives,
  `.eslintrc.json:17` requires `app-` kebab element selectors.
- `src/app/app.component.spec.ts:20` is the repo's only spec, `toBeTruthy()`-shaped.
- `e2e/app.spec.ts:3` is the repo's only e2e spec, asserting the welcome text.
- Docs' running example (`docs/vibe-harness.html`) uses "vehicle brand → models"
  throughout as the illustrative feature. Making it real closes that loop.

## Model of the system  ← human-owned
No existing state management. Brand selection is form state; models are a pure
function of the selected brand (static lookup, no backend). One service is the
single owner; components only read/write through it. (correct me if wrong)

## Hypothesis
A `VehicleService` exposing `models$(brand)` plus two dumb components
(`brand-select`, `model-list`) wired through `AppComponent` is enough to
demonstrate real derived state with zero new dependencies.
Falsified if: the brand/model relationship needs anything RxJS's `combineLatest`
+ a `BehaviorSubject` can't express — then a real state library is warranted,
which is door 1 and stops here.

## Blast radius
- `src/app/vehicle/**` (new: service, brand-select, model-list, specs)
- `src/app/app.component.{ts,html,sass}` (wire the feature in)
- `src/app/app.module.ts` (declare new components)
- `e2e/app.spec.ts` (extend, don't replace, the existing smoke assertion)
- `.ai/run/vehicle-selection/**`

## Doors
None expected. No dependency, no migration, no external contract, no test
deleted or weakened, nothing under auth. Zero new packages — the hypothesis's
falsification condition is exactly the trip-wire for door 1.

## Open decisions
Selecting a brand with no matching models (or an unrecognized brand) — clear
the model list, or leave the previous selection showing? Default: clear.
Reasoning: a stale list showing models for the *previous* brand while a new,
empty-result brand is selected is a worse UX bug than a moment of emptiness.
Reversible in a one-line change if wrong.
