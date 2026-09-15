---
skill: understand
needs: [intake]         # no Intent / Done when in the brief? run /intake first, then continue
reads: [.ai/run/<slug>/brief.md, .ai/run/<slug>/input.md, src/**, e2e/**, CLAUDE.md, .ai/MODEL.md, .ai/bank/**]
writes: [.ai/run/<slug>/brief.md, .ai/run/<slug>/understand.json]
model: large            # overspend here - a bad brief is paid for by every step under it
budget: 20m · 40 files read
stop_on:
  - advisory: one_way_door
  - advisory: question_is_underspecified   # go back to /intake - don't invent intent
---

Investigate. Do not edit code — the only files you may write are in `.ai/run/<slug>/`.

1. Run `/recall <topic>` first. Do not rediscover what the bank already knows.
2. Read the code that actually runs. Prefer grep and symbol search over opening
   whole files; read the region and its callers, not the module.
3. Complete `.ai/run/<slug>/brief.md`. `/intake` already wrote Intent, Done when and
   Out of scope at the top — don't rewrite them. If the code contradicts them, say so:
   that is `hypothesis_falsified` territory, not a license to retarget.

```
# <one line: the problem, not the plan>
run: <slug> · intake <date>

## Intent · ## Done when · ## Out of scope   — from /intake, unchanged
## Understand          — every claim cites file:line. No citation, no claim.
## Model of the system — ← human-owned. Your best guess, stated so it can be corrected in one edit.
## Hypothesis          — which Done-when box it serves, plus "Falsified if: ..." Without that line this is a guess, not a hypothesis.
## Blast radius        — the paths you expect to touch. /implement opens the run with these as an
                          enforced allowlist. Source paths only — the run's own `.ai/run/<slug>/**`
                          is always implicitly allowed, so don't spend a line on it.
## Doors               — any of the seven crossed? State the door, both sides, your default, the cost of being wrong.
## Open decisions      — at most one. If none, say none.
```

4. **Don't open the run.** `/implement` does, so the clock starts when the questions stop,
   not while the human is still reading your brief.
5. Run `sh .ai/harness/check-citations.sh` before you finish. A citation that does
   not resolve is a fabrication; one that resolves to the wrong line is a
   misattribution and the script cannot see it, so re-read what it prints.
