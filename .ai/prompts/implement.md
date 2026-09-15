---
skill: implement
needs: [understand]      # no brief on disk? run it first, then continue
reads: [.ai/run/<slug>/brief.md, src/**]
writes: [src/**, .ai/run/<slug>/implement.json, .ai/run/<slug>/state.json]   # state.json once, via open-run.sh
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

Execute the approved brief. Nothing else.

**First, open the run** — unless `.ai/run/<slug>/state.json` already exists:
`sh .ai/harness/open-run.sh <slug> <max_files> <max_minutes> <allowed_path>...`, with the
brief's Blast radius as the allowed paths. 30/90 is the default (`.ai/harness/config.yml`),
sized to the largest real run on record; raise or lower it if the blast radius clearly
warrants. This stamps `started_at` from the real clock and `base_commit`/`dirty_at_start`
from git, not from anything you type — a model-typed `started_at` is not trustworthy (it
drifted from the run's own first commit by two hours on `harness-v42-r3`, local time written
down as UTC) and every budget in the hook measures from it. A path you forget from
`allowed_path` will block a later step — that is the mechanism working, not a bug. **This
runs once.** The hook is `state.json`'s sole writer after this: it re-derives `files_touched`
from git (against `base_commit`, not a moving `HEAD`) on every edit, and blocks any tool —
including a shell write — from touching this file again, creation included, while the run is
active. If a budget or allowlist genuinely turns out wrong mid-run, say so in the digest;
don't delete the file to reset it.

**This is the walk-away point.** The human may leave once the run is open. From here on, no
questions: a one-way door gets written down — door, both sides, your default, cost of being
wrong — and you continue with everything that doesn't depend on it.

- Work on a branch. Commit WIP after each green step — free, and the strongest
  recovery you have.
- Journal write-ahead: intent line **before** the step, result appended after.
  Skip read-only exploration and anything under a minute.
- **`hypothesis_falsified` is a success, not a failure.** If the code says your
  brief was wrong, stop and write that down. It is the most useful thing you can
  produce. Reshaping the problem until your first guess looks right is the most
  expensive failure in this whole system.
- **If the hook blocks you, it is a fork, not a wall.** Two different situations
  look identical from inside the block, and only you can tell them apart:
  - *The brief's model of the system was wrong* — the change is bigger, or
    different in kind, from what the brief describes. Stop, write the handoff,
    say so. Still the right answer, still the common one.
  - *This is normal discovery* — a refactor found the next caller, a redesign
    found the sibling component. The brief wasn't wrong so much as incomplete in
    the way every prediction about existing code is incomplete. Widen it, on the
    record:
    `sh .ai/harness/revise-run.sh <slug> --add-path <glob> --reason <text>`
    (or `--extend files|minutes <n>`). Three per run, then it refuses — and that
    refusal *is* the first case above, reached with evidence instead of a guess.

  **Do not route around a block by making the edit through Bash.** The allowlist
  and the budget only cover Edit/Write — the hook returns before either check on
  the Bash path (`.claude/hooks/budget.mjs:175-187`) — so a shell edit just
  succeeds, silently and undisclosed. Every run here before `revise-run.sh`
  existed took that route and wrote a note about it afterwards
  (`.ai/run/vehicle-selection/journal.md:9-13`, `:19-21`). The widening is the
  same either way; the difference is whether the gate can see it.
- Run `sh .ai/harness/verify.sh fast` as you go, `smoke` at a natural checkpoint
  (a route added, navigation changed, a component wired into the app shell) and
  `full` before handing back. `smoke` is cheap enough to run more than once per
  run — it's the tier `runtime_falsified` can actually fire from mid-loop, not
  just at hand-back. See `.ai/HARNESS.md`'s tier table for what it checks.

Emit `implement.json` with `files_changed` taken from `git diff --name-only`,
never from your own recollection.
