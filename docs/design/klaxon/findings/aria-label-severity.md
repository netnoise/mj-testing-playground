# Finding: severity badge hidden but still named, on the Klaxon board (iteration 1)

**Question this run answered:** can the frozen suite tell a severity badge that is visually gone but still named for
assistive technology from one that is gone entirely ([`colour-only-severity.md`](colour-only-severity.md))?

**Answer:** no. All 35 comparable cells came out identical to the colour-only run: the same Jest test and the same layout
snapshot caught it, and every other layer missed. The Jest catch is keyed to text content, which this variant also removes,
so it fires whether or not the accessible name survived. Nothing in the suite reads a name off a badge, and axe, the layer
that might, doesn't exist here.

Machine-readable copy: [`aria-label-severity.json`](aria-label-severity.json), with a `compared_with` block.

## What was run

| | |
|---|---|
| Baseline commit | `9db523f` (branch `claude/klaxon-aria-label-variant`, stacked on `claude/klaxon-colour-severity`); `verify.sh deep` green twice before and after (see the caveat on the first baseline run) |
| Predictions | committed at `51ebe68`, before the patch existed: `.ai/run/aria-label-severity-finding/predictions.md` |
| Test revision | every spec under `src/` and `e2e/` at `9db523f` (unchanged since `59631ef`), unedited; the same suite as the three earlier findings |
| Mutation | `.ai/run/aria-label-severity-finding/mutations/M3-aria-label-severity.patch`: the row badge becomes `<span class="sev …" role="img" [attr.aria-label]="severityLabel[…].short">` with no text (`src/app/board/board.html:47`); the stylesheet change is identical to the colour-only patch (`src/app/board/board.scss:124`) |
| What stays | the filter buttons and the inspector's `Severity` row; as before, "hidden" applies to the table row only |
| Measured | in the production build, all 12 badges: text `CRIT`/`MAJ`/`MIN` → empty; the row's first cell's accessible name `CRIT` → `CRIT` (unchanged); `getByRole('img', { name })` finds 0 badges before and 12 after; `color` equal in every row (`.ai/run/aria-label-severity-finding/mutations/badge.baseline.json`, `.ai/run/aria-label-severity-finding/mutations/badge.mutated.json`) |
| Commands, environment, scenario | as in [`colour-only-severity.md`](colour-only-severity.md); one patch, each cell ran once |

## Result

| Layer | Cells | Caught | Missed | Not applicable | Same as colour-only |
|---|---|---|---|---|---|
| Jest, `board.spec.ts` | 7 | **1** | 6 | | 7 of 7 |
| Jest, four other files | 17 | | | 17 | 17 of 17 |
| Playwright, `board.spec.ts` | 6 | | 6 | | 6 of 6 |
| Playwright, `smoke.spec.ts` | 2 | | 2 | | 2 of 2 |
| Lint | 1 | | 1 | | yes |
| Build | 1 | | 1 | | yes |
| Layout snapshot | 1 | **1** | | | yes |
| Axe, visual regression | 2 | | | `not run`: not installed | |

All 37 cells came out as predicted.

## Where the two variants do differ

The cells are identical, but the evidence is not. Comparing the two layout snapshots directly, 12 of 162 elements differ: the
badge spans, which carry `role="img"` here and no role there. So the snapshot holds enough to tell the two variants apart and
nothing asks it to, because its cell is a single pass or fail. The Jest failure shows the same thing: its first line is the
same "Unable to find an element with the text: CRIT.", and the dumped `<tr>` now shows `aria-label="CRIT"` and
`role="img"` on the span. The prediction said the message would not hint at the kept name; the dump does, for a reader who
gets that far. The first line does not.

## What this describes, and what it doesn't

- It describes this suite's assertions. A test that asked for `getByRole('img', { name: 'CRIT' })` would pass here and fail on
  the colour-only patch; none exists, so that difference is unobserved, not absent. The measurement above shows the query
  does separate the two trees.
- The variant keeps the same short string. A longer label (`Critical`) or visually-hidden text was not run.
- `role="img"` was needed: `aria-label` on a bare `<span>` is not reliably exposed. Lint's `templateAccessibility` ruleset
  accepted it, as predicted at medium confidence.

## Caveats

- **The first baseline run of this session failed, and it was the environment.** The keyboard-focus test in
  `e2e/board.spec.ts:23` failed in 2 of 4 `deep` runs, and in 5 and 14 of 20 isolated repeats, while two tabs were open in the
  desktop app's built-in browser pane. After I closed them it passed 20 of 20 and `deep` passed twice. The repo was not at fault;
  the run's journal has the numbers. This is a recorded local-environment hazard for `deep` and `smoke`, not a property of the suite.
- One run per cell, no flake check on the mutated cells; `replay.sh` reproduced every outcome a second time.
- Axe and visual regression don't exist yet; a later iteration row never overwrites this one.

## Evidence and replay

- Patch, raw output per layer, `results.tsv`, `badge.*.json`, `layout-snapshot.mjs`, `make-record.mjs` and `replay.sh`:
  `.ai/run/aria-label-severity-finding/mutations/`. `collect.mjs` is reused from `.ai/run/klaxon-heading-finding/mutations/`.
- The tree after the revert is clean (`.ai/run/aria-label-severity-finding/mutations/restored-diffstat.txt` is empty) and `verify.sh deep` is green on it
  (`.ai/run/aria-label-severity-finding/mutations/output/restored.deep.txt`).
- `sh .ai/run/aria-label-severity-finding/mutations/replay.sh` re-runs both trees and exits nonzero if any outcome differs from `results.tsv`. Negative control: with the
  Jest catch falsified to a pass it exits 1 (`.ai/run/aria-label-severity-finding/mutations/output/negative-control.txt`). Needs ports 4200 and 4300 free, and the
  built-in browser pane closed.
