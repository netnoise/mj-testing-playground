# Vibe Harness v4.2 — implementation audit

**Date:** 2026-09-08
**Reviewed:** the harness as *built* in `mj-testing-playground` — `.ai/`, `.claude/`, `docs/` —
at `6ddcb44` on `redesign/ui-shell`.
**Prior inputs:** the v4.1→v4.2 delta note (2026-09-07), which reviewed the design page; and
`.ai/run/ui-shell-redesign/retro.md`, written after it.

**Method.** Every claim here was checked against the files, not against `docs/vibe-harness.html`.
Line citations resolve at `6ddcb44`. Where this audit contradicts the delta note, the evidence is
given rather than the disagreement asserted.

**How to use.** §1 is the work, grouped into six workstreams. §2 orders it. §3 is a do-not-touch
list, carried forward and extended. §4 answers the delta note's open questions. §5 maps every
issue raised across all three documents to a workstream, so nothing is silently dropped.

---

## 0. What this audit adds

The delta note reviewed a design. This reviews the implementation beneath it, plus one full run
that happened afterwards. Three things follow:

1. **Two delta-note items rest on premises that don't hold here.** Its 1.6 assumes emits are
   accruing; none have ever been written. Its 1.1 move 2 would pass today and would not have
   caught the decay that actually occurred.
2. **The ui-shell-redesign run produced first-hand evidence of four failures** the note could not
   have seen, three of them caused by harness mechanisms rather than by the agent.
3. **The docs have started to drift from the code** — including, in one place, exactly the drift
   the note predicted.

Not re-litigated: everything §0 of the delta note recorded as closed, and everything in its §3.

---

## 1. Findings

### 1.1 `enforced:` is the right mechanism, and three of its tags are currently false

`docs/vibe-harness.html`'s §03 argument is that a rule the agent polices itself is advisory, and
the ones that matter are hooks over a single-writer state file. That argument is correct and is
the reason the tagging must be true. Right now it isn't.

**Evidence — the run's own numbers.** `.ai/run/ui-shell-redesign/state.json` records **5** entries
in `files_touched` against `max_files: 20`. Its own digest says 28 files; `git diff --name-only
d37cfbc~1 HEAD` says **30**. The budget was exceeded by half and `budget_spent` never fired.

**Three independent causes, in order of severity.**

1. **The guard locks the agent out of its own brief, and the escape hatch destroys the evidence.**
   `.ai/prompts/understand.md:32` derives `allowed_paths` from the brief's blast radius, which the
   brief template defines as "the paths you expect to touch" — source paths. The run directory
   isn't among them, so the first post-hoc edit to `brief.md` is blocked by the allowlist that
   `brief.md` just created. The retro records the workaround used three times in one session:
   `rm state.json` → edit → rewrite. `.claude/hooks/budget.mjs:54` and `.claude/hooks/budget.mjs:65` both fail open when
   state is absent, so each deletion disabled blast radius, file budget and wall clock at once,
   and reset `files_touched` to `[]` and `started_at` to now.

   All three runs on disk eventually list their own run directory in `allowed_paths` —
   **rediscovered by hand each time**, because the prompt still doesn't say to. Scope changing
   after a brief is written is normal (here the user resolved both open decisions four minutes
   after the brief landed), so this will recur on every run until fixed.

2. **The hook does not guard Bash.** `.claude/settings.json:6` matches
   `Edit|Write|MultiEdit|NotebookEdit` only. `sed -i angular.json`, `cat > jest.config.js` and
   `rm -rf src/app/vehicle` all pass unchallenged — including door 7, the only always-enforced
   mechanism in the system. Agents are increasingly steered toward shell-based edits by default,
   so this is widening, not narrowing.

3. **`files_touched` is tool-interception, not truth.** It cannot see deletions, moves, or any
   shell edit — which is why 5 was recorded for a change that deleted an entire feature directory.
   `docs/vibe-harness.html`'s own §04 rule is that changed-file counts come from
   `git diff --name-only`, "never from the agent's recollection". The hook doesn't follow it.

