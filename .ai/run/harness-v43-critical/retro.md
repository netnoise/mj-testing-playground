# Retro — harness-v43-critical

## Verdict

About the effort the task warranted, maybe slightly over on time (135 of a 150-minute budget I
set myself, above the 90-minute default, disclosed as such in the brief). Most of the overrun was
debugging the new fixture-repo test harness, not the actual fixes — three real bugs in test
scaffolding, one of them environment-specific and genuinely hard to anticipate. The work itself
(one shared module, one opener script, five consumer rewrites, one new consistency spec, one
proposed hook patch) matches what the brief scoped.

## Mistakes

1. **`open-run.sh`'s first draft had `process.argv.slice(1)` where it needed `slice(2)`.**
   `node --input-type=module - a b` puts the literal `-` at `argv[1]`, not the script itself —
   I reasoned through node's argv layout for a stdin script correctly on the *second* look, but
   wrote it wrong the first time. Caught before running anything, by re-reading the line rather
   than by a failed test — the better outcome, but the first draft still shipped with the bug for
   one file-write.
2. **Built two negative controls that silently tested nothing, twice, for the same underlying
   reason.** The blast-radius negative control sed-patched `budget.mjs` for a string
   (`pat.endsWith('/**')`) that had moved to `lib.mjs` in this same run — patching dead code, so
   the control couldn't fail even in principle. The sweep's negative control dropped a broken hook
   copy at the fixture root instead of at `.claude/hooks/budget.mjs`, breaking its own relative
   import to `lib.mjs` and making it fail to run at all rather than exercise the broken branch.
   Both are the exact trap `harness-v42-landing`'s own `HANDOFF.md` already named ("test a staged
   patch at its real directory depth") — I'd read that file this session (`brief.md`'s Inputs
   read list) and still hit a version of it twice, in a new place, because I didn't generalize
   the lesson from "verify.sh's ROOT calc" to "any relative import in a fixture." Caught only
   because I insist on running negative controls, not because I anticipated the failure mode.
3. **Assumed both negative controls should expect the same "broken" exit code (2) and only
   noticed the mismatch when the second one failed.** The blast-radius case and the sweep case
   break in opposite directions — one makes something wrongly *block*, the other makes something
   that should block wrongly *pass*. A single hard-coded expectation in `neg_case()` would have
   let the sweep's negative control "pass" for the wrong reason (matching a coincidental 0 against
   an unrelated bug) if I hadn't already tripped over mistake 2 first and been looking closely at
   its actual output.

## What the harness made harder than the task needed

The same Bash door-7 false-positive this run exists to fix hit me twice while building the fix,
both on multi-line test scripts whose *text* mentioned `state.json` or `angular.json` in an
unrelated line (a `cat`, a comment) while an earlier line in the same command used a write verb
(`git commit`, `cp`). Routed around both times by writing the test to a script file and invoking
it with `sh <path>`, per `OWED.md`'s documented workaround — which worked, but is itself evidence
for the fix: I was the test subject for the bug I was patching, inside the same session.

## Human touches

- **One door-7 patch bundle handed to you** (`.claude/hooks/budget.mjs`, `.ai/harness/verify.sh`,
  `.ai/harness/hook-test.sh` — three files, applied together per `PATCH-NOTES.md`). This is the
  only human-owed action from this run; I did not ask any other question or need any other
  correction mid-run.
- **One decision surfaced in the digest** (apply the patch now vs. defer) rather than asked
  inline, per the brief's default-and-proceed instruction — you can override either way.
- Cross-check: `ls .ai/run/harness-v43-critical/patch-*` shows exactly the three files named
  above; no `door-crossings.md` exists for this run, because I never used `HARNESS_DOOR_OPEN` or
  edited a gate-scope file directly — everything gate-scope-shaped went through the patch
  mechanism instead.

## What actually happened

Matches `digest.md` — no divergence worth calling out separately, beyond the mistakes above
(which the digest doesn't cover, by design — that's what this file is for).
