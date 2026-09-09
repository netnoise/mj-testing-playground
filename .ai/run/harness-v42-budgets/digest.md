# Default budgets raised 12/45 -> 30/90
harness/v4.2-remediation · verify deep ✓ · ~20 min · 6 files

### One decision for you

None. Direct user direction after R2 hit its own cap mid-run: "increase those
budgets across the harness rules." Sizing (30 files / 90 minutes) is evidence-based
— the largest real run on record (`ui-shell-redesign`) touched 30 files in about
90 minutes, and its own time budget was already extended to exactly that number
once before (decision 0005) — not a round-number guess.

### What surprised me

Nothing new this run — this one confirmed rather than discovered. The session was
quit and restarted mid-run (one file, `budget.mjs`, still pending your patch
application). `/resume` verified rather than assumed: `git diff` showed the patch
was applied and matched byte-for-byte, `hook-test.sh` ran green against the live
patched hook (not just the copy I'd tested it against before sending it to you),
and `verify.sh deep` ran green end to end. Exactly the situation this harness's own
`resume.md` exists for, and it worked cleanly.

### What I learned about your system

Nothing new — this run's job was propagating a number, not discovering something.

### Concept: a default should be set from the largest real run, not a guess

12 files / 45 minutes was never validated against actual usage before this repo
had any real feature work to check it against. Once it did (`ui-shell-redesign`:
30 files, needed 90 minutes), the original numbers were wrong by roughly 2.5x on
both axes — and the harness's own `harness-v42-r2` run then hit the same wall for
real, mid-remediation. The fix isn't picking a bigger round number; it's reading
the one number your own run history already provides and using that.

### What I did — and what is NOT verified

`config.yml`'s default budget, `understand.md`'s example `state.json` template,
`implement.md`'s frontmatter budget line (plus R2's deferred smoke-checkpoint
note), and `HARNESS.md`'s tier table (also deferred from R2, four tiers now
documented instead of three) were all edited directly. `budget.mjs`'s fallback
defaults required a patch file (door 7, same desktop-app `HARNESS_DOOR_OPEN`
limitation R2 found) — applied by the user, confirmed via `git diff` to match
exactly, and confirmed working via `hook-test.sh` (14/14) and `verify.sh deep`
(green) against the live file, not just the staged copy.

Nothing outstanding. This closes out both this run's own scope and R2's two
deferred items.