**Related:** `.ai/HARNESS.md:68` states `state.json`'s "single writer is `.claude/hooks/budget.mjs`".
Decision 0005 records the agent extending its own time budget from 60 to 90 minutes via shell —
disclosed at the time, and it worked. Combined with the three deletions above, the single-writer
invariant is documented and unenforced.

**Also unenforced:** `docs/vibe-harness.html:510` states as a rule that "a run asserts that each
expected hook fired at least once — 'nothing failed' over zero firings is a vacuous pass". Nothing
anywhere performs this assertion. `grep -rn 'budget.mjs\|HARNESS_DOOR_OPEN'` over the repo returns
the hook itself and prose. Fail-open plus no assertion is a fully silent regression path: one typo
in the `hit()` glob and nothing notices.

### 1.2 The runtime oracle tests a server of unknown provenance

The delta note's 1.2 asks whether `deep` runs late. The sharper problem here is *what* it runs
against.

- `.ai/harness/verify.sh:22` runs `npm run build`, then `.ai/harness/verify.sh:25` runs `npx playwright test`.
  `playwright.config.ts` boots `npm run start` — `ng serve`. **The production artifact is compiled
  and discarded; the browser never touches it.**
- `playwright.config.ts:30` is `reuseExistingServer: !process.env['CI']`. The retro records an
  orphaned `ng serve` "running since roughly the start of this session or before", origin never
  established, silently reused by every Playwright run. So `verify.sh deep` on a developer machine
  tests **whatever happens to be listening on :4200**.

This is the mechanism behind the retro's mistake #3 — the one report that reached the user as
"all 3 e2e tests pass" and turned out incomplete. It is the only finding in this audit that has
already produced a false claim to a human. Note the asymmetry: CI is safe (`reuseExistingServer`
is false there); local runs, which is where the agent runs `deep`, are not.

Two smaller members of the same family:

- `.ai/harness/verify.sh:25` is a bare `npx playwright test`, and `playwright.config.ts:9` sets
  `reporter: 'html'`, which blocks the terminal on a non-CI failure. The retro's mistake #2 is
  this behaviour being discovered live and read as a hang.
- `jest.config.js:5` excludes only `/node_modules/` and `/e2e/`. Decision 0005 records a stray
  `git worktree` under `.claude/worktrees/` breaking every `jest --ci` run. The worktree was
  removed; the config gap remains, and `.claude/worktrees/` is where this harness puts worktrees.

**On the delta note's 1.2 proper:** its diagnosis is confirmed. `e2e/app.spec.ts` is entirely the
"feature-driving spec" shape — it asserts on copy (`'mj-testing-playground'`, `'Must be at least 3
characters.'`) and breaks on any wording change. There is exactly one route, so the generic
route-mount smoke it asks for is roughly ten lines.

### 1.3 The door-7 list has six copies, and one has already drifted

The delta note's open question 1 asks whether `.ai/HARNESS.md` restates the list, making three
copies. It does, and there are six:

| # | Location | `setup-jest.ts` present |
|---|---|---|
| 1 | `.claude/hooks/budget.mjs:43` (the enforcer) | yes |
| 2 | `.ai/harness/config.yml:18` | yes |
| 3 | `.ai/HARNESS.md:31` | yes |
| 4 | `.ai/MODEL.md:29` | yes |
| 5 | `docs/vibe-harness.html:347` | yes |
| 6 | `docs/cheatsheet.html:198` | **no** |

Copy 6 has seven patterns where every other copy has eight. The cheatsheet — the artifact a human
reaches for first — tells you a file is safe to edit that the hook will block you on. The delta
note predicted silent decay in this list; it has already happened, in the direction nobody was
watching.

`.ai/MODEL.md:47`'s "Known duplication" section describes this as two copies. Its analysis (no YAML
parser, adding one is door 1) is right; its count is a third of the real number.

**On move 2 (assert every path resolves):** all eight patterns resolve today, so this check would
pass. Worth building — it is ten lines and directly applies the Angular 9→14 lesson — but it should
not be counted as coverage, because the decay that actually occurred (§1.6) was in a different file
and a different shape.

