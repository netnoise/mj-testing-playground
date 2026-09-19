# Milestone 1 ends with one recorded result: does the frozen suite catch a demoted board heading?
run: klaxon-heading-finding · intake 2026-09-19

## Intent
Plant one defect, the board's `<h1>` demoted to a visually identical styled `<div>`, against the
frozen suite at `7327964`; run every layer that exists; restore; and publish one finding record with
a replay that can fail. No test is changed to make the result better.

> "Merge, then start Run 3" — decision 0008 §5 steps 4 and 5: "freeze the suite, apply the
> mutation as a patch, and run it. Record every layer, including those that were not run. Don't
> write the expected matrix in advance."

## Done when
- [ ] `bash .ai/harness/verify.sh deep` is green on the untouched tree, and the baseline commit
      and test revision are written down before any mutation runs.
- [ ] `predictions.md` is committed **before** the first mutated run, one predicted status per
      cell (`caught` / `missed`), each with a reason.
- [ ] The mutation is one patch touching the board template and its stylesheet only (heading
      demoted, look unchanged), applied and reverted only via that patch, and its application is
      confirmed effective (`git diff --stat` non-empty) before any result is read.
- [ ] Every layer is recorded with a 0008 status (`caught`, `missed`, `not run`, `not applicable`,
      `infrastructure error`): lint, build, each Jest spec file, each Playwright test in the
      board spec, the smoke spec; axe and visual regression as `not run`, with the reason
      (neither exists yet).
- [ ] For each `caught` cell the failing output is saved and the record says whether the message
      names the intended cause (a missing level-1 heading), compared with the prediction.
- [ ] After the revert `git diff --stat -- src e2e` is empty and `verify.sh deep` is green again,
      output saved.
- [ ] A finding record (Markdown and JSON) lists baseline commit, patch, test revision,
      commands, environment, per-cell status and output files, and a `replay.sh` reproduces the
      outcomes, exits nonzero on a mismatch, and has a negative control showing it does.

## Out of scope
- Editing any test, config or source beyond the mutation patch. A better assertion is a later
  iteration row and never overwrites this result (0008 §2).
- The colour-only severity mutation, and any second defect.
- Installing axe or a visual-regression layer: they are recorded as `not run`.
- Fixing anything the run reveals, including weak assertions in the frozen suite.
- The write-up HTML, the findings matrix, the wireframes and the two claude.ai artifacts.
- The `README` under `docs/design/klaxon/` beyond its recorded-result count (see Open decisions).

## Doors
None expected: the mutation is a transient edit on a branch, and no test, dependency or
gate-scope file is touched. Stop and write it down if a step would need one.

## Open decisions
Assumptions with defaults, all cheap to change:
- **Where the record lives.** Default: evidence (patch, raw output, `replay.sh`) in the run
  directory, and the durable finding record at `docs/design/klaxon/findings/` as
  `heading-demotion.md` and `heading-demotion.json`, where a later Findings route can read it.
  Cost if wrong: a file move.
- **`docs/design/klaxon/README.md` says "exactly one recorded result today".** Default: this
  run updates that count and links the new record, because it makes the claim false. Nothing else
  in the docs changes. Cost if wrong: a stale sentence until a docs pass.
