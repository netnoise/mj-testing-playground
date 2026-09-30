# The harness costs more per run than the Klaxon work it guards
run: harness-v5-slim · intake 2026-09-30

## Intent
Cut what a run costs in tokens and round trips, close the owed items that bit during Klaxon
milestone 1, then freeze the harness so the next runs are Klaxon runs.
From the input: "close as many gaps as possible and ideally make the overhead less taxing for my
token usage so I can quckly move fdorward with Klaxon development."

## Done when
- [ ] `.ai/HARNESS.md` is at most 110 lines, holds rules only, and passes `check-citations.sh`.
- [ ] The default flow is four steps (brief, implement, verify, digest) with one brief prompt; the
      eight-step flow is kept under the name `full` for ambiguous or multi-day work.
- [ ] A digest ends by offering to push the branch; no prompt suggests a local merge.
- [ ] `close-run.sh` refuses a `done` close when the digest or retro has a BAD citation.
- [ ] One agent definition, defect-planter, exists and cannot be dispatched to edit a spec, an e2e
      file or the incident fixture.
- [ ] One door-7 patch file is in the run directory, tested with `hook-test.sh <proposed hook>`, and
      the hand-back message carries its apply commands inline.
- [ ] `.ai/harness/OWED.md` lists open items only, one to three lines each, with a freeze rule on top.

## Out of scope
- fast-check and Stryker. Door 1, and the validators are dead code in the app. Proposed instead as a
  Klaxon experiment on `src/app/incidents/format-age.ts`.
- Owed items that have not bitten a Klaxon run: content-hash citations, the trunk-ancestry check,
  the committed no-run crossing, blocking `AskUserQuestion` mid-run, `.claude/settings.local.json`
  in gate scope. They stay listed and parked.
- Any change to `src/` or `e2e/`.

## Understand
- **Six prompts are read for one change.** `.ai/harness/config.yml:45` lists eight steps; five of
  them carry a prompt of 1.7–5.2 KB, on top of the 13.8 KB `.ai/HARNESS.md`. Reading is the smaller
  cost: each step also writes (brief, journal, three emits, digest), 18–50 KB per run.
- **The emits have one consumer.** Only `.ai/harness/handoff.sh:62` reads them, to print the last
  one. The journal and `git diff` carry the same facts.
- **Everything is routed to the large model** (`.ai/harness/config.yml:56`), and nothing enforces
  the routing: the commands under `.claude/commands/` only say "read the prompt".
- **The Bash `state.json` guard is wrong in both directions.** `.claude/hooks/budget.mjs:173` and
  `:177` block a read that shares a command line with any write verb, and miss a write through an
  unlisted verb. `.ai/harness/OWED.md:47` and `:111` record that the two fixes pull against each
  other. With that branch gone the hook does nothing for Bash, so the matcher at
  `.claude/settings.json:6` can drop it and stop spawning node on every shell call.
- **`deep` runs smoke twice** (`.ai/harness/verify.sh:101`, `:107`) and its citation step falls back
  to an old closed run (`.ai/harness/verify.sh:164`).
- **Stale references in the rules themselves.** `.ai/HARNESS.md:67`, `.ai/HARNESS.md:78`,
  `.ai/MODEL.md:48` and `.ai/prompts/test.md:26` cite two files the regen deleted. `CLAUDE.md:11`
  calls the heading-demotion run "next"; its finding is already in
  `docs/design/klaxon/findings/heading-demotion.md`.
- **The flow has no publish step** (`.ai/harness/config.yml:45`), which produced the local merges in
  `.ai/run/2026-09-19-klaxon-milestone-1/retro.md:17`.

## Model of the system
The harness has three layers: rules an agent reads (HARNESS.md, prompts), scripts that stamp and
close a run, and one hook that blocks writes. Only the third layer prevents anything; the first two
are where the tokens go. This run shrinks layers one and two and removes one branch from layer three.

## Hypothesis
Serves every Done-when box. A Klaxon experiment run under the new default flow reads under half the
harness text and writes under half the paperwork of `klaxon-heading-finding` (20.5 KB), with the same
gate tiers green. Falsified if: the first Klaxon run after this one needs a step or a file this run
removed.

## Plan

**A. Rules and prompts (agent edits, no door)**
1. Rewrite `.ai/HARNESS.md` as rules only. History and "found live" narrative go to one file under
   `docs/reviews/`. Fix the stale citations, add the port 4200 note for `smoke` and `deep`.
2. One new prompt, brief, replacing intake plus understand for the default flow: Intent, Done when,
   Blast radius, Hypothesis, Doors. Target 40 lines of output. A run may hold several experiments.
3. `.ai/harness/config.yml`: `fix` becomes brief, implement, verify, digest; the old sequence is
   renamed `full`. Test authorship folds into implement.
4. `.ai/prompts/implement.md`: trim to the rules; add the door-7 stop shape (commands inline, one
   per block, end on a question); drop the emit.
5. `.ai/prompts/digest.md`: "What I learned" and "Concept" become optional; add the closing push
   offer, never a merge.
6. Remove emits: `.ai/harness/emit.sh` and the block at `.ai/harness/handoff.sh:62`.
7. `.ai/harness/close-run.sh` runs `check-citations.sh` on digest and retro before a `done` close,
   with an escape flag shaped like `--no-disclosure-check`.
8. `.ai/harness/check-citations.sh`: accept a `(new)` suffix as a forward reference; skip
   `predictions.md`.
9. Agent definition defect-planter: smaller model, may edit non-spec files under `src/app/`, never
   specs, `e2e/`, `src/app/incidents/incident-fixture.ts` or the harness.
10. Collapse `.ai/harness/OWED.md` to open items; add the freeze rule: a harness run happens only
    when a Klaxon run was blocked by the harness, and fixes only that.
11. `CLAUDE.md:11` brought up to date; commit the untracked run directories and handoffs.

**B. One door-7 patch (human applies)**
- `.claude/hooks/budget.mjs`: delete the Bash branch and its regex; cut the header to the current
  behaviour.
- `.claude/settings.json`: drop `Bash` from the matcher.
- `.ai/harness/verify.sh`: `deep` runs the non-smoke specs only on its second pass; a preflight
  message when port 4200 is taken; no citation fallback to a closed run.
- `.ai/MODEL.md`: the pending two-line patch plus the stale spec reference.
- `.ai/harness/hook-test.sh` is not gate scope: updated in part A and run against the proposed hook.

## Blast radius
`.ai/HARNESS.md`, `.ai/prompts/**`, `.ai/harness/config.yml`, `.ai/harness/OWED.md`,
`.ai/harness/close-run.sh`, `.ai/harness/check-citations.sh`, `.ai/harness/handoff.sh`,
`.ai/harness/emit.sh`, `.ai/harness/hook-test.sh`, `.claude/commands/**`, `.claude/agents/**`,
`CLAUDE.md`, `docs/reviews/**`, `docs/vibe-harness.html`. Budget: 30 files, 90 minutes.

## Doors
- **Door 7**, four files, part B. Default: one patch, proposed not applied. Cost if wrong: the hook
  stops guarding `state.json` against shell writes. That guard already misses `node -e`, and
  `close-run.sh` checks git, not `state.json`, so the loss is small and the patch is one revert.
- **Door 4** is not crossed: `hook-test.sh` loses the cases for the deleted branch only, and the
  digest names each one.

## Open decisions
One. `patchgen` and `pg2` at the repo root are untracked scratch (about 280 KB, a copied `src`).
Default: leave them alone and list them in the digest; deleting untracked files is not reversible,
so it is the human's call.
