# The Klaxon board exists only as a wireframe and a stub, so there is nothing to plant a defect in
run: klaxon-board · intake 2026-09-19

## Intent
Build the Klaxon incident board, and only the board, on the Angular 21.2 shell, with one component
test and one real-click e2e flow that both pass on unmutated code. The `Board` route is currently a
heading-only stub.

> "Merge, then start Run 2" — decision 0008 §5 steps 2 and 3: "one board, one reproducible
> defect, one trustworthy result"; this run is the board and the healthy baseline.

## Done when
- [ ] `bash .ai/harness/verify.sh deep` is green on the branch.
- [ ] `/board` renders about 12 deterministic fixture incidents in a real `<table>` with
      `<th scope="col">` headers (SEV, ID, TITLE, SERVICE, OWNER, OPENED, STATUS); severity is
      visible text (`CRIT`, `MAJ`, `MIN`), not colour alone; relative times come from an injected
      clock so they don't drift; the page has exactly one `<h1>`, owned by the board.
- [ ] One filter, severity chips (All / Critical / Major / Minor), narrows the rows; selecting a
      row (a `<button>`, not a click handler on a `<tr>`) fills a details panel that shows the same
      severity text.
- [ ] The four non-happy states (loading, empty, failed, stale) each render distinctly and are
      reachable by URL on the production build (`?scenario=loading|empty|failed|stale`); failed and
      stale announce themselves to assistive tech.
- [ ] Keyboard only can reach the chips, a row's button and the details, with a visible
      `:focus-visible` indicator (an e2e assertion on computed style, not a screenshot).
- [ ] One Jest component test asserts row counts per filter, severity text, and details after
      selection, using role-based queries; each `it` names the invariant it protects.
- [ ] One Playwright flow (a new board spec file under `e2e/`) drives the production build with real `click()` (no
      `evaluate(el => el.click())`), and asserts the `h1` by role and level, the filter and the
      details panel; `e2e/smoke-routes.ts` still matches the routes.

## Out of scope
- Search, "new since you looked", sorting, Acknowledge, an inspector timeline, pagination: none of
  them is in 0008's milestone-1 list.
- Archive, triage form, Findings route, on-call rota, MSW, the Node BFF, the Go service.
- axe and visual regression layers (0008: "as their own steps, not prerequisites").
- Any mutation, planted defect or finding record: that is run 3 (`klaxon-heading-finding`).
- Webfonts: system stack with IBM Plex named first, no download.
- No edits to gate-scope config (`angular.json`, `tsconfig*.json`, `jest.config.js`,
  `setup-jest.ts`, `eslint.config.js`, `playwright.config.ts`).
- No rewrite of the shell beyond the heading change under Open decisions.

## Doors
- **1 (dependencies): `@testing-library/dom`**, the only new package, for role-based queries in
  the component test. Default: approved with the plan. Cost if wrong: the component test falls
  back to CSS selectors, which is the coupling `.ai/run/old-baseline-findings/evidence.md`
  already recorded, and the frozen suite for run 3 would repeat it.
- **7 (gate scope): none expected.** If Jest, ESLint or the build needs a config change to run
  the new code, stop and write a patch; don't work around it.

## Open decisions
Assumptions with defaults, all cheap to change:
- **The shell header stops being an `<h1>`.** Today `src/app/app.html` (the root template) puts
  the app title in an `<h1>`; the plan makes the board's `<h1>` the one page heading and the
  later mutation target. Default: the shell header becomes a non-heading brand element. Cost if
  wrong: a second small edit to the shell and its styles.
- **Fixture scope:** about 12 incidents, mixed severity and status (with `LIVE` and `ACKED` as
  in the wireframe), hand-written and deterministic, no faker or seed. Cost if wrong: a longer
  fixture file.
- **`?scenario=` is a production-build test seam**, labelled in the UI as fixtures like the
  wireframe's "env: fixtures". Cost if wrong: the states need another driver, such as an
  injectable data source with no URL hook.

## Understand
- **The board is a stub inside a narrow, light shell.** `src/app/board/board.ts:10` is an empty
  `Board` class rendering one `<h2>`. The shell's `<h1>` is at `src/app/app.html:2`, bound to
  `title` (`src/app/app.ts:11`). `src/app/app.scss:19-20` caps `main` at `max-width: 640px` on a
  light theme, which is wrong for an 8-column table on a dark console; the shell styles change
  in this run.
- **`smoke` visits `/board` and fails on any console error or horizontal overflow**
  (`e2e/smoke.spec.ts:29`), so the failed and stale states must be handled in the UI and must not
  call `console.error` or throw. Only `/` and `/board` are visited (`e2e/smoke-routes.ts:14`);
  `?scenario=` variants are visited by the new board spec, not by smoke.
