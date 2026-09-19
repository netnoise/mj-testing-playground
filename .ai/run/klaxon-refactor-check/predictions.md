# Predictions — written and committed before any patch is applied or run

- **Baseline commit:** `c44571d` (master, 2026-09-19); the run's `base_commit`. `verify.sh deep`
  was green on it before this file was written.
- **Test revision:** every spec under `src/` and `e2e/`, identical to `7327964` (the first finding's
  suite), unedited.
- **Patches** (in `.ai/run/klaxon-refactor-check/mutations/`): `R1-class-rename.patch`
  (`.board-header` → `.page-header`, template and scss), `R2-selector-rename.patch`
  (`app-board` → `app-incident-board`), `R3-signal-rename.patch` (`filter` → `severityFilter`, class
  and template).
- **Rule (0008 §2):** these are hypotheses; a cell that differs is recorded as a difference, and
  this file is never edited afterwards.
- **Vocabulary:** these changes are not defects, so a test that goes red on one is `flagged` and
  one that stays green is `unchanged` (0008's `caught` and `missed` describe defects).

## Predicted outcomes

For each of R1, R2 and R3, every cell is **unchanged**:

| Layer | Cells | Predicted |
|---|---|---|
| Lint | 1 | unchanged |
| Build | 1 | unchanged |
| Jest | 24 tests in 5 files | unchanged (0 flagged) |
| Playwright | 8 tests in 2 files | unchanged (0 flagged) |
| Layout snapshot (heading, filters, table, details; role, text, typography, spacing, position) | 1 | equal to baseline |

That is 34 cells per patch, 102 in total, 0 predicted flagged. Confidence: high for R2 and R3
(nothing in the suite selects on a selector or a private member), high for R1 (every board query is
by role and name; the old failure came from a class selector, which these tests don't use).

## What a flagged cell would mean
A red test on R1, R2 or R3 would show a test coupled to something the user cannot see: a class, a
selector or a member name. That is the same coupling the old suite had and would be the finding.
A different layout snapshot would mean the patch was not harmless, and is reported as that, not as
a passing test.
