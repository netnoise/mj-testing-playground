## Harness v5 slim   harness/v5-slim · verify deep ✓ · ~10m · 15 files

### One decision for you
Apply the door-7 patch (`.ai/run/harness-v5-slim/patch/gate-scope.patch`; files in `.ai/run/harness-v5-slim/patch/proposed/`). **Default: apply.** It deletes the Bash guard on a run's state file, which blocked one of my own commands three times this run and misses a `node -e` write anyway, and stops `deep` running smoke twice. **Cost if wrong:** shell writes to that file are no longer refused; `close-run.sh` and the gate read git, not that file, so the loss is small. **Reversible:** yes, one revert.

### What surprised me
The guard I am removing hit me three times, each on a command that only *named* the file next to an unrelated write or read (a heredoc of prompt text, a Python script, a read plus a journal append). That is `.ai/harness/OWED.md`'s recorded false positive, reproduced live, not a theory.

### What I did
- `.ai/HARNESS.md` is rules only: 110 lines, was 231. The default flow reads about 16 KB of prompts, was about 30 KB (measured bytes of the files, not tokens).
- Default flow is `brief, implement, verify, digest` (`.ai/harness/config.yml`); the old eight steps are `full`. New `.ai/prompts/brief.md` and `.claude/commands/brief.md`; emits are no longer required by any prompt.
- `close-run.sh` refuses a `done` close on a BAD citation, proved by `.ai/run/harness-v5-slim/test-close-citations.sh` (refuses, accepts clean, accepts a digest with no citations, honours `--skip-citation-check`). `check-citations.sh` accepts `(new)` and skips `predictions.md`.
- The digest prompt now ends on a push offer, never a merge. Door-7 stops must put the apply commands inline.
- `.claude/agents/defect-planter.md` added. `.ai/harness/OWED.md` is open items only, under a freeze rule.
- The patch was tested in a throwaway worktree: hook-test 23/23 on the proposed hook; its two changed cases fail on the live hook (so they can go red); `deep` green; the port-4200 preflight fires with a listener on the port.
- Not done from the brief: `emit.sh` and `ledger.sh` are kept, inert (`ledger.sh` was outside the blast radius, `lib.mjs` is door 7); listed in OWED. `hook-test.sh` is in the patch, not live, because two of its cases assert the old Bash behaviour and would turn the gate red before the patch lands. Two existing test cases are flipped, not deleted (door 4: disclosed here).
- **Not verified:** the `/brief` command has never run (a new command file needs a session restart). The defect-planter agent has never been dispatched, and its file lock is instruction-level; the hook only enforces the run's allowlist. The hypothesis (a Klaxon run pays under half the paperwork of `klaxon-heading-finding`) is untested until the next run.

### What I got wrong
I typed timestamps into the journal by hand (16:50 to 18:30) although the run had used about ten minutes; the harness's own rule is that model-typed times are untrustworthy. Removed, and the journal now cites only the run record's start. I also created a `door-crossings.md` for a patch that only proposes, then deleted it: a crossing file records a crossing and this run made none.

### Next
Push `harness/v5-slim` for review and stack the next run on it. Do not merge locally.