### 1.4 Three described mechanisms have never run

**1.4.1 There are no emits.** `.ai/prompts/understand.md`, `implement.md` and `test.md` all declare
`writes: […].json` in frontmatter. Across three run directories the only JSON is `state.json`.
`understand.json`, `implement.json` and `test.json` have never been written once.

This matters beyond bookkeeping. `docs/vibe-harness.html`'s §04 calls the structured emit "the
entire integration surface"; §07's spend-ledger row and `docs/vibe-harness.html:473`'s `spent: {min, files, tok}` example
depend on it. And it corrects the delta note's 1.6 directly: that item says "emits already carry
`spent`… the corpus is accruing and only the roll-up is missing." **The corpus is empty.** A `jq`
roll-up built now would compute over zero records and return a clean-looking number — precisely the
vacuous pass `.ai/HARNESS.md` warns about four lines from the end of its "Never trust" section.

The fix is ordering, not scope: make the emit a *mechanical* artifact first, on the model of
`handoff.sh` — no model call, `files_changed` from `git diff --name-only` — then build the ledger
over something real.

**1.4.2 The Stop hook manufactures stale handoffs, and the agent learned to delete them.**
`.claude/settings.json:21` fires `handoff.sh` on every stop while a run is active — including
ordinary turn ends, not just interruptions. The retro records two auto-generated `HANDOFF.md`
files noticed and deleted so they wouldn't be mistaken for current state.

The result is visible on disk: `harness-phase-0` and `vehicle-selection` each have a `HANDOFF.md`;
`ui-shell-redesign` — the one run that actually went wrong — has none. The artifact designed to
survive when the agent cannot act was destroyed on the run that most needed it, and the deletions
are invisible because the hook would simply regenerate the file.

**1.4.3 There is nowhere to record what the agent got wrong.** `grep -rn retro .ai/` returns
nothing: not in `.ai/HARNESS.md:84`'s run-directory layout, not in `config.yml`, not a prompt.
`.ai/prompts/digest.md`'s template has "What surprised me" (about the code) and "What I did" —
no section in which the agent is the subject. So the digest doesn't report on the agent, and the
six agent-caused failures in this run surfaced only because a retro was requested by hand.

That retro is the highest-signal document in the repo. It is also, currently, an accident.

This is adjacent to the delta note's 1.3 but distinct: 1.3 is about *routing* the digest
(`.ai/prompts/digest.md:6` and `.ai/harness/config.yml:47` both still say `small`, unchanged); this is about a
missing section in it.

### 1.5 The citation checker is advisory, and structurally blind to the drift that happened

`.ai/harness/check-citations.sh` is invoked only by prose in `.ai/prompts/record.md` and
`understand.md` — a habit, inside a system whose stated thesis is that a habit does not scale and
a script does. Three defects, and one trap in the obvious fix:

1. **Bare-path citations are invisible.** `.ai/harness/check-citations.sh:18` requires `:[0-9]+`. `.ai/MODEL.md:10`
   cites `src/app/vehicle/vehicle.service.ts` with no line number; that path was deleted at
   `ef2923d` and the checker reports the file clean. Roughly four lines to fix.
2. **The vacuous-pass guard is one level too high.** `.ai/harness/check-citations.sh:35` fails on zero
   *documents*, not zero *citations*. Running it over `.ai/MODEL.md` and `.ai/HARNESS.md` prints
   `all citations resolve (2 doc(s))` on the strength of a single citation across both files —
   the same shape the script exists to prevent. (`/tmp/.cite_fail` is also a fixed path; two
   repos checking concurrently cross-contaminate.)
3. **Gating it naively breaks the build.** Run over the live tree it exits 1 with seven failures,
   all in `.ai/run/ui-shell-redesign/brief.md`, and all *correct*: the brief cited a tree its own
   run then changed. **A brief is a snapshot of a tree the run invalidates.** Wiring the checker
   into `verify.sh` as-is makes `deep` permanently red. It needs commit-pinned resolution
   (`git show <sha>:path`), or it scopes to records and digests and leaves briefs pinned.

