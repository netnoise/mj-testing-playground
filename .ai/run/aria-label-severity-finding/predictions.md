# Predictions — written and committed before the patch exists or any layer is run against it

- **Baseline commit:** `9db523f` (branch `claude/klaxon-aria-label-variant`, stacked on `claude/klaxon-colour-severity`); the
  run's `base_commit`. `verify.sh deep` was green on it twice in a row before this file was written
  (`.ai/run/aria-label-severity-finding/mutations/output/baseline-deep.txt`). An earlier baseline run failed; its cause
  and the evidence are in `.ai/run/aria-label-severity-finding/journal.md`. `src/` and `e2e/` are unchanged since `59631ef`.
- **Test revision:** every spec under `src/` and `e2e/` as of `9db523f`, frozen, not edited; the same suite as the
  heading-demotion, harmless-refactor and colour-only findings.
- **Mutation M3-aria-label-severity** (patch to be written next, in `mutations/`): the row badge keeps no visible text but
  gains `role="img"` and `aria-label` carrying the same short string (`CRIT`/`MAJ`/`MIN`); the stylesheet is the
  colour-only patch's filled 14px circle. The filter buttons and the inspector are untouched.
- **Comparison:** the colour-only finding (`docs/design/klaxon/findings/colour-only-severity.json`) is the reference vector.
- **Rule (0008 §2):** hypotheses. A cell that differs is recorded as a difference; this file is never edited afterwards.
- **Vocabulary:** `caught`, `missed`, `not applicable`, `not run`.

## Predicted outcomes (35 cells, identical to the colour-only run's)

| Layer | Cell | Predicted | Reason |
|---|---|---|---|
| Jest `board.spec.ts` | "lists every incident in a table with column headers, and shows severity as visible text" | **caught** | `within(row).getByText` (`src/app/board/board.spec.ts:34`) reads text content, and `aria-label` is not text content |
| Jest `board.spec.ts` | the other 6 tests | **missed** | none reads a row's badge |
| Jest, four other files | 17 tests | **not applicable** | they never render `Board` |
| Playwright `board.spec.ts` | all 6 tests | **missed** | severity is read only through the filter buttons and inspector (`e2e/board.spec.ts:14`, `e2e/board.spec.ts:20`) |
| Playwright `smoke.spec.ts` | 2 tests | **missed** | asserts nothing about content |
| Lint | 1 | **missed** | `role="img"` with a label is valid ARIA; medium confidence, because `templateAccessibility` is on (`eslint.config.js:28`) |
| Build | 1 | **missed** | the template still compiles |
| Layout snapshot | 1 | **caught** | it records each element's `role` and text, and both change, plus the reflow |
| Axe, visual regression | — | **not run** | not installed |

Expected tally: 2 caught, 16 missed, 17 not applicable among the 35, plus axe and visual as two `not run` rows.

## Predicted failure message (Jest catch)
`Unable to find an element with the text: CRIT.` followed by a dump of one `<tr>`, now with
`role="img"` and `aria-label="CRIT"` visible on the span. The message names the lost **text**, not the kept name, so
nothing in it tells a reader the badge is still accessible.

## Predicted measurement (script, not a test)
In the production build, for all 12 rows: badge text empty; the row's first cell's accessible name `CRIT`/`MAJ`/`MIN`;
`getByRole('img', { name })` finds 12 badges; `color` unchanged from baseline.

## What the expected result means, and what would falsify it
If the vector equals the colour-only run's, the finding is that **the suite cannot tell "visually absent but named" from
"absent entirely"**: its one catch is keyed to text content, and no layer that could see a name (axe) exists. Falsified if any
cell differs from the colour-only run, or lint flags `role="img"`. A Playwright catch would contradict the claim that no
end-to-end test reads a row badge.
