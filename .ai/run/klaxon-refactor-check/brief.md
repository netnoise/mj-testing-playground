# The first finding says role-based tests catch a demoted heading, but not whether they survive a harmless change
run: klaxon-refactor-check · intake 2026-09-19

## Intent
Answer the one question the first finding left open: do the frozen board tests stay green when the
code is refactored without changing behaviour, semantics or looks? Three behaviour-preserving
patches are run against every layer, recorded, and reverted. No test is changed.

> "Merge, then run the harmless-refactor check" — the old class-selector tests failed identically
> on a real regression and on a harmless rename (`.ai/run/old-baseline-findings/evidence.md`); this
> checks whether the role-based tests avoid that.

## Done when
- [ ] `bash .ai/harness/verify.sh deep` is green on the untouched tree, with the baseline commit
      written down before any patch runs.
- [ ] `predictions.md` is committed before the first patched run, one predicted outcome per
      refactor and layer.
- [ ] Three patches, each applied and reverted only through `git apply`, each confirmed effective
      (`git diff --stat` non-empty): a coordinated class rename (`R1`), a component selector rename
      (`R2`), an internal signal rename (`R3`).
- [ ] For each patch, lint, build, every Jest test and every Playwright test is recorded per test.
      A test that goes red on a harmless change is recorded as `flagged`, one that stays green as
      `unchanged`.
- [ ] Each refactor is shown harmless in the browser: a layout snapshot of the heading, filters,
      table and details panel is equal before and after (font, spacing, size, position, roles).
- [ ] The tree is clean after every revert and `verify.sh deep` is green after the last one.
- [ ] `replay.sh` reproduces the outcomes, exits nonzero on a mismatch, and has a negative control;
      a finding record (Markdown and JSON) is published beside the first one and linked from it.

## Out of scope
- Editing any test, config or source beyond the transient patches.
- A behaviour-changing defect of any kind, including the CSS-only "header loses its styling" case:
  that is a defect, not a harmless refactor, and the old run already recorded it.
- Axe, visual regression, the colour-only severity mutation, the write-up, the artifacts.
- Fixing anything the run reveals.

## Doors
None. Transient edits on a branch, reverted; no test, dependency or gate-scope file is touched.

## Open decisions
None. Assumption: the vocabulary for these cells is `flagged` / `unchanged`, because the 0008
words (`caught`, `missed`) describe defects and these changes are not defects. The record says so.

## Understand
- **What the three patches touch.** R1 renames `.board-header` to `.page-header` in
  `src/app/board/board.html:1` and `src/app/board/board.scss:1`. R2 renames the component selector
  `app-board` in `src/app/board/board.ts:17`; nothing selects on it (the route renders `Board` by
  class). R3 renames the protected `filter` signal (`src/app/board/board.ts:29`) to
  `severityFilter` in the class and its one template use (`src/app/board/board.html:23`). All three
  patches apply cleanly on `c44571d` (`.ai/run/klaxon-refactor-check/mutations/`), and were made in
  a scratch repo, not by editing `src/`.
- **Why these three.** R1 is the coordinated rename that failed the old class-selector test
  identically to a defect. R2 and R3 are the other common harmless refactors (a selector and an
  internal member). A change that alters behaviour, roles or looks is excluded.
- **Every board query in the suite is by role and name.** `src/app/board/board.spec.ts:26` and
  `e2e/board.spec.ts:11` use `getByRole`; no test in either file selects a CSS class, a tag name
  through a selector or a component selector.
- **Cells and per-test recording** reuse the machinery of
  `.ai/run/klaxon-heading-finding/mutations/`, which is on `master`: `collect.mjs` turns Jest and
  Playwright JSON into per-test rows, and its `replay.sh` is the template (refuses a dirty tree, a
  used port 4200, and a patch that changed nothing; exits 1 on a mismatch).
- **Prior art:** no bank entry; the previous runs' lessons apply (confirm a control took effect,
  a replay must be able to fail).

## Model of the system
*(human-owned — my best guess, correct it in one edit)*
The suite reads the board only through the accessibility tree (roles, names, aria state) plus
fixture text, so anything that leaves that tree and the text unchanged is invisible to it. Class
names, the component selector and private member names are not in that tree.

## Hypothesis
Serves every Done-when box. All 34 test-and-tooling cells are predicted `unchanged` for each of
R1, R2 and R3 (102 cells, 0 flagged), and the layout snapshots are predicted equal.

Falsified if: any cell goes red on a refactor (a result, recorded as `flagged`, not a failure of
the run), a patch changes the layout snapshot (then it was not harmless and is reported so), or the
tree is not clean after a revert.

## Blast radius
- `src/app/board/board.html`, `src/app/board/board.scss`, `src/app/board/board.ts` (transient, reverted)
- `docs/design/klaxon/findings/**` (new record beside the first; one link added to the first)
- `docs/design/klaxon/README.md` (one sentence: the recorded-result list)

Suggested `open-run.sh`: type `feature`, 10 files, 45 minutes.
