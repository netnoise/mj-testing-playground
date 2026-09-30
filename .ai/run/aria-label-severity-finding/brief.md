# Can the frozen suite tell a severity badge that is visually gone but still named from one gone entirely?
run: aria-label-severity-finding · 2026-09-30

## Intent
Plant one defect, the row badge reduced to a coloured mark with no visible text but the same name kept for assistive
technology, against the frozen suite; run every layer; restore; publish a finding that sits beside `colour-only-severity`.
> "brief the aria-label variant run": the variant the colour-only finding left open. No test is changed.

## Done when
- [ ] `verify.sh deep` green on the untouched tree; baseline commit and test revision written down first.
- [ ] `predictions.md` committed before the patch exists: one status per cell, expecting the colour-only cell vector.
- [ ] One patch (badge template and stylesheet only), reverted via itself, **measured** in the production build by script:
      visible text empty, first cell's accessible name still the label, 12 badges found by `getByRole('img', { name })`,
      colour unchanged.
- [ ] Every layer recorded with a 0008 status: the same 35 cells, axe and visual `not run`.
- [ ] Each `caught` cell's failing output saved; the record says whether it shows that the name survived.
- [ ] The record has a side-by-side table against `colour-only-severity`, names every differing cell, and its replay
      reproduces it and exits 1 on a negative control.
- [ ] After the revert `git diff --stat -- src e2e` is empty and `verify.sh deep` is green again.

## Out of scope
Editing any test or other source; fixing what it reveals; a second defect; axe or a visual layer (door 1); a `sr-only`
or `Critical`-wording variant; the write-up HTML and claude.ai artifacts. README and the Findings wireframe change only
for a pointer to the new record.

## Understand
- **One home.** Badge `src/app/board/board.html:47`, box `src/app/board/board.scss:124`; the colour-only patch is
  `.ai/run/colour-only-severity-finding/mutations/M2-colour-only-severity.patch`.
- **The variant needs a role.** `aria-label` on a bare `<span>` isn't reliably exposed, so the form is
  `<span role="img" aria-label="CRIT" class="sev …">`, with the label from `src/app/incidents/incident.ts:17`.
- **Jest reads text, not names.** The one badge test is `within(row).getByText(…short)` (`src/app/board/board.spec.ts:34`);
  `getByText` ignores `aria-label`, so it still fails. Other Jest queries target buttons, headings and the inspector
  (`src/app/board/board.spec.ts:26-58`). E2E never reads a row badge (`e2e/board.spec.ts:14`, `e2e/board.spec.ts:20`).
- **Layout snapshot records `role` and text** (`.ai/run/colour-only-severity-finding/mutations/layout-snapshot.mjs`), so
  it differs on the added role as well as the reflow. Lint has a11y template rules (`eslint.config.js:28`); `role="img"`
  with a label is valid, so a lint miss is expected at medium confidence. No axe or visual layer exists.
- **Tooling reuse:** `replay.sh`, `make-record.mjs`, `badge-metrics.mjs`, `layout-snapshot.mjs` from
  `.ai/run/colour-only-severity-finding/mutations/`, `collect.mjs` from `.ai/run/klaxon-heading-finding/mutations/`.

## Hypothesis
Serves every box. The cell vector equals the colour-only run (Jest table test and layout snapshot caught; 6 Jest, 8
Playwright, lint, build missed; 17 not applicable), and Jest's message is again `Unable to find an element with the
text: CRIT.` with no sign of the kept name. **Falsified if:** any cell differs from `colour-only-severity`, or lint flags
`role="img"`. Equal vectors mean the suite cannot tell "absent" from "hidden but named", since its one catch is keyed to text.

## Blast radius
`src/app/board/board.html`, `src/app/board/board.scss`, `docs/design/klaxon/findings/**`, `docs/design/klaxon/README.md`,
`docs/design/klaxon/wireframes/findings.html`

## Doors
None: no dependency, test, migration, contract, secret or gate-scope file.

## Open decisions
One, defaulted: `aria-label` keeps the same short string (`CRIT`/`MAJ`/`MIN`) to isolate visibility from wording.
Cost if wrong: one patch rerun.
