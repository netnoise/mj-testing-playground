# Does the frozen suite notice an optimistic acknowledge that is never rolled back when the fake fails?
run: no-rollback-ack-finding · 2026-10-27

## Intent
Plant one defect, the rollback removed from a failed acknowledge (the alert stays), against the frozen suite; run every
layer; restore; publish a finding beside the earlier ones. No test is changed.
> "remove the rollback on failed acknowledge, freeze the existing specs, record which layers notice"

## Done when
- [ ] `verify.sh deep` green on the untouched tree, browser pane closed; baseline commit and test revision written down.
- [ ] `predictions.md` committed before the patch exists, one status per cell, saying whether the Playwright cell fails for
      the rollback or for something incidental.
- [ ] One patch (`Board.acknowledge` only), measured in the production build: under `?scenario=ack-failed` the row and
      inspector still say `ACKED` once the alert shows; unchanged with no scenario.
- [ ] Every layer recorded with a 0008 status (lint, build, each Jest and Playwright test, layout snapshot); axe and visual `not run`.
- [ ] Each `caught` cell's failing output saved; the record says whether it names the rollback or only a text mismatch.
- [ ] The record has a replay that reproduces it and exits 1 on a negative control, and a caveat that these specs were
      written knowing this mutation was planned.
- [ ] After the revert `git diff --stat -- src e2e` is empty and `verify.sh deep` is green again.

## Out of scope
Editing any test or other source; fixing what it reveals; a second defect (rollback kept, alert dropped, is a follow-up);
MSW, a BFF, axe, a visual layer (door 1); the write-up HTML and artifacts; README and wireframe beyond a pointer.

## Understand
- **One home.** The rollback is the `catch` that deletes the id from the overlay (`src/app/board/board.ts:89`); the optimistic
  set (`src/app/board/board.ts:85`) and the alert (`src/app/board/board.ts:94`) are separate, so the patch deletes 89-93 only.
- **The fake fails on request.** `acknowledge` rejects after `ACK_DELAY_MS` for `ack-failed` (`src/app/incidents/incident-source.ts:41`).
- **Jest should catch it:** one spec asserts the return to `LIVE` (`src/app/board/board-ack.spec.ts:70`); the failed-ack digest
  says removing the override deletion fails exactly that spec. **Playwright too** (`e2e/board-ack.spec.ts:29`). Older specs
  never click Acknowledge (`e2e/board.spec.ts`, `e2e/smoke.spec.ts`) and the layout snapshot is taken at rest.
- **Lint, build:** a `catch` with one statement left is valid and leaves no unused symbol, so a miss is expected.
- **Tooling reuse:** `replay.sh`, `make-record.mjs`, `layout-snapshot.mjs` in `.ai/run/aria-label-severity-finding/mutations/`;
  `collect.mjs` in `.ai/run/klaxon-heading-finding/mutations/`. Base is `8eaab01`.

## Hypothesis
Serves every box. Exactly two cells are caught, the Jest and the Playwright rollback specs; the other Jest and Playwright
tests, lint, build and the layout snapshot miss. **Falsified if:** any other cell is caught, or either rollback spec stays green.

## Blast radius
`src/app/board/board.ts`, `docs/design/klaxon/findings/**`, `docs/design/klaxon/README.md`, `docs/design/klaxon/wireframes/findings.html`

## Doors
None: no dependency, test, migration, contract, secret or gate-scope file.

## Open decisions
One, defaulted: keep the alert, so the defect is "the UI says it failed and still shows ACKED". Cost if wrong: one patch rerun.
