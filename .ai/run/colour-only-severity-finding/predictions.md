# Predictions — written and committed before the patch exists or any layer is run against it

- **Baseline commit:** `e56bed4` (branch `claude/klaxon-colour-severity`, cut from `master` at
  `59631ef`); the run's `base_commit`. `verify.sh deep` was green on it before this file was written
  (`.ai/run/colour-only-severity-finding/mutations/output/baseline-deep.txt`). `src/` and `e2e/` are
  unchanged since `59631ef`.
- **Test revision:** every spec under `src/` and `e2e/` as of `e56bed4`, frozen, not edited. It is the
  same suite the heading-demotion and harmless-refactor findings used.
- **Mutation M2-colour-only-severity** (patch to be written next, in `mutations/`): the table row's SEV
  badge loses its text interpolation, and the stylesheet turns the empty span into a filled mark in the
  same severity colour. No `aria-label`, no sr-only text. The filter buttons and the inspector keep
  their severity text.
- **Rule (0008 §2):** these are hypotheses. A cell that comes out differently is recorded as a
  difference; this file is never edited afterwards, and corrections go in the finding record.
- **Vocabulary:** `caught` (the layer failed), `missed` (the layer ran and passed), `not applicable`
  (the test never renders the board), `not run` (the layer doesn't exist).
- **Caveat stated in advance:** the suite was written knowing this mutation was planned
  (`src/app/board/board.spec.ts:23`, `src/app/incidents/incident.ts:16`), so a Jest catch is partly by
  design, not a blind result. The README's earlier "0 of 5" is expected to be wrong for Jest.

## Predicted outcomes (35 cells)

| Layer | Cell | Predicted | Reason |
|---|---|---|---|
| Jest `board.spec.ts` | "lists every incident in a table with column headers, and shows severity as visible text" | **caught** | looks up each row's short label with `within(row).getByText` (`src/app/board/board.spec.ts:34`) |
| Jest `board.spec.ts` | the other 6 tests | **missed** | none reads a row's badge; the inspector and filter text are untouched |
| Jest `format-age`, `incident-source`, `advanced-form.validators`, `smoke-routes` | 17 tests | **not applicable** | they never render `Board` |
| Playwright `board.spec.ts` | all 6 tests | **missed** | severity is read only through the filter buttons (`e2e/board.spec.ts:14`) and the inspector (`e2e/board.spec.ts:20`); no test reads a badge |
| Playwright `smoke.spec.ts` | 2 tests | **missed** | asserts nothing about content |
| Lint | 1 | **missed** | no rule about element content |
| Build | 1 | **missed** | the template still compiles; `severityLabel` is still used by the inspector |
| Layout snapshot | 1 | **caught** | the snapshot records each element's text and box, and the badge's text and width change |
| Axe | — | **not run** | not installed |
| Visual regression | — | **not run** | not installed |

Expected tally: 2 caught, 16 missed, 17 not applicable, 0 not run among the 35 (axe and visual are
two more `not run` rows outside them).

## Predicted failure message (for the Jest catch)
Testing Library's `Unable to find an element with the text: CRIT.` (the first fixture incident,
`INC-2891`, is critical), followed by a dump of the rendered DOM. It names the lost text, not the
word "severity" or "colour". The test stops at that first row, so the later rows' checks are not
evaluated on the mutated tree.

## What a wrong prediction would mean
A predicted miss that turns out caught means a test reaches further than its title says. A
predicted catch that turns out missed means the test does not assert what it looks like it asserts.
A Playwright catch would contradict the claim that no end-to-end test reads a badge. All are
findings about the suite, not about Jest, Playwright or lint.
