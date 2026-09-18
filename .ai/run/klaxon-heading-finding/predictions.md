# Predictions — written and committed before the mutation is applied or any layer is run against it

- **Baseline commit:** `7327964` (master, 2026-09-19); the run's `base_commit`. `verify.sh deep` was
  green on it before this file was written.
- **Test revision:** every spec under `src/` and `e2e/` as of `7327964`, frozen, not edited.
- **Mutation:** `mutations/M1-heading-demotion.patch`: board `<h1>Incident Board</h1>` becomes
  `<div class="page-title">Incident Board</div>`, and the scss `h1` rule becomes `.page-title`.
- **Rule (0008 §2):** these are hypotheses. A cell that comes out differently is recorded as a
  difference; this file is never edited afterwards, and corrections go in the finding record.
- **Vocabulary:** `caught` (the layer failed), `missed` (the layer ran and passed),
  `not applicable` (the test never renders the board), `not run` (the layer doesn't exist).

## Predicted outcomes

| Layer | Cell | Predicted | Reason |
|---|---|---|---|
| Jest `board.spec.ts` | "lists every incident in a table with column headers…" | **caught** | asserts `getByRole('heading', { level: 1 })` (`src/app/board/board.spec.ts:26`) |
| Jest `board.spec.ts` | the other 6 tests | **missed** | none queries a level-1 heading |
| Jest `format-age`, `incident-source`, `advanced-form.validators`, `smoke-routes` | 17 tests | **not applicable** | they never render `Board` |
| Playwright `board.spec.ts` | "filters by severity and shows the details…" | **caught** | asserts a level-1 heading (`e2e/board.spec.ts:11`) |
| Playwright `board.spec.ts` | the other 5 tests | **missed** | none queries a level-1 heading |
| Playwright `smoke.spec.ts` | 2 tests | **missed** | asserts nothing about content |
| Lint | 1 | **missed** | no rule about heading presence; medium confidence |
| Build | 1 | **missed** | the template still compiles |
| Axe | — | **not run** | not installed |
| Visual regression | — | **not run** | not installed |

## Predicted failure messages (for the two catches)
- Jest: Testing Library's "Unable to find an accessible element with the role "heading" and level
  "1"", followed by a dump of the rendered DOM. It names the missing level-1 heading.
- Playwright: `getByRole('heading', { name: 'Incident Board', level: 1 })` with "element(s) not
  found" after the 5s expect timeout. It names the missing level-1 heading.
- Both failures are predicted to stop their test at that first assertion, so the table, severity
  and filter assertions in the same test are not evaluated on the mutated tree.

## What a wrong prediction would mean
A predicted miss that turns out caught means a test reaches further than its title says. A
predicted catch that turns out missed means the test does not assert what it looks like it asserts.
Both are findings about the suite, not about Jest, Playwright or lint.

## Visual identity
Predicted: the demoted element's computed `font-size`, `font-weight`, margins, `display`, width and
height are equal to the `h1`'s in the production build (baseline in `mutations/metrics.baseline.json`).
