# The harness has no front door: unclear asks become invented briefs, and the clock runs while the human thinks
run: harness-v44-intake · started 2026-09-15 (09:34Z, from `date -u`, not typed)

Inputs: this session's analysis of `docs/reviews/spec-bursts-research-2026-09-10.md` and two outside
reviews (pasted into chat, not on disk); the user's answers: "ask first, then walk away", `/ideate`
for feature/product and open-ended ideas, one-pass lenses, standalone outputs under
`.ai/run/<date>-<topic>/`. Approved plan: `~/.claude/plans/yes-write-the-prompts-glowing-umbrella.md`
(outside the repo — this brief is the in-repo copy of what matters).

## Intent
Add `/intake` and `/ideate`, tweak `/retro`, and move the run clock to `implement`, so that
questions happen before the run opens and the brakes are on while the human is away.

## Done when
- [ ] `.ai/prompts/intake.md` + `.claude/commands/intake.md` exist; intake saves input to disk, asks ≤4 questions in one round only for missing product intent, writes Intent / Done when / Out of scope into the brief
- [ ] `.ai/prompts/ideate.md` + `.claude/commands/ideate.md` exist; six fixed lenses, per-idea Pitch / Must be true / Cheapest test, judged separately, standalone output dir
- [ ] `understand.md` no longer calls `open-run.sh`; `implement.md` does, and names itself the walk-away point
- [ ] `retro.md` allows a standalone target and routes concrete fixes to `OWED.md`
- [ ] The loop sequence has one owner (`config.yml` `flows`); `HARNESS.md` points at it instead of restating it
- [ ] Human-owed follow-ups are in `OWED.md`; the rest of the roadmap is in `docs/reviews/harness-v44-roadmap-2026-09-15.md`
- [ ] `verify.sh full` green

## Out of scope
- Any gate-scope file (`gate-scope.json` patterns) — proposed in `OWED.md`, not edited
- `.ai/MODEL.md` — proposed diff only
- `docs/vibe-harness.html` — has the user's uncommitted edit; roadmap item
- `tiny` tooth, eval set — roadmap Phase 1

## Understand

- The premise is unattended: `.ai/HARNESS.md:12` ("You run it end to end without asking"). The
  user is at the keyboard mostly because harness commands prompt for permission — the local
  allowlist held only `npm run *` before this run (now widened, `.claude/settings.local.json`,
  gitignored, not gate scope).
- The run clock starts inside understand: `.ai/prompts/understand.md:34` calls `open-run.sh`, which
  stamps `started_at` (`.ai/harness/open-run.sh:47`). Any question asked after that is charged to
  the 90-minute budget (`.claude/hooks/budget.mjs:278`).
- Budget, allowlist and the protected-diff sweep only apply while a run is active
  (`.claude/hooks/budget.mjs:225`, `.claude/hooks/budget.mjs:240`); door 7 direct edits are
  always on (`.claude/hooks/budget.mjs:202`). So opening the run at implement means the brakes
  switch on exactly when the human leaves.
- The loop is defined twice and the copies disagree: `.ai/HARNESS.md:10` vs `.ai/harness/config.yml:40`.
- The brief template allows one hypothesis and invents intent from a code tour
  (`.ai/prompts/understand.md:26`); `question_is_underspecified` is advisory only
  (`.ai/prompts/understand.md:10`).
- A standalone retro directory already exists: `.ai/run/harness-v42-closeout/retro.md`. The run
  picker skips directories without `state.json` (`.ai/harness/lib.mjs:89`), so `verify deep`
  never citation-checks such a directory (`.ai/harness/verify.sh:164`).
- `.ai/MODEL.md:36` states `state.json` is "created once by `/understand`" — becomes stale.

## Model of the system
Prompts are advisory text; the hook, `open-run.sh`, `close-run.sh` and `verify.sh` are the teeth.
Moving the `open-run.sh` call between prompts changes *when* the teeth engage, not *what* they
enforce — no gate-scope file needs to change for this run.

## Hypothesis
Adding intake/ideate and moving `open-run.sh` to implement requires only prompt, command, doc and
config edits; the hook and verify.sh keep working unchanged, and `hook-test.sh` stays green.
Falsified if: `verify.sh full` fails, or any change turns out to require editing a gate-scope file.

## Blast radius
.ai/prompts/intake.md · .ai/prompts/ideate.md · .claude/commands/intake.md ·
.claude/commands/ideate.md · .ai/prompts/understand.md · .ai/prompts/implement.md ·
.ai/prompts/retro.md · .ai/HARNESS.md · .ai/harness/config.yml · .ai/harness/OWED.md ·
.ai/harness/open-run.sh (comment only) · docs/reviews/harness-v44-roadmap-2026-09-15.md ·
docs/reviews/spec-bursts-research-2026-09-10.md (header only)

## Doors
None crossed. The allowlist widening is a local-machine permission change the user approved in
chat; it is not gate scope (`.ai/harness/gate-scope.json`), and whether it should become gate
scope is proposed in `OWED.md`, not decided here.

## Open decisions
None — resolved with the user in chat before this run.
