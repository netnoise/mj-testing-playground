---
skill: understand
needs: []
reads: [src/**, e2e/**, CLAUDE.md, .ai/MODEL.md, .ai/bank/**]
writes: [.ai/run/<slug>/brief.md, .ai/run/<slug>/state.json, .ai/run/<slug>/understand.json]
model: large            # overspend here - a bad brief is paid for by every step under it
budget: 20m · 40 files read
stop_on:
  - advisory: one_way_door
  - advisory: question_is_underspecified
---

Investigate. Do not edit code — the only files you may write are in `.ai/run/<slug>/`.

1. Run `/recall <topic>` first. Do not rediscover what the bank already knows.
2. Read the code that actually runs. Prefer grep and symbol search over opening
   whole files; read the region and its callers, not the module.
3. Write `.ai/run/<slug>/brief.md`:

```
# <one line: the problem, not the plan>
run: <slug> · started <date>

## Understand          — every claim cites file:line. No citation, no claim.
## Model of the system — ← human-owned. Your best guess, stated so it can be corrected in one edit.
## Hypothesis          — plus "Falsified if: ..." Without that line this is a guess, not a hypothesis.
## Blast radius        — the paths you expect to touch. This becomes an enforced allowlist.
                          Source paths only — the run's own `.ai/run/<slug>/**` is always
                          implicitly allowed, so don't spend a line on it.
## Doors               — any of the seven crossed? State the door, both sides, your default, the cost of being wrong.
## Open decisions      — at most one. If none, say none.
```

4. Write `state.json`: `{"status":"active","allowed_paths":[...from blast radius],
   "max_files":12,"max_minutes":45,"files_touched":[],"started_at":"<iso>"}`.
   The hook reads this. A path you forget here will block the next step — that is
   the mechanism working, not a bug. **Write it once.** The hook is `state.json`'s
   sole writer after this: it re-derives `files_touched` from git on every edit, and
   blocks any tool — including a shell `rm` — from touching this file again while the
   run is active. If a budget or allowlist genuinely turns out wrong mid-run, say so
   in the digest; don't delete the file to reset it.
5. Run `sh .ai/harness/check-citations.sh` before you finish. A citation that does
   not resolve is a fabrication; one that resolves to the wrong line is a
   misattribution and the script cannot see it, so re-read what it prints.