**And the memory shelf above it has no path to a mechanism.** `.ai/bank/2026-09-04-citation-drift.md`
names its own fix in its Generalises line — a content hash of the cited span, not the line number.
`.ai/prompts/understand.md` mandates `/recall` first. The card was available and the retro's
mistake #1 is a citation misattribution *inside a document that cites that card*. A `kind: gotcha`
whose Generalises line is actionable should become a tracked item, not a re-readable one.

The delta note's 1.4 (retarget §10's weekly pass from resolution to aptness) stands unchanged:
`docs/vibe-harness.html:797` still reads "file:line everywhere, one spot-check a week".

### 1.6 The docs describe a harness that is no longer the one in the repo

**`README.md` is the worst offender.** Lines 3, 19 and 23 still say the project was generated with
Angular CLI 9.1.0, that unit tests run "via Karma", and e2e "via Protractor" — all false since
decision 0003. It is simultaneously stale and a one-owner-per-fact violation, since `CLAUDE.md`
owns commands. The harness section at the bottom is accurate; the twenty-five lines above it are
not, and it is the first file any human or cold agent opens.

**`.ai/MODEL.md` has silently decayed.** Lines 10–12 describe `VehicleService`,
`BrandSelectComponent` and `ModelListComponent` as this repo's first real feature;
`src/app/vehicle/` was deleted at `ef2923d`. Line 43 reads "Known drift: None recorded." The file
whose stated boundary is "how the system is now, present tense" is describing a system that no
longer exists, and §1.5.1 explains why no script noticed.

**`docs/vibe-harness.html` (Design v4.1) — six corrections.**

- **`docs/vibe-harness.html:762` is now falsified.** "The blast-radius allowlist was enforced live, not advisory — its
  own record of which files it approved is in the run's `state.json`, not self-reported." Given
  §1.1, this is the single sentence on the page most worth correcting: it is the page's
  proof-of-teeth claim and the whole §03 argument rests on it.
- **`docs/vibe-harness.html:487` lists `review`** (model: large) in the Phase-0 skill table with no status column, and
  the page's `flows.fix` includes `review` and `keep?`. Shipped `.ai/harness/config.yml:40` is
  `[recall, understand, implement, test, record]`. Two of the page's flow steps do not exist.
- **`docs/vibe-harness.html:473` and §07's ledger row** describe the emit bus (§1.4.1). **`docs/vibe-harness.html:510`** states the
  hook-fired assertion (§1.1). Both are present tense; both are unbuilt.
- **§03's tier table** claims `deep` is "production build + a real browser driving the app end to
  end". The browser drives `ng serve` (§1.2).
- **`docs/vibe-harness.html:524`** says `HANDOFF.md` "fires on every stop condition"; the shipped hook fires on every
  turn end (§1.4.2).
- **`docs/vibe-harness.html:316` promises "you own one file (`MODEL.md`)"**, while §06 makes the bank human-curated and
  `.ai/harness/config.yml:1` says "humans edit it". Three human-owned files, not one. It is the page's
  headline promise and it is contradicted two sections later.

**`flows.tiny` exists in three states.** `.ai/harness/config.yml:41` defines it; `docs/vibe-harness.html:707` presents it as an
active spend lever; `docs/vibe-harness.html:776` lists it as Phase 2 pending. Nothing anywhere says *when* it applies,
and nothing selected it for a task the retro describes as "delete one feature, delete a scaffold,
restyle two files, extend one e2e spec". The run produced roughly 36 KB of brief, journal, digest,
decision record and retro against a net −370-line, mostly-deletion diff. `docs/vibe-harness.html`'s
§08 answer to ceremony creep is `/prune`, which is Phase 3.

**Three door-7 fixes are owed by a human and there is nowhere for them to wait.** The
`jest.config.js` worktree exclusion, and the two `playwright.config.ts` changes in §1.2. Door
crossings get recorded (`.ai/run/harness-v14-retool/door-crossings.md`), but nothing tracks the
ones still outstanding. `docs/vibe-harness.html:805` asks for an occasional grep for orphaned
`HARNESS_DOOR_OPEN` overrides; "occasionally" is not a cadence, and three real crossings are
already recorded across two files.

