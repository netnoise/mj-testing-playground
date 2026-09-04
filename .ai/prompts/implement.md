---
skill: implement
needs: [understand]      # no brief on disk? run it first, then continue
reads: [.ai/run/<slug>/brief.md, src/**]
writes: [src/**, .ai/run/<slug>/implement.json]
model: large
budget: 45m · 12 files
stop_on:
  - enforced: one_way_door           # .claude/hooks/budget.mjs, door 7 always on
  - enforced: blast_radius_exceeded  # hook, against state.json allowed_paths
  - enforced: budget_spent           # hook
  - advisory: hypothesis_falsified   # only you can notice this
  - advisory: runtime_falsified
on_stop: write handoff, leave the branch, exit clean
---

Execute the approved brief. Nothing else.

- Work on a branch. Commit WIP after each green step — free, and the strongest
  recovery you have.
- Journal write-ahead: intent line **before** the step, result appended after.
  Skip read-only exploration and anything under a minute.
- **`hypothesis_falsified` is a success, not a failure.** If the code says your
  brief was wrong, stop and write that down. It is the most useful thing you can
  produce. Reshaping the problem until your first guess looks right is the most
  expensive failure in this whole system.
- If the hook blocks you, do not work around it. It is telling you the brief's
  model of the system was wrong. Stop and say so.
- Run `sh .ai/harness/verify.sh fast` as you go, `full` before handing back.

Emit `implement.json` with `files_changed` taken from `git diff --name-only`,
never from your own recollection.
