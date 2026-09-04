---
kind: gotcha
tags: [harness, tooling, citations]
source: .ai/decisions/0002-reconcile-design-to-v4.md, .ai/decisions/0004-vehicle-selection.md
confidence: high
blog: yes
---
A `file:line` citation checker that confirms a line exists tells you the
citation *resolves* — it says nothing about whether the line still contains
what the citation claims. Both fail silently in different ways: a genuinely
missing citation is loud (exit 1, easy to catch); a citation that resolves
to the wrong content because the cited file changed underneath it is quiet —
it looks exactly like success.

Seen: twice in one session. `check-citations.sh`'s own dotfile-matching bug
(decision 0002) initially made `.eslintrc.json:N` citations un-resolvable at
all, which was loud and easy to fix. But adding two import lines to
`app.component.spec.ts` for an unrelated feature silently shifted an existing
assertion from line 20 to line 24 — three live docs still cited :20, and the
checker correctly flagged them as `WEAK` (resolves, but the line is blank)
rather than a hard failure, because a blank line was a lucky tell. A citation
that shifted onto a *different real line of code* would have passed clean.

Generalises: any citation checker that only proves resolution needs either a
second signal (content hash of the cited span, not just its line number) or
an accepted residual risk that a misattribution reads as a pass. For now this
harness's checker prints the cited line's content specifically so a human
skimming the output can catch drift the exit code can't.
