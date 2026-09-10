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
7. **Editing the config that defines a gate's own scope** — one owner:
   `.claude/hooks/budget.mjs`'s `GATE_SCOPE` array, which is also the sole
   enforcer. It emits the live list to `.ai/harness/gate-scope.json` on every
   invocation — read that file for what is actually guarded. Do not re-state the
   list here: this line was a hand-kept copy until 2026-09-09 and had already gone
   stale, omitting `.claude/settings.json` for two days after the hook began
   blocking it. `.ai/MODEL.md` is a related but separate, older door (human-owned
   structure, not a gate's own scope) protected by the same tree-diff mechanism —
   see Budgets below for how enforcement actually works, including for Bash.

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
`.ai/run/<slug>/state.json`, opened once by `sh .ai/harness/open-run.sh` (called from
`understand.md`, never written by hand — see `.ai/harness/lib.mjs`'s header for why a
model-typed `started_at` isn't trustworthy). The hook blocks any other write to an
existing `state.json`, creation included, including a shell write followed by a
rewrite. The active run's own `.ai/run/<slug>/**` is always inside blast radius, so a
brief needing a mid-run correction is a normal edit, not a reason to touch
`state.json`.

`files_touched` is `.ai/harness/lib.mjs`'s `runTouched(state)`: everything that
differs from the run's `base_commit` (stamped once at open, not a moving `HEAD`),
plus untracked files, minus the run's own paperwork under `.ai/run/**` and anything
already dirty before the run started. Not accumulated from which tool you happened to
use — a deletion, a shell edit, or a file committed mid-run (this harness's own
"commit WIP on green" rule) all still count, because the ruler is git against a fixed
point, not the working tree against itself.

Bash is not scanned for write verbs against door-7 file *names* any more — that
whole-command-string check let a write through whenever it didn't use one of a fixed
verb list (`node -e`, `python3 -c`, `git apply`, …), while blocking unrelated commands
that merely *mentioned* a protected path. In its place: `.ai/harness/lib.mjs`'s
`gateDiff` compares the actual tree against `base_commit` (or `HEAD` with no run open)
on every guarded call. It can't prevent a Bash write before it happens, so instead —
once an undisclosed door-7 (or `.ai/MODEL.md`) diff exists, every subsequent
`Edit`/`Write`/`MultiEdit`/`NotebookEdit` **outside the active run's own directory**
is refused until it's disclosed (`.ai/run/<slug>/door-crossings.md`, naming the file)
or reverted (`git checkout -- <path>`, via Bash — Bash itself is never blocked by
this, since it's the only way to revert). `verify.sh`'s preflight makes the same
check before any tier runs, so an undisclosed crossing can't produce a green gate even
if it slips past a single missed hook call. This sweep only runs while a run is
genuinely active — there's nowhere to disclose into otherwise, and a committed (not
just uncommitted) crossing with no run open is a real, undetected gap; ad-hoc/`tiny`
work was never meant to carry this machinery, and a direct edit whose own target is a
door-7 file is still blocked unconditionally either way.

**The `HARNESS_DOOR_OPEN=1` override does not work as a prefix on one Bash call.** The
hook reads its own process environment, not the environment of the command it's
checking — a value set mid-conversation, or prefixed onto a single shell command, is
invisible to it. The two forms that actually work: the human sets it for the *entire
session* before it starts (not available in the Claude Code desktop app — there is no
path to it there; go straight to a patch for the human), or the human runs
`HARNESS_DOOR_OPEN=1 sh .ai/harness/verify.sh` themselves. If a gate-scope edit is
needed, propose it as a patch (a unified diff — `git diff --no-index <live> <proposed>
> x.patch` in the run directory, so a human reviews a diff, not a full-file
replacement) and say so in the digest; don't chase the override.

**When you (the human) apply a gate-scope patch, commit it before running `verify.sh`
— not after.** `verify.sh`'s own preflight diffs the tree against `HEAD` when no run
is active and fails on an undisclosed protected-file diff; applying a patch (`cp` or
`git apply`) is exactly that kind of diff. Copy the file(s) in, commit, then verify —
found live applying the v4.3 door-7 patch itself.

Run `sh .ai/harness/hook-test.sh` (part of `verify.sh full`) — now built entirely
inside a throwaway `mktemp` git repo, never the live `.ai/run` — to confirm the guard
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
