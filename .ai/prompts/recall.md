---
skill: recall
needs: []
reads: [.ai/bank/**, .ai/decisions/**]
writes: []
model: small
budget: 2m
---

Answer "what do I already know about this?" before any investigation starts.
The cheapest skill here, and the one whose absence is measurable: capture
without recall means rediscovering the same failure class three times.

1. Scan card and record **headers only** — frontmatter and titles.
2. Open only what matches the topic.
3. Report as: claim, source, date, and whether it still holds.
4. Nothing found is a real answer. Say "no prior art" and move on — do not pad.

If `.ai/bank/` is empty this returns nothing, which is correct on day one and
the reason `/keep` exists. Point it at another repo's failure log with
`recall --from <path>` when there is a corpus worth reading.
