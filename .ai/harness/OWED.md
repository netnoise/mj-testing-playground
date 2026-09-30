# Owed

Open items only. A closed item is deleted; its history is in the run that closed it and in git.

**Freeze rule.** A harness run happens only when a Klaxon run was blocked or misled by the harness,
and it fixes only that. Everything below is parked until it bites. Every entry is one to three lines,
with a trigger or a source; no tallies, no narrative (that is what `retro.md` is for). Agents propose
an entry when they find one; a human strikes it when applied.

## Parked, with the trigger that un-parks it

- **`emit.sh` and `ledger.sh` are inert** since no prompt writes emits. Delete both, plus the comments
  naming them in `lib.mjs` (door 7), `open-run.sh`, `revise-run.sh` and `shots.sh`. Trigger: the next
  door-7 patch.
- **Nothing looks across runs or at the trunk.** `close-run.sh` records `head_commit`; the check "is a
  `done` run's head an ancestor of the default branch" is unbuilt. Trigger: a stacked-PR merge lands
  out of order again.
- **A protected-path crossing that is committed with no run open is invisible** to the hook sweep and
  the `verify.sh` preflight (both diff against `HEAD`). Needs a no-run disclosure mechanism.
- **Standalone `.ai/run/<date>-<topic>/` directories are never citation-checked** by `deep`, and a
  door-7 crossing in a `done` run only warns. Sketch: pass modified standalone directories to
  `check-citations.sh`; fail, not warn.
- **Citation drift by content, not line number**: `.ai/bank/2026-09-04-citation-drift.md` names a
  content-hash fix that was never built. Trigger: a citation resolves at the right line but the
  content moved.
- **Optional tooth: block `AskUserQuestion` while a run is `active`.** First confirm a `PreToolUse`
  hook fires for that tool. Human's call whether mid-run pairing should stay possible.
- **`.claude/settings.local.json` in `GATE_SCOPE`.** It holds the permission allowlist; an agent
  widening it is door 7's shape. `gateDiff` can't see it (gitignored), only the direct Edit block would.
- **Spike mode** (a throwaway worktree with no run ceremony). Trigger: the first time something
  genuinely throwaway is blocked by the run ceremony. If built: the worktree goes outside the repo
  (the ruler counts untracked files), and it must refuse to start while a run is `active`.
- **`fast-check` and Stryker** on Klaxon's pure logic (`src/app/incidents/format-age.ts`), as an
  experiment, not harness. Door 1. Trigger: the mutation-testing Klaxon run.
