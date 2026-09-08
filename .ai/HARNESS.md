# The harness

One page. Everything an agent needs to work in this repo. Read it before any
non-trivial change.

**The one rule:** nothing valuable lives only in a context window.

## The loop

`understand → implement → test → verify → digest → record`

You run it end to end without asking. The human reads the digest afterwards. The
only thing that stops you is a door.

## Doors

Two-way — **run, report after.** Any edit on a branch that is not pushed to a shared
ref; tests, refactors, renames; reading anything; new files inside the declared blast
radius. The undo is `git branch -D`.

One-way — **stop and write down the question.** Do not ask permission; state the door,
both sides, your default, and the cost of being wrong, then continue with everything
that does not depend on the answer.

1. Adding, removing or bumping a dependency
2. Schema or data migration
3. Changing a contract something outside the repo calls
4. Deleting or weakening an existing test
5. Anything under auth, secrets, payments
6. Writing outside the repo; pushing to a shared branch; rewriting history
7. **Editing the config that defines a gate's own scope** — `jest.config.js`,
   `setup-jest.ts`, `playwright.config.ts`, `.eslintrc.json`, `angular.json`,
   `tsconfig*.json`, `.ai/harness/verify.sh`, `.claude/hooks/budget.mjs` itself

Door 7 exists because the symptom is a *better* number. A gate metric that improves
after the gate's own config was edited is not evidence.

## Gates

`bash .ai/harness/verify.sh <tier>` — the only contract, exit 0 or 1.

| tier | runs | when |
|---|---|---|
| `fast` | lint (eslint) | after a unit of work |
| `full` | fast + `jest --ci` + `hook-test.sh` | before every commit |
| `smoke` | full + production build + `e2e/smoke.spec.ts` | at a checkpoint mid-`implement` |
| `deep` | smoke + the full e2e suite | once before handing back |

`smoke` and `deep` are both genuine runtime oracles, and both run against the actual
**production build** (`npm run build`'s `dist/`, served by `e2e/serve-dist.mjs`), not
`ng serve` — `ng serve` may be a leftover process of unknown provenance, which is the
mechanism behind a report that once reached a human as "all tests pass" and was wrong.

They check different things. `smoke` is generic and cheap: every route mounts, no
uncaught error, no horizontal overflow — it breaks only when the app is actually
broken, so it belongs inside the fix loop (`implement.md`), not just at hand-back.
`deep` adds the feature-driving spec (`e2e/app.spec.ts`) — a real acceptance test and
a much narrower regression net, since it breaks on any copy or layout change too.
A green `deep` (or `smoke`) means something actually executed, not just compiled —
the `unverified_at_runtime` state this section used to warn about no longer applies
to either. It still applies to anything that only ran `fast` or `full` and is being
reported as if the app had been exercised.

## Never trust

- **`VERIFY: PASS`** on its own. Read the test diff. A spec whose only assertion is
  `expect(x).toBeTruthy()` passes, looks like diligence and verifies nothing —
  `src/app/app.component.spec.ts:24` is that shape.
- **`status: completed`.** Compare against `git diff --stat`. A clean exit with zero
  edits is a failed run wearing a success label.
- **A metric that improved after you edited its config.** See door 7.
- **An empty list.** "Nothing failed" over zero checks is a vacuous pass.

## Budgets

Declared in each prompt's frontmatter, tagged `enforced:` (a hook checks it) or
`advisory:` (only you can trigger it — say so when you do). Enforced limits live in
`.ai/run/<slug>/state.json`, whose single writer is `.claude/hooks/budget.mjs` — the
hook blocks any other write to an existing `state.json`, including a shell `rm`
followed by a rewrite. The active run's own `.ai/run/<slug>/**` is always inside
blast radius, so a brief needing a mid-run correction is a normal edit, not a reason
to touch `state.json`.

`files_touched` is derived from `git diff --name-only HEAD` plus untracked files on
every guarded call, not accumulated from which tool you happened to use — a deletion
or a shell edit counts the same as an `Edit` call. The guard covers `Bash` as well as
`Edit`/`Write`/`MultiEdit`/`NotebookEdit`: a shell command containing a write verb
(`>`, `sed -i`, `mv`, `rm`, …) against a door-7 file or a run's `state.json` is
blocked the same as a direct edit would be. It does not apply blast radius or the
file budget to Bash — that's covered by the git-derived count above regardless of
which tool wrote the file.

Run `sh .ai/harness/hook-test.sh` (part of `verify.sh full`) to confirm the guard
itself is firing rather than silently passing everything through.

Stop conditions: `one_way_door`, `hypothesis_falsified`, `runtime_falsified`,
`blast_radius_exceeded`, `budget_spent`. Every stop writes a handoff, leaves the
branch, exits clean.

## Durability

Journal a step if redoing it costs more than recording it, or if it changed the
working tree. Intent line first, result appended. Commit WIP on green.

If you are interrupted, `bash .ai/harness/handoff.sh <slug>` writes `HANDOFF.md` with
no model call — that is the path that still works at a usage limit.

**A `HANDOFF.md` appearing while a run is still active is expected, not a signal
something went wrong — do not delete it.** The Stop hook writes one on every stop
while `state.json` is `active`, including an ordinary turn end, not just a real
interruption. It is stamped `ACTIVE — mid-run snapshot, not a final state` for
exactly this reason. Deleting it to keep the run directory tidy destroys the one
artifact this durability layer exists to guarantee, for no benefit — the file is
overwritten on the next stop regardless.

## Where things live

`.ai/run/<slug>/` brief, journal, state, emits, digest, retro (hours) ·
`.ai/decisions/` why a change happened (permanent) ·
`.ai/bank/` lessons that outlive this repo (human-curated) ·
`.ai/MODEL.md` structure and invariants (human-owned) ·
`CLAUDE.md` commands and conventions.

`emits` (`.ai/run/<slug>/<skill>.json`) are written by `.ai/harness/emit.sh`, not
by hand — mechanical, no model call, same reason as `handoff.sh`. `retro.md` is
the process critique: what the agent got wrong, distinct from `digest.md`'s
technical summary, which has no section where the agent is the subject.

## Right-sizing the loop

Not every change is `understand → implement → test → verify → digest → record`.
`.ai/harness/config.yml`'s `flows.tiny` (`implement → verify`) is for a change
that is provably local and small enough that a brief would cost more than it
saves — a typo, a one-line config value already covered by an existing test, a
comment fix. If you're unsure whether a change qualifies, it doesn't: run the
full loop. Ceremony sized to a task this small is a real cost — see the
`ui-shell-redesign` retro's own closing observation — but the failure mode of
skipping the loop on something that wasn't actually tiny is worse than the
ceremony it would have cost.

**One owner per fact.** Never restate a convention inside `.ai/`.

## After editing any prompt, hook or command file

Say so, and tell the human to restart the session. Those files load at session start;
a file written mid-session is invisible to that session, and a hook that never fires
reports nothing at all.