- **`?scenario=` needs the router to hand query params to the component.**
  `src/app/app.config.ts:9` is `provideRouter(routes)` with no features. Two ways in: add
  `withComponentInputBinding()` there and read `scenario` as a signal `input()`, or inject
  `ActivatedRoute`. Recommendation: the input binding, one line in the config, no extra
  injection in the component. It is inside the allowed paths.
- **The wireframe gives the content, not the markup.** `docs/design/klaxon/wireframes/board.html`
  shows six sample rows (`INC-2891` … `INC-2879`), columns `SEV · ID · TITLE · SERVICE · OWNER ·
  OPENED · STATUS · UPD.`, chips `All · Critical · Major · Minor`, statuses `LIVE`, `ACKED`,
  `MITIGATING`, `RESOLVED`, and a details panel (owner, duration, paged, impact, timeline).
  This run takes the first seven columns (no `UPD.`) and a details panel with owner, opened,
  status and severity; timeline, Acknowledge and Escalate are out (0008 lists neither).
- **Palette and type are fixed by the README.** `docs/design/klaxon/README.md:61-67` gives ink
  `#0c0d10`/`#14161b`, accent `#5b8def`, and severity hues; IBM Plex Sans/Mono are named but not
  loaded (no webfont download), so the CSS uses the stack `'IBM Plex Sans', system-ui, sans-serif`.
- **Role-based queries work under zoneless Jest.** In a scratch copy of the run-1 tree,
  `@testing-library/dom` 10.4.2 installed, and one spec found a level-1 heading, a column header
  and a named button by role and passed (1 test, `setupZonelessTestEnv` from
  `setup-jest.ts:1-3`). jsdom cannot compute `:focus-visible` styles, which is why the brief puts
  the focus assertion in e2e.
- **Budget headroom exists.** `angular.json:53` warns at 6kb per component stylesheet; the board
  stylesheet must stay under it, so palette variables go in `src/styles.scss` and the board keeps
  only layout.
- **No door-7 file needs a change.** Jest, ESLint and the build run today on components,
  signals and `@for`; nothing in this run needs a new `tsconfig` option or a Jest transform.
- **Prior art:** no bank entry. `.ai/run/old-baseline-findings/evidence.md` is the reason the
  component test must use role queries: the class-selector spec failed identically on a real
  regression and a harmless rename.

## Model of the system
*(human-owned — my best guess, correct it in one edit)*
The board is four pieces, each small enough to read in one sitting:
1. **Model and fixture.** A typed `Incident` and a hand-written array of about 12, with a fixed
   `now`, so "3m" is computed the same on every run.
2. **A data source** the board reads, which returns the fixture normally and is told to be
   loading, empty, failed or stale by the `scenario` query param.
3. **The `Board` component**, signal-based: a filter signal, a selected-id signal, computed
   filtered rows, a template with a table and a details panel, and one branch per state.
4. **Two tests**: a Jest component test (role queries) and a Playwright flow (production build,
   real clicks).
Nothing else changes except the shell (header no longer an `<h1>`, dark theme, wider `main`).

## Hypothesis
Serves every Done-when box. A board built from semantic elements (`<table>`, `<th scope>`,
`<button>`, one `<h1>`) can be tested entirely with role queries in both layers, with no CSS
class or `data-testid` selector in either test. That is what makes the run-3 comparison with
the old class-selector result meaningful.

Falsified if: either baseline test needs a class selector or test id to find something; the
component test cannot find the row buttons or the level-1 heading by role and name; or any of the
four states can only be reached by a code path that does not exist in the production build.

## Blast radius
- `src/app/board/**` (component, template, styles, its spec)
- `src/app/incidents/**` (model, fixture, data source)
- `src/app/app.ts`, `src/app/app.html`, `src/app/app.scss`, `src/app/app.config.ts`
- `src/styles.scss`
- a new board e2e spec file directly under `e2e/`
- `package.json`, `package-lock.json`
- `CLAUDE.md` (Layout notes only)

`e2e/smoke-routes.ts` is expected unchanged and `src/app/app.routes.ts` is unchanged; if the
route table needs to change, that is a widening to record. Not listed on purpose: every door-7
file. Suggested `open-run.sh`: type `feature`, 25 files, 90 minutes.

## Doors
Only door 1, and only `@testing-library/dom` (approved with the plan). No door 7, no door 4:
no existing test is deleted or weakened. `src/app/smoke-routes.spec.ts` and
`src/app/advanced-form/advanced-form.validators.spec.ts` are not touched.

## Open decisions
None. The intake's three assumptions stand: shell header becomes a non-heading brand, a
hand-written 12-incident fixture, and `?scenario=` as a fixtures-only test seam.
