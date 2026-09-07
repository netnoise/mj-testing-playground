# The default `ng new` scaffold is still the app shell, with real features bolted around it
run: ui-shell-redesign · started 2026-09-07 · scope resolved 2026-09-08

**User decisions (chat, 2026-09-08), superseding the two open items below:**
drop `vehicle-selection` entirely (do not route it, delete it); component
styles move from SASS to SCSS. Both folded into Hypothesis/Blast
radius/Doors below.

## Understand

*(Citations below describe the pre-implementation state this brief was written
against. This run's own edits — deleting `src/app/vehicle/**`, rewriting
`app.component.html`/`app.module.ts` — have since made several of them no
longer resolve to the quoted content. That is this run doing what the
Hypothesis said it would, not drift; see `.ai/bank/2026-09-04-citation-drift.md`
for why the checker can't tell the difference and a human/reviewer should
read the diff, not re-run `check-citations.sh`, to confirm this brief.)*

- `src/app/app.component.html:1-8` and `:524-531` are the untouched `ng new`
  "delete this to get started" placeholder comments — they were never deleted.
- `src/app/app.component.html:301-522` is the full default scaffold body: the blue
  toolbar with the Angular/Twitter logos (`:301-316`), the "app is running!"
  rocket card (`:318-339`), the "Resources" link cards (`:342-369`), the
  "Next Steps" `ng generate`/`ng add` terminal switcher (`:371-423`), the
  circle-link footer icons (`:426-501`), and the GitHub star footer (`:504-516`).
  None of it is product surface; all of it is CLI-scaffold marketing content.
- The two real features are appended *after* that scaffold, with no shared shell:
  a bare-text nav link and `<router-outlet>`
  (`src/app/app.component.html:532-536`), then a hardcoded (non-routed)
  `<section class="vehicle-selection">` (`src/app/app.component.html:538-542`).
- Only one route exists: `advanced-form` (`src/app/app-routing.module.ts:6-9`,
  redirecting `''` to it). Vehicle selection is not a route — `app-brand-select`
  and `app-model-list` are always rendered directly in `AppComponent`'s template
  (`src/app/app.component.html:540-541`), never behind the outlet.
- Both real features are functionally complete but visually bare — no layout
  classes beyond generic `.error-message`/`.hint`/`.radio-group`/`.skill-row` in
  `src/app/advanced-form/advanced-form.component.html:1-140`, and a single
  unstyled `<label>`/`<select>` in
  `src/app/vehicle/brand-select.component.html:1-6` /
  `src/app/vehicle/model-list.component.html:1-8`.
- `AppModule` is one flat module — `AppComponent`, `AdvancedFormComponent`,
  `BrandSelectComponent`, `ModelListComponent` all declared together
  (`src/app/app.module.ts:11-17`), `ReactiveFormsModule` imported at root
  (`:21`). No lazy loading, no shared/UI module.
- `e2e/app.spec.ts` has exactly two tests: one asserts the scaffold's
  `"mj-testing-playground app is running!"` text is visible (`:3-6`), the other
  drives the vehicle brand→model flow (`:8-16`). `advanced-form` — the feature
  the current branch (`907ffdb`) added — has a unit spec
  (`src/app/advanced-form/advanced-form.component.spec.ts`) but **zero** e2e
  coverage; nothing in `e2e/` navigates to `/advanced-form` at all.
- `.ai/MODEL.md:39-41` already flags this in general terms ("does not by itself
  cover every route... new features should extend `e2e/`"), but no run has
  acted on it — `.ai/decisions/0004-vehicle-selection.md` shipped without an
  e2e addition either, only vehicle's existing test happened to get one because
  it replaced scaffold content the smoke test already touched.
- `CLAUDE.md` conventions that bound any redesign: component styles must be
  `.sass` (indented syntax, not SCSS — user has now asked for the opposite,
  see Doors), selectors `app-` kebab-case, and the production build enforces
  a 6kb/10kb per-component style budget and 2mb/5mb initial bundle budget
  (`CLAUDE.md` "Commands"/"Conventions" sections).
- The style convention is wired into the build, not just documented:
  `angular.json:10` sets `schematics.@schematics/angular:component.style` to
  `"sass"`, and `angular.json:31` lists `src/styles.sass` as the global
  stylesheet. Both must change for a real SCSS switch. `angular.json` is a
  door-7 gate-scope file (`.ai/HARNESS.md:31-33`, `.ai/MODEL.md:29-31`).
- No other config references the `.sass` extension — `jest.config.js` and
  `.storybook/main.js` are extension-agnostic, and `.eslintrc.json`'s only
  `"style"` keys are selector-casing rules (`.eslintrc.json:15,19`), unrelated
  to stylesheet syntax. `@angular/router` and `@angular/forms` are already
  dependencies (`package.json:25,28`), so nothing here is a door-1 issue.
- Vehicle-selection's full footprint: `src/app/vehicle/vehicle.service.ts`
  (+`.spec.ts`), `brand-select.component.{ts,html,sass,spec.ts}`,
  `model-list.component.{ts,html,sass,spec.ts,stories.ts}`; wired into
  `src/app/app.module.ts:8-9,15-16` and rendered at
  `src/app/app.component.html:538-542`; exercised by
  `e2e/app.spec.ts:8-16`; its addition is recorded in
  `.ai/decisions/0004-vehicle-selection.md`.

## Model of the system

The repo has two independent, working feature modules (vehicle selection,
advanced form) that were each added correctly in isolation but never
integrated into a real application shell — they were grafted onto the
original `ng new` placeholder instead of it being replaced. There is no
navigation structure that reflects the app's actual surface (one real route
plus one always-on section), no shared layout/typography, and the DOM a
test would drive is dominated by scaffold marketing copy rather than product
content. This is why it reads as "unusable" and "nothing worth e2e-testing":
the thing e2e tests can currently assert on is mostly the placeholder.

