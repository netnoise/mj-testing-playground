## Hotfix: red deep gate, stale CLAUDE.md, overstated heading-test wording   hotfix/klaxon-gate-and-claims · verify deep ✓ · ~10m · 4 files

### What surprised me
`verify.sh deep` doesn't check `evidence.md` at all, only the latest run's `digest.md` and `retro.md`.
The explicit `check-citations.sh` run I added found three bare relative paths in the Replay text I
had just written (two output files and the replay script), and `deep` alone would have passed over
them. The checker also treats a leading-ellipsis shorthand as a bare path, and it did the same to this
digest's first draft, which quoted those paths as examples.

### What I learned about your system
- With no active run, `deep` checks the **last closed run's** digest. A closed run's citations can
  turn `master` red after the fact: `.ai/harness/verify.sh` picks it via `.ai/harness/lib.mjs`'s
  `current-run` fallback.
- The `harness-v14-retool` WARN is intentional. `.ai/harness/verify.sh` documents it as a run that
  predates the disclosure check, so I left it.
- `angular.json` already had the `scss` schematic and `src/styles.scss`. CLAUDE.md was the stale
  side, not the config.

### Concept: a gate you didn't run isn't a gate
The previous run reported `full` green. `full` is a strict subset of `deep`, and the check it skipped
is exactly the one my own paperwork tripped. Two more instances of the same idea here: the replay
proves the finding by re-executing it, and the citation check verifies text by resolving it.

### What I did — and what is NOT verified
- Replayable evidence for M1–M3 in `.ai/run/klaxon-claims-correction/mutations/`: patches, full Jest
  output, a passing post-restore run, `environment.txt`, and `replay.sh`. The replay reproduced PASS /
  FAIL / PASS / FAIL. `src/` and `e2e/` are unchanged against `12d0732`.
- Reworded the finding as three separate properties (detects it; fails on a harmless rename; reports
  poorly) in `.ai/run/klaxon-claims-correction/evidence.md`, the old digest, an appended amendment to
  `.ai/decisions/0008-klaxon-claims-to-hypotheses.md`, the write-up, and the findings wireframe.
- Corrected `CLAUDE.md` (Project paragraph, styles bullet, gate tiers).
- Republished both claude.ai artifacts: Klaxon Testing Lab (version 5) and Klaxon Views (version 7).
- **Not verified:** the Views canvas was not rendered (its type instructions say not to verify), and
  I did not look at the live Lab page after publishing. `CLAUDE.md`'s claims were checked against
  `angular.json`, `package.json` and `src/app/app-routing.module.ts` by reading, not by a test. The
  role-based-query hypothesis is still unrun.
- **Left alone on purpose:** the `harness-v14-retool` WARN, three old untracked run leftovers,
  `e2e/app.spec.ts`'s `evaluate` click, the Angular-target decision, and your door-7 edits.

### What I got wrong
I wrote three bare paths into evidence.md's new Replay text and only the explicit check caught them.
The Views publish also cost three attempts: a path-scoped `read` didn't satisfy the version guard, and
a plain `read` of the artifact URL did.
