## Old baseline: e2e layer and advanced-form validators   claude/old-baseline-findings · verify deep ✓ · ~17m · 0 files

### One decision for you
The README and write-up still say "exactly one recorded result" (`docs/design/klaxon/README.md`,
"Claims and evidence"). This run recorded 24 more cells. **Default:** update the docs' count in a
separate small change. **Cost of leaving it:** the docs understate the evidence, and the next
reader sees a stale claim of the kind decision 0008 corrected. **Reversible:** yes, doc-only.

### What surprised me
Nothing contradicted the predictions: all 24 cells came out as I wrote them down first. That is
less reassuring than it sounds, because the predictions came from reading the specs, so a match
shows the specs are predictable. The actual surprise was in my own tooling: the replay script I
wrote to prove reproducibility exited 0 on a falsified result.

### What I learned about your system
- **e2e shares the jest coupling.** M1 and M3 fail the same e2e test with the same
  `toHaveText` message (`.ai/run/old-baseline-findings/mutations/output/M1.e2e.app.spec.ts.txt`,
  `M3.e2e.app.spec.ts.txt`), so red still can't tell a heading demotion from a harmless rename.
- **`smoke` protects against none of these mutations.** `e2e/smoke.spec.ts` missed all seven,
  by design (`e2e/smoke.spec.ts:13-14`), so the cheap tier doesn't guard content or semantics.
- **Three of four validator mutations are missed at every layer**, because the specs feed too few
  inputs: only `admin` as a taken name (`src/app/advanced-form/advanced-form.validators.spec.ts:42-47`),
  no case-only password pair, and `advanced-form.validators.spec.ts:19` alone pins the
  empty-confirm guard.

### Concept: a comparison that can't fail
A check that prints a difference but doesn't fail on it is an empty list dressed as a pass. It
recurs in `.ai/HARNESS.md`'s Never trust list ("An empty list") and in
`src/app/app.component.spec.ts:24`. The test for it is a negative control: falsify one input and
see the exit code change. I ran that only during `/test`; before that the script had never been
shown able to go red.

### What I did — and what is NOT verified
- Opened the run on a branch, committed `predictions.md` first (`eaed381`), then ran 8 tree
  states (baseline, M1–M3, V1–V4) through jest and/or e2e: 24 cells in
  `mutations/results.tsv`, raw output beside them, tree restored after each.
- `replay.sh` reproduced all 24 outcomes on a second run, and now exits 1 on a mismatch.
- `src/` and `e2e/` have no diff against `32e5dc6`. `verify full` and `verify deep` are green.
- **Not verified:** stability (each cell ran once). Whether V4 is an equivalent mutant at these
  specs' contract. Per-test outcomes for e2e beyond what the raw output shows. The other 30 cells
  of the findings matrix (a different suite and different mutations).
- **Not done, on purpose:** no new tests, no spec edits, no doc edits, no CI, no capture script.

### What I got wrong
`replay.sh` shipped in the first commit exiting 0 when an outcome differed, and `evidence.md` said
it "reproduced all 24 outcomes" without ever having seen it fail. `/test` found it with a
negative control and fixed it; the claim was true but unproven when written. Also, the brief's
line citations weren't scanned by `check-citations.sh` (it covered five other documents), so I
verified them by hand. Not enough for a `/retro`.
