# HANDOFF - harness-v43-critical
generated mechanically 2026-09-10T18:56:31Z - no model call

> **ACTIVE - mid-run snapshot, not a final state.** This run is still
> in progress; the Stop hook wrote this automatically, it wasn't
> requested. Expected during an active run - do not delete it, and
> don't read it as evidence the run ended here.

## Goal
# The harness's budget and door-7 numbers are not trustworthy enough to grade a feature run against
run: harness-v43-critical · started 2026-09-10 (16:40Z, from `date -u`, not typed)

## Journal tail
```
`HARNESS_DOOR_OPEN` semantics) and door 7's list entry (points out `.ai/MODEL.md` shares the
mechanism). `.ai/prompts/understand.md` now calls `open-run.sh` instead of templating
`started_at`. `.ai/prompts/retro.md` gets a `human_touches` field (advisory, self-reported,
cross-checkable against `patch-*` files and `door-crossings.md`). `.ai/harness/OWED.md`: struck
the old Bash-guard entry (patch ready, not applied), added the two new known-gap findings, marked
the citation-gate mtime bug fixed for `check-citations.sh`/`handoff.sh` and pending-via-patch for
`verify.sh`, and noted `close-run.sh` now anchors the still-undesigned trunk-ancestry check.
Wrote `PATCH-NOTES.md` for the human with the full apply/why/tested-before-handoff writeup.

`sh .ai/harness/verify.sh full` re-run after all doc edits: still green (lint 4 pre-existing
warnings, 55/55 jest, hook-test 14/14 - the *old* hook-test, since `budget.mjs` hasn't been
patched yet).
```

## Tree state (git is the truth, not any claim above)
```
branch: harness/v43-critical-fixes  head: b8d1321
 M .ai/run/harness-v43-critical/implement.json
 M .ai/run/harness-v43-critical/state.json
?? .ai/run/harness-v42-landing/HANDOFF.md
?? .ai/run/harness-v43-critical/HANDOFF.md
?? .ai/run/harness-v43-critical/digest.md
?? .ai/run/harness-v43-critical/retro.md
--
 .ai/run/harness-v43-critical/implement.json | 22 ++++++++++++++++++----
 .ai/run/harness-v43-critical/state.json     | 14 +++-----------
 2 files changed, 21 insertions(+), 15 deletions(-)
```

## Last emit
```
{
  "skill": "implement",
  "status": "ok",
  "at": "2026-09-10T18:55:12.636Z",
  "base_commit": "1e644ea2b3db12ba505fa25a8cdb0d1529fbb9c9",
  "artifacts": [
    "HANDOFF.md",
    "PATCH-NOTES.md",
    "brief.md",
    "implement.json",
    "journal.md",
    "understand.json"
  ],
  "files_changed": [
    ".ai/HARNESS.md",
    ".ai/harness/OWED.md",
    ".ai/harness/check-citations.sh",
    ".ai/harness/close-run.sh",
    ".ai/harness/emit.sh",
    ".ai/harness/handoff.sh",
    ".ai/harness/ledger.sh",
    ".ai/harness/lib.mjs",
    ".ai/harness/open-run.sh",
    ".ai/prompts/retro.md",
    ".ai/prompts/understand.md",
    "e2e/smoke-routes.ts",
    "e2e/smoke.spec.ts",
    "src/app/app-routing.module.ts",
    "src/app/smoke-routes.spec.ts"
  ],
  "spent": {
    "min": 135,
    "files": 15
  }
}
```

## Resume
```
git checkout harness/v43-critical-fixes && /resume harness-v43-critical
```

> A clean exit is not evidence of work. Diff the tree before believing
> anything the journal claims.
