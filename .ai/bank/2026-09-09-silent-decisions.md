---
kind: gotcha
tags: [harness, transparency, agent-behavior]
source: claude/testing-techniques-review-go6osk — .ai/run/testing-techniques-docs/brief.md
confidence: high
blog: yes
---
A decision embedded only in a tool call's arguments — a file path, a slug, a
flag — is invisible to a human who reads only the conversation, even though
the tool call itself is fully logged. "I did it" is not the same as "I told
you."

Seen: the run slug `testing-techniques-docs` was chosen inside a `Write` call
to `.ai/run/testing-techniques-docs/brief.md` and never named in chat text
until the human noticed it already embedded in a plan they'd approved · cost ≈
a naming decision that becomes the durable `/resume <slug>` handle went
unreviewed by the person who will later type it.

Generalises: narrate a decision in prose the moment you make it, not only in
the tool call that enacts it — especially for anything that becomes a handle,
identifier, or filename someone else will reference later. `/keep` itself
follows this rule (propose in text, human picks); apply it one level up, to
the decisions made *before* a `/keep` moment ever comes up.
