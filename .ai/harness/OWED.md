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

- ~~**`.claude/hooks/budget.mjs` + `.ai/harness/verify.sh` + `.ai/harness/hook-test.sh`:
  the Bash door-7 check scanned the whole command string, not the write verb's
  actual target.**~~ **Applied, commit `b55f988`.** At least five documented
  instances across R1–R3 (`.ai/run/harness-v42-r3/digest.md:38`), confirmed still
  present at `1e644ea` (six commands probed live, three of them new: `git apply`,
  `eslint --fix`, a `node -e` write — `.ai/run/harness-v43-critical/brief.md`'s
  reproduction table). Replaced with `.ai/harness/lib.mjs`'s `gateDiff()`: compares
  the tree against the run's `base_commit` and blocks further non-run-directory
  edits while an undisclosed crossing exists, instead of parsing command text.
  `verify.sh full` and `deep` both green post-apply with the new `hook-test.sh`
  (23/23). **Applying it live surfaced one more gap**, now fixed in the same
  commit and in `.ai/run/harness-v43-critical/PATCH-NOTES.md`/`.ai/HARNESS.md`:
  the patch's own new preflight fails on the uncommitted diff that applying the
  patch itself creates (no active run to disclose into) — the apply instructions
  didn't say to commit before verifying. Fixed by documenting "commit, then
  verify" as the standard apply sequence, not by weakening the preflight.
  Source: `.ai/run/harness-v42-r1/journal.md`, `.ai/run/harness-v42-r2/journal.md`,
  `docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md` §1.1.

- **New, found preparing the patch above, not fixed by it either: a Bash write to
  a run's `state.json` via a verb the regex doesn't list** (e.g. `node -e
  "...writeFileSync('.ai/run/x/state.json', ...)"`) **still isn't blocked.** The
  narrow `state.json` regex (kept as the delta note recommended, "path-specific,
  rarely misfires") sits behind the same write-verb gate the removed checks did.
  Recorded as a `[KNOWN GAP]` case in the pending `hook-test.sh` patch so it's
  visible on every `full` once applied, not silently unnoticed. Real fix (not
  attempted — same shape as the state.json check's original design tradeoff):
  tie the regex to the actual write target the way `gateDiff` does, or drop the
  write-verb prefilter for this one check specifically.

- **New: a protected-path crossing with no active run, that gets COMMITTED (not
  left uncommitted), is invisible to both the new hook sweep and the new
  `verify.sh` preflight.** Both compare against `HEAD` when no run is open, and a
  commit becomes the new `HEAD` — tested directly, `.ai/run/harness-v43-critical/
  test-verify-preflight.sh`'s last case. Bounded (requires no run open at all,
  outside the harness's normal flow) but real; not attempted to fix, since it
  needs a no-run disclosure mechanism the harness doesn't have anywhere else.

- **`.ai/harness/verify.sh`: `deep` runs `e2e/smoke.spec.ts` twice** — once
  explicitly for the `smoke` tier's own check, once again inside `deep`'s
  unfiltered `npx playwright test`. Harmless (same 3 tests pass both times),
  costs about a second. Fix: scope `deep`'s second invocation to
  `e2e/app.spec.ts` only. Cosmetic, not urgent.
  Source: `.ai/run/harness-v42-r2/digest.md`.

- ~~**`.ai/harness/verify.sh:111`: the citation gate picks its run by mtime.**~~
  **Fixed for `check-citations.sh` and `handoff.sh`** (`.ai/run/harness-v43-critical`,
  now route through `.ai/harness/lib.mjs`'s `currentRun()` — status-based, falling
  back to the greatest `started_at`, not `ls -1t`). **`verify.sh`'s own `LATEST_RUN`
  pick is fixed too, but only in the pending patch above** (`verify.sh` is
  gate-scope) — applying that patch closes this entry fully.
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
  distinguishes "merged" from "on the trunk." **`close-run.sh` now records
  `head_commit` in `state.json`** (`.ai/run/harness-v43-critical`) — the anchor
  this fix needs. **The actual check (warn when a `done` run's `head_commit` is
  not an ancestor of the default branch) is still not built** — no single run has
  the stacked-PR shape this needs to exercise against; deferred, per
  `.ai/run/harness-v43-critical/brief.md`.

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

- ~~**`.claude/hooks/budget.mjs`, `.ai/harness/verify.sh`, `.ai/harness/hook-test.sh`**
  — the door-7 tree-check patch.~~ **Done, see commit `b55f988`.**

- ~~**`.ai/MODEL.md`** — proposed diff awaiting application.~~ **Done, see commit
  `21703f5`** — applied byte-identical to
  `.ai/run/harness-v42-r3/proposed-MODEL.md`. This entry kept saying "not yet
  applied" for a day after it was.
