# Input — harness-v5-slim

Saved 2026-09-30, before interpretation.

## The ask (verbatim)

> Validate state of ai harness and plan a improvement run to close as many gaps as possible and
> ideally make the overhead less taxing for my token usage so I can quckly move fdorward with Klaxon
> development.

## The review it came with (written by an agent working from the TriTrack workspace; condensed, claims kept)

1. **No scoped subagent dispatch.** TriTrack bounds blast radius before the fact with agent
   definitions carrying a file allowlist; this repo "bounds it after the fact". Suggests a
   defect-planter agent forbidden from the fixture and baseline files.
2. **No property tests or mutation score** on the advanced-form validators, "the one piece of real
   logic". Suggests fast-check plus Stryker.
3. **No path from a finished run to a reviewed PR.** Cheapest fix: one line in the digest prompt.
4. **The harness spends its hardening budget on itself.** Suggests hook tests that assert the
   payload shape, run in verify, the way TriTrack's guard tests do.

## Validation of those claims against the tree at `feab964` (interpreted — my reading)

| Claim | Verdict | Evidence |
|---|---|---|
| 1. no agent roster | True, but the mechanism is misdescribed | No agents directory under `.claude/`. The allowlist is enforced *before* the write for Edit/Write (`.claude/hooks/budget.mjs:256`); only Bash is after the fact. An agent definition here buys a cheaper model and a small context, not new enforcement. |
| 2. no property or mutation tests | True, wrong target | The validators are imported by nothing except their own spec, so they are not app logic any more. Both tools are a door-1 dependency change. Mutation testing is what Klaxon itself studies, so it belongs there as an experiment on `src/app/incidents/format-age.ts`, not in the harness. |
| 3. no publish step | True | `.ai/harness/config.yml:45`; already owed. |
| 4. hook tests missing | False as stated, true in spirit | `.ai/harness/hook-test.sh` runs 23 cases with two negative controls inside `full`. But since 2026-09-01, 73 of 120 commits mention the harness, and `.ai`, `.claude` and `docs` took about 24,000 changed lines against about 4,100 in `src` and `e2e`. |

## State found (measured, not from the review)

- `verify.sh full` and `deep` both exit 0: 24 Jest tests, 23 hook cases, 8 Playwright tests.
- No run is active; 18 runs closed `done`, 10 of them harness runs.
- `.ai/HARNESS.md` fails its own citation checker: the e2e app spec it cites no longer exists.
- Run paperwork is 18–50 KB of markdown per run; the last two experiments each paid the full loop
  for minutes of real work (`.ai/run/2026-09-19-klaxon-milestone-1/retro.md:13`).
- Untracked at start: two standalone run directories, three `HANDOFF.md` files in closed runs, and
  scratch directories `patchgen` and `pg2` at the repo root.
