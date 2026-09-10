## lib.mjs + open-run.sh

Intent: write the shared ruler/picker module (`runTouched`, `currentRun`, `hit`, `gateDiff`)
and the run-opener script that stamps `started_at`/`base_commit`/`dirty_at_start` from real
state instead of a model-typed template (brief §Model of the system, delta §1.2/§1.3/§1.5).

Wrote `.ai/harness/lib.mjs`, `.ai/harness/open-run.sh`. First cut of `open-run.sh` had
`process.argv.slice(1)` where it needed `slice(2)` — `node --input-type=module - a b` puts
`-` at argv[1], not the script itself; caught before running anything, by reasoning about
node's argv layout for stdin scripts, not by a failed run.

Tested both in a `mktemp -d` throwaway git repo (never touches this repo's real `.ai/run`):
`open-run.sh` stamps a real ISO timestamp and the fixture's actual `HEAD` sha; `currentRun()`
picks the one active run; `runTouched()` returns `[]` right after open, then correctly
still counts a file *after it's been committed* (`src/a.ts`, committed, still shows in the
touched set) alongside an uncommitted one (`src/b.ts`) — this is the direct fix for C1, the
WIP-commit reset. Opening a second run and calling `current-run` again correctly errors
`multiple active runs: myrun, other` rather than silently picking one, per the brief's
`currentRun` contract.

One process note: the very first version of this test, run as a single multi-line Bash
command, was blocked by the *existing* Bash door-7 check — its `cat .ai/run/myrun/state.json`
line contains "state.json" while an earlier line in the same command string (`git commit`)
matches a write verb, so the whole command was refused. This is C4's failure mode, caught live
while testing the fix for it. Worked around by moving the test into a script file run via
`sh <path>` instead of a heredoc/multi-line Bash call, per `OWED.md`'s documented workaround.

Result: green. Deleted the throwaway test script from the run directory after confirming it
passed; the mktemp fixture repo itself is discarded automatically (OS temp).

## Non-gate consumers: emit.sh, ledger.sh, close-run.sh, handoff.sh, check-citations.sh

Intent: route every ruler/picker through `lib.mjs` instead of the five hand-kept copies (C1/C2
in the brief), and fix the run-picker (M1) and emit timestamp (M2). None of these five files are
in `GATE_SCOPE`, so all editable directly.

- `emit.sh`: `files_changed`/`spent.files` now from `lib.runTouched(state)`; added `at`
  (real timestamp) and `base_commit`. Kept the `spent.tok` omission and its stated reason
  (delta §3, "do not change"). Tested against the live run:
  `.ai/run/harness-v43-critical/implement.json` now shows `files_changed` limited to the three
  harness files actually touched, not the run's own paperwork.
- `ledger.sh`: rewrote the roll-up in one `node -e` pass (a jq pipeline can't express "diff
  against the previous emit by `at`"). Per-run total = the emit with the greatest `at` (not a
  sum); per-skill total = each emit's own delta from the prior emit in the same run; an emit
  with no `at`, or a negative/missing `spent.min`, is marked `legacy`/`invalid`, excluded from
  every total, and the whole script exits 1. Ran against the live corpus (mixed: harness-v42-r3's
  two pre-fix emits, this run's one old `understand.json` from before the fix, one new
  `implement.json`): correctly prints `[2 legacy]` for r3, `min=n/a files=n/a`, `[1 legacy]` for
  this run alongside the one valid emit, and exits 1 — this is C2's negative-minutes bug and the
  summed-snapshot bug both gone, and the exit code makes the corpus's remaining rot visible
  instead of silent.
