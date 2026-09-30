# Input

Topic as given, 2026-09-30, in chat, after the aria-label run was pushed:

> brieth both Failed-ack/rollback scenario: the next item in decision 0008's post-milestone sequence.

Source of the item, `.ai/decisions/0008-klaxon-claims-to-hypotheses.md` §6: "After milestone 1: a failed-ack/rollback
scenario against a controlled fake → the real BFF with scripted scenarios run against both → the Findings route → the Go
generator, once it answers a question scripted scenarios can't". The write-up says the same
(`docs/design/klaxon/klaxon-testing-lab.html:766-768`): "A failed acknowledgment with rollback, run against a controlled
MSW fake."

The second half of "both" (a `.ai/HARNESS.md` note about the browser pane) is a separate job with its own brief:
`.ai/run/harness-note-browser-pane/`.

Branch: stacked on `claude/klaxon-aria-label-variant` (pushed at `a9fb03d`), per "publish, don't merge" in `.ai/HARNESS.md`.