- **How the finding is worded.** Default: phrased as the question the run answered ("does any
  layer notice a demoted heading?"), and a miss describes the suite, not the tool (0008 §3).

## Understand
- **The defect has one home.** The board's only `<h1>` is `src/app/board/board.html:2`, styled by
  the `h1` rule at `src/app/board/board.scss:6`. The shell no longer has a heading
  (`src/app/app.html` is a `<span>`), so demoting it leaves the page with no level-1 heading at
  all. `.ai/run/klaxon-heading-finding/mutations/M1-heading-demotion.patch` does exactly that: the
  `<h1>` becomes `<div class="page-title">` and the scss rule follows the class, so nothing changes
  visually. `git apply --check` passes on `7327964`. It was made in a scratch repo, not by
  editing `src/`.
- **Exactly two places assert the heading, both in tests whose titles don't mention it.**
  `src/app/board/board.spec.ts:26` (inside "lists every incident in a table…") and
  `e2e/board.spec.ts:11` (inside "filters by severity and shows the details…"). Every other
  `heading` query targets a level-2 heading (`src/app/board/board.spec.ts:56`,
  `e2e/board.spec.ts:19`). So a catch is expected to be incidental to the test's name, and to
  stop that test before its other assertions run.
- **The smoke layer is blind to it by design.** `e2e/smoke.spec.ts:13` says it "Deliberately
  asserts NOTHING about text content".
- **Lint has an accessibility ruleset but none about heading presence.**
  `eslint.config.js:28` extends `angular.configs.templateAccessibility`; whether any rule there
  flags a heading replaced by a `div` is a prediction, not something I have run.
- **`deep` stops at the first failing tier**, so it cannot report the layers separately
  (`.ai/harness/verify.sh:80` lint, `:83` Jest, `:87` build, `:107` Playwright). As in
  `.ai/run/old-baseline-findings/`, each layer is run directly and per file or test.
- **The cell inventory (frozen at `7327964`):** lint (1), build (1), Jest 24 tests in 5 files
  (board 7, format-age 4, incident-source 3, advanced-form validators 7, smoke-routes 3),
  Playwright 8 tests in 2 files (board 6, smoke 2). Axe and visual regression don't exist.
- **The previous result to compare with.** `.ai/run/old-baseline-findings/evidence.md`: on the
  old app the same demotion failed a class-selector test with `TypeError: Cannot read properties
  of null` (jest) and `toHaveText … "undefined"` after a 5s timeout (e2e), and the same failure
  came from a harmless class rename. This run's board tests are role-based, so the comparison is
  of failure *messages* and of whether a harmless refactor also fails, not of "caught or not".
- **Prior art:** no bank entry. The lessons from the previous runs apply directly: a control must
  be confirmed to have taken effect before its result is read (`git diff --stat`), and a replay
  must exit nonzero on a mismatch.

## Model of the system
*(human-owned — my best guess, correct it in one edit)*
Six layers can in principle see the mutation. Lint and build read source and templates and know
nothing about heading semantics. Jest renders `Board` in jsdom and queries by role, so the level-1
heading is visible to it, but only one line asks. Playwright drives the production build in a real
browser and asks once too. Smoke asks nothing about content. Axe and visual regression would see it
but aren't installed. The mutation is therefore predicted to be caught by exactly two tests, and
to be missed by everything else that runs.

## Hypothesis
Serves every Done-when box. Predictions to pre-register (final wording goes in `predictions.md`):

| Layer | Cells | Predicted | Reason |
|---|---|---|---|
| Jest, `board.spec` | 1 of 7 (the table-listing test) | **caught**, message names a missing level-1 heading | `src/app/board/board.spec.ts:26` |
| Jest, `board.spec` | other 6 | **missed** | no level-1 query |
| Jest, other 4 files (17 tests) | 17 | **not applicable** | they never render the board |
| Playwright, `board.spec` | 1 of 6 (filter and select) | **caught**, `getByRole … level: 1` not found | `e2e/board.spec.ts:11` |
| Playwright, `board.spec` | other 5 | **missed** | no level-1 query |
| Playwright, `smoke.spec` | 2 | **missed** | asserts nothing about content |
| Lint | 1 | **missed** | no rule about heading presence (medium confidence) |
| Build | 1 | **missed** | compiles |
| Axe, visual | 2 | **not run** | not installed |

Falsified if: any cell differs from its prediction (which is a result, recorded as such, not a
failure); the patch changes the board's computed heading styles (font-size, weight, margin), so
the demotion isn't visually identical; or the tree is not empty of changes after the revert.

## Blast radius
- `src/app/board/board.html` and `src/app/board/board.scss` (transient: the mutation, reverted)
- `docs/design/klaxon/findings/**` (new: the finding record, Markdown and JSON)
- `docs/design/klaxon/README.md` (one sentence: the recorded-result count and a link)

Not listed on purpose: every test, every config file, every other source file. Suggested
`open-run.sh`: type `feature`, 10 files, 60 minutes.

## Doors
None. The mutation is applied and reverted with `git apply` and `git apply -R` through Bash, as
in `old-baseline-findings`; the run directory holds the patch and the outputs, and the closing
diff against `base_commit` is empty for `src/` and `e2e/`.

## Open decisions
None beyond the three assumptions under intake. One check `/implement` performs before running
anything: compare the heading's computed `font-size`, `font-weight` and margin before and after
the patch in the production build, so the "visually identical" claim is measured, not assumed.
