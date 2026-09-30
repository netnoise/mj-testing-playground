# Harness v5 slim: why, what changed, what was left

Run `harness-v5-slim`, 2026-09-30, branch `harness/v5-slim`. The run's own brief and input are in
`.ai/run/harness-v5-slim/`.

## Why

An outside review compared this harness with TriTrack's. Checked against the tree at `feab964`, its
four claims were: no agent roster (true, but the allowlist is already enforced before an Edit or
Write, so an agent buys a smaller model and context rather than new enforcement); no property or
mutation tests (true, but the validators are imported by nothing except their own spec, and both
tools are a door-1 dependency change); no publish step (true, already owed); hook tests missing
(false, `hook-test.sh` has 23 cases with negative controls). The measured problem was cost: since
2026-09-01, 73 of 120 commits mention the harness, and `.ai`, `.claude` and `docs` took about 24,000
changed lines against about 4,100 in `src` and `e2e`. A change walked eight steps and wrote 18–50 KB
of paperwork; the last two Klaxon experiments each paid the whole loop for minutes of work
(`.ai/run/2026-09-19-klaxon-milestone-1/retro.md`).

## Changed

- `.ai/HARNESS.md` is rules only. The "found live" narrative that used to sit in it is in the git
  history at `feab964` and in the run retros; nothing was lost, it stopped being loaded every run.
- The default flow is `brief, implement, verify, digest`. The old eight steps are `full`.
- Emits are no longer required by any prompt. Only `handoff.sh` ever read them.
- `close-run.sh` refuses a `done` close on a BAD citation in the digest or retro.
- `check-citations.sh` skips a backticked path followed by ` (new)`, and skips bare paths in
  `predictions.md`.
- The digest ends with a push offer, never a merge.
- The `defect-planter` agent exists. Its file lock is instruction-level; the hook enforces only the
  run's allowlist.

## Left alone

- `emit.sh` and `ledger.sh` are inert now. Deleting them needs edits in files the run did not open
  (`ledger.sh`) and in door-7 comments (`lib.mjs`); listed in `OWED.md`.
- fast-check and Stryker: proposed as a Klaxon experiment on `src/app/incidents/format-age.ts`.
- The owed items that had not bitten a Klaxon run stay in `.ai/harness/OWED.md`.

## Door 7

One patch, proposed not applied: see the run's `patch/` directory.
