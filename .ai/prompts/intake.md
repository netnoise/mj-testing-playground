---
skill: intake
needs: []
reads: [the input as given — prompt text, image, link, file; CLAUDE.md; .ai/MODEL.md]
writes: [.ai/run/<slug>/input.md, .ai/run/<slug>/brief.md]
model: large            # a misread ask is paid for by every step under it
budget: 10m · 1 question round
stop_on:
  - advisory: question_is_underspecified   # ask, or write the default down - never invent
  - advisory: two_jobs_in_one
  - advisory: one_way_door
---

Turn whatever arrived into a job someone could fail. **Do not read `src/` yet** — that is
`/understand`'s job, and touring the code first is how a brief invents intent.

1. Pick the run slug: the job in kebab-case (`form-validation-copy`, not `task-1`). Everything
   below goes in `.ai/run/<slug>/`. Do not open the run — `/implement` does that.
2. **Save the input first**, to `input.md`, before interpreting it. Nothing valuable lives only
   in a context window: a pasted screenshot is gone when the session ends.
   - **Text** — quote it verbatim.
   - **Image** — what you see, in words: which screen, visible text, what looks wrong, any
     arrows or annotations; the file path if it is on disk. Mark the section *interpreted* —
     it is your reading, and the human checks it.
   - **Link** — fetch it. Save the URL, today's date, and the excerpt that matters, quoted.
     Can't fetch? Say so and ask for a paste; don't guess from the URL.
   - **File / md** — its path, plus the lines that are requirements, quoted.
3. Write these three sections at the top of `brief.md`:

```
# <one line: the problem, not the plan>
run: <slug> · intake <date>

## Intent        — the job in one sentence, then the input quote it came from
## Done when     — at most 7 checkboxes. Each one a test, a runtime check, or your eyes could fail.
## Out of scope  — what you will not touch. Default: no rewrite, no drive-by refactor.
```

4. **Ask only where a checkbox can't be written without guessing product intent.** One
   `AskUserQuestion` call: at most 4 questions, 2–4 options each, your default first and marked
   "(Recommended)", every option's description saying what it costs if it's the wrong pick.
   - Never ask what the repo can answer — that is `/understand`.
   - Never ask when the default is cheap and reversible — write it under `## Open decisions`
     as an assumption with its default and move on.
   - A second round only if the answers contradict each other.
   - Can't ask (unattended, non-interactive, tool unavailable): every question goes under
     `## Open decisions` with its default, and you proceed on the defaults.
5. Write the answers into Intent / Done when / Out of scope straight away. There is no separate
   Q&A file — the brief is the one owner of what was agreed.
6. Stop and say so, instead of forcing a brief, when:
   - two unrelated jobs are glued together — pick one, name the other as a follow-up;
   - a door is already implied (dependency, migration, external contract, auth) — state it
     under `## Doors` with both sides and your default;
   - there is no job yet, only an open question — suggest `/ideate`.

Hand back the three sections and any open decision. `/understand` fills in the rest of the brief.

**This is the last point where asking the human is normal.** Once `/implement` opens the run,
the human may have walked away: from then on a one-way door gets written down with your
default, and you continue.
