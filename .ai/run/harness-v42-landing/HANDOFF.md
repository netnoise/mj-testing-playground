# HANDOFF — harness-v42-landing

Mechanical floor generated 2026-09-10T08:55:37Z by `.ai/harness/handoff.sh`, then
improved. Written for a cold agent with zero context.

## Goal

The harness v4.2 remediation — from the audit in
`docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md` through runs R1,
R2, budgets and R3, then landing it on the trunk — is finished and on `master`.
No brief for this run: it was post-merge repair work, and the plan it executed
is the audit's §2.

## Done

Supported by git and a fresh gate, not by recollection:

- `master` at `1e644ea`, in sync with `origin/master`, working tree clean.
- `verify.sh deep` green on `1e644ea`, re-run for this handoff: lint, 52/52
  unit tests, `hook-test.sh` 14/14, production build, smoke 3/3, full e2e 6/6,
  door-7 disclosure check, and 7/7 citations in this run's `retro.md`.
- `771ac4a` — PR #17: the R1–R3 commits reach `master` (they had been stranded
  on `redesign/ui-shell` by merge order).
- `8a6d6cc` — R1's digest corrected in place: it had told readers to restart
  for a change that needed no restart.
- `65b7cfb` — `.ai/HARNESS.md` door 7 now points at `gate-scope.json` instead
  of a stale hand-kept list; this run's `retro.md`.
- `1e644ea` — citation gate widened to `retro.md` as well as `digest.md`;
  `.ai/harness/OWED.md` brought up to date (two stale entries fixed, three
  findings added).

## In flight

Nothing. The last action — commit and push of `1e644ea` — completed; the push
confirmed `65b7cfb..1e644ea`. The previous turn was interrupted *after* the push,
before a summary was written, so no work was cut off mid-step.

## Next

1. **Branch cleanup** — see Open decision.
2. Work from `.ai/harness/OWED.md`, roughly in order of friction caused:
   1. The Bash guard's whole-string matching (door 7 — patch for the human).
      Cost more tool calls in this remediation than anything else.
   2. Nothing looks across runs or at the trunk. Needs design before code; the
      entry sketches a shape (record head commit at close, warn if unmerged).
   3. The citation gate choosing its run by mtime (door 7).
   4. `deep` running `e2e/smoke.spec.ts` twice (door 7, cosmetic).
   5. The citation-drift card's content-hash mechanism (unbuilt, larger).

## Open decision

**Delete the merged branches?** Eleven are fully merged into `master`: locally
`harness/v4.2-remediation`, `redesign/ui-shell`, `feat/advanced-form`,
`claude/ai-harness-vibe-coding-jwi4yx`, `claude/xenodochial-banzai-617355`; and on
the remote those same five plus `claude/add-claude-documentation-8wL3G`. Default:
delete all. Cost of being wrong: low — every commit is on `master`, and GitHub can
restore a deleted branch from its PR page. Remote deletion is outward-facing, so
it waits for the human rather than being done by default.

## Traps

- **`HARNESS_DOOR_OPEN` cannot be reached in the Claude Code desktop app.** The
  hook process never sees an env var — not one set in-session, not one exported
  in a separate terminal. Every door-7 edit (`verify.sh`, `budget.mjs`, the
  Playwright/Jest configs, `.claude/settings.json`) goes to the human as a patch
  file. Don't try the override.
- **Test a staged patch at its real directory depth.** `verify.sh` computes its
  root with `dirname "$0"/../..`; a copy staged three levels deep in a run
  directory resolves the wrong root and fails for reasons that aren't the patch.
- **The Bash guard blocks on text, not targets.** Any command whose text mentions
  a gate-scope file, `.ai/MODEL.md`, or a run's `state.json` path *and* contains
  any write verb is blocked, even when the write targets something unrelated
  (`.claude/hooks/budget.mjs:117`, `.claude/hooks/budget.mjs:121`,
  `.claude/hooks/budget.mjs:126`). Split the call, use the
  `Write` tool, copy with Python, and write commit messages to a file for
  `git commit -F`.
- **The citation gate checks the most recently *touched* run**
  (`.ai/harness/verify.sh:111`), not the active one. Editing a file in an old run
  pulls that run into `deep`.
- **Command and prompt files load at session start** — a new slash command needs
  a restart. `settings.json` hook-matcher changes do *not*; that was confirmed
  live, and R1's digest wrongly said otherwise until `8a6d6cc`.
- **`set -e` plus `[ -f x ] && VAR=y` as the last command in a loop aborts the
  script** when the test is false. Hit twice. Use an explicit `if`.
- **Stacked PRs: merge the top of the stack first.** GitHub retargets a PR's base
  when its base branch is deleted; it never re-merges content. Getting this
  backwards is what stranded R1–R3 for a day.
- **The mechanical floor's Resume line said `/resume harness-v42-landing`.**
  There is nothing to resume — the run is complete. If `handoff.sh` regenerates
  this file, that line comes back; use the Resume section below instead.

## Resume

Nothing to resume. To start the next piece of work:

```
git checkout master && git pull --ff-only
```

then open a new run against an `OWED.md` item, e.g. `/understand` on the Bash
guard's whole-string matching.
