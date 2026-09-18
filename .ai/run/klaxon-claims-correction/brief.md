# Klaxon's design docs state predictions as results, and two of them contradict the repo
run: klaxon-claims-correction · intake 2026-09-18

## Intent
Correct the Klaxon design docs so every test-outcome claim is either backed by a recorded run or
labelled a hypothesis — from input.md: "Reproduce both mutations and record their actual outcomes."

## Done when
- [ ] M1 (h1→div), M2 (stylesheet-only class rename), M3 (template+stylesheet rename) each run
      against `app.component.spec.ts`, results in `evidence.md`, `src/` back at `HEAD`.
- [ ] Write-up §01 states the M1–M3 results, not the inverted claim.
- [ ] Write-up §03 matrix is labelled hypotheses, with a status legend; no cell claims "run" without evidence.
- [ ] README, board callout and findings card no longer claim the badge is colour-only.
- [ ] Build sequence puts Go after the first measured frontend finding.
- [ ] Decision 0008 recorded; 0006/0007 carry an appended pointer, bodies unedited.
- [ ] `verify.sh full` green.

## Out of scope
App code, Angular regen (doors 1/7), `e2e/app.spec.ts` click fix, wireframe markup rework,
the claude.ai artifact copies, `docs/vibe-harness.html`, `CLAUDE.md`.

## Blast radius
`docs/design/klaxon/**`, `.ai/decisions/**`, `src/app/app.component.html` and
`src/app/app.component.scss` (temporary mutations only, reverted).
