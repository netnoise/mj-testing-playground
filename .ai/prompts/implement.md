---
skill: implement
needs: [brief]           # no brief on disk? run it first, then continue
reads: [.ai/run/<slug>/brief.md, src/**]
writes: [src/**, .ai/run/<slug>/state.json]   # state.json once, via open-run.sh
model: large
budget: 90m · 30 files
stop_on:
  - enforced: one_way_door           # .claude/hooks/budget.mjs, door 7 always on
  - enforced: blast_radius_exceeded  # hook, against state.json allowed_paths
  - enforced: budget_spent           # hook
  - advisory: hypothesis_falsified   # only you can notice this
  - advisory: runtime_falsified
on_stop: write handoff, leave the branch, exit clean
---

Execute the approved brief, including the tests it needs. Nothing else.

**First, open the run** — unless `.ai/run/<slug>/state.json` already exists:
`sh .ai/harness/open-run.sh <slug> [--type refactor|redesign] <max_files> <max_minutes> <allowed_path>...`,
with the brief's Blast radius as the allowed paths. Pass `--type refactor` if the brief said
refactoring is the job (omitting it means `feature`, and the "no test file changed" claim is never
checked at close), and leave test files out of a refactor's paths. 30/90 is the default
(`.ai/harness/config.yml`). This stamps `started_at` and `base_commit` from the real clock and git,
not from anything you type. It runs once; the hook is `state.json`'s only writer afterwards.

**This is the walk-away point.** From here on no questions: a one-way door gets written down (door,
both sides, your default, cost of being wrong) and you continue with everything that doesn't
depend on it.

- Work on a branch. Commit WIP after each green step.
- Journal write-ahead: intent line before the step, result after. Skip read-only exploration and
  anything under a minute.
- **Tests:** a bug's failing spec lands first and you show it failing. A feature's specs each name
  the invariant in their `it(...)` text. A refactor's existing specs are the assertion; if one has
  to change, the change wasn't behaviour-preserving. Never weaken, skip or delete an existing test
  (door 4). Before finishing, read your own test diff and ask of each spec what would have to break
  for it to fail — a spec that only checks something is truthy verifies nothing. Gate on changed
  lines covered, never a global coverage number.
- **`hypothesis_falsified` is a success, not a failure.** If the code says the brief was wrong, stop
  and write that down. Reshaping the problem until the first guess looks right is the most
  expensive failure in this system.
- **A hook block is a fork.** Either the brief's model of the system was wrong (stop, write the
  handoff, say so) or it is normal discovery — the next caller, the sibling component. Then widen on
  the record: `sh .ai/harness/revise-run.sh <slug> --add-path <glob> --reason <text>` (or
  `--extend files|minutes <n>`). Three per run, then it refuses. Never route around a block with a
  Bash edit: the gate can't see it.
- **At a door-7 stop the final message is the hand-back.** It contains the patch's apply and verify
  commands, one per code block, and ends with a direct question. Pointing at a notes file cost two
  round trips once. Apply, then commit, then verify: the preflight fails on an uncommitted diff to a
  protected file.
- Run `sh .ai/harness/verify.sh fast` as you go, `smoke` at a natural checkpoint (a route added,
  navigation changed), `full` before handing back and `deep` once before handing back. `smoke` and
  `deep` need port 4200 free: use `ng serve --port 4300` alongside.

`files_changed` in the digest comes from `git diff --name-only`, never from recollection.
