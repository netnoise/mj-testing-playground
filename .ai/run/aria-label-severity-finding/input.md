# Input

Topic as given, 2026-09-30, in chat, after the colour-only severity run was pushed:

> brief the aria-label variant run

Context from that run (`docs/design/klaxon/findings/colour-only-severity.md`, "What this describes"): "A variant
that hides the text visually but keeps an `aria-label` was not run; role-and-name queries would very likely pass
it, and only a visual layer would see it. That is a separate iteration." Its `/digest` offered this run as a next
step. Decision 0008 §4 defines colour-only severity as an isolated patch on a frozen suite.

Branch: stacked on `claude/klaxon-colour-severity` (pushed at `f1cd5ad`), per "publish, don't merge" in
`.ai/HARNESS.md`.
