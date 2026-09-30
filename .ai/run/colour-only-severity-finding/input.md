# Input

Topic as given, 2026-09-30, in chat, after a `/recall` of project status:

> refresh master branch, then fix CLAUDE.md first, then intake the colour-only run

Context the human was shown and agreed to (recall report, same session): the colour-only severity
mutation is planned but not run (`docs/design/klaxon/README.md:71-85`; decision 0008 §4: "Colour-only
severity is a patch applied to a frozen suite, run, recorded, and reverted"). Heading demotion
(`docs/design/klaxon/findings/heading-demotion.md`) and harmless refactors are already recorded.

Answer to the one intake question (what the mutation strips from the SEV badge):

> Text and accessible name (Recommended)

Meaning: the badge becomes a coloured mark with no text, no aria-label and no sr-only text.

Steps already done before intake: `master` fast-forwarded to `59631ef`; `CLAUDE.md` needed no edit
(the v5-slim merge had already removed the stale "next run" sentence).
