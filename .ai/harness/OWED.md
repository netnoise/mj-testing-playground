# Owed

Human-owed door-7 fixes, bank cards whose own named mechanism was never built,
checks that retros found missing, and orphaned `HARNESS_DOOR_OPEN` overrides —
collected here instead of being re-discovered from a journal or re-read from a
bank card each time. Agent-owned: propose an entry when you find one (`/keep`'s
`mechanism:` field appends here automatically when set); human-owned: strike an
entry when it's actually applied, don't just delete the line — a short "done,
see commit" beats silent removal.

**No running tallies in entries.** A count of how many times something recurred
goes stale the next time it recurs — this file's own first entry did, inside the
session that created it. Cite the documented floor and where to look instead.

## Door-7 (needs a human edit)

- **`.claude/hooks/budget.mjs`: all three Bash sub-checks match against the whole
  command string, not the write verb's actual target.** The `MODEL.md` check
  (`.claude/hooks/budget.mjs:117`), the door-7 needle check
  (`.claude/hooks/budget.mjs:121`) and the `state.json` check
  (`.claude/hooks/budget.mjs:126`) each test whether a protected name appears
  *anywhere* in the command, and block if a write verb also appears *anywhere*. So
  a legitimate command is blocked because it *mentions* a protected file in
  unrelated content — prose, a JSON value, a heredoc body, a `cp` or `diff`
  *source* — while its `>` or `rm` targets something else entirely. At least five
  documented instances across three runs (`.ai/run/harness-v42-r3/digest.md:38`),
  and it has recurred in every run since, including while writing test fixtures and
  a PR body. The `MODEL.md` variant fired writing a fixture to an unrelated file
  whose *text* cited that path. Workaround: split into separate Bash calls, route
  the write through the `Write` tool, or copy with Python. Real fix: tie each check
  to the token the write verb actually targets. Always fails closed — friction,
  never a hole.
  Source: `.ai/run/harness-v42-r1/journal.md`, `.ai/run/harness-v42-r2/journal.md`.
  *(Previously said "found live three times" — already five before the run that
  wrote it had ended, and never updated.)*

- **`.ai/harness/verify.sh`: `deep` runs `e2e/smoke.spec.ts` twice** — once
  explicitly for the `smoke` tier's own check, once again inside `deep`'s
  unfiltered `npx playwright test`. Harmless (same 3 tests pass both times),
  costs about a second. Fix: scope `deep`'s second invocation to
  `e2e/app.spec.ts` only. Cosmetic, not urgent.
  Source: `.ai/run/harness-v42-r2/digest.md`.

- **`.ai/harness/verify.sh:111`: the citation gate picks its run by mtime.**
  `ls -1t .ai/run | head -1` means "most recently touched," not "most recent
  work" — editing any file in an old run makes that run the one gated. Happened
  once already: correcting `harness-v42-r1`'s digest in place pulled a two-day-old
  run into `deep`, where it surfaced a synthetic fixture path written as a real
  citation. Useful by accident that time, but the gate can check the wrong run and
  skip the one actually being handed back. Fix: select the run whose `state.json`
  is `status: active`, falling back to the latest `started_at` — both already in
  every `state.json`. Low urgency.
  Source: `.ai/run/harness-v42-landing/PATCH-NOTES.md`.

## Checks retros found missing

- **Nothing looks across runs, or at the trunk.** Every digest checks its own run
  and every gate checks its own branch, so work that falls *between* runs is
  invisible to all of them. Twice now. The closeout found two plan items still
  open after each run had honestly reported itself complete
  (`.ai/run/harness-v42-closeout/retro.md`). Then eight reviewed commits sat one
  branch away from `master` for a day, after a stacked-PR merge landed in the
  wrong order, surfacing only because a slash command added in those commits came
  back "Unknown command" (`.ai/run/harness-v42-landing/retro.md`). Nothing
  distinguishes "merged" from "on the trunk." Shape of a fix: have
  `.ai/harness/close-run.sh` record the run's head commit in `state.json`, and a
  check that warns when a `done` run's head is not an ancestor of the default
  branch. Not designed yet.

## Bank cards with an unbuilt mechanism

- **`.ai/bank/2026-09-04-citation-drift.md`** names its own fix in its
  `Generalises` line: "a content hash of the cited span, not just its line
  number." `.ai/harness/check-citations.sh`'s `<!-- cite-base: <sha> -->` header
  (added `harness-v42-r3`) solves a related but different problem — a citation
  resolving against the wrong *commit* — not this one: a citation whose line
  still resolves, at the intended commit, but whose *content* silently drifted
  after the citation was written and before it was next checked. Genuinely
  still unbuilt. Would need per-citation hash storage, which is a bigger change
  than this run's scope.

## Pending human application

- ~~**`.ai/MODEL.md`** — proposed diff awaiting application.~~ **Done, see commit
  `21703f5`** — applied byte-identical to
  `.ai/run/harness-v42-r3/proposed-MODEL.md`. This entry kept saying "not yet
  applied" for a day after it was.
