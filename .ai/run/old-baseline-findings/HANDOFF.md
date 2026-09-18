# HANDOFF - old-baseline-findings
generated mechanically 2026-09-18T21:21:34Z - no model call

> **ACTIVE - mid-run snapshot, not a final state.** This run is still
> in progress; the Stop hook wrote this automatically, it wasn't
> requested. Expected during an active run - do not delete it, and
> don't read it as evidence the run ended here.

## Goal
# The Klaxon lab has one recorded result and no baseline to compare the regen against
run: old-baseline-findings · intake 2026-09-18

## Journal tail
```
# Journal — old-baseline-findings

- 21:19Z opened run via open-run.sh on branch `claude/old-baseline-findings`, base `32e5dc6`,
  8 files / 30 min, allowlist = app.component.{html,scss}, advanced-form.validators.ts.
- Intent: commit predictions.md before any mutation runs (Done-when box 2).
- 21:2xZ wrote mutations/{V1..V4}.patch (git diff of one sed each, reverted) and replay.sh; next: baseline sanity then replay.sh --record
```

## Tree state (git is the truth, not any claim above)
```
branch: claude/old-baseline-findings  head: eaed381
 M .ai/run/old-baseline-findings/journal.md
?? .ai/run/2026-09-15-landing-page/
?? .ai/run/2026-09-18-next-development-step/
?? .ai/run/harness-v42-landing/HANDOFF.md
?? .ai/run/harness-v43-critical/HANDOFF.md
?? .ai/run/hotfix-gate-and-claims/HANDOFF.md
?? .ai/run/old-baseline-findings/HANDOFF.md
?? .ai/run/old-baseline-findings/mutations/
--
 .ai/run/old-baseline-findings/journal.md | 1 +
 1 file changed, 1 insertion(+)
```

## Last emit
```
(none with an "at" field - emit.sh hasn't been called since this fix, or not at all for this run)
```

## Resume
```
git checkout claude/old-baseline-findings && /resume old-baseline-findings
```

> A clean exit is not evidence of work. Diff the tree before believing
> anything the journal claims.
