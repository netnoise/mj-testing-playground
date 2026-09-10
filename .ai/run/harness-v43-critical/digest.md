# Digest — harness-v43-critical

Triage and partial remediation of the v4.3 delta note (external, triathlon repo:
docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md — not a path in this repo, so not a checkable
citation here) before the harness goes back to feature work on this repo. Every reproduction in
the delta note was re-run live at `1e644ea` first (`brief.md`'s Understand section) — all of it
reproduced.

## What shipped, committed and applied

- **`.ai/harness/lib.mjs`** (new): one owner for `runTouched` (files touched since the run's
  `base_commit`, run paperwork excluded — fixes the WIP-commit budget reset, delta §1.3),
  `currentRun` (status-based run picker, delta §1.5), `hit` (glob matcher), `gateDiff` (the
  tree-check primitive the pending door-7 patch uses).
- **`.ai/harness/open-run.sh`** (new): opens a run with `started_at`/`base_commit`/
  `dirty_at_start` stamped from the real clock and git, not typed by the model (delta §1.2 —
  `harness-v42-r3`'s `started_at` was 2h08m off its own first commit).
- **`emit.sh`, `ledger.sh`, `close-run.sh`, `handoff.sh`, `check-citations.sh`** all route through
  `lib.mjs` now. `ledger.sh` treats emits as cumulative-since-run-start (latest = the run total,
  not a sum) and refuses an emit with no `at` or an impossible `spent.min`; `close-run.sh` also
  now records `head_commit`. Verified against the live corpus: `sh .ai/harness/ledger.sh` used to
  print `min=-259 files=45` for `harness-v42-r3` and exit 0; it now prints `min=n/a files=n/a
  [2 legacy]` and exits 1 — an honest "this run's numbers can't be trusted," not a wrong-but-
  plausible one.
- **New finding, not in the delta note**: `e2e/smoke.spec.ts` kept its own hand-typed route list,
  a second unchecked copy of the Angular router config — a route added to the app without also
  editing the e2e spec would get a green `smoke`/`deep` over a page that never mounted. Fixed:
  `app-routing.module.ts` exports `routes`; `e2e/smoke-routes.ts` is the one list smoke visits;
  `src/app/smoke-routes.spec.ts` (new, runs inside `verify.sh full`) fails if they drift. Tested
  the negative case directly — added an uncovered fixture route, watched the spec fail, reverted.
- Docs: `.ai/HARNESS.md`'s Budgets section rewritten for the new ruler and the tree-check
  mechanism, including corrected `HARNESS_DOOR_OPEN` semantics (delta §1.7 — the old wording told
  the agent to do something that cannot work as a per-command prefix). `.ai/prompts/understand.md`
  now calls `open-run.sh`. `.ai/prompts/retro.md` gains an advisory `human_touches` field
  (delta §1.8). `.ai/harness/OWED.md` updated throughout.

`verify.sh full` and `deep` both green after every step above: lint (4 pre-existing warnings,
unrelated file), 55/55 jest (52 + 3 new), hook-test 14/14 (the *old* suite — see below), build,
smoke 3/3, full e2e 6/6.

## What's proposed but not applied — needs you

`.claude/hooks/budget.mjs` and `.ai/harness/verify.sh` are gate-scope (door 7); a companion change
to `.ai/harness/hook-test.sh` is not gate-scope but is sequenced with them. All three are staged in
this run's directory with full instructions in **`PATCH-NOTES.md`** — that's the file to read next.

Short version: the Bash door-7 check used to scan whole command strings for a write verb and a
protected filename with no relation between them, so `node -e "...writeFileSync(...)"`,
`python3 -c "open(...)"`, `git apply`, and `eslint --fix` on a protected file all went straight
through (verified live, six for six), while a plain read like `cp angular.json /tmp/x` got
blocked. It's replaced with a tree check — compare the actual working tree against the run's
`base_commit`, and once an undisclosed crossing exists, refuse further edits outside the run
directory until it's disclosed or reverted. Tested in a throwaway `mktemp` repo: 23/23 cases pass
against the proposed hook, and the same 23-case suite run against the *current, unpatched* hook
fails 4 — exactly the cases this patch is meant to fix. `PATCH-NOTES.md` has the full table and
both known gaps the patch does not close (a Bash write to `state.json` via an unlisted verb; a
protected-path crossing that gets committed with no run open).

## One decision for you

**Apply the door-7 patch now, or defer it?** Default: apply it before the next feature run —
`OWED.md`'s door-7 section and every retro since R1 name this guard as the single largest
friction source in the harness, and the fix is tested and ready. Cost of being wrong (applying a
bug): bounded — the hook fails open on anything unexpected, the run directory always stays
editable, and `git checkout` always reverts, so a bad patch degrades to "annoying" rather than
"unrecoverable." Cost of deferring: the next feature run inherits a door-7 guard that both
under-blocks (the six bypasses) and over-blocks (reads mistaken for writes), which is exactly the
condition that trained past runs to route around it.

```bash
cd /Users/emjot/dev/projects/mj-testing-playground
cp .ai/run/harness-v43-critical/patch-budget.mjs .claude/hooks/budget.mjs
cp .ai/run/harness-v43-critical/patch-verify.sh .ai/harness/verify.sh
cp .ai/run/harness-v43-critical/patch-hook-test.sh .ai/harness/hook-test.sh
chmod +x .ai/harness/verify.sh .ai/harness/hook-test.sh
sh .ai/harness/verify.sh full
```

## Deferred on purpose — not done this run

- Bringing `docs/vibe-harness.html` to v4.3 (still labelled v4.1) — documentation, not mechanism;
  do it once this run's changes have settled.
- The trunk-ancestry check and `close-run.sh` refusing on unticked plan items (delta §1.9) — arc-
  level, no single run has that shape to test against. `close-run.sh` now records `head_commit`
  as the anchor.
- Per-flow budgets, `observed_unlisted` noise, capping `HARNESS.md`'s length, the citation-drift
  card's content hash.
- **Re-tuning 30/90** — deliberately not touched. The ruler changed under these numbers; the
  brief says to re-measure over 3+ real runs first.

## What surprised me

Building the new `hook-test.sh` inside a `mktemp` repo (rather than the live tree) surfaced a
macOS-specific bug that had nothing to do with the harness logic: `/var` is a symlink to
`/private/var`, so `mktemp -d`'s literal output and Node's `process.cwd()` after `cd` into it
disagree, and every fixture payload built from the raw path silently mismatched the hook's
`ROOT`. It cost more debugging time than the actual door-7 fix, and the failure mode (many
unrelated-looking test failures) didn't point at the cause — full account in `retro.md`.