---

## 2. Order

Grouped into six workstreams. ⛔ marks door-7 items an agent cannot apply.

**W1 — make `enforced:` true.** Nothing else in the system can be trusted until this lands.
1. Hook implicitly permits `.ai/run/<active-slug>/**`. ~2 lines. Removes the brief lockout and
   with it the entire incentive to delete `state.json`. *Do this first regardless of the rest.*
2. Add `Bash` to the `PreToolUse` matcher.
3. Derive `files_touched` from `git diff --name-only`.
4. Protect `state.json` from non-hook writers, or drop the claim at `.ai/HARNESS.md:68`.
5. A hook self-test — exit 2 on `angular.json`, 0 on `src/foo.ts`, 2 on an out-of-radius path —
   wired into `verify.sh full`. This is the assertion `docs/vibe-harness.html:510` already claims exists.

**W2 — make green mean something.**
1. ⛔ `reuseExistingServer: false` for `deep`; `--reporter=line` in `.ai/harness/verify.sh:25`.
2. ⛔ Point `deep`'s Playwright at the production build. Retires the live-reload workaround at
   `e2e/app.spec.ts:39`.
3. Generic route-mount smoke at the `full` tier; keep the feature spec in `deep`.
4. ⛔ `jest.config.js` worktree exclusion.

**W3 — one owner for the door list.**
1. `budget.mjs` emits `.ai/harness/gate-scope.json`; six copies become one plus pointers.
2. Assert every listed path resolves; exit non-zero naming the missing.
3. Report — never block — unlisted paths that look like gate scope.
4. Grep for orphaned `HARNESS_DOOR_OPEN` crossings in `verify.sh deep`.

**W4 — artifacts that don't exist.**
1. Write the emits mechanically. **Precondition for 2.**
2. `jq` roll-up over `.ai/run/*/*.json`, grouped by skill and flow.
3. A "What I got wrong" section in `digest.md`, or `/retro` as a tenth prompt.
4. Stop hook fires on real interruption only, or `HANDOFF.md` becomes append-only.
5. Split `digest` routing: assembly `small`, the decision block `large`.

**W5 — citations and memory.**
1. Check bare-path citations.
2. Fail on zero citations; `mktemp` instead of `/tmp/.cite_fail`.
3. Commit-pinned resolution, *then* gate it in `verify.sh`.
4. Retarget `docs/vibe-harness.html:797`'s weekly pass to aptness.
5. A path from an actionable bank card to a tracked mechanism.

**W6 — docs to v4.2.**
1. `.ai/MODEL.md`: current feature, real drift section, duplication count.
2. `README.md`: delete the Angular 9 half, point at `CLAUDE.md`.
3. Design page: the six corrections in §1.6.
4. Cheatsheet: `setup-jest.ts`, then regenerate from `gate-scope.json`.
5. A flow-selection rule in `.ai/HARNESS.md`.
6. A human-owed door-7 surface.
7. Split `/adopt` into its own phase (delta note 1.5) — planning, no code.

**Sequence.** W1.1 → W1.2 → W1.3, then W2.1 and W2.4 to a human. Then W1.5, W3.2, W5.1, W5.2 —
all cheap, all closing silent holes. Then W3.1, W2.2, W2.3, W4.1 → W4.2. Docs last, once there is
something settled to describe.

---

## 3. Do not change these

Carried forward from the delta note's §3, all still correct here:

- **`enforced:` / `advisory:` tagging.** W1 exists to make the tags true, not to erase them.
  `hypothesis_falsified` and `runtime_falsified` are agent-noticed by nature.
- **`budget.mjs` failing open on anything unexpected.** W3.3 deliberately reports rather than
  blocks for this reason. Note the distinction W1.1 draws: failing open on the *unexpected* is
  correct; failing open because the agent deleted the state file is not.
