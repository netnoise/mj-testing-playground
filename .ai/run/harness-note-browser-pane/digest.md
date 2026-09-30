## Browser-pane note for HARNESS.md: not added, the cause was wrong   claude/harness-note-browser-pane · verify full ✓ · ~20m · 0 files

**This run changed no tracked file, on purpose.** An empty `git diff --stat` here is the result, not a failed run: the brief made the note conditional on reproducing the cause, and it did not reproduce.

### One decision for you
The aria-label run's finding and digest say the flaky baseline was caused by an open built-in browser tab and that closing it fixed it. That is now contradicted. **Default: correct them in a follow-up commit on `claude/klaxon-aria-label-variant`** (the Caveats section of the aria-label finding record, and the "One decision" and "What I learned" paragraphs of that run's digest), because that branch is already pushed and says something I now believe is false. **Cost:** until then the pushed branch carries a wrong cause. **Reversible:** yes, doc-only. I did not touch that branch, since the brief put it out of scope.

### What surprised me
The pane is not the cause. Over 300 runs of the keyboard-focus test, the failure rate was 26 of 160 with the pane closed and 31 of 140 with one tab open: no clear difference, and plenty of failures with it closed. My earlier "20 of 20 after closing the tabs" was two quiet batches that I read as a fix; the closed arm also produced two batches of 0 of 20 and three with 4, 6 and 7 failures.

### What I learned about your system
- **The test is flaky on this machine regardless of the pane**: about 16% to 25% of runs fail (`e2e/board.spec.ts:26-28`, the `Tab` then `toBeFocused` check), and failures cluster in time, so something about the machine's state moves the rate. This run did not find what. Counts: `.ai/run/harness-note-browser-pane/output/counts.md`.
- **That weakens earlier findings' single runs, in one direction.** A flake shows up as a red cell, so a flaky Playwright test can only fake a `caught`, never a `missed`. All three findings recorded that test as passing (missed), so their results stand, but "replay reproduced every outcome" was partly luck for that test.
- **Batch duration is not a load signal here.** A failing test waits out a 5 s timeout, so failing batches are slower because they fail. I first read it the other way and corrected it before writing it down.

### What I did — and what is NOT verified
- Ran the keyboard test in 20-repeat batches with the pane closed (8 batches, parallel and `--workers=1`) and with one tab open (7 batches), confirming the pane state with `tabs_context` each time. Raw output and the table are in `.ai/run/harness-note-browser-pane/output/`. Added no sentence to `.ai/HARNESS.md`. `verify.sh full` is green.
- **Not verified:** what does cause the flake (load, focus timing right after `goto`, Chromium state); whether a different number of tabs or a visible pane matters; whether the flake predates today (earlier runs passed, which a 16% rate makes unremarkable); the effect on anything other than this one test.
- **Not done, deliberately:** no edit to `e2e/board.spec.ts` (an existing test, and another job), no `verify.sh` preflight (door 7), no change on the aria-label branch.

### What I got wrong
- I stated a cause from a before-and-after observation (closing tabs, then two green runs) in a digest and a finding, and pushed both. The brief for this run exists because that claim needed a controlled test, and the test disproved it.
- I wrote "failures track batch duration, pointing at load" into the counts file, then found the inference was circular and removed it; the journal records the correction.

### Next step
Nothing here to push except the run's own files; `claude/harness-note-browser-pane` has the brief, journal, counts and this digest. Want me to correct the aria-label finding and digest on `claude/klaxon-aria-label-variant` first, and then push both branches? The flaky keyboard test is a separate job worth a brief of its own.
