# 0008 — Klaxon's test-outcome claims become hypotheses until run; milestone 1 shrinks

## Problem
An outside review of the Klaxon design (2026-09-18, read-only, against `master`) found that the
docs state test outcomes with more confidence than their own evidence supports:

1. **The founding example contradicted the code.** 0006 item 1 and write-up §01 said that
   demoting the `<h1>` in `app.component.html` to a styled `<div>` leaves
   `app.component.spec.ts:33` green. The spec calls `querySelector('.app-header h1').textContent`.
   With no `h1`, that is null, and the test throws.
2. **The featured "colour-only severity" defect wasn't in the markup.** The README called it a
   deliberate, live gap. Every badge in `wireframes/board.html` has visible text (`CRIT`, `MAJ`,
   `MIN`, `CRITICAL`).
3. **The findings matrix was presented as results.** It said "every cell is a claim you have
   actually run" while nothing had been built. It also made claims about whole tool categories
   ("No automated layer catches this. Manual only."; "E2E is too slow to notice extra requests")
   that are really claims about particular assertions.
4. **The Go generator came before the first payoff.** The build sequence put Go ahead of the first
   planted defect.

## Root cause
The docs were written to argue for the concept, and the matrix was filled in with the answers
the argument needed. Nobody ran the one experiment that was already runnable: the founding
example needs only the existing spec and a one-line edit. The repo's own rule, that a claim with
no counterfactual isn't evidence, wasn't applied to its own docs.

## Decision
1. **Run the founding example; don't re-predict it.** Three mutations were run at `cb11246` with
   `npx jest src/app/app.component.spec.ts`, then reverted:

   | Mutation | Kind | Result |
   |---|---|---|
   | `<h1>` → `<div class="title">` | accessibility regression | fail: `TypeError: Cannot read properties of null (reading 'textContent')` |
   | rename `.app-header` in scss only | CSS-only (header visibly unstyled) | pass |
   | rename `.app-header` in template + scss | harmless refactor | fail: the same TypeError |

   The corrected lesson is still about implementation coupling. The spec catches the regression
   only by crashing, and it crashes in the same way on the harmless refactor, so a red run can't
   tell the two apart. Full record: `.ai/run/klaxon-claims-correction/evidence.md`.
2. **Status vocabulary.** Every cell is one of `hypothesis`, `caught`, `missed`, `not run`,
   `not applicable`, or `infrastructure error`. A cell leaves `hypothesis` only with a baseline
   commit, mutation patch, test revision, command, scenario/seed, environment, and failure output.
   The suite is frozen before the mutation. An improved test is a new iteration row and never
   overwrites the first result.
3. **A miss describes the suite, not the tool.** Verdict text is phrased as the question a run
   answers ("does any layer count requests?"), not as a limit of a layer.
4. **Accessible by default; defects are isolated mutations.** The normal app ships severity text
   labels. Colour-only severity is a patch applied to a frozen suite, run, recorded, and reverted.
   It is not an inaccessible default kept to support a predetermined result.
5. **Milestone 1 is one board, one reproducible defect, one trustworthy result.** The sequence is:
   keep the old baseline, then do a pinned regen → board only (fixture, text severity,
   selection/details, one filter, table semantics, visible focus, empty/loading/failed/stale
   states) → healthy baseline (one component test, one browser flow with real clicks against the
   production build) → plant heading demotion → restore, verify, and write a finding record
   (Markdown/JSON). **Stopping rule:** no archive, rota, Findings UI, Go service, or mutation
   framework is needed to call milestone 1 done.
6. **After milestone 1:** a failed-ack/rollback scenario against a controlled fake → the real BFF
   with scripted scenarios run against both → the Findings route → the Go generator, once it
   answers a question scripted scenarios can't, and only with a seed, a clock, ordering,
   cancellation, and replay.

## Why
- The repo exists to practise judging whether a test caught something. Docs that assert results
  without runs teach the opposite habit.
- The correction is itself the repo's first finding. A confident, plausible explanation failed
  when it was checked against its own evidence, and that is what the lab is meant to surface.
- Putting Go after the first finding means the first result costs one toolchain instead of three.
  Go stays on the roadmap (0007) because it's a learning goal, not because it is needed first.

## Trade-off
- The findings matrix now looks weaker: almost every cell is a question mark. That's accurate.
- The claude.ai artifact copies (Klaxon Testing Lab, Klaxon Views) still show the uncorrected
  claims. The README already makes the repo copy authoritative. Republishing them is an
  outward-facing action and was left to the owner.
- The wireframes are corrected in their text, not their structure. The board's all-div markup,
  fixed widths, and 10px labels remain as prototype choices. The README now says to take their
  hierarchy and type, not their structure.

## Concept
**Hypothesis until run.** A predicted test outcome is recorded as a prediction so a run can
overturn it. A cell with no run behind it is a question, even when the answer seems obvious. The
answer that seemed obvious here was wrong.

## What actually happened
Run `klaxon-claims-correction` (fix flow, docs only). The mutations touched `src/app/` temporarily
and were reverted. Edited: `docs/design/klaxon/{README.md, klaxon-testing-lab.html,
wireframes/board.html, wireframes/findings.html}`. Pointers were appended to 0006 and 0007 without
editing their bodies. No doors were crossed.

Deferred:
- The milestone 1 build itself (the Angular regen crosses doors 1 and 7).
- Replacing `e2e/app.spec.ts`'s `evaluate(el => el.click())` with a real pointer click against
  the production build.
- A structural accessibility pass on the wireframes.
