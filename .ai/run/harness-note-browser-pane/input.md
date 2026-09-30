# Input

Topic as given, 2026-09-30, in chat, after the aria-label run was pushed:

> brieth both … Harness note: a line in .ai/HARNESS.md about keeping the built-in browser pane closed when running `deep`.

Evidence the human was shown (the aria-label run's digest and finding caveat, same day):
- On `9db523f` the keyboard-focus Playwright test (`e2e/board.spec.ts:23`) failed in 2 of 4 `verify.sh deep` runs, and in 5 of
  20 and 14 of 20 isolated repeats (parallel and `--workers=1`), while two tabs were open in the desktop app's built-in
  browser pane.
- After both tabs were closed it passed 20 of 20 isolated repeats, and `deep` passed twice.
- Source: `.ai/run/aria-label-severity-finding/journal.md`, `docs/design/klaxon/findings/aria-label-severity.md` (Caveats).
  Those are on `claude/klaxon-aria-label-variant`, not on `master`; this brief's branch is cut from `origin/master`.

The other half of "both" (the failed-ack/rollback scenario) is a separate job: `.ai/run/failed-ack-rollback/`.
