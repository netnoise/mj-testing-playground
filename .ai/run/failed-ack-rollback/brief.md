# The board has no Acknowledge action, so there is nothing yet to fail and roll back
run: failed-ack-rollback · 2026-09-30

## Intent
Build Acknowledge on the board against a controlled fake that can be told to fail, with an optimistic update, a rollback
and an alert on failure, and a healthy baseline of tests for it. **Planting** the "optimistic ack not rolled back on 500"
defect and recording how the suite reacts is the next run, not this one.
> "Failed-ack/rollback scenario: the next item in decision 0008's post-milestone sequence."

## Done when
- [ ] Selecting a `live` incident shows an "Acknowledge" button in the inspector; no other status does.
- [ ] Clicking it shows the incident as `ACKED` at once (optimistic) and keeps it `ACKED` after the fake confirms.
- [ ] With `?scenario=ack-failed` the same click shows `ACKED`, then returns the row and the inspector to `LIVE` and raises a
      `role="alert"` naming the incident; the button is usable again.
- [ ] A Jest spec drives the optimistic, confirmed and rolled-back states through a fake it settles by hand, with no timers.
- [ ] A Playwright spec on the production build clicks through both paths with real pointer clicks and no sleeps, and raises no
      console error.
- [ ] Every existing spec is unedited and green; new specs are in new files; `verify.sh deep` is green (browser pane closed).
- [ ] The scenario list in `CLAUDE.md` names `ack-failed`, and the wireframe's Acknowledge button is the only UI reference.

## Out of scope
MSW, a BFF, HTTP, any dependency; the planted defect; the Findings route; Escalate, timeline and other inspector content; a
second scenario; editing or weakening an existing test; styling beyond what the new button and alert need.

## Understand
- **Read-only today.** `IncidentSource.load` is synchronous and returns fixtures by scenario
  (`src/app/incidents/incident-source.ts:19`); `Board` derives everything from it (`src/app/board/board.ts:33`) and has no action
  (`src/app/board/board.ts:60-72`). Status is `live | acked | mitigating | resolved` (`src/app/incidents/incident.ts:3`); the
  first fixture incident is `live` (`src/app/incidents/incident-fixture.ts:18`).
- **The design wants it.** The wireframe inspector has an Acknowledge button (`docs/design/klaxon/wireframes/board.html:199`), and
  the write-up puts "a failed acknowledgment with rollback" next (`docs/design/klaxon/klaxon-testing-lab.html:766`).
- **The scenario seam is the existing `?scenario=`**, bound to `Board.scenario` (`src/app/board/board.ts:23`) and documented in
  `CLAUDE.md:49`; `ack-failed` is another value of it. It is a fixtures-only seam.
- **The table and inspector are in `@for`/`@if` blocks** (`src/app/board/board.html:49`, `src/app/board/board.html:69`); the
  button goes in the `@if (selected(); …)` branch. Optimistic state is a per-id overlay over the loaded incidents.
- **The fake is the source.** An async `acknowledge(id, scenario)` on `IncidentSource` that resolves, or rejects for
  `ack-failed` after a fixed delay, lets a browser test see the optimistic state then the rollback; Jest replaces the class with a
  hand-settled deferred. Existing source spec: `src/app/incidents/incident-source.spec.ts:1`.

## Hypothesis
Serves the Jest and Playwright boxes. Three states (before, optimistic, rolled back with alert) are observable deterministically in
Jest with a hand-settled deferred and in the browser without sleeps, by waiting on the `ACKED` text and then the alert.
**Falsified if:** either spec needs a real timer, `waitForTimeout` or a retry loop to see the optimistic state.

## Blast radius
`src/app/board/**`, `src/app/incidents/**`, `CLAUDE.md`, and one new Playwright file, named `board-ack` with the `.spec.ts` suffix, in `e2e/`

## Doors
Door 1 considered and **not** crossed: the write-up says "controlled MSW fake", and MSW is a dependency. Default: a fake inside
`IncidentSource`, no dependency; MSW belongs to the "real BFF behind the same contract" step. Cost if wrong: the fake is replaced
then, and the component and specs keep their shape. No other door.

## Open decisions
One, defaulted: only `live` incidents can be acknowledged, and the failure notice is an alert inside the board, not a toast.
Cost if wrong: a template branch.
