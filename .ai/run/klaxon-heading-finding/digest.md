## Klaxon milestone 1: first finding, heading demotion   claude/klaxon-heading-finding · verify deep ✓ · ~10m · 3 files (all docs)

### One decision for you
The write-up's findings matrix and the two claude.ai artifacts still show the old claims; the README now says so. **Default: leave them** and treat this finding as the source of truth until a docs pass. **Cost:** anyone opening the artifacts sees stale numbers. **Reversible:** yes, doc-only, and republishing the artifacts is your call (they are outside the repo).

### What surprised me
Two of my predictions were wrong in their wording, though every cell's status matched. I predicted Jest's message would name a missing level-1 heading; it names the `heading` role but omits the level, and then dumps about 1,200 lines of DOM. I predicted Playwright would say "element(s) not found"; it says `unexpected value "hidden"`. The mutation was caught, but the catch is harder to read than I expected.

### What I learned about your system
- **The catches are incidental to the tests' names.** The only two heading assertions are `src/app/board/board.spec.ts:26` and `e2e/board.spec.ts:11`, each inside a test titled for something else (a table listing, a filter flow). A red run points a reader at the wrong feature.
- **A failed first assertion hides the rest.** Both catching tests stop at the heading, so on the mutated tree their table, severity and filter assertions were never evaluated. A catch says nothing about whether those would pass.
- **`smoke` protects nothing here, by its own description.** `e2e/smoke.spec.ts:13` "Deliberately asserts NOTHING about text content", and it has missed every mutation recorded so far: all seven in `old-baseline-findings`, and this one.

### Concept: pre-register the message, not just the status
Predicting only caught/missed hid the interesting result. The predictions were right on status and slightly wrong on the diagnostic, which is what matters at 3am. It recurs in `.ai/run/old-baseline-findings/evidence.md`, where the old suite caught the same demotion but with a null `TypeError` that a harmless rename produced identically.

### What I did — and what is NOT verified
- Ran the frozen suite (`7327964`) against one patch (`<h1>` → styled `<div>`, scss `h1` → `.page-title`) across lint, build, 24 Jest tests, 8 Playwright tests; axe and visual recorded as `not run`. 36 cells, 2 caught, 15 missed, 17 not applicable, 2 not run, all as predicted.
- Measured that the demotion is visually identical: font-size, weight, margins, display, width and height all equal, only the tag differs.
- Wrote the record at `docs/design/klaxon/findings/heading-demotion.md` and `.json` (the JSON is generated from `results.tsv` by `make-record.mjs`), and updated the README's recorded-results sentence.
- `replay.sh` reproduced all outcomes (exit 0) and exits 1 on a falsified row (negative control); it also refuses a patch that applied but changed nothing.
- `src/` and `e2e/` have no diff against the baseline; `verify deep` is green on the restored tree.
- **Not verified:** whether a harmless refactor (a class rename) leaves these role-based tests green; each cell ran once; axe and visual layers don't exist.
- **Not done, deliberately:** no test edited, no second defect, the colour-only severity mutation is still planned, and the write-up and artifacts are untouched.

### What I got wrong
- I wrote a Jest prediction with wording ("and level "1"") that Testing Library doesn't produce when no heading exists at all; the record states the difference instead of the prediction.
- I edited `predictions.md` after committing it, against my own rule that it is never edited: two path tokens changed to full repo paths because `check-citations.sh` rejects run-relative ones. No prediction text changed; `git diff 13820cc -- .ai/run/klaxon-heading-finding/predictions.md` shows exactly two changed lines, and the original wording is at `13820cc`.
