# 0005 — Testing techniques catalog and roadmap

## Problem
The repo is named `mj-testing-playground` but exercised only three techniques
— example-based Jest units, one happy-path Playwright e2e, two static
Storybook stories — and documented none of the alternatives. Every "should we
add X?" restarted from nothing, with no shared record of what had already been
considered and rejected.

## Root cause
N/A — this is documentation work, not a fix.

## Decision
Two Markdown documents under `docs/`: `testing-techniques.md`, a catalog of
~33 techniques grouped into six sections, each with a fixed skeleton (what it
is · where it's used · fit here · cost · verdict); and `testing-roadmap.md`,
a dependency-ordered phase plan (0–6 plus a deferred set) that labels every
one-way door each phase would cross. `README.md` gained a pointer to both.
No code, config, or dependency change — `docs/**` is outside `GATE_SCOPE`
(`.claude/hooks/budget.mjs:43`), so the whole run was door-free.

## Why
The catalog's value is its honest *no*s as much as its yeses. Two facts about
the repo disqualify whole families of technique: there are no HTTP calls
anywhere in `src/` (`src/app/vehicle/vehicle.service.ts:5` is a hardcoded
const, not a fetch), which rules out contract testing, record/replay and
service virtualization; and nothing is deployed, which rules out canary,
shadow traffic, chaos and synthetics. Stating those as explicit
"not applicable until <trigger>" verdicts is what makes the "adopt now"
verdicts credible rather than a wish list. Sequencing by prerequisite (CI
before visual-regression baselines and mutation scores, which are near-
worthless local-only) keeps the roadmap honest about order.

## Trade-off
A catalog dates. Verdicts pinned to today's repo state (`file:line` citations,
"no CI", "nothing deployed") will drift as the repo changes, and nothing
enforces that they be revisited — the same citation-drift risk recorded in
`.ai/bank/2026-09-04-citation-drift.md`, now spread across two long documents
instead of one brief.

## Concept
**A catalog earns trust by its noes.** A survey that recommends everything
recommends nothing; the discriminating verdict — "not applicable here, and
here is the exact fact that would change that" — is what lets a reader trust
the short list of yeses without re-deriving the whole space. Grep for where it
recurs: `docs/testing-techniques.md`'s closing index table, which sorts every
entry by verdict precisely so the noes are as scannable as the yeses.

## What actually happened
The documents shipped in `672c27d` and verified clean (`verify.sh full`:
lint + 11 Jest specs green; `check-citations.sh` resolving; `git diff --stat`
inside the declared radius). A follow-up bank card shipped in `42ed603`.

The divergence worth recording is procedural, not in the output: the run
executed straight from plan approval and never closed itself out. `state.json`
was left `"paused"` / `"started_at": null` / `"files_touched": []` with the
note "No code written," and `HANDOFF.md` still read "Nothing implemented" over
a Next-list that was fully done — so any `/resume testing-techniques-docs`
would have been actively misled, the inverse of the stale-completion failure
`.ai/prompts/resume.md` warns of. And this record itself was skipped at the
time: it is written after the fact, its claims reconstructed from
`git show 672c27d` rather than from a live journal. This decision record and
the reconciliation of `state.json` / `HANDOFF.md` are that missing close-out,
applied late.
