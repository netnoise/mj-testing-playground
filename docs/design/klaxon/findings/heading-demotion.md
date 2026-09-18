# Finding: heading demotion on the Klaxon board (iteration 1)

**Question this run answered:** does any layer of the frozen suite notice the board's heading
demoted from an `<h1>` to a visually identical `<div>`?

**Answer:** two tests notice, one in Jest and one in Playwright, and nothing else does. Both are
inside tests named for something else, so a red run reads as "the table listing broke", not "the
page lost its heading". Lint, the build and the smoke tier don't ask the question.

Machine-readable copy: [`heading-demotion.json`](heading-demotion.json). Every cell, its
prediction and its output file are in it.

## What was run

| | |
|---|---|
| Baseline commit | `7327964` (master), `verify.sh deep` green before and after |
| Predictions | committed at `13820cc`, before any mutated run: `.ai/run/klaxon-heading-finding/predictions.md` |
| Test revision | every spec under `src/` and `e2e/` at `7327964`, unedited |
| Mutation | `.ai/run/klaxon-heading-finding/mutations/M1-heading-demotion.patch`: `<h1>Incident Board</h1>` becomes `<div class="page-title">Incident Board</div>`, and the scss `h1` rule becomes `.page-title` |
| Visually identical | measured in the production build: `font-size`, `font-weight`, margins, `display`, width and height are equal; only the tag differs (`mutations/metrics.baseline.json`, `metrics.mutated.json`) |
| Commands | `npm run lint`, `npm run build`, `npx jest --ci --json`, `HARNESS_DEEP=1 npx playwright test --reporter=list,json`; each layer run directly, because `verify.sh deep` stops at its first failing tier |
| Environment | Darwin 25.5.0 arm64, Node v24.11.1, Jest 30.5.2, Playwright 1.30.0 (chromium) |
| Scenario | none: fixed fixture and clock, each cell ran once |

## Result

| Layer | Cells | Caught | Missed | Not applicable |
|---|---|---|---|---|
| Jest, `board.spec.ts` | 7 | **1** | 6 | |
| Jest, four other files | 17 | | | 17 |
| Playwright, `board.spec.ts` | 6 | **1** | 5 | |
| Playwright, `smoke.spec.ts` | 2 | | 2 | |
| Lint | 1 | | 1 | |
| Build | 1 | | 1 | |
| Axe, visual regression | 2 | | | `not run`: not installed |

The two catches are:
- Jest: "Board lists every incident in a table with column headers, and shows severity as visible
  text" (`src/app/board/board.spec.ts:26` asserts the level-1 heading).
- Playwright: "filters by severity and shows the details of a clicked incident"
  (`e2e/board.spec.ts:11`).

All 36 cells came out as predicted. That says the suite is predictable by reading it, not that the
predictions were careful.

## Do the failures name the cause?

| | Predicted | Observed | Reading |
|---|---|---|---|
| Jest | "Unable to find an accessible element with the role "heading" and level "1"" | `TestingLibraryElementError: Unable to find an accessible element with the role "heading"`, then about 1,200 lines of DOM and role dump | Names the missing role, **not the level**; the cause is in the first line but the useful part is buried under the dump |
| Playwright | `getByRole(… level: 1)` "element(s) not found" | `expect(received).toBeVisible()`, waiting for `getByRole('heading', { name: 'Incident Board', level: 1 })`, `unexpected value "hidden"`, after the 5s timeout | Names role, level and text, but says "hidden", so a reader has to infer "absent" |

Both stop their test at the first assertion, so on the mutated tree the table, severity and filter
assertions in the same tests were **not evaluated**. A failing run therefore hides whether the
rest of the test would still pass.

## What this describes, and what it doesn't

- It describes this suite's assertions, not Jest or Playwright: another test asking for a level-1
  heading would have caught it too.
- The catch is incidental. Neither test's title mentions a heading, so nobody reading a failing
  title would guess the cause.
- Compared with the old app (`.ai/run/klaxon-claims-correction/evidence.md`, `.ai/run/old-baseline-findings/evidence.md`),
  where a class-selector test failed on the demotion with a null `TypeError` and failed identically
  on a harmless class rename, these role-based tests fail with a message about a heading.
- **Not run in this iteration:** whether a harmless refactor (renaming a class) leaves these tests
  green. It is predicted to, and it is untested, so the "does not fail on harmless changes" half of
  the comparison is still a hypothesis.

## Caveats

- One run per cell, no flake check; `replay.sh` reproduced every outcome a second time.
- Axe and visual regression don't exist yet; the demotion may well be caught there, and that is a
  later iteration row, never an overwrite of this one.
- Lint's `templateAccessibility` ruleset was predicted to miss this at medium confidence, and it did.

## Evidence and replay

- Patch, raw output per layer, `results.tsv`, `metrics.*.json`, `collect.mjs`, `make-record.mjs`
  and `replay.sh`: `.ai/run/klaxon-heading-finding/mutations/`.
- The tree after the revert is clean (`restored-diffstat.txt` is empty) and `verify.sh deep` is green
  on it (`output/restored.deep.txt`).
- `sh .ai/run/klaxon-heading-finding/mutations/replay.sh` re-runs both trees and exits nonzero if any
  outcome differs from `results.tsv`. Negative control: with one recorded row falsified it exits 1
  (recorded in the run journal). Needs port 4200 free.
