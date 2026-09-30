# `.ai/HARNESS.md` says `deep` needs port 4200 free but not that an open browser pane can make it fail
run: harness-note-browser-pane · 2026-09-30

## Intent
Add one sentence to `.ai/HARNESS.md` telling an agent to keep the built-in browser pane closed while running `smoke` or `deep`,
but only after the cause is reproduced on purpose, because the evidence so far is a before-and-after, not a controlled test.
> "Harness note: a line in .ai/HARNESS.md about keeping the built-in browser pane closed when running `deep`."

## Done when
- [ ] With a pane tab open, the keyboard test run 20 times fails at least 3 times; the counts are saved in the run directory.
- [ ] With the pane closed, the same command run 20 times passes all 20; counts saved.
- [ ] Either a reopened tab alone brings the failures back, or the run says it did not and **no sentence is added**.
- [ ] If confirmed, exactly one added or changed sentence in the `smoke`/`deep` paragraph of `.ai/HARNESS.md`, stating the symptom
      (keyboard-focus test red, no code change), the rule, and no cause beyond what the counts support.
- [ ] `git diff --stat` shows only `.ai/HARNESS.md` outside the run directory; `sh .ai/harness/verify.sh full` is green.

## Out of scope
A `verify.sh` preflight check or any hook change (door 7); editing `e2e/board.spec.ts` to make the test robust (door 4 territory and
a different job); touching the findings docs on the other branches; any other HARNESS.md wording.

## Understand
- **The rule has one home.** The paragraph on `smoke` and `deep` already states the port requirement (`.ai/HARNESS.md:59-63`), and
  HARNESS.md is rules only: history lives in `docs/reviews/` and conventions in `CLAUDE.md`.
- **Not a gate-scope file.** `.ai/harness/gate-scope.json` lists `verify.sh`, `budget.mjs`, `settings.json`, `lib.mjs` and the
  configs, not `.ai/HARNESS.md`; `.ai/MODEL.md` is the separate human-owned door.
- **The test that flaked** asserts focus after one `Tab` (`e2e/board.spec.ts:26-28`) and runs against the production build served by
  `e2e/serve-dist.mjs`; `playwright.config.ts:10` sets `workers` to 1 only under `CI`.
- **The pane is operable from here** by the `preview_start` and `navigate` tools, so a tab can be opened and closed on purpose.

## Hypothesis
Serves the first three boxes. An open built-in browser tab makes the focus test fail often enough (at least 3 in 20) to matter, and
closing it restores 20 of 20. **Falsified if:** with a tab open the test fails fewer than 3 times in 20, or fails with the pane
closed. Then the earlier cause was wrong and the aria-label finding's caveat needs correcting instead.

## Blast radius
`.ai/HARNESS.md`

## Doors
None. `.ai/HARNESS.md` is outside `gate-scope.json`; no dependency, test or hook is touched.

## Open decisions
One, defaulted: the sentence goes in the existing `smoke`/`deep` paragraph, not a new section. Cost if wrong: moving one line.
