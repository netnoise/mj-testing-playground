## Klaxon third finding: aria-label variant   claude/klaxon-aria-label-variant · verify deep ✓ · ~6m · 4 files (all docs)

> **Correction, 2026-09-30.** The browser-pane cause stated below ("One decision", "What I learned", "What I got wrong") is wrong. A controlled
> test found no clear difference between a closed pane and an open tab: 26 of 160 failures closed, 31 of 140 open (the counts file of the harness-note-browser-pane run,
> on `claude/harness-browser-pane-note`). The keyboard-focus test is flaky for an unknown reason, and I pushed a cause I had not tested. The body below is
> left as written; the decision it asks about (a HARNESS.md line or a preflight) has no basis and was not taken.

### One decision for you
`deep` and `smoke` are flaky while the desktop app's built-in browser pane has a tab open: the keyboard-focus test failed in 2 of 4 `deep` runs and in 5 and 14 of 20 isolated repeats, then passed 20 of 20 once I closed the tabs. `.ai/HARNESS.md` says only that port 4200 must be free. **Default: leave the harness alone** and keep the pane closed for runs; the finding's caveat records it. **Cost:** the next run that forgets gets a false red baseline. **Reversible:** yes; adding a line to `.ai/HARNESS.md` is a one-line edit, or a preflight check in `verify.sh`, which is door 7 and needs your patch.

### What surprised me
The two variants give identical results in all 35 comparable cells, but the evidence underneath is not identical: the layout snapshots differ in the 12 badge spans (`role="img"`), and the Jest failure dump now shows `aria-label="CRIT"`. I had predicted the message would give no hint of the kept name; it does, below the first line. The suite can distinguish the two trees, and nothing asks it to.

### What I learned about your system
- **The one catching test is keyed to text, so it cannot say whether the name survived** (`src/app/board/board.spec.ts:34`, `getByText`), and no layer that reads names exists: a `getByRole('img', { name })` query finds 0 badges on the baseline and 12 on the variant, measured, not tested (`.ai/run/aria-label-severity-finding/mutations/badge-metrics.mjs`).
- **Lint accepted `role="img"` with a label**, as predicted at medium confidence; `templateAccessibility` (`eslint.config.js:28`) has nothing to say about it.
- **My own browser use can break the gate.** Two tabs I opened to look at a wireframe made a Playwright focus test fail about a quarter to two thirds of the time. Found by measuring, not guessing.

### What I did — and what is NOT verified
- Verified `verify.sh deep` green twice on `9db523f` (after diagnosing the flake), committed predictions at `51ebe68` (37 cells), applied one patch (`M3-aria-label-severity.patch`: badge text removed, `role="img"` and `aria-label` added, same filled circle as colour-only) and ran lint, build, 24 Jest tests, 8 Playwright tests and the layout snapshot. Result: 2 caught, 16 missed, 17 not applicable, 2 not run; all 37 as predicted, and identical to `colour-only-severity` in 35 of 35.
- Measured that all 12 badges lost their text, kept the accessible name unchanged, were found by role and name, and kept their colour.
- Published `docs/design/klaxon/findings/aria-label-severity.md` and `.json` (with a `compared_with` block), and added a pointer in the README and the Findings wireframe. `replay.sh` reproduced every outcome and exits 1 on the negative control. `src/` and `e2e/` have no diff against the baseline; `verify.sh deep` is green on the restored tree, and `full` is green now.
- **Not verified:** a Playwright or axe check that asserts the name (none exists); a longer label or visually-hidden text; each cell ran once.
- **Not done, deliberately:** no test edited, no second defect, the write-up and claude.ai artifacts untouched.

### What I got wrong
- I left two browser-pane tabs open from the previous task and then ran the gate; the first baseline failed because of it, which cost four extra `deep` runs to diagnose. I also overwrote `baseline-deep.txt` with the green rerun, so the failed run's raw output is gone; the journal keeps the numbers.
- My prediction text said the Jest message would not hint at the kept name; the dump does. Recorded as a difference in the finding, `predictions.md` untouched.

### Next step
Push `claude/klaxon-aria-label-variant` and open the PR yourself; it is stacked on `claude/klaxon-colour-severity`, so that branch's PR comes first. Want me to push it?
