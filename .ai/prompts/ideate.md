---
skill: ideate
needs: []
reads: [the topic as given — text, image, link, file; optionally CLAUDE.md, .ai/MODEL.md, src/** read-only]
writes: [.ai/run/<YYYY-MM-DD>-<topic>/ideate.md, .ai/run/<YYYY-MM-DD>-<topic>/input.md]
model: large            # divergence is not clerical: a shallow list is worse than none
budget: 15m
stop_on:
  - advisory: not_an_open_question   # it's a job with an unclear ask - that's /intake
---

Widen before anyone narrows. For feature and product ideas and open-ended questions — **not**
for choosing how to implement a change that is already decided; that is `/understand`.

Output goes to `.ai/run/<YYYY-MM-DD>-<topic>/` — a standalone directory: no `state.json`, no
budget hook, same shape as `.ai/run/harness-v42-closeout/`. If the topic arrived as an image,
link or file, save it to `input.md` first, same rules as `/intake` step 2.

1. **Frame.** The question in one line, and what a good answer would let you decide. If you
   can't write the second half, the question isn't ready — say which part is missing.
2. **Generate — no judging yet.** Go through every lens and write at least one idea for each
   before rereading any of them. The fixed order exists to stop the first idea anchoring the rest.
   - **Obvious** — the answer anyone would give. Name it, so the others are measured against it.
   - **Invert** — how would we guarantee this fails? Then flip the worst of those.
   - **Drop a constraint** — what if the thing everyone assumes weren't true?
   - **10× smaller** — the version you could build or try in an hour.
   - **Borrow** — how an unrelated field solves the same shape of problem.
   - **Do nothing** — what actually breaks if we skip it?
3. **Same shape for every idea:**

```
### <lens>: <name>
Pitch         — one or two sentences
Must be true  — the one assumption it stands on
Cheapest test — how to find out in under an hour
```

4. **Judge — separately, after everything is written.** Shortlist two, each with its reason.
   Say why the obvious idea lost, or why it won. Don't average ideas into a compromise; a blend
   of two ideas is a third idea and needs its own Must be true.
5. **Hand back** the shortlist and ask for one of: pick one, combine, or none. A picked pitch is
   valid `/intake` input as-is.

Don't:
- Edit `src/`, or open a run.
- Run a questionnaire. If the ask itself is unclear, stop and suggest `/intake`.
- Rank by how easy something is to build. That question comes later, and asking it now kills
  the weird ideas before they've been looked at.