- `close-run.sh`: `files_touched` now from `lib.runTouched`; also now records `head_commit`
  (`gitHead()`) on every close — cheap, and it's OWED.md's "nothing looks at the trunk" anchor
  point per the brief, not a full fix (the ancestry check itself stays deferred, brief's §Deferred).
- `handoff.sh`: default slug now `node .ai/harness/lib.mjs current-run` instead of `ls -1t`;
  "Last emit" now picked by the emit's own `at` field instead of file mtime. Verified live:
  `sh .ai/harness/handoff.sh` (no slug) correctly picked `harness-v43-critical` (the one active
  run) and its "Last emit" section shows `implement.json` (has `at`), not the older
  `understand.json` (predates this fix, no `at`).
- `check-citations.sh`: default slug picker same fix (`current-run` instead of `ls -1t`).

## C5: smoke's route list can silently miss a new route

Intent: stop `e2e/smoke.spec.ts`'s hand-typed `ROUTES` const from being an unchecked second copy
of the router config - a new finding, not in the delta note itself.

- Exported `routes` from `src/app/app-routing.module.ts` (was module-private).
- New `e2e/smoke-routes.ts`: `SMOKE_ROUTES` - the list smoke actually visits. Kept
  hand-maintained on the Playwright side rather than generated, because a Playwright spec
  pulling in the Angular routing module directly drags the whole component tree through
  esbuild's plain TS transform with no Angular compiler in the loop.
- `e2e/smoke.spec.ts` now imports `SMOKE_ROUTES` instead of declaring its own `ROUTES`.
- New `src/app/smoke-routes.spec.ts`: a Jest spec, run inside `verify.sh full` (cheap, inside
  the fix loop, not just at `deep`), that reads `routes` from the Angular module and asserts
  every real (non-redirect) path is present in `e2e/smoke-routes.ts`'s list.
- **Tested the negative case directly**, same discipline as `hook-test.sh`'s negative control:
  added a throwaway `{ path: 'not-in-smoke-list', component: AdvancedFormComponent }` route,
  ran the new spec - it failed exactly as intended (`Expected value: "/not-in-smoke-list"`),
  then reverted the fixture route before committing anything.
- `npm run lint` and `npx jest --ci` both green afterward: 0 new lint errors (4 pre-existing
  warnings, unrelated file), 55/55 tests (52 previous + 3 new).

WIP commit `f2b21bc`. Confirmed the fix live afterward: `runTouched(state)` for this run's own
`state.json` still listed all 11 real files touched, none dropped by the commit.

## C4: the door-7 tree check (patch, not applied - budget.mjs and verify.sh are gate-scope)

Wrote `.ai/run/harness-v43-critical/patch-budget.mjs` and `patch-verify.sh`: `lib.mjs`'s
`gateDiff()` replaces the whole-command-string Bash scan; `lib.mjs` joins `GATE_SCOPE`;
`.ai/MODEL.md` gets the same tree-diff coverage via a separate `PROTECTED_PATHS` list;
`runTouched` replaces the hook's own `gitTouchedFiles()`; four `HARNESS_DOOR_OPEN` messages
corrected to describe what actually works.

Built `.ai/run/harness-v43-critical/patch-hook-test.sh` - the proposed replacement for
`.ai/harness/hook-test.sh`, entirely inside a fresh `mktemp` git repo (fixes delta §1.6: the
live-tree stash a `SIGKILL` can't unwind). Hit three real bugs building the fixture harness
itself, all caught by actually running it, not by inspection:

1. `open-run.sh`'s `node --input-type=module - a b` puts `-` at `argv[1]`, needed
   `argv.slice(2)` not `slice(1)` - caught before running anything (reasoned about node's argv
   layout for a stdin script).
2. **macOS symlink mismatch**: `mktemp -d` returns a `/var/folders/...` path; `process.cwd()`
   after `cd` into it resolves to `/private/var/folders/...` (`/var` is a symlink). Every fixture
   payload built from the raw `$FIX` path silently mismatched the hook's `ROOT = process.cwd()`,
   so `rel = file.startsWith(ROOT) ? ... : file` took the "no match" branch for every case -
   direct door-7 checks looked like they weren't firing, blast-radius checks fired on paths that
   should have passed. All from one root cause; fixed with `FIX=$(pwd -P)` right after `cd`, not
   the raw `mktemp -d` output. This one cost the most time in the run - the symptom (many
   unrelated-looking failures) didn't obviously point at the cause.
3. Both negative controls initially patched the WRONG file at the WRONG depth: `hit()` now lives
   in `lib.mjs`, not `budget.mjs`, so sed-patching a copy of `budget.mjs` for the blast-radius
   negative control touched dead code (nothing to break); and a broken-hook copy dropped at
   `$FIX/.broken-hook.mjs` instead of `$FIX/.claude/hooks/budget.mjs` couldn't resolve its own
   relative `import '../../.ai/harness/lib.mjs'` - exactly the trap `harness-v42-landing`'s
   HANDOFF already named for `verify.sh` at the wrong directory depth, hit again in a new place.
   Fixed by patching each file in place (save/restore) at its real location, and by checking the
   *directional* fix each negative control claims to prove (breaking blast radius wrongly BLOCKS,
   exit 2; breaking the sweep wrongly PASSES, exit 0) instead of assuming both go the same way.

Result after fixes: `sh .ai/run/harness-v43-critical/patch-hook-test.sh
.ai/run/harness-v43-critical/patch-budget.mjs` - all 23 cases pass, including the WIP-commit
budget regression and the four sweep cases (blocks/disclosed/reverted/no-run-scoped-out).

**Differential check**: ran the same 23-case suite against the live, unpatched hook -
`sh .ai/run/harness-v43-critical/patch-hook-test.sh .claude/hooks/budget.mjs` - 4 failures,
exactly the shapes the patch changes (WIP-commit budget, the sweep, one Bash case that now
intentionally differs, one negative control that's a no-op against a hook with nothing to gut).
This is what makes the new suite evidence of a real fix, not just a clean run of new code.

Separately built `.ai/run/harness-v43-critical/preflight-check.mjs` (a standalone copy of
`patch-verify.sh`'s new preflight logic - written as a real file, not a `node -e` string, after
a shell-quoting-in-a-command-substitution issue made an earlier attempt silently produce empty
output with no visible error) and `test-verify-preflight.sh`: 6 fixture cases, all pass,
including the two documented gaps (state.json via a non-listed Bash verb; a crossing committed
with no run open) confirmed present, not silently assumed.

## Docs and OWED

Updated `.ai/HARNESS.md`'s Budgets section (the new ruler, the sweep mechanism, corrected
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
