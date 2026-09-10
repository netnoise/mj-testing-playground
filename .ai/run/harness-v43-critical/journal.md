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
