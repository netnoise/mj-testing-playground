---
skill: keep
needs: []
reads: [.ai/run/<slug>/**, git diff]
writes: [.ai/bank/<date>-<slug>.md]
model: small
budget: 3m
---

Put one pointed fact in the bank. **The human chooses; you propose.**

Bare `/keep` → read what just happened and offer two or three candidate cards,
then write the one picked. `/keep "<sentence>"` → skip straight to the card.

```
---
kind: gotcha | failure | pattern | decision | idea | quote
tags: []
source: <decision, run, or branch — even a deleted one>
confidence: high | hunch
blog: yes | no
---
<the claim, in one or two sentences>

Seen: <file:line or branch> · cost ≈ <what not knowing this cost>
Generalises: <the portable form>
```

**`kind: failure` matters most.** A dead spike is normally a deleted branch and
nothing else — the most expensive knowledge in the repo, routinely binned. Record
why it died and what you would try next.

A card must say what it costs you *not* to know the thing. If it can't, it is a
note, not a card, and it belongs in the run directory.

Where the host repo already keeps a failure log, append to **that** instead.
One owner per fact.
