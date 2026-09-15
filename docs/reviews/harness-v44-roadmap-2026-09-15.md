# Harness roadmap after v4.4 (intake, ideate, ask first then walk away)

**Date:** 2026-09-15
**Status:** plan. Supersedes the backlog in §7 of
`docs/reviews/spec-bursts-research-2026-09-10.md` for this repo.
**Scope:** a solo lab. Team and Jira ideas (spec.md, finalize, CODEOWNERS, merge door,
multiplayer ownership) are out of scope on purpose.

## Where things stand

`harness-v44-intake` shipped:

- `/intake`: saves any input (text, screenshot, link, file) to disk, asks at most four
  questions in one round only for missing product intent, and writes Intent / Done when /
  Out of scope into the brief.
- `/ideate`: six fixed lenses, the same shape for every idea, judged separately. Writes to a
  standalone `.ai/run/<date>-<topic>/` directory.
- The run clock and the hook's brakes now start at `/implement`, not `/understand`. The
  premise changed from "run end to end without asking" to "ask first, then walk away".
- `/retro` gained a standalone target and routes concrete fixes to `.ai/harness/OWED.md`.
- `config.yml` `flows` is the only place the loop is written.
- A local permission allowlist (`.claude/settings.local.json`, not in git) so harness
  commands don't stop for approval.

None of the new prompts has been used on real work yet.

## Next: prove it on real work, before any further harness change

1. Run `/intake` on a vague feature request for the Angular app, ideally with a
   screenshot, then the whole `fix` flow through `/implement`.
2. Run `/ideate` on one open question.
3. Write a retro on each only if something went wrong.

This comes first because 9 of the 11 run directories before v4.4 were harness work
(`ls .ai/run`). Both outside reviews named the harness becoming the work as the main risk.
If step 1 shows `/intake` asking the wrong questions, fix that before anything below.

## Phase 1: agent-editable, one small run

| Item | Why | Touches |
|---|---|---|
| Give `tiny` a tooth | `flows.tiny` is advisory. Opening a run with `open-run.sh <slug> 2 15 <path>` gets a 2-file cap from the existing hook, with no hook change | `.ai/HARNESS.md`, `.ai/harness/config.yml` |
| Harness eval set | Only `hook-test.sh` guards the harness itself. 4–5 frozen tasks with pass/fail criteria, run by hand at first: vague prompt → intake asks ≤4 and writes failable Done when · out-of-radius edit → blocked · runtime skipped → says `unverified_at_runtime` · door-7 edit → blocked · ideate → all six lenses, obvious baseline named | new `.ai/evals/` |
| Design page catch-up | The page claims "any repo, any agent, any OS" (`docs/vibe-harness.html:266`) while the checks are Claude Code hooks, and it doesn't describe the v4.4 flow. Wait until the pending local edit to that file is committed | `docs/vibe-harness.html` |
| Tune the allowlist | After a few real runs, the `fewer-permission-prompts` skill can propose rules from what was actually run | `.claude/settings.local.json` |

## Phase 2: human patches

Tracked in `.ai/harness/OWED.md`, the one owner for human-owed work:

- `.ai/MODEL.md`: two-line diff for the stale `state.json` invariant.
- `verify.sh`: standalone directories are never citation-checked; the `currentRun()`
  fallback re-checks an old run; disclosure only warns when there's no digest.
- Optional: block `AskUserQuestion` while a run is active.
- Consider putting `.claude/settings.local.json` in `GATE_SCOPE`.

## Parked

`/diverge`, `/prune`, the attic, bank rituals, merging `fast` and `full`, spec.md, and
anything Jira-shaped. Pick one up only when its absence actually hurts. Don't build it
because a design says it should exist.

## Corrections to the 2026-09-10 research note

For the record, because the note is still read as input:

- "Specs mock the store, selector bugs don't show" comes from another repo. This app has
  no NgRx. The real test lie here is `expect(app).toBeTruthy()` in
  `src/app/app.component.spec.ts`.
- Its overkill list includes `/prune`, `/diverge`, the attic and `/draft`. Those are unbuilt
  Phase 3 items (`docs/vibe-harness.html:790`), so cutting them saves nothing.
- It filed `/retro` with bank/record as "off the default path". Retro is the only place
  where the agent is the subject. It's optional, and high-signal when used.
- "Two verify tiers" contradicts its own later advice. `smoke` (cheap runtime) vs `deep`
  (feature e2e) is a real distinction, and only `fast`/`full` could merge.
