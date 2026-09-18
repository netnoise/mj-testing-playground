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
| M1 | `<h1>{{ title }}</h1>` → `<div class="title">{{ title }}</div>` | semantic regression (heading demoted) | **fail** | `TypeError: Cannot read properties of null (reading 'textContent')` at `src/app/app.component.spec.ts:33` (column 52) |
| M2 | `.app-header {` → `.site-header {` in `app.component.scss` only | CSS-only change (header visibly loses its styling; DOM unchanged) | **pass** | 3/3 passed |
| M3 | rename `app-header` → `site-header` in the template **and** the scss | coordinated class refactor (no behaviour or semantic change) | **fail** | same `TypeError` at `:33:52` |

## What this shows

The write-up said M1 stays green and "a class rename" goes red. That was a prediction, and
half of it was wrong: the demotion does turn the test red.

### Revised reading (after outside review, same day)

The first version of this section said M1 is caught "by accident", that the spec "never asserts
on heading semantics", and that a red run gives "no diagnosis". That overstated it.
`querySelector('.app-header h1')` requires an `h1` under `.app-header`, and the test fails
without one. The result splits into properties that should be measured separately:

| Property | Result | From |
|---|---|---|
| Detects the demotion | **yes** | M1 fails |
| Survives a harmless refactor | **no**: coupled to the `.app-header` class | M3 fails |
| Says why it failed | **poorly**: M1 and M3 give the same null `TypeError`, and nothing says an `h1` was expected | `.ai/run/klaxon-claims-correction/mutations/output/M1.txt` and its `M3.txt` sibling |
| CSS-only styling change | **not seen**: a DOM query can't observe styling | M2 passes |

- Two different changes sharing one failure does not by itself invalidate a test. What is weak
  here is the message, and that the `h1` requirement is a side effect of the selector, not a stated
  expectation.
- Whether M2's pass is a *miss* depends on whether "header lost its styling" counts as a defect at
  this layer. It reads as a visual-layer concern.
- A role-based assertion (`getByRole('heading', { level: 1, name: 'mj-testing-playground' })`)
  is predicted to fail M1 with a meaningful message and pass M2 and M3. That is a **hypothesis**,
  not run: adding the test is out of scope here, and `@testing-library/dom` is not installed.

## Replay

Added 2026-09-18 by `hotfix-gate-and-claims`, so the result no longer rests on a description.
`.ai/run/klaxon-claims-correction/mutations/` holds `M1.patch`, `M2.patch`, `M3.patch`, the full
Jest output of each run in its `output/` subdirectory (with `exit=` appended), a passing
`restored.txt` run after the last revert, `environment.txt`, an empty `restored-diffstat.txt` (an
empty diff stat means `src/` and `e2e/` were clean again), and
`.ai/run/klaxon-claims-correction/mutations/replay.sh`, which applies each patch, runs the spec,
reverts it, and prints the outcome next to the recorded one. The replay ran at `12d0732`, where `src/` and
`e2e/` are identical to the recorded baseline `cb11246`. It reproduced
baseline PASS / M1 FAIL / M2 PASS / M3 FAIL.

## Not run
- `e2e/app.spec.ts:5` uses the same `.app-header h1` locator. Its predicted outcomes match the
  above, but they were **not run** (they need `verify.sh deep`).
- axe and visual layers are not installed.
