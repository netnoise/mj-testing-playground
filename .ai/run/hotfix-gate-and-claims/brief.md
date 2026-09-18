# master fails `verify.sh deep`, CLAUDE.md is stale, and the heading-test finding is overstated
run: hotfix-gate-and-claims · intake 2026-09-18

## Intent
Turn `deep` green again, make CLAUDE.md true, and correct the "caught by accident" reading of the
heading test so it is replayable and accurately worded — from input.md: "plan first, fix all,
commit and push as a hotfix."

## Done when
- [ ] `verify.sh deep` exits 0 on the branch, before and after `close-run.sh`.
- [ ] `check-citations.sh` reports no BAD line for the old run's `digest.md` and `evidence.md`.
- [ ] M1-M3 exist as `.patch` files with full Jest output, a post-restore passing run, and a
      `replay.sh` that reproduces pass / fail / pass / fail.
- [ ] evidence.md, the old digest, 0008 (appended), write-up §01/§02, findings wireframe and both
      claude.ai artifacts state the three-property reading, not "by accident".
- [ ] CLAUDE.md's Project paragraph, styles bullet and gate tiers match the repo.
- [ ] `git diff --stat HEAD -- src e2e` empty at the end.

## Out of scope
The `harness-v14-retool` WARN (documented as predating the mechanism; fixing it means a door-7 edit
or an invented digest). The three old untracked run leftovers. `e2e/app.spec.ts:39`'s `evaluate`
click. The role-based-query experiment. The Angular-target decision and the door-7 edits. A PR.

## Blast radius
`CLAUDE.md`, `docs/design/klaxon/**`, `.ai/decisions/**`, `.ai/run/klaxon-claims-correction/**`,
and `src/app/app.component.{html,scss}` for the temporary mutations only (reverted).
