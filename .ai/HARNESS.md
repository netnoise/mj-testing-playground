# The harness

Rules only; history and reasoning live in `docs/reviews/`, commands and conventions in `CLAUDE.md`.
**One owner per fact:** never restate a convention inside `.ai/`.
**The one rule:** nothing valuable lives only in a context window.

## The loop

The sequence lives in one place: `flows` in `.ai/harness/config.yml`.

- `fix` (default): `/brief`, `/implement`, `verify`, `/digest`, and `/retro` when the run was long,
  odd or the harness got in the way. One run may hold several experiments that share a blast radius.
- `full`: the older eight steps (`/intake`, `/understand`, `/test`, `/record` added), for vague
  input, an unfamiliar area or multi-day work.
- `tiny`: `implement`, `verify`, for a provable one-liner. Unsure? It isn't tiny; run `fix`.
- `idea`: `/ideate`, then `/brief` on the pitch picked.

**Ask first, then walk away.** Questions belong to `/brief` (or `/intake`): at most four, one round,
only for product intent the repo can't answer. Once `/implement` opens the run, assume the human has
left: no questions, only doors.

**Publish, don't merge.** A finished run ends with a push offer; stack the next run on the branch.

## Doors

Two-way (run, report after): any edit on an unpushed branch, tests, refactors, new files inside the
blast radius. The undo is `git branch -D`. One-way (stop and write down the question: door, both
sides, your default, the cost of being wrong; continue with what doesn't depend on it):

1. Adding, removing or bumping a dependency
2. Schema or data migration
3. Changing a contract something outside the repo calls
4. Deleting or weakening an existing test
5. Anything under auth, secrets, payments
6. Writing outside the repo; pushing to a shared branch; rewriting history
7. Editing the config that defines a gate's own scope. The list has one owner,
   `.claude/hooks/budget.mjs`'s `GATE_SCOPE`, emitted live to `.ai/harness/gate-scope.json`; read
   that, never copy it here. `.ai/MODEL.md` is a separate human-owned door with the same protection.

Door 7 exists because its symptom is a *better* number, which is not evidence.

**At a door-7 stop**, propose a patch (`git diff --no-index <live> <proposed>` into the run
directory) and put the apply and verify commands inline in the final message, one per block, ending
on a question. `HARNESS_DOOR_OPEN=1` works only if the human sets it for a whole session or runs
`verify.sh` with it themselves; a prefix on one Bash call is invisible to the hook. **Apply, then
commit, then verify** — the preflight fails on an uncommitted diff to a protected file.

## Gates

`bash .ai/harness/verify.sh <tier>` — the only contract, exit 0 or 1.

| tier | runs | when |
|---|---|---|
| `fast` | lint | after a unit of work |
| `full` | fast + `jest --ci` + `hook-test.sh` | before every commit |
| `smoke` | full + production build + `e2e/smoke.spec.ts` | at a checkpoint mid-`implement` |
| `deep` | smoke + the full e2e suite | once before handing back |

`smoke` and `deep` run against the production build (`e2e/serve-dist.mjs`), never `ng serve`, so
green means the shipped bundle executed. Both need **port 4200 free**; run a dev server on 4300
alongside. `smoke` is generic and cheap (routes mount, no error, no overflow) and catches nothing
about text or behaviour, so a green `smoke` is not a green feature. Anything that ran only `fast`
or `full` and is reported as exercised is `unverified_at_runtime`; say so.

## Never trust

- **`VERIFY: PASS`** alone. Read the test diff: a spec whose only assertion is `toBeTruthy()` passes
  and verifies nothing.
- **`status: completed`.** Compare against `git diff --stat`; a clean exit with no edits is a failed
  run wearing a success label.
- **A metric that improved after you edited its config.** See door 7.
- **An empty list.** "Nothing failed" over zero checks is a vacuous pass.

## Runs and budgets

A run is `.ai/run/<slug>/`: input, brief, journal, digest, retro, state. Three mechanical moments,
all scripts, never hand-edits:

| | |
|---|---|
| `open-run.sh <slug> [--type refactor\|redesign] <files> <minutes> <paths>...` | `/implement`, once. Stamps clock and ruler. Default type `feature`, 30 files, 90 minutes. |
| `revise-run.sh <slug> --add-path \| --extend --reason <text>` | Mid-run, when the allowlist or budget was too narrow. Three per run, then it refuses. |
| `close-run.sh <slug> [done\|dead]` | After `/digest`. Refuses a `done` close if a revision or door-7 crossing is missing from the digest, if digest or retro has a BAD citation, or if a `refactor` run changed a `*.spec.ts`. |

Escape flags exist for each refusal (`--no-disclosure-check`, `--skip-citation-check`,
`--skip-refactor-check`) and are disclosed in the digest.

The hook (`.claude/hooks/budget.mjs`) enforces the allowlist and the file and minute budgets on
Edit/Write, and is `state.json`'s only writer. `files_touched` comes from git against the run's
`base_commit`, minus the run's own paperwork, so a shell edit or a WIP commit still counts. The
active run's own directory is always in scope. **Widening is disclosed, not forbidden:** the digest
must name every revision. A block is either "the brief's model was wrong" (stop, write the handoff)
or normal discovery (revise). Never route around a block through Bash: the gate can't see it.

Stop conditions: `one_way_door`, `hypothesis_falsified`, `runtime_falsified`,
`blast_radius_exceeded`, `budget_spent`. Every stop writes a handoff, leaves the branch, exits clean.
`hypothesis_falsified` is a success: the code said the brief was wrong.

A declared refactor may not change a test; `close-run.sh` is door 4's only mechanical tooth.

## Durability and layout

Journal a step if redoing it costs more than recording it, or if it changed the tree: intent first,
result appended. Commit WIP on green. If interrupted, `bash .ai/harness/handoff.sh <slug>` writes
`HANDOFF.md` with no model call; the Stop hook writes one on every stop while a run is active, so
**do not delete it.** `.ai/run/<slug>/` is one run, `.ai/run/<YYYY-MM-DD>-<topic>/` a standalone
ideate or retro, `.ai/decisions/` permanent why, `.ai/bank/` human-curated lessons, `.ai/MODEL.md`
human-owned structure, `.ai/harness/OWED.md` the open list and its freeze rule.

After editing a prompt, hook or command file, say so and tell the human to restart the session.
