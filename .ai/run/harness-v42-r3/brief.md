# One owner for the door list, the missing artifacts, and the docs that describe them
run: harness-v42-r3 · started 2026-09-08

## Understand

This is R3 of `docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md`'s plan
(`.claude/plans/cuddly-launching-snowglobe.md`, section "R3 — One owner, missing
artifacts, citations, docs"), which already contains the full investigation this
section would otherwise duplicate. Citing the plan's own citations rather than
re-deriving them:

- Six copies of the door-7 path list exist: `.claude/hooks/budget.mjs:50-53`,
  `.ai/harness/config.yml:17-25`, `.ai/HARNESS.md:31-33`, `.ai/MODEL.md:29-31`,
  `docs/vibe-harness.html:347`, `docs/cheatsheet.html:198` — the last one is
  already missing `setup-jest.ts`, confirmed drifted in the audit.
- Zero `.ai/run/*/*.json` emits exist anywhere in this repo (audit §1.4.1) —
  `understand.json`/`implement.json`/`test.json` are declared in every prompt's
  frontmatter `writes:` and have never once been written.
- The Stop hook (`.claude/settings.json:19-24`) fires `handoff.sh` on every stop
  while a run is active, not just on interruption — the ui-shell-redesign retro
  recorded two auto-generated `HANDOFF.md`s deleted as noise, which is exactly why
  `ui-shell-redesign` is the one run on disk with no `HANDOFF.md` at all.
- `.ai/harness/check-citations.sh:18`'s regex requires `:[0-9]+` — a bare-path
  citation is invisible to it, which is why `.ai/MODEL.md:10`'s reference to the
  deleted `src/app/vehicle/vehicle.service.ts` still reads as clean.
- `README.md:3,19,23` still describes an Angular 9 / Karma / Protractor scaffold,
  false since decision 0003.

## Model of the system

← human-owned, stated so it can be corrected in one edit. This run treats
`.ai/harness/check-citations.sh` as freely editable (confirmed: not in
`GATE_SCOPE` at `.claude/hooks/budget.mjs:50-53`), and `.ai/MODEL.md` as strictly
human-owned — the hook blocks every write to it regardless of `HARNESS_DOOR_OPEN`
reachability (`.claude/hooks/budget.mjs:93-96`), so this run's MODEL.md changes are written as a
proposed diff in the digest, never attempted as a direct edit.

## Hypothesis

Consolidating the door-7 list to one emitted source (`gate-scope.json`), building
the emit/ledger mechanism the design page already claims exists, adding a `/retro`
prompt and a "what I got wrong" digest section, and correcting the docs that no
longer describe the shipped harness will close every remaining item in the audit's
§5 coverage table except the two already-committed workstreams (R1, R2) and the
already-flagged-as-a-planning-change item (splitting `/adopt`, delta note 1.5,
explicitly out of scope for a code run).

**Falsified if:** any of the following don't hold after implementation —
`check-citations.sh` still can't see a bare-path citation; `gate-scope.json` isn't
actually read by anything (i.e., the six copies aren't really replaced); or the
emit mechanism, once built, doesn't survive being exercised for real (an emit.sh
call that errors silently would be the same vacuous-artifact problem this run
exists to fix).

## Blast radius

- `.claude/hooks/budget.mjs` — door 7, emits `gate-scope.json`; **desktop-app
  `HARNESS_DOOR_OPEN` limitation confirmed in R1/R2 — will be a patch, not a
  direct edit.**
- `.ai/harness/verify.sh` — door 7, same limitation; adds the orphaned-override
  grep to `deep`.
- `.ai/harness/config.yml` — drop the enumerated list, model-routing update for
  `digest`, `flows.fix` gains `retro`.
- `.ai/HARNESS.md` — stop enumerating the door list, flow-selection rule for
  `tiny`, layout note for `retro.md` and `gate-scope.json`, HANDOFF.md-during-
  active-run note.
- `.ai/harness/emit.sh` (new), `.ai/harness/ledger.sh` (new)
- `.ai/prompts/retro.md` (new), `.claude/commands/retro.md` (new)
- `.ai/prompts/digest.md` — "What I got wrong" section, `model:` routing
- `.ai/harness/handoff.sh` — stamp active-run snapshots
- `.ai/harness/check-citations.sh` — bare-path resolution, zero-citation guard,
  `mktemp`, optional `cite-base` header
- `.ai/prompts/keep.md` — `mechanism:` frontmatter field
- `.ai/harness/OWED.md` (new)
- `README.md` — delete the Angular 9 scaffold half
- `docs/cheatsheet.html`, `docs/vibe-harness.html` — stop enumerating the door
  list; the design page's six corrections from the audit's §1.6
- `.ai/run/harness-v42-r3/**`

**Not in radius, deliberately:** `.ai/MODEL.md` (human-owned; proposed as a diff
in the digest instead).

## Doors

Door 7 crossed twice (`budget.mjs`, `verify.sh`) — same sanctioned pattern as R1
and R2, except the desktop app has no reachable `HARNESS_DOOR_OPEN` for this
session's hook process (confirmed twice already), so both land as patch files for
the user, logged in `door-crossings.md` and named in the digest, not applied
directly.

## Open decisions

None. Every choice here is already specified by the approved plan; nothing in
this brief needed a fresh judgment call.
