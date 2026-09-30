## Acknowledge with rollback, against a fake that can fail   claude/klaxon-failed-ack · verify deep ✓ · ~5m · 8 files

### One decision for you
The fake lives inside `IncidentSource` (`acknowledge` settles after `ACK_DELAY_MS`, rejecting for `?scenario=ack-failed`) instead of MSW, because MSW is a dependency (door 1) and the write-up's "controlled MSW fake" predates that cost. **Default: keep it**; MSW belongs with the "real BFF behind the same contract" step. **Cost if wrong:** the fake is swapped then, and the component and specs keep their shape. **Reversible:** yes.

### What surprised me
One thing in the tests, none in the feature. A hand-settled fake still needs a microtask flush before `whenStable()`: the rejection reaches the component's `await` one microtask after it settles, so my first rollback spec failed on a correct implementation (`src/app/board/board-ack.spec.ts`, in the `settle` helper). The e2e specs passed 120 of 120 repeats (parallel and `--workers=1`), so they are not flaky like the keyboard test.

### What I learned about your system
- **The existing suite is unaffected.** No existing spec was edited and all 24 earlier Jest tests and 6 earlier Playwright tests stayed green; the new specs are in new files.
- **The rollback spec does guard the rollback.** With the one line that deletes the override removed, exactly that spec fails and the other three pass (run, then reverted).

### What I did — and what is NOT verified
- Wrote the specs first and showed them failing (6 of 6, `.ai/run/failed-ack-rollback/output/red-before-feature.txt`), then built: `IncidentSource.acknowledge` and `ACK_DELAY_MS` (`src/app/incidents/incident-source.ts`), a per-incident optimistic status overlay, rollback and `role="alert"` in `Board` (`src/app/board/board.ts`), the Acknowledge button for `live` incidents only (`src/app/board/board.html`), and `ack-failed` in `CLAUDE.md`.
- 30 Jest tests (6 new), 8 Playwright tests (2 new, real pointer clicks, no sleeps, no console error); `verify.sh deep` green, `full` green. Screenshots of both states are in `.ai/run/failed-ack-rollback/output/`.
- **Not verified:** the success path's "stays acknowledged after the fake confirms" is covered in Jest only, because a browser test cannot see a confirmation without waiting on something; the new UI was checked by screenshot at one viewport, not across widths; no accessibility check beyond the role-and-name queries the specs use; the keyboard e2e test is still flaky and a red `deep` on it alone would be that, not this change.
- **Not done, deliberately:** the planted "not rolled back on 500" defect and its finding (the next run), MSW, a BFF, any dependency, any existing test edit.

### What I got wrong
- Nothing that changed a result. My first rollback spec was wrong, not the feature, as above; I fixed the spec and kept the failing version's reasoning in the journal.

### Next step
Push `claude/klaxon-failed-ack` (stacked on `claude/klaxon-aria-label-variant`) and open the PR yourself. The next run on this branch is the planted defect: remove the rollback, freeze these specs, and record which layers notice. Want me to push it?
