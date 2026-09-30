# Finding: colour-only severity badge on the Klaxon board (iteration 1)

**Question this run answered:** does any layer of the frozen suite notice the board table's severity
badge reduced to a coloured mark with no text and no accessible name?

**Answer:** one Jest test notices, and the layout snapshot notices. No Playwright test, lint, the
build or the smoke tier does. The Jest catch is partly by design: the suite was written knowing this
mutation was planned, and that test is titled "…shows severity as visible text". The snapshot catch
is real but noisy: it flags 123 of 162 elements, because the narrower mark reflows the whole table.

Machine-readable copy: [`colour-only-severity.json`](colour-only-severity.json). Every cell, its
prediction and its output file are in it.

## What was run

| | |
|---|---|
| Baseline commit | `e56bed4` (branch `claude/klaxon-colour-severity`, from `master` at `59631ef`); `verify.sh deep` green before and after |
| Predictions | committed at `011662d`, before the patch existed: `.ai/run/colour-only-severity-finding/predictions.md` |
| Test revision | every spec under `src/` and `e2e/` at `e56bed4`, unchanged since `59631ef`, unedited; the same suite as [`heading-demotion.md`](heading-demotion.md) |
| Mutation | `.ai/run/colour-only-severity-finding/mutations/M2-colour-only-severity.patch`: the row badge loses its `{{ … .short }}` text (`src/app/board/board.html:47`), and `.sev` becomes a 14px filled circle in the same colour (`src/app/board/board.scss:124`) |
| What stays | the filter buttons (`Critical 3`…) and the inspector's `Severity` row still say the severity in words, so "colour-only" here means colour-only **in the table row** |
| Measured | in the production build, all 12 badges: text `CRIT`/`MAJ`/`MIN` → empty; the row's first cell's accessible name `CRIT` → empty; no `aria-label`, `aria-labelledby` or `title` afterwards; `color` equal in every row (`.ai/run/colour-only-severity-finding/mutations/badge.baseline.json`, `.ai/run/colour-only-severity-finding/mutations/badge.mutated.json`) |
| Commands | `npm run lint`, `npm run build`, `npx jest --ci --json`, `HARNESS_DEEP=1 npx playwright test --reporter=list,json`, `node …/layout-snapshot.mjs`; each layer run directly, because `verify.sh deep` stops at its first failing tier |
| Environment | Darwin 25.5.0 arm64, Node v24.11.1, Jest 30.5.2, Playwright 1.30.0 (chromium) |
| Scenario | none: fixed fixture and clock, each cell ran once |

## Result

| Layer | Cells | Caught | Missed | Not applicable |
|---|---|---|---|---|
| Jest, `board.spec.ts` | 7 | **1** | 6 | |
| Jest, four other files | 17 | | | 17 |
| Playwright, `board.spec.ts` | 6 | | 6 | |
| Playwright, `smoke.spec.ts` | 2 | | 2 | |
| Lint | 1 | | 1 | |
| Build | 1 | | 1 | |
| Layout snapshot | 1 | **1** | | |
| Axe, visual regression | 2 | | | `not run`: not installed |

The Jest catch is "Board lists every incident in a table with column headers, and shows severity as
visible text" (`src/app/board/board.spec.ts:34` looks up each row's short label). All 37 cells came
out as predicted, including the wording of the failure.

## Do the failures name the cause?

| | Predicted | Observed | Reading |
|---|---|---|---|
| Jest | "Unable to find an element with the text: CRIT." then a DOM dump | exactly that, then a dump of one `<tr>` with an empty `<span class="sev sev-critical"/>` | Names the lost text in the first line, and the dump is short and shows the empty span. Better than the heading finding's 1,200 lines |
| Layout snapshot | "the badge's text and width change" | 123 of 162 elements differ: 12 text changes (the badges) and 111 box-only changes, because the narrower mark shifts column widths | The difference is real, but a reader can't tell from the count that severity was lost; the heading demotion changed exactly one element, this changes most of the table |

The Jest test stops at the first row, so the later rows' checks were not evaluated on the mutated tree.

## What this describes, and what it doesn't

- It describes this suite's assertions, not Jest or Playwright. The Playwright assertions that
  read severity (`e2e/board.spec.ts:14`, `:20`) read the filter buttons and the inspector, which
  the mutation leaves alone, so they say nothing about the table badge. Whether a Playwright test that
  asserted a row's badge would catch it is a different question, not run here.
- The earlier README figure, "predicted 0 of 5", was a hypothesis and is **falsified for Jest**: one
  test catches it, because the suite already guards this exact property on purpose. It was never a
  blind result, and the record does not present it as one.
- The mutation removes text and accessible name together. A variant that hides the text visually but
  keeps an `aria-label` was not run; role-and-name queries would very likely pass it, and only a visual
  layer would see it. That is a separate iteration.
- Severity is still available elsewhere on the page, so this is not a page that has lost severity
  altogether, and an axe rule about colour alone may or may not flag it. Axe does not exist here.

## Caveats

- One run per cell, no flake check; `replay.sh` reproduced every outcome a second time.
- Axe and visual regression don't exist yet; the defect would very likely be caught by a visual layer,
  and that is a later iteration row, never an overwrite of this one.
- The layout snapshot normalises `app-*` host tags (see [`harmless-refactors.md`](harmless-refactors.md)),
  which does not matter for this patch.

## Evidence and replay

- Patch, raw output per layer, `results.tsv`, `badge.*.json`, `layout-snapshot.mjs`, `make-record.mjs`
  and `replay.sh`: `.ai/run/colour-only-severity-finding/mutations/`. `collect.mjs` is reused from
  `.ai/run/klaxon-heading-finding/mutations/`.
- The tree after the revert is clean (`.ai/run/colour-only-severity-finding/mutations/restored-diffstat.txt` is empty) and `verify.sh deep` is green
  on it (`.ai/run/colour-only-severity-finding/mutations/output/restored.deep.txt`).
- `sh .ai/run/colour-only-severity-finding/mutations/replay.sh` re-runs both trees and exits nonzero if
  any outcome differs from `results.tsv`. Negative control: with the Jest catch falsified to a pass it
  exits 1 (`.ai/run/colour-only-severity-finding/mutations/output/negative-control.txt`). Needs ports 4200 and 4300 free.
