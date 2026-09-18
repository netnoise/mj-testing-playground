## Klaxon claims → hypotheses and evidence   claude/klaxon-claims-correction · verify full ✓ · ~25m · 7 files

### What surprised me
The founding example was wrong, and the way it was wrong matters. The h1→div demotion makes
`src/app/app.component.spec.ts:33` fail, so the test does detect it. But the harmless template+scss
class rename makes it fail with the same `TypeError: Cannot read properties of null`, so the failure
doesn't say which happened. A stylesheet-only rename passes while the header visibly loses its
styling. The review predicted the first result, and running it exposed the other two. (Amended by
`hotfix-gate-and-claims`: the first wording called this "undiagnosable" and "by accident", which
overstated it. See `evidence.md`, "Revised reading".)

### What I learned about your system
- The only claim in the Klaxon docs that could be run today had never been run. It took three
  one-line edits and under a second of Jest (`evidence.md`).
- `e2e/app.spec.ts:5` uses the same `.app-header h1` locator, so it very likely shares the same
  coupling. **Not run**: that needs `verify deep`.
- The findings wireframe's stat tiles (7 planted, 6 of 7 caught) were the most confident
  numbers in the docs, and none of them came from a run. They now read 7 planned, 1 of 31 cells
  recorded, 30 hypotheses.

### Concept: hypothesis until run
A predicted test outcome is written down as a prediction so that a run can overturn it. This
recurs in every row of the findings matrix and in `.ai/HARNESS.md`'s "Never trust" list, which
the docs weren't applying to themselves. Recorded in `.ai/decisions/0008`.

### What I did — and what is NOT verified
- Ran M1–M3 against the frozen spec, recorded them, and reverted them. `src/` and `e2e/` are
  unchanged against `cb11246`.
- Corrected the write-up (§01 evidence table, §02 relabelled, §03 hypothesis matrix with the
  status legend, §07 milestone-1 order with its stopping rule and Go moved later), the README,
  the board callout, and the findings card and tiles. Added 0008 and appended correction
  pointers to 0006 and 0007 (bodies untouched).
- `verify full` green. HTML rendered and checked in the browser pane. The SVG label overlap was
  measured and fixed.
- **Not verified:** the role-based-query hypothesis (not run, because it would be a test change);
  all 30 other matrix cells; the e2e behaviour under M1.
- **Now stale:** the two claude.ai artifacts (Klaxon Testing Lab, Klaxon Views) still show the old
  claims. The README says so. Republishing them is your call.
- **Deferred:** the milestone-1 build (doors 1 and 7); replacing `evaluate(el => el.click())` in
  `e2e/app.spec.ts` with a real click; a structural accessibility pass on the wireframes.

### What I got wrong
My first SVG relabel ("catch?") overlapped the "e2e · playwright" label. I only caught it by
measuring in the browser, not by reading the source.

Amended by `hotfix-gate-and-claims`: I also skipped the `deep` gate before hand-back, which
`.ai/HARNESS.md` asks for. `full` doesn't run the citation check, so this run's own digest and
`evidence.md` shipped with bare-path citations and left `deep` red on `master`. The citations are
fixed, and the wording in the first section is corrected.
