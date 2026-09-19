## Klaxon board and healthy baseline   claude/klaxon-board · verify deep ✓ · ~25m · 18 files

### What surprised me
Nothing in the code contradicted the brief, but the environment did: an `ng serve` I didn't start was holding port 4200, so `verify deep` refused to run (by design; it won't reuse a server). And a negative control I wrote silently did nothing: the macOS `sed` form I used matched nothing, and I nearly took "7 passed" as evidence the tests couldn't catch a wrong fixture.

### What I learned about your system
- **The router does the query-param plumbing.** One argument, `withComponentInputBinding()` at `src/app/app.config.ts:9`, is why the board can read `?scenario=` as a plain signal `input()` with no `ActivatedRoute` injection.
- **Focus visibility is checkable without a screenshot.** `e2e/board.spec.ts:29` asserts the computed `outline-style` after a real Tab press, which jsdom can't do (it has no `:focus-visible`), so the assertion has to live in e2e.
- **Role queries make the component test structure-independent, with one exception.** `src/app/board/board.spec.ts:33` finds a row via `closest('tr')` from the ID button. That is the only structural hop in the spec, and it is deliberate: severity text has to be checked in the same row as its incident.

### Concept: a control that never ran is worse than none
A check that can't fail, or a control that silently didn't apply, produces a green result that reads as reassurance. It recurs from the previous run, where `replay.sh` printed a diff and exited 0. The defence is the same: apply the control, then confirm it took effect (`git diff --stat` non-empty) before reading the result.

### What I did — and what is NOT verified
- Built the board: 12-incident fixed-clock fixture, severity as visible text (`CRIT`/`MAJ`/`MIN`), a real table with `<th scope="col">`, severity filter chips, selection via row buttons into a details panel, and loading/empty/failed/stale states behind `?scenario=`.
- Restyled the shell: dark palette, the app title is now a non-heading `<span>`, so the board owns the one `<h1>`.
- Tests: 7 component specs, 4 `formatAge`, 3 `IncidentSource`, and 6 Playwright tests (a filter-and-select flow, a keyboard-only flow, and the four states, each asserting zero console or page errors).
- Checked the running production build by eye in the browser pane (happy path with selection, stale, failed).
- Non-vacuity: two neutral controls (wrong fixture severity; a filter that narrows nothing). Each made 2 Jest and 1 e2e test fail; both reverted with an empty diff.
- **Not verified:** the layout at real phone widths (only the 900px breakpoint rule was written, not viewed); screen-reader behaviour beyond role and name queries; `?scenario=` values other than the four (an unknown value silently renders the normal board, and one unit test covers that).
- **Not done, deliberately:** the planned heading-demotion and colour-only mutations (run 3), sorting, search, Acknowledge, axe, visual regression.
- **Left alone:** the uncommitted `package-lock.json` `"peer": true` change from run 1 is in `stash@{0}`; the lockfile in this run carries the same flag on installs of the new dependency.

### What I widened or crossed
- **Door 1 (crossed, approved with the plan):** `@testing-library/dom` `^10.4.2`, the only new package.
- No door 7, door 4 or allowlist revisions, and no `door-crossings.md` for this run.

### What I got wrong
- Control A's mutation didn't apply (a GNU-only `sed` address on macOS) and I only noticed because the diff stat was empty. Redone with a Python replace and confirmed with `git diff --stat` before reading the result.
- I first wrote "Try again in a moment." into the failed state, which promised a retry the board doesn't have; removed at `src/app/board/board.html:11`.