- **Door 7 always-on rather than run-scoped.**
- **`check-citations.sh` printing the cited line instead of judging aptness.**
- **`unverified_at_runtime` surviving after `deep` landed.** §1.2 strengthens this: `deep` green
  is weaker evidence than it looks.

Added here:

- **The mechanical handoff's no-model design.** W4.2's problem is *when* it fires, never that it
  runs without a model. That property is the guarantee.
- **`AGENTS.md`.** Ten lines, pure pointer, correct. Leave it.
- **The retro as a genre.** W4.3 asks to make it routine, not to fold it into the digest. Its value
  came from the agent being the subject, which the digest's frame does not allow.
- **`flows.tiny` existing.** The problem is that nothing selects it, not that it is defined.

---

## 4. The delta note's open questions, answered

1. **Does `.ai/HARNESS.md` restate door 7's list?** Yes — and there are six copies, one already
   drifted. See §1.3.
2. **When `/adopt` finds two stores disagreeing, which wins?** Still open; unchanged by this audit.
3. **Is the hooks-fired assertion checking that the hook fired, or that it blocked correctly?**
   **Neither — it does not exist.** The evidence for the hook working is prose at
   `docs/vibe-harness.html:762`. Fail-open plus no assertion at all is the silent regression path
   the question anticipates. W1.5.
4. **What does the digest do with `decisions_needed: []` *and* `unverified_at_runtime`?** Still
   open as specified — but §1.4.3 reframes it: the digest has no section in which the agent's own
   reliability is the subject, so this is one instance of a general gap rather than an edge case.

---

## 5. Coverage

Every issue raised across the delta note, the conversation audit and the retro, mapped to a
workstream. Nothing here is unassigned.

| Source | Issue | Lands in |
|---|---|---|
| Delta 1.1 | door list: one owner / decay / fail-open | W3.1, W3.2, W3.3 |
| Delta 1.2 | `deep` runs once; two oracle shapes | W2.3 |
| Delta 1.3 | `digest` routed `small` | W4.5 |
| Delta 1.4 | §10 spot-check cadence stale | W5.4 |
| Delta 1.5 | `/adopt` scope vs estimate | W6.7 |
| Delta 1.6 | spend ledger ordering | W4.1 → W4.2 |
| Audit | Bash unguarded | W1.2 |
| Audit | `files_touched` undercounts | W1.3 |
| Audit | oracle tests unknown server | W2.1, W2.2 |
| Audit | bare-path citations invisible | W5.1, W6.1 |
| Audit | gating the checker breaks `deep` | W5.3 |
| Audit | zero-citation vacuous pass | W5.2 |
| Audit | no hook-fired assertion | W1.5 |
| Audit | `state.json` single-writer unenforced | W1.4 |
| Audit | door-7 fixes owed, untracked | W2.4, W6.6 |
| Audit | e2e is feature-shaped only | W2.3 |
| Retro | brief lockout | W1.1 |
| Retro | `rm state.json` as routine | W1.1 |
| Retro | stale handoff churn | W4.4 |
| Retro | no place to record agent error | W4.3 |
| Retro | bank card with no mechanism | W5.5 |
| Retro | reporter / server reuse | W2.1 |
| Retro | ceremony disproportionate | W6.5 |
| Docs | `README.md` stale | W6.2 |
| Docs | `MODEL.md` stale + undercount | W6.1 |
| Docs | six design-page corrections | W6.3 |
| Docs | cheatsheet missing `setup-jest.ts` | W6.4 |
| Docs | `flows.tiny` in three states | W6.5 |

---

## 6. One closing observation

The retro reads as a process failure — "roughly 3x the back-and-forth a task this size should
need". Four of its six agent-caused mistakes were *produced by harness mechanisms*: the brief
lockout, the stale-handoff churn, the reused server, and a bank lesson with no enforcement path.

That is a better outcome than it looks. The harness generated the evidence against itself, in
writing, on disk, in the form its own §08 asks for. Every finding in this audit traces to an
artifact the system produced on purpose. The work in §2 is what happens when that evidence is
acted on rather than filed.
