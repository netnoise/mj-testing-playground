# Predictions — written and committed before the patch exists or any layer is run against it

- **Baseline commit:** `8eaab01` (branch `claude/klaxon-failed-ack`, the run's `base_commit`). `verify.sh deep` was green on it
  (`.ai/run/no-rollback-ack-finding/mutations/output/baseline-deep.txt`), browser pane closed, ports 4200 and 4300 free.
- **Environment difference from the earlier findings:** Playwright 1.30.0 expects `chromium-1045`, which is no longer in
  `~/Library/Caches/ms-playwright`. Installing it would download and write outside the repo (door 6), so the run uses the config's
  own `PW_CHROMIUM` seam (`playwright.config.ts:24`) pointing at the cached Chrome for Testing 156.0.8078.4. Baseline and mutated
  cells use the same browser; the earlier findings used Chromium 110, so cross-run browser comparisons are not like for like.
- **Test revision:** every spec under `src/` and `e2e/` as of `8eaab01`, frozen, not edited. This includes the failed-ack specs,
  which were written knowing this defect was planned.
- **Mutation M4-no-rollback** (patch to be written next, in `mutations/`): in `Board.acknowledge` the `catch` no longer removes the
  incident from `optimisticStatus` (`src/app/board/board.ts:89-93`); it still sets `ackError` (`src/app/board/board.ts:94`).
- **Rule (0008 §2):** hypotheses. A cell that differs is recorded as a difference; this file is never edited afterwards.
- **Vocabulary:** `caught`, `missed`, `not applicable`, `not run`.

## Predicted outcomes

| Layer | Cell | Predicted | Reason |
|---|---|---|---|
| Jest `board-ack.spec.ts` | "puts the incident back to live, says which one failed, and offers Acknowledge again when the fake rejects" | **caught** | asserts the return to `LIVE` after rejection (`src/app/board/board-ack.spec.ts:70`) |
| Jest `board-ack.spec.ts` | the other 3 tests | **missed** | they cover offer, optimistic and confirmed states, none of which reaches the `catch` |
| Jest `board.spec.ts` | all 7 tests | **missed** | none clicks Acknowledge |
| Jest, five other files | 19 tests | **not applicable** | they never render `Board` (`incident-source-ack.spec.ts` calls the fake directly) |
| Playwright `board-ack.spec.ts` | "a failed acknowledgement is rolled back and reported" | **caught** | drives `?scenario=ack-failed` with real clicks (`e2e/board-ack.spec.ts:29`); fails on the row still reading `ACKED` after the alert, **not** on the alert, which is still raised |
| Playwright `board-ack.spec.ts` | the success-path test | **missed** | the `catch` is never reached |
| Playwright, the other 6 tests | board and smoke specs | **missed** | none clicks Acknowledge |
| Lint | 1 | **missed** | a `catch` with one statement is valid and leaves no unused symbol |
| Build | 1 | **missed** | still type-checks |
| Layout snapshot | 1 | **missed** | taken at rest, no click, no scenario |
| Axe, visual regression | — | **not run** | not installed |

Expected tally: 2 caught, among the Jest and Playwright applicable cells, everything else missed.

## Predicted failure messages
Jest: an `expect` failure on the row or inspector text, `ACKED` where `LIVE` is expected, with a DOM dump. Playwright: a
`toHaveText`/`toContainText` timeout with `ACKED` received. Neither message contains the word "rollback"; the spec's title does.

## Predicted measurement (script, not a test)
In the production build with `?scenario=ack-failed`: after clicking Acknowledge and waiting for the alert, the row and the
inspector still say `ACKED` and Acknowledge is not offered again; with no scenario the result is unchanged from baseline.

## What would falsify it
Any cell other than those two caught, or either of those two staying green. A Playwright catch that fails on the alert rather
than the status would mean the spec's title overstates what it checks.
