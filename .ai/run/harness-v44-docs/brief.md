# The design page and cheatsheet describe v4.3 (or older) while the harness is v4.4
run: harness-v44-docs · intake 2026-09-15 (asked in chat, no questions needed)

## Intent
Bring `docs/vibe-harness.html` and `docs/cheatsheet.html` up to v4.4, and republish both
Claude artifacts from them. Quote: "also update claude artefact and html docs".

## Done when
- [ ] The repo copy of the design page first matches the published v4.3 artifact (it was ahead of the repo), committed on its own
- [ ] The design page describes /intake, /ideate, the run opening at /implement, "ask first, then walk away", the new flows, and v4.4 in §09 and the footer, with the version label and prose in the same commit
- [ ] Stale claims fixed where touched: the "any agent" portability line, `/fix` in the lightweight test, implement's frontmatter example, digest as `small` in §07, and §08's ledger labelled illustrative
- [ ] The cheatsheet's loop, command table, flows note and file map match v4.4
- [ ] Both artifacts are republished to their existing URLs from the committed files

## Out of scope
- Redesigning either page; the existing tokens, fonts and dark-first theme stay
- The illustrative vehicle-models examples in §02/§05/§06. Labelled as illustrations already by their `.ai/run/vehicle-models/` captions; rewriting them is a separate job
- Any `.ai/` file other than this run directory, except marking the roadmap's design-page item done

## Understand
- The published artifact carries v4.3 prose the repo copy lacks: 32 differing lines, including
  the v4.3 phase card and the "label shipped ahead of prose" note. The repo copy differs from
  its last commit only in the eyebrow label (`git diff docs/vibe-harness.html`).
- Current flows: `.ai/harness/config.yml:39`–`.ai/harness/config.yml:47`. The run opens in
  `.ai/prompts/implement.md:19`. Premise: `.ai/HARNESS.md:13`.
- The cheatsheet artifact body matches `docs/cheatsheet.html`.

## Model of the system
The repo files are the source; artifacts are published copies. The published page drifted ahead
of the repo once, so step 1 restores the repo as the owner before any v4.4 edit.

## Hypothesis
Content-only edits inside the existing structure and CSS classes are enough; at most a
couple of CSS lines are needed for the cheatsheet's walk-away marker.
Falsified if: the new content needs a layout the existing classes can't express.

## Blast radius
docs/vibe-harness.html · docs/cheatsheet.html · docs/reviews/harness-v44-roadmap-2026-09-15.md

## Doors
None. Republishing the artifacts changes pages the user owns, at their request. The Vibe
Harness artifact is shared by link with a pinned earlier version for viewers, and republishing
doesn't change that pin.

## Open decisions
None.
