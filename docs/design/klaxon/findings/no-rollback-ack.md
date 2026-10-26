# Finding: optimistic acknowledge never rolled back, on the Klaxon board (iteration 1)

**Question this run answered:** does any layer of the frozen suite notice an acknowledge that is shown at once, fails in the
fake, raises the alert, and is never put back?

**Answer:** two tests notice, the Jest and the Playwright spec written for the rollback, and nothing else does. That is by
design: both specs were written knowing this defect was next. They fail for the right reason, the status staying `ACKED`, not
for the alert, which the defect leaves in place. Lint, the build and the layout snapshot, which is taken at rest, don't ask.

Machine-readable copy: [`no-rollback-ack.json`](no-rollback-ack.json). Every cell, its prediction and its output file are in it.

## What was run

| | |
|---|---|
| Baseline commit | `8eaab01` (branch `claude/klaxon-failed-ack`); `verify.sh deep` green before and after, browser pane closed |
| Predictions | committed at `6fa33be`, before the patch existed: `.ai/run/no-rollback-ack-finding/predictions.md` |
| Test revision | every spec under `src/` and `e2e/` at `8eaab01`, unedited, including the failed-ack specs |
| Mutation | `.ai/run/no-rollback-ack-finding/mutations/M4-no-rollback.patch`: the `catch` in `Board.acknowledge` no longer removes the incident from the optimistic overlay (`src/app/board/board.ts:89`); the optimistic update and the alert stay |
| Measured | in the production build under `?scenario=ack-failed`, once the alert shows: row and inspector `LIVE` → `ACKED`, Acknowledge button offered again → gone; with no scenario nothing changes (`.ai/run/no-rollback-ack-finding/mutations/ack-state.baseline.json`, `.ai/run/no-rollback-ack-finding/mutations/ack-state.mutated.json`) |
| Commands | `npm run lint`, `npm run build`, `npx jest --ci --json`, `HARNESS_DEEP=1 npx playwright test --reporter=list,json`, `node …/layout-snapshot.mjs`; each layer run directly |
| Environment | Darwin 27.0.0, Node v24.11.1, Jest 30.5.2, Playwright 1.30.0 driving Chrome for Testing 156.0.8078.4 (see Caveats) |
| Scenario | `ack-failed` for the rollback specs, none otherwise; fixed fixture and clock, each cell ran once |

## Result

| Layer | Cells | Caught | Missed | Not applicable |
|---|---|---|---|---|
| Jest, `board-ack.spec.ts` | 4 | **1** | 3 | |
| Jest, `board.spec.ts` | 7 | | 7 | |
| Jest, five other files | 19 | | | 19 |
| Playwright, `board-ack.spec.ts` | 2 | **1** | 1 | |
| Playwright, `board.spec.ts` and `smoke.spec.ts` | 8 | | 8 | |
| Lint | 1 | | 1 | |
| Build | 1 | | 1 | |
| Layout snapshot | 1 | | 1 | |
| Axe, visual regression | 2 | | | `not run`: not installed |

45 cells; all came out as predicted. One slip in the predictions file, left as written: it counted "the other 6 tests" for
Playwright, and there are 8 outside `board-ack.spec.ts`; the cell vector is unaffected.

## How the two catches fail

- **Jest** (`src/app/board/board-ack.spec.ts:70`): `Unable to find an element with the text: LIVE.` and a dump of the row. The
  first assertion in the spec that can fail does, and the alert and button assertions after it never run.
- **Playwright** (`e2e/board-ack.spec.ts:29`): `toContainText` with expected `"LIVE"` and received the row ending in `ACKED`.
  The `alert` assertion before it passes, as predicted.

Neither message contains the word "rollback"; the spec title does. A reader of the failure sees a status that didn't change
back, which is the defect's symptom but not its cause.

## What this describes, and what it doesn't

- It describes this suite's assertions. Two specs hold the rollback, one per layer; there is no third check on it, so a change
  that weakened both would pass.
- The alert was kept so the defect is "says it failed, still shows `ACKED`". Rollback kept with the alert dropped was not run.
- The failed-ack digest said removing the override deletion fails exactly the Jest rollback spec; this run confirms that on the
  whole suite and adds the Playwright cell.

## Caveats

- **Different browser from the earlier findings.** Playwright 1.30.0 expects `chromium-1045`, which is no longer in the local
  Playwright cache, and installing it would write outside the repo. The run used the config's `PW_CHROMIUM` seam
  (`playwright.config.ts:24`) with a cached Chrome for Testing 156; the earlier findings ran Chromium 110. Baseline and
  mutated cells share a browser, so this finding is internally consistent; comparing a cell with an earlier finding's is not
  like for like.
- **The catches are partly by design**, as with `colour-only-severity.md`: the specs were written for this mutation.
- One run per cell, no flake check on the mutated cells; `replay.sh` reproduced every outcome a second time.
- Axe and visual regression don't exist yet; a later iteration row never overwrites this one.

## Evidence and replay

- Patch, raw output per layer, `results.tsv`, `ack-state.*.json`, `layout-snapshot.mjs`, `make-record.mjs`, `measure.sh` and
  `replay.sh`: `.ai/run/no-rollback-ack-finding/mutations/`. `collect.mjs` is reused from `.ai/run/klaxon-heading-finding/mutations/`.
- The tree after the revert is clean (`.ai/run/no-rollback-ack-finding/mutations/restored-diffstat.txt` is empty) and `verify.sh deep` is green on it
  (`.ai/run/no-rollback-ack-finding/mutations/output/restored.deep.txt`).
- `sh .ai/run/no-rollback-ack-finding/mutations/replay.sh` re-runs both trees and exits nonzero if any outcome differs from `results.tsv`. Negative control: with the
  Playwright catch falsified to a pass it exits 1 (`.ai/run/no-rollback-ack-finding/mutations/output/negative-control.txt`). Needs ports 4200 and 4300 free, the
  built-in browser pane closed, and `PW_CHROMIUM` set to an installed Chromium.
