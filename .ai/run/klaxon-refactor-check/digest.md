## Harmless-refactor check on the Klaxon board   claude/klaxon-refactor-check · verify deep ✓ · ~4m · 4 files (all docs)

### What surprised me
Nothing went red. All 105 cells (three refactors × lint, build, 24 Jest tests, 8 Playwright tests and a layout snapshot) stayed green, matching the prediction. The one thing worth being suspicious of is that result being too clean, which is why the run also had to prove its own checks could fail.

### What I learned about your system
- **The suite is blind to anything not in the accessibility tree.** `e2e/board.spec.ts:11` and `src/app/board/board.spec.ts:26` query by role and name, so the class, the component selector at `src/app/board/board.ts:17` and a private member name are invisible to them. That is what makes the earlier catch trustworthy: the old class-selector test failed on both a real defect and a harmless rename, and this one fails only on the defect.
- **The per-test tooling is reusable across runs.** This run reused `.ai/run/klaxon-heading-finding/mutations/collect.mjs` unchanged, so a new experiment is a patch list, a replay loop and a record generator, not new plumbing.
- **The layout snapshot has a deliberate soft spot.** It normalises `app-*` host tags, because R2 legitimately changes one; the cost is that a change to the host element's tag name is invisible to it. Recorded in the finding as a limit, not hidden.

### Concept: prove the negative can fail
A result of "nothing changed" is only evidence if the check could have shown a change. Here the layout snapshot was run on the known heading-demotion patch and reported exactly one differing element (`h1` → `div`), and `replay.sh` was run against a falsified record and exited 1. It recurs from the last two runs, where a comparison that couldn't fail and a control that never applied both looked like passes.

### What I did — and what is NOT verified
- Ran three behaviour-preserving patches (class rename in template and stylesheet, component selector rename, internal signal rename) against the frozen suite: 105 cells, 0 flagged, layout snapshots equal for all 162 elements in `<main>`.
- Published `docs/design/klaxon/findings/harmless-refactors.md` and `.json`, linked from the first finding and the README.
- `replay.sh` reproduced all outcomes (exit 0) and exits 1 on a falsified row; `verify deep` is green on the restored tree and `src/` and `e2e/` have no diff against the baseline.
- **Not verified:** any refactor that changes DOM structure, element types or content order (a different experiment, and some such changes are defects); each cell ran once.
- **Not done, deliberately:** no test edited, no new mutation of a defect, the write-up and artifacts untouched.

### What I got wrong
- `predictions.md` states 34 cells per patch and 102 in total; the correct numbers are 35 and 105, because I left the layout snapshot out of the sum. I did not edit the pre-registered file; the record states the correct counts and the discrepancy.
