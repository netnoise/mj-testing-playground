# Evidence — founding example, actually run

- **Baseline commit:** `cb11246` (master, 2026-09-18)
- **Test revision:** `src/app/app.component.spec.ts` as of `cb11246`, frozen (not edited)
- **Command:** `npx jest src/app/app.component.spec.ts` (Jest 28.1.3, jest-preset-angular, jsdom)
- **Environment:** local macOS (Darwin 25.5.0)
- **Scenario/seed:** n/a (static template, no data)

Each mutation was applied to the working tree, run, then reverted with `git checkout -- src/app/`.
`git diff --stat -- src/ e2e/` was empty afterwards.

| # | Mutation | Kind | Spec `should render the title in the header` | Evidence |
|---|---|---|---|---|
| 0 | none | healthy baseline | **pass** | 3/3 passed |
| M1 | `<h1>{{ title }}</h1>` → `<div class="title">{{ title }}</div>` | semantic regression (heading demoted) | **fail** | `TypeError: Cannot read properties of null (reading 'textContent')` at `app.component.spec.ts:33:52` |
| M2 | `.app-header {` → `.site-header {` in `app.component.scss` only | CSS-only change (header visibly loses its styling; DOM unchanged) | **pass** | 3/3 passed |
| M3 | rename `app-header` → `site-header` in the template **and** the scss | coordinated class refactor (no behaviour or semantic change) | **fail** | same `TypeError` at `:33:52` |

## What this shows

The write-up said M1 stays green and "a class rename" goes red. That was a prediction, and
half of it was wrong:

- **M1 is caught, but by accident.** The spec fails because `querySelector` returns null and the
  test crashes. It never asserts on heading semantics.
- **M1 and M3 are indistinguishable.** The real regression and the harmless refactor produce the
  byte-identical failure. A red test that can't tell those apart gives you no diagnosis, only an
  alarm.
- **M2 passes while the page visibly changes.** A CSS-only change is invisible to a DOM query.
  Whether that is a *miss* depends on whether "header lost its styling" counts as a defect. It is
  a visual-layer concern, not a unit-layer one.

The corrected lesson: the assertion is coupled to implementation structure (`.app-header h1`), so
it fails on refactors and succeeds on semantic regressions only by coincidence. A role-based
assertion (`getByRole('heading', { level: 1, name: 'mj-testing-playground' })`) would be predicted
to fail M1 with a meaningful message and pass M2/M3. That is a **hypothesis**. It is not run here,
because adding it is a test change and out of scope for this run.

## Not run
- `e2e/app.spec.ts:5` uses the same `.app-header h1` locator. Its predicted outcomes match the
  above, but they were **not run** (they need `verify.sh deep`).
- axe and visual layers are not installed.
