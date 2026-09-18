# Input

Topic as given, 2026-09-19:

> Milestone 1 is done. What should happen next? → "Merge, then run the harmless-refactor check"

Source of the open question: `docs/design/klaxon/findings/heading-demotion.md`, "Not run in this
iteration": whether a harmless refactor leaves the role-based board tests green. Baseline is
`master` at `c44571d`; `git diff 7327964 HEAD -- src e2e` is empty, so the frozen suite is the
one the first finding used.
