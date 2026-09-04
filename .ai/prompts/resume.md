---
skill: resume
needs: []
reads: [.ai/run/<slug>/HANDOFF.md, journal.md, *.json, git]
writes: [.ai/run/<slug>/journal.md]
model: small
budget: 10m
---

Pick up an interrupted run. **Trust the diff, not the claims.**

1. Read `HANDOFF.md`, then verify each "Done" item against `git diff` and
   `git log`. A clean exit code is not evidence of work: a run can report
   `status: completed` after seventy tool calls and zero edits.
2. Re-read `state.json` — is the budget already spent? Then this is a new run
   with a new budget, and say so rather than quietly continuing.
3. Re-run `verify` yourself. A green claim in a journal is a claim.
4. Steps are idempotent by contract, so re-running a completed one is safe. When
   in doubt, re-run rather than assume.
5. Append to the journal — never rewrite history in it.
