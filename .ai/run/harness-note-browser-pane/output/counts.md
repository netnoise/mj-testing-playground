# Keyboard-focus test (`e2e/board.spec.ts`, "is operable by keyboard alone…"), 20 repeats per batch, production build

Command: `HARNESS_DEEP=1 npx playwright test board.spec.ts -g "operable by keyboard" --repeat-each=20 [--workers=1]`.
Pane state set with `preview_start` / `tabs_close`; `tabs_context` confirmed it before each arm. Raw output per batch is in this directory.

| Arm | Mode | Failures per batch of 20 | Total |
|---|---|---|---|
| Pane closed | parallel | 1, 6, 4, 0, 0 | 11 / 100 |
| Pane closed | `--workers=1` | 1, 7, 7 | 15 / 60 |
| One tab open | parallel | 1, 2, 6, 1, 7 | 17 / 100 |
| One tab open | `--workers=1` | 9, 5 | 14 / 40 |

Closed 26 / 160 (16%), open 31 / 140 (22%): no clear difference, and the test fails with the pane closed, which the brief named as
its falsifier. Batch duration is not evidence of load: a failed test waits out a 5 s timeout, so failing batches are slow because
they fail. Failures do cluster in time (two consecutive closed batches had 0 of 20, most others several), so something in the
machine's state changes the rate; this run did not find what.
