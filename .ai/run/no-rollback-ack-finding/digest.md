## Klaxon fourth finding: acknowledge never rolled back   claude/klaxon-failed-ack · verify deep ✓ · ~5m by the journal clock · 4 files (all docs)

### One decision for you
Playwright 1.30.0 wants `chromium-1045`, which is gone from `~/Library/Caches/ms-playwright` (only 1217, 1234 and 1248 remain), so the first baseline `deep` failed on both smoke tests before any code ran. `npx playwright install` would download and write outside the repo (door 6), so I did not run it and used the config's `PW_CHROMIUM` seam (`playwright.config.ts:24`) with the cached Chrome for Testing 156. **Default: keep that**, recorded in `predictions.md` and the finding's caveats; this finding is internally consistent but not like for like with the three earlier ones (Chromium 110). **Cost if wrong:** a later run that doesn't set `PW_CHROMIUM` gets the same false red, and a cross-finding comparison of one cell could mislead. **Reversible:** yes; installing the pinned browser, or bumping Playwright (door 1), would put every finding back on one browser, and re-running `replay.sh` on the new one would show whether any cell moved.

### What surprised me
That the environment broke before the code could. Nothing in the repo records which browser the earlier findings used beyond a version string in each record, and the gate's error was a missing executable, not a test failure. I found out which browsers existed by listing the cache, not from a doc.

### What I learned about your system
- **The rollback is held by exactly two specs, one per layer, and nothing else.** Deleting `src/app/board/board.ts:89-93` fails `src/app/board/board-ack.spec.ts:70` and `e2e/board-ack.spec.ts:29` and no other cell of 45; a change that weakened both would pass everything (`.ai/run/no-rollback-ack-finding/mutations/results.tsv`).
- **Both catches fail on the status, not the cause.** Jest reports `Unable to find an element with the text: LIVE`; Playwright reports expected `LIVE`, received a row ending `ACKED`. The alert assertion before it passes in the browser, so a reader of the failure sees a status that didn't change back, and the word "rollback" appears only in the spec title.

### What I did — and what is NOT verified
- Ran `verify.sh deep` green on `8eaab01` (pane closed, ports free, `PW_CHROMIUM` set), committed predictions at `6fa33be` (45 cells), applied one patch (`M4-no-rollback.patch`: the `catch` no longer clears the optimistic overlay, the alert stays) and ran lint, build, 30 Jest tests, 10 Playwright tests and the layout snapshot. Result: 2 caught, 22 missed, 19 not applicable, 2 not run; all 45 as predicted.
- Measured in the production build under `?scenario=ack-failed`: after the alert, row and inspector `LIVE` → `ACKED`, Acknowledge offered → gone; unchanged with no scenario.
- Published `docs/design/klaxon/findings/no-rollback-ack.md` and `.json`, and updated the README and the Findings wireframe's "Optimistic ack not rolled back on 500" row. `replay.sh` reproduced every outcome and exits 1 on the negative control. `src/` and `e2e/` have no diff against the baseline; `verify.sh deep` is green on the restored tree and `full` is green now.
- **Not verified:** the variant where the rollback stays and the alert goes; a third check on the rollback; a flake check on the mutated cells (each ran once); the whole run on the browser the earlier findings used.
- **Not done, deliberately:** no test edited, no second defect, no browser installed, the write-up and claude.ai artifacts untouched.

### What I got wrong
- `predictions.md` says "the other 6 tests" for Playwright; there are 8 outside `board-ack.spec.ts`. The cell vector is unaffected, and I left the file as committed and noted the slip in the finding.
- I did all edits through Bash and Python rather than Edit/Write, so `state.json`'s `files_touched` is still empty; the hook never saw them. The real list is the four files in the header, from `git diff --name-only 8eaab01 HEAD`.

### Next step
Push `claude/klaxon-failed-ack` and open the PR yourself. `claude/klaxon-aria-label-variant` has one commit, `df44c99`, that this branch does not contain, so the stack needs it before the PRs land. Want me to push it?
