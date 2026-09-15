## Setup (before the run opened)

Branch `harness/v44-intake` from `0e18ca6`. Allowlist widened in `.claude/settings.local.json`
(user-approved list, 12 rules, `jq` valid). Brief written; `check-citations.sh` resolves every
claim citation, and fails only on the five Done-when files this run creates. Run opened
09:35Z via `open-run.sh`, 15 files / 90 min.

## New prompts: intake, ideate

Intent: write `.ai/prompts/intake.md`, `.ai/prompts/ideate.md` and their `.claude/commands/`
wrappers, in the frontmatter shape the other prompts use (brief §Done when 1–2).

Done, `921efd1`, `verify fast` OK. Both commands showed up in the session's skill list
immediately, without a restart — `.claude/commands/` appears to be hot-loaded, unlike what
`.ai/HARNESS.md` says for "prompt, hook or command file". Prompt *content* is read at invocation
time anyway. Hooks are the part that genuinely needs a restart. Worth correcting that paragraph.

## Rewire understand / implement / retro

Intent: move `open-run.sh` from understand step 4 to implement step 1, make understand need
intake, add retro's standalone target and OWED routing, fix `open-run.sh`'s header comment
(brief §Done when 3–4).

Done, `bef1fb0`, `verify fast` OK. The long open-run explanation moved verbatim from
understand to implement; understand's frontmatter no longer claims to write `state.json`.

## One owner for the loop; new premise

Intent: `config.yml` `flows` becomes the only place the sequence is written; `HARNESS.md`
points at it and switches its premise to "ask first, then walk away" (brief §Done when 5).

Done, `a9cd4cc`, `verify fast` OK. Also corrected HARNESS.md's "restart after editing" paragraph
with the observation above — softened, not removed: hooks still need it.

## Follow-ups persisted

Intent: human-owed items into OWED.md, MODEL.md diff as a patch, roadmap doc, research-note
header (brief §Done when 6).

Done, `2a900ef`. `patch-MODEL.md.patch` is two lines. The research note was untracked; it is
now committed together with its corrections header, since the roadmap cites it.

## Verify

`verify.sh full`: OK — lint, jest 4 suites / 55 tests, hook-test 23/23. Stale-reference grep:
only `.ai/MODEL.md:36` remains (human-owned, patch proposed). No gate-scope file mentions
understand opening the run. Brief citations: 25/25 resolve, the five Done-when targets included.

## Close

Digest and retro written, citations 11/11. One more OWED entry (citation checker forward
references). `close-run.sh` → done, head `2a900ef`.

The first attempt at the closing commit was blocked by the hook: one Bash command both appended
to `journal.md` with `>>` and named `state.json` in its `git add` list, which is the exact shape
of the single-writer regex (`.claude/hooks/budget.mjs:177`). False positive — `git add` doesn't
write the file — but correct to refuse, not to work around. Split into an Edit plus a plain
`git add`. A second instance of the command-text-scan family the v4.3 patch replaced elsewhere.