## Hypothesis

Redesigning the shell — not the surviving feature's logic — resolves this:
1. Delete `src/app/vehicle/**` outright (service, both components, their
   specs and stories), and its wiring in `app.module.ts` and
   `app.component.html`. `app-routing.module.ts` already only routes
   `advanced-form` (plus the `''` redirect) — no routing change needed there.
2. Delete the `ng new` placeholder markup from `app.component.html` entirely,
   replacing it with a minimal real shell (a header and the existing
   `router-outlet` — a `<nav>` is not worth adding for a single route).
3. Convert component styles from SASS to SCSS repo-wide: `angular.json`'s
   schematics default and global style entry, `src/styles.sass` →
   `src/styles.scss`, `app.component.sass` → `.scss`,
   `advanced-form.component.sass` → `.scss` (vehicle's `.sass` files are
   deleted, not converted). `CLAUDE.md`'s convention line updated to match,
   since it is that fact's sole owner (`.ai/MODEL.md:19-21`).
4. Extend e2e coverage for `/advanced-form`'s actual form flow (fill a field,
   trigger a validation message, submit successfully) — currently untested
   at the e2e tier — and replace the two now-obsolete assertions in
   `e2e/app.spec.ts` (scaffold text, vehicle flow) with real-shell coverage.

No falsification condition — both prior open decisions were resolved directly
by the user in chat rather than inferred, so this is now a spec, not a guess.

## Blast radius

- `src/app/app.component.html`, `src/app/app.component.ts`,
  `src/app/app.component.sass` → `.scss`, `src/app/app.component.spec.ts`
  (asserts on scaffold/vehicle content today — must be rewritten regardless)
- `src/app/app.module.ts` (drop vehicle declarations)
- `src/app/vehicle/**` (deleted, not edited)
- `src/app/advanced-form/advanced-form.component.sass` → `.scss`,
  `src/app/advanced-form/advanced-form.component.ts` (`styleUrls` reference)
- `angular.json` (door 7 — schematics style default + global stylesheet path)
- `src/styles.sass` → `src/styles.scss`
- `CLAUDE.md` (convention line: SASS → SCSS)
- `e2e/app.spec.ts` (rewrite obsolete assertions, add advanced-form flow)
- `.ai/decisions/**` (a new decision record superseding 0004, at `/record` time)
- Not touching: `advanced-form.validators.ts` or the form's business logic —
  this is shell/deletion/styling/test work only.

**Discovered mid-implementation, added to blast radius:**
`src/app/advanced-form/advanced-form.component.spec.ts` fails to compile
under this repo's strict TS settings — 16 unbracketed `control.errors.X`
reads trip `TS4111` (index-signature access). Confirmed via `git stash` that
this is pre-existing on `feat/advanced-form@907ffdb`, unrelated to
vehicle-selection or SCSS — `npm test`/`verify.sh full` was already red
before this run touched anything. Fixing it is bracket-notation only, no
behavior change, and it's the only thing standing between a green `full` gate
and this redesign's own changes being indistinguishable from that pre-existing
break. Also discovered: `.claude/worktrees/xenodochial-banzai-617355` (an
untracked, registered `git worktree` at `bda9993`, already fully pushed as
`origin/claude/xenodochial-banzai-617355`, clean working tree) sits inside the
repo and is *also* picked up by `jest --ci` since `jest.config.js`'s
`testPathIgnorePatterns` only excludes `/node_modules/` and `/e2e/` — every
`full`/`deep` run in this repo double-runs a stale copy of the test suite
against that worktree's own separate `node_modules` and fails there too. Not
fixed here: `jest.config.js` is gate-scope (door 7), and removing someone
else's worktree is outside this run's blast radius — flagged for the user
instead.

## Doors

**Door 1 (dependency) — resolved, not crossed.** No UI kit is being added.
Dropping vehicle-selection leaves one form as the app's entire surface, which
doesn't need a component library; hand-rolled SCSS is sufficient. This closes
the open question the first draft of this brief raised.

**Door 7 (gate-scope config) — crossed, with human say-so.** The SCSS switch
requires editing `angular.json` (schematics default style, global stylesheet
path — see Understand). `angular.json` is unconditionally gate-scope
(`.ai/HARNESS.md:31-33`, enforced by `.claude/hooks/budget.mjs:43-45`
regardless of which key changes), and that guard blocks the edit unless
"a human changes this file, or re-run with HARNESS_DOOR_OPEN=1 and say so in
the digest" (`.claude/hooks/budget.mjs:46-49`). The user's own chat message —
"I prefer scss" — is that say-so for this specific, narrow edit (the two
style keys named above). `/implement` should set `HARNESS_DOOR_OPEN=1` only
for that edit, and the digest must say so explicitly per `.ai/HARNESS.md`'s
door-7 instructions, so the crossing is never mistaken for silent drift.

**Door 4 (test deleted) — crossed, with human say-so.** Dropping
vehicle-selection means deleting `e2e/app.spec.ts:8-16`'s vehicle
brand→model test outright — testing a feature that no longer exists is not
"coverage," so this isn't a weakening in the sense door 4 warns about
(coverage silently shrinking while the feature stays). The user's "drop this
vehicle thing completely" is explicit authorization for the test to go with
it. The scaffold-text assertion (`:3-6`) is replaced, not silently dropped,
with real-shell coverage per Hypothesis step 4.

## Open decisions

None — both items raised in the first draft of this brief (vehicle-selection's
IA shape; SASS vs SCSS) were resolved directly by the user in chat.
