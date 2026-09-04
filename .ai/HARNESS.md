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
| `full` | fast + `jest --ci` | before every commit |
| `deep` | full + production build + `playwright test` | once before handing back |

`deep` is the real runtime oracle: Playwright's `webServer` boots the app and
`e2e/app.spec.ts` drives it in a real browser. A green `deep` means something
actually executed, not just compiled — the `unverified_at_runtime` state this section
used to warn about no longer applies to `deep` itself. It still applies to anything
that only ran `fast` or `full` and is being reported as if the app had been exercised.

## Never trust

- **`VERIFY: PASS`** on its own. Read the test diff. A spec whose only assertion is
  `expect(x).toBeTruthy()` passes, looks like diligence and verifies nothing —
  `src/app/app.component.spec.ts:20` is that shape.
- **`status: completed`.** Compare against `git diff --stat`. A clean exit with zero
  edits is a failed run wearing a success label.
- **A metric that improved after you edited its config.** See door 7.
- **An empty list.** "Nothing failed" over zero checks is a vacuous pass.

## Budgets

Declared in each prompt's frontmatter, tagged `enforced:` (a hook checks it) or
`advisory:` (only you can trigger it — say so when you do). Enforced limits live in
`.ai/run/<slug>/state.json`, whose single writer is `.claude/hooks/budget.mjs`.

Stop conditions: `one_way_door`, `hypothesis_falsified`, `runtime_falsified`,
`blast_radius_exceeded`, `budget_spent`. Every stop writes a handoff, leaves the
branch, exits clean.

## Durability

Journal a step if redoing it costs more than recording it, or if it changed the
working tree. Intent line first, result appended. Commit WIP on green.

If you are interrupted, `bash .ai/harness/handoff.sh <slug>` writes `HANDOFF.md` with
no model call — that is the path that still works at a usage limit.

## Where things live

`.ai/run/<slug>/` brief, journal, state, emits, digest (hours) ·
`.ai/decisions/` why a change happened (permanent) ·
`.ai/bank/` lessons that outlive this repo (human-curated) ·
`.ai/MODEL.md` structure and invariants (human-owned) ·
`CLAUDE.md` commands and conventions.

**One owner per fact.** Never restate a convention inside `.ai/`.

## After editing any prompt, hook or command file

Say so, and tell the human to restart the session. Those files load at session start;
a file written mid-session is invisible to that session, and a hook that never fires
reports nothing at all.
