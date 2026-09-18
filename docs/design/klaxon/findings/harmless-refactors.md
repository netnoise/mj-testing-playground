# Finding: harmless refactors on the Klaxon board (iteration 1b)

**Question this run answered:** do the frozen board tests stay green when the board is refactored
without changing behaviour, roles or looks? It closes the open question in
[`heading-demotion.md`](heading-demotion.md), which showed the suite *notices* a demoted heading
but not whether it also reacts to changes that don't matter.

**Answer:** no test reacted. Across three behaviour-preserving refactors, 105 cells (lint, build,
24 Jest tests, 8 Playwright tests, and a layout snapshot per patch) all stayed green, and the
snapshot of everything the board renders was identical to the baseline for all 162 elements.

Machine-readable copy: [`harmless-refactors.json`](harmless-refactors.json).

## What was run

| | |
|---|---|
| Baseline commit | `c44571d` (master); `verify.sh deep` green before and after |
| Predictions | committed at `45c9559`, before any patch was applied: `.ai/run/klaxon-refactor-check/predictions.md` |
| Test revision | every spec under `src/` and `e2e/`, identical to `7327964` (the first finding's suite), unedited |
| `R1` | coordinated class rename: `.board-header` → `.page-header` in the template and the stylesheet |
| `R2` | component selector rename: `app-board` → `app-incident-board` |
| `R3` | internal signal rename: `filter` → `severityFilter`, in the class and its one template use |
| Layout snapshot | tag, role, `aria-pressed`, text, typography, spacing and position of all 162 elements inside `<main>`, with a row selected; host `app-*` tags normalised because R2 legitimately changes one |
| Commands | as in the first finding, plus `node .ai/run/klaxon-refactor-check/mutations/layout-snapshot.mjs`; each layer run directly |
| Environment | Darwin 25.5.0 arm64, Node v24.11.1, Jest 30.5.2, Playwright 1.30.0 (chromium) |
| Scenario | none: fixed fixture and clock, each cell ran once |

For these cells a red result is `flagged` and a green one `unchanged`, because decision 0008's
`caught` and `missed` describe defects and these changes are not defects.

## Result

| Patch | Lint | Build | Jest (24) | Playwright (8) | Layout snapshot |
|---|---|---|---|---|---|
| `R1` | unchanged | unchanged | 0 flagged | 0 flagged | equal |
| `R2` | unchanged | unchanged | 0 flagged | 0 flagged | equal |
| `R3` | unchanged | unchanged | 0 flagged | 0 flagged | equal |

All 105 cells matched the prediction ("every cell unchanged"). The prediction text says 34 cells
per patch and 102 in total; the correct counts are 35 and 105, because it left the layout snapshot
out of the sum. The statuses were right and the arithmetic was wrong.

## Can this check fail?

Two proofs, both run in this iteration:
- The same layout snapshot on the heading-demotion patch from the first finding differs in exactly
  one element (`h1` → `div`), so it can see a change that matters.
- With one recorded row falsified, `replay.sh` exits 1; on the untouched record it exits 0.

## What this describes, and what it doesn't

- It describes this suite: every board query is by role and name, so a class, a component selector
  and a private member name are not in what it reads. The old app's class-selector test failed
  identically on a demotion and a harmless rename; these tests separate the two, catching the
  demotion (first finding) and ignoring the renames (this one).
- It does **not** show that any refactor is safe. Only three were tried, all of which leave the
  DOM structure, roles and text unchanged. A refactor that adds a wrapper element, changes an
  element type or reorders content is a different experiment, and one of those (a `<header>` swapped
  for a `<div>`, losing the banner landmark) would be a defect, not a harmless change.
- Each cell ran once; `replay.sh` reproduced every outcome a second time.

## Evidence and replay

- Patches, raw output per layer, the four layout snapshots, `results.tsv`, `layout-snapshot.mjs`,
  `make-record.mjs` and `replay.sh`: `.ai/run/klaxon-refactor-check/mutations/`.
- The tree is clean after every revert and `verify.sh deep` is green on the restored tree
  (`output/restored.deep.txt`).
- `sh .ai/run/klaxon-refactor-check/mutations/replay.sh` re-runs all four trees and exits nonzero on
  any difference from `results.tsv`. It needs ports 4200 and 4300 free.
