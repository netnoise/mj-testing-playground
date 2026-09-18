# HANDOFF - old-baseline-findings
generated mechanically 2026-09-18T21:33:07Z - no model call

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
- result: 24 cells recorded, all matched predictions; replay reproduces; verify full green; evidence.md written; implement.json emitted
- test: negative control showed replay.sh exiting 0 on a falsified results.tsv row (diff printed, exit status lost to the trailing rm). Fixed: exit 1 on mismatch. results.tsv restored byte-for-byte.
```

## Tree state (git is the truth, not any claim above)
```
branch: claude/old-baseline-findings  head: 135e42a
 M .ai/run/old-baseline-findings/HANDOFF.md
?? .ai/run/2026-09-15-landing-page/
?? .ai/run/2026-09-18-next-development-step/
?? .ai/run/harness-v42-landing/HANDOFF.md
?? .ai/run/harness-v43-critical/HANDOFF.md
?? .ai/run/hotfix-gate-and-claims/HANDOFF.md
--
 .ai/run/old-baseline-findings/HANDOFF.md | 40 +++-----------------------------
 1 file changed, 3 insertions(+), 37 deletions(-)
```

## Last emit
```
{
  "skill": "test",
  "status": "ok",
  "at": "2026-09-18T21:32:57.495Z",
  "base_commit": "32e5dc6a7378ec35ba3a3649839f64ab7dfa70b3",
  "artifacts": [
    "HANDOFF.md",
    "brief.md",
    "evidence.md",
    "implement.json",
    "input.md",
    "journal.md",
    "predictions.md",
    "understand.json"
  ],
  "files_changed": [],
  "spent": {
    "min": 14,
    "files": 0
  },
  "specs_added": 0,
  "vacuous": null,
  "note": "No spec written by design: brief Out of scope forbids new or edited tests (door 4 untouched). The assertion this run adds is mutations/replay.sh vs results.tsv. Audit found it exited 0 on a falsified row (vacuous); fixed to exit 1, negative control re-run (tampered exit=1, clean exit=0)."
}
```

## Resume
```
git checkout claude/old-baseline-findings && /resume old-baseline-findings
```

> A clean exit is not evidence of work. Diff the tree before believing
> anything the journal claims.
