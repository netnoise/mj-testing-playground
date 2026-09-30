# Milestone 1 second finding: does the frozen suite notice a severity badge that carries colour and nothing else?
run: colour-only-severity-finding · intake 2026-09-30

## Intent
Plant one defect, the board's SEV badge stripped to a coloured mark with no visible text and no
accessible name, against a frozen suite; run every layer that exists; restore; and publish one
finding record with a replay that can fail. No test is changed to make the result better.

> "intake the colour-only run" — decision 0008 §4: "Colour-only severity is a patch applied to a
> frozen suite, run, recorded, and reverted." Mutation scope, chosen at intake: "Text and accessible
> name", meaning no text, no aria-label and no sr-only text remain.

## Done when
- [ ] `bash .ai/harness/verify.sh deep` is green on the untouched tree, and the baseline commit
      and test revision are written down before any mutation runs.
- [ ] `predictions.md` is committed **before** the first mutated run, one predicted status per
      cell, each with a reason, and it says what each `caught` cell's message is predicted to name.
- [ ] The mutation is one patch touching only what renders the badge (template and stylesheet),
      applied and reverted only via that patch; it is confirmed effective (`git diff --stat`
      non-empty) and the record shows by measurement that the badge's text and accessible name are
      gone and that its colour is unchanged.
- [ ] Every layer is recorded with a 0008 status: lint, build, each Jest spec file, each
      Playwright test in the board spec, the smoke spec, and the layout snapshot from
      `klaxon-refactor-check` if it is reusable unchanged. Axe and visual regression are `not run`
      with the reason, unless the brief's Understand section finds one that already exists.
- [ ] For each `caught` cell the failing output is saved and the record says whether the message
      names the intended cause (severity no longer readable), compared with the prediction.
- [ ] After the revert `git diff --stat -- src e2e` is empty and `verify.sh deep` is green again,
      output saved.
- [ ] A finding record (Markdown and JSON) lists baseline commit, patch, test revision, commands,
      environment, per-cell status and output files, and a `replay.sh` reproduces the outcomes,
      exits nonzero on a mismatch, and has a negative control showing it does.

## Out of scope
- Editing any test, config or source beyond the mutation patch. A better assertion is a later
  iteration row and never overwrites this result (0008 §2).
- A "visible text only" variant, a second defect, and any refactor-safety experiment.
- Installing axe or a visual-regression layer (door 1): they are recorded as `not run`.
- Fixing anything the run reveals, including weak assertions in the frozen suite.
- The write-up HTML, the findings matrix, the wireframes and the two claude.ai artifacts. The
  README's recorded-results sentence (`docs/design/klaxon/README.md:97-103`) is updated to count
  and link the new record, because the run makes it stale.

## Open decisions
Assumptions with defaults, all cheap to change:
- **Where the record lives.** Default: evidence in the run directory; the durable record in the
  findings folder beside the two existing ones, as `colour-only-severity` `.md` and `.json`.
- **Reuse of tooling.** Default: copy `collect.mjs`, `replay.sh` and `make-record.mjs` from
  `.ai/run/klaxon-heading-finding/mutations/` unchanged where they fit, and say in the digest
  where they didn't. Cost if wrong: some new plumbing.
- **Branch.** Default: `claude/klaxon-colour-severity`, cut from `master` at `59631ef`; the run ends
  with a push offer, not a merge.
- **Finding wording.** Default: phrased as the question the run answered, and a miss describes the
  suite, not the tool (0008 §3).

## Understand
- **The defect has one home.** The badge is `<span class="sev sev-{{ incident.severity }}">{{ severityLabel[incident.severity].short }}</span>`
  in the table row (`src/app/board/board.html:47`); colour comes from `.sev-critical|major|minor` (`src/app/board/board.scss:134-144`)
  and the box from `.sev` (`src/app/board/board.scss:124-132`). It has no `aria-label` and no sr-only text, so removing the
  interpolation removes the text and the accessible name together, which is the agreed mutation.
- **Severity text lives in three other places, and the mutation leaves them.** The filter buttons
  (`src/app/board/board.ts:11-14`, rendered at `src/app/board/board.html:23`) and the inspector's `Severity` row
  (`src/app/board/board.html:74`, from `src/app/incidents/incident.ts:17-21`). "Colour-only" here means colour-only *in the table row*.
  The record must say so.
- **The suite was written knowing this mutation was planned.** `src/app/board/board.spec.ts:23` is titled "…shows severity as visible
  text" and asserts `within(row).getByText(SEVERITY_LABEL[…].short)` for every incident (`src/app/board/board.spec.ts:32-35`); the file
  header says "a lost heading or lost severity text can" fail it (`src/app/board/board.spec.ts:8-9`), and `src/app/incidents/incident.ts:16`
  cites decision 0008 §4. So the README's "predicted 0 of 5" (`docs/design/klaxon/README.md:48`) is very likely wrong for Jest,
  and a catch here is partly by design, not a blind result. The record must say so.
- **E2E asserts severity only through other text.** `e2e/board.spec.ts:14` clicks the Critical filter, `:15` counts rows, `:20` checks
  the inspector contains `Critical`; nothing reads a row's badge. Kept after the mutation, all of it is still true.
- **No axe and no visual layer exist**: `package.json` and `playwright.config.ts` have no `axe` or `toHaveScreenshot`; both are `not run`.
  The layout snapshot from `klaxon-refactor-check` (`.ai/run/klaxon-refactor-check/mutations/layout-snapshot.mjs`) can see the changed
  element, as it did for the heading demotion, so it is a layer here.
- **Tooling is reusable.** `collect.mjs` (`.ai/run/klaxon-heading-finding/mutations/collect.mjs`) and the replay pattern
  (`.ai/run/klaxon-refactor-check/mutations/replay.sh`) need only a new patch list. The `defect-planter` agent
  (`.claude/agents/defect-planter.md`) runs `full` and `smoke` only and cannot run the per-cell collection, so it is not used.
- **`patchgen/` and `pg2/` are not part of this work.** Two scratch one-commit repos from 2026-09-19, made only to print diffs; their
  output is byte-identical to `M1-heading-demotion.patch` and `R3-signal-rename.patch`, both already committed. Nothing was interrupted.

## Model of the system
(human-owned) The board is one standalone component whose template renders severity as text in three places (row badge, filter buttons,
inspector). The suite was built around role and text queries, so it reads text wherever it sits.

## Hypothesis
Serves every Done-when box. Jest `board.spec.ts` "lists every incident in a table…" is **caught** (the row lookup at `:34` finds no
`CRIT`/`MAJ`/`MIN`), the other 6 Jest tests in that file are **missed**; all 8 Playwright tests and the smoke spec are **missed**; lint
and build **missed**; the layout snapshot **flags** the badge elements (their text and width change). Predicted Jest message: "Unable
to find an element with the text: CRIT" followed by a DOM dump, naming the lost text. Falsified if: Jest misses it, or any Playwright
test catches it, or the layout snapshot shows no difference.

## Blast radius
- `src/app/board/board.html`
- `src/app/board/board.scss`
- `docs/design/klaxon/findings/**` (the durable record) and `docs/design/klaxon/README.md` (its recorded-results sentence only)

## Doors
None. No dependency, test, migration, contract, secret or gate-scope file is touched. Adding axe would be door 1 and is out of scope.

## Open decisions
none beyond the defaults above. One to confirm: the mark stays visible as a filled block (scss changes with the html) so the row still
shows colour; the alternative, an empty bordered span, is a fainter defect. Default: filled block.
