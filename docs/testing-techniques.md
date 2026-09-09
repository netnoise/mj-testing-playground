# Testing techniques: a catalog

A survey of testing techniques as practised in large engineering organisations
and in strong commercial products, each with an honest verdict for *this* repo.

This is a reference, not a wish list. Most entries below say **not applicable**,
and say why. A catalog that recommends everything recommends nothing.

Two documents own facts this one does not repeat:

- **How to run anything** — `CLAUDE.md`. No command is restated here.
- **How tests are written here** — `.ai/prompts/test.md`. Failing-spec-first for
  bugs, each `it(...)` naming the invariant it protects, gating on changed lines
  rather than a global coverage number, and reporting specs that verify nothing.
  That doctrine is not re-argued here; this document is about *which* techniques
  exist and *when* each earns its place.

The adoption sequence lives in [`testing-roadmap.md`](./testing-roadmap.md).

## Why a taxonomy rather than a list

Techniques are not competing answers to one question. They answer different
questions, and a suite can be excellent at one while blind to the others:

| The question | Answered by |
|---|---|
| Does the code do what I said? | Example-based unit and integration tests |
| **Are my tests themselves any good?** | Mutation testing, changed-lines coverage |
| Does it hold for inputs I didn't think of? | Property-based, fuzzing, combinatorial |
| Did the *appearance* change? | Visual regression, snapshot, approval testing |
| Can everyone actually use it? | Accessibility testing |
| Do the pieces still fit together? | Contract testing, schema validation |
| Does it survive the real world? | Chaos, canary, shadow traffic, synthetics |
| Is it fast enough, still? | Load testing, performance budgets |
| Can the org sustain this suite? | Flaky quarantine, test impact analysis |

A repo with 100% line coverage and no mutation testing does not know whether its
tests assert anything. One with perfect unit tests and no visual regression
ships a broken stylesheet. The value of the taxonomy is that it makes the blind
spots nameable.

## How to read an entry

```
### <Technique>
**What it is**    — the mechanism, plainly.
**Where it's used** — real-world grounding.
**Fit here**      — grounded in this repo, citing file:line.
**Cost**          — dependencies, one-way doors, prerequisites.
**Verdict**       — Adopt now · Adopt after <prereq> · Not applicable until <trigger>
```

"Doors" are this repo's one-way decisions, defined in `.ai/HARNESS.md`. Two
recur below. **Door 1** is any dependency add. **Door 7** is any edit to
gate-scope config — `jest.config.js`, `setup-jest.ts`, `playwright.config.ts`,
`.eslintrc.json`, `angular.json`, `tsconfig*.json`, `.ai/harness/verify.sh` —
enforced in code at `.claude/hooks/budget.mjs:43`. Door 7 exists because editing
a gate's own config makes the *number* improve without the code improving.

---

## 1. Test-suite quality and correctness

### Mutation testing
**What it is** — The tool deliberately breaks your source (flips `<` to `<=`,
replaces a return with `null`, deletes a statement) and re-runs the suite. Each
surviving mutant is a change to your code that no test noticed. The score is a
measure of your *tests*, not your code.
**Where it's used** — Stryker in the JS/TS world, PIT in Java. Used as a merge
gate at organisations that have learned coverage is gameable; Google's internal
mutation-testing service surfaces surviving mutants during code review rather
than as a blocking percentage.
**Fit here** — The strongest single audit available to this repo. Existing specs
would very likely score poorly: `src/app/vehicle/model-list.component.spec.ts`
asserts with `expect.arrayContaining`, so a mutant that *drops* a model from the
list survives. `src/app/app.component.spec.ts:24` is `expect(app).toBeTruthy()`,
which no mutant can ever kill.
**Cost** — Door 1 (`@stryker-mutator/core`, `@stryker-mutator/jest-runner`).
`stryker.conf.json` is a new file, so **not** door 7. Slow — it re-runs the
suite once per mutant — which is why it wants CI.
**Verdict** — **Adopt after CI.** The honest audit of everything else.

### Property-based testing
**What it is** — Instead of asserting one input/output pair, you state an
invariant that must hold for *all* inputs, and the framework generates hundreds
of cases trying to break it, then shrinks any failure to a minimal reproduction.
**Where it's used** — QuickCheck (Haskell) originated it; Hypothesis (Python)
and fast-check (TS) are the modern workhorses. Heavy use in parsers,
serialisers, financial calculations, and anywhere an input space is large.
**Fit here** — `src/app/vehicle/vehicle.service.ts:18` is the natural target:
`(brand && BRAND_MODELS[brand]) || []` indexes a `Record<string, …>` by an
arbitrary string. `tsconfig.json` enables `strictTemplates` and
`strictInjectionParameters` but **not** `strict` or `noUncheckedIndexedAccess`,
so an unknown key silently yields `undefined`. The invariant "`models$` always
emits an array, never `undefined`, for any string whatsoever" is exactly the
kind of claim example-based tests state three times and property tests state
once, properly.
**Cost** — Door 1 (`fast-check`). Specs stay in `src/**/*.spec.ts`, which is
already the write scope of `.ai/prompts/test.md`.
**Verdict** — **Adopt now-ish.** Highest insight-per-line in the catalog.

### Fuzzing
**What it is** — Feed malformed, hostile, or randomly mutated input and watch
for crashes, hangs, or memory errors. Coverage-guided fuzzers evolve inputs to
reach new code paths.
**Where it's used** — libFuzzer and AFL against C/C++; Google's OSS-Fuzz runs
continuously against hundreds of open-source projects and has found tens of
thousands of bugs. Essential for parsers and anything touching untrusted bytes.
**Fit here** — Property-based testing is the same idea in a form that suits
typed application code; classic fuzzing targets memory-unsafe parsers, and this
repo has neither. Treat `fast-check` as the fuzzing entry and stop there.
**Cost** — Not worth measuring.
**Verdict** — **Not applicable.** Subsumed by property-based testing here.

### Snapshot testing
**What it is** — Serialise a value or rendered output, commit it, and fail the
build when it changes. Jest ships it built in.
**Where it's used** — Ubiquitous in the React/Jest ecosystem, and increasingly
regretted there: large snapshots are approved blindly, so they detect change
without detecting *defects*.
**Fit here** — Cheap (zero dependencies) but a poor fit for the current code.
The components render a `<select>` and a `<ul>`; a snapshot would mostly pin
markup that no one has decided is correct. The failure mode — reflexively
re-running with `-u` — is worse than the gap it fills.
**Cost** — Zero. Built into Jest.
**Verdict** — **Not recommended**, despite being free. Prefer explicit
assertions and, for appearance, visual regression.

### Golden master / approval testing
**What it is** — Capture the full output of a system you don't fully understand,
lock it in as the "golden" reference, then refactor freely and diff against it.
Unlike snapshots, the intent is explicitly to characterise *existing* behaviour
before changing it.
**Where it's used** — The standard technique for putting legacy code under test
(Feathers' "characterization tests"); ApprovalTests is the best-known library.
**Fit here** — No legacy code to characterise — the app is ~60 lines of TypeScript
written this year. Genuinely useful as a *demonstration* of the technique, which
is worth something in a repo whose purpose is demonstrating techniques.
**Cost** — Door 1 for a library, or zero if hand-rolled with fixture files.
**Verdict** — **Adopt in the showcase phase**, as illustration rather than
protection.

### Differential testing
**What it is** — Run two implementations against the same inputs and assert they
agree. The oracle is the other implementation, so you never have to state what
the right answer is.
**Where it's used** — Compiler and database testing; migrations where an old and
new implementation must match; re-implementations validated against a reference.
**Fit here** — No second implementation exists today. Becomes genuinely valuable
the moment `VehicleService` is refactored — e.g. if the hardcoded `BRAND_MODELS`
const is replaced by an HTTP call, old-vs-new differential tests would prove the
swap behaviour-preserving.
**Cost** — Zero dependencies; it is a test-writing pattern.
**Verdict** — **Not applicable until a refactor or migration** creates a second
implementation to compare against.

### Metamorphic testing
**What it is** — When you cannot know the exact correct output, assert
*relationships* between related inputs and outputs. "Searching for `X Y` should
return no more results than searching for `X`." "Re-encoding an already-encoded
image should change it less the second time."
**Where it's used** — The standard answer to the oracle problem in ML systems,
search ranking, and scientific computing, where no one can say what the single
right output is.
**Fit here** — A real, if small, target: `src/app/vehicle/vehicle.service.ts:17`
defines `models$` as a *cold* pipe off the `BehaviorSubject`, so every subscriber
re-runs `map`. The metamorphic relation "N subscribers see identical sequences"
is checkable and currently unasserted. Also: selecting brand A then B then A
should yield the same list both times — true today, and worth pinning.
**Cost** — Zero dependencies. Pure test-design technique.
**Verdict** — **Adopt in the showcase phase.** The most intellectually
interesting technique that actually fits this codebase.

### Model-based testing
**What it is** — Describe the system as a state machine, then let a tool
generate test sequences by walking it, including paths a human would not write
by hand.
**Where it's used** — Protocol implementations, embedded systems, and stateful
APIs. `fast-check` ships model-based testing on top of its property engine.
**Fit here** — Brand selection is a genuine, tiny state machine: `null → brand →
null`, seeded `null` at `src/app/vehicle/vehicle.service.ts:13`, reset via the
`value || null` coercion at `src/app/vehicle/brand-select.component.ts:16`. Note
there is no `distinctUntilChanged`, so re-selecting the same brand re-emits — a
model-based test would pin that behaviour deliberately rather than leaving it
accidental.
**Cost** — Door 1, but shares the `fast-check` dependency with property-based
testing, so effectively free once that door is crossed.
**Verdict** — **Adopt in the showcase phase**, riding on `fast-check`.

### Combinatorial / pairwise testing
**What it is** — With many configuration options, testing every combination
explodes exponentially. Pairwise testing generates a much smaller set covering
every *pair* of values, which empirically catches the large majority of
interaction bugs.
**Where it's used** — Microsoft's PICT; heavy use in enterprise software with
large configuration matrices and in hardware/OS compatibility testing.
**Fit here** — The interesting matrix would be brand × viewport × colour scheme,
which is small enough to enumerate exhaustively. Pairwise solves a problem this
repo does not have.
**Cost** — Door 1 for a generator.
**Verdict** — **Not applicable until the configuration space grows** beyond
what exhaustive enumeration handles comfortably.

### Changed-lines coverage gating
**What it is** — Gate on whether *the lines this change touched* are covered,
rather than on a repository-wide percentage.
**Where it's used** — The default at organisations with large legacy codebases,
because a global target on an under-tested repo is unreachable and therefore
gets disabled — taking the discipline with it.
**Fit here** — Already this repo's stated doctrine; `.ai/prompts/test.md` owns
that rule and explains the reasoning. Not restated here. What is *missing* is
enforcement: `jest.config.js` sets no `collectCoverageFrom`, no thresholds, and
no reporters, so `npm run test:coverage` produces a number nobody checks.
**Cost** — Door 7 (`jest.config.js`) plus CI to compute the diff.
**Verdict** — **Adopt after CI**, as the mechanism behind an existing rule.

---

## 2. Component and UI layer

### Storybook interaction tests (`play()`)
**What it is** — A story defines its own interaction script: click, type, select,
then assert. The same story that documents a component becomes its test, run in
a real browser and debuggable frame by frame.
**Where it's used** — Standard practice in design-system teams at product
companies, where the component explorer already exists and the marginal cost of
making it assert is near zero.
**Fit here** — The cheapest real win available. `@storybook/addon-interactions`
is **already installed** (`package.json:46`) and **no story uses `play()`**.
There is no `brand-select` story at all, and the `ModelListComponent` story can
only render its empty state because it supplies no `moduleMetadata` override —
which is precisely why its only export is named `Empty`.
**Cost** — Zero. Installed, configured, unused.
**Verdict** — **Adopt now.** Already paid for.

### Visual regression testing
**What it is** — Screenshot the UI, compare against a committed baseline, fail
on perceptible difference. Perceptual (rather than pixel-exact) comparison
avoids failing on anti-aliasing noise.
**Where it's used** — Chromatic, Percy, Applitools; near-universal in
design-system and marketing-surface teams, where an unnoticed CSS change is the
characteristic production defect.
**Fit here** — Catches the entire class of bug this repo is structurally blind
to. `src/app/app.component.html` carries ~500 lines of inline-styled markup that
no test touches; any change to it is currently invisible to the suite.
Playwright's `toHaveScreenshot()` needs **no new dependency**.
**Cost** — Zero dependencies. Door 7 *only* if thresholds or
`snapshotPathTemplate` require touching `playwright.config.ts` — the assertion
itself works unconfigured. Wants CI, since baselines are OS- and
browser-dependent and a locally-generated baseline will not match a CI runner's.
**Verdict** — **Adopt after CI.** Best value-per-dependency in the catalog.

### Accessibility testing
**What it is** — Automated WCAG auditing against the rendered DOM: contrast,
labels, roles, focus order, landmark structure.
**Where it's used** — axe-core is the de facto engine; a merge gate at most
organisations with accessibility obligations, which in practice means anyone
selling to government, education, or enterprise.
**Fit here** — Directly relevant and currently absent. The app has a labelled
`<select>` and a placeholder `<option value="" disabled selected>` — exactly the
kind of markup where automated auditing has opinions worth hearing. Wires into
the existing `e2e/` specs.
**Cost** — Door 1 (`@axe-core/playwright`). Roughly ten lines of setup.
Automated tools catch perhaps a third of real accessibility defects; the rest
needs manual and assistive-technology testing. Worth stating so the green check
is not mistaken for compliance.
**Verdict** — **Adopt now.** Cheapest genuine quality gain per line of setup.

### Cross-browser and viewport matrix
**What it is** — Run the same e2e suite across browser engines and screen sizes.
**Where it's used** — Standard wherever the user base is not controlled;
Playwright's `projects` array makes it close to free.
**Fit here** — `playwright.config.ts:14` declares exactly one project,
`chromium` (`playwright.config.ts:16`). No WebKit, no Firefox, no mobile
viewport. For a layout that is mostly flexbox this is a modest risk, but it also
pairs with visual regression: the matrix is what makes screenshot testing catch
responsive breakage rather than just desktop breakage.
**Cost** — Door 7 (`playwright.config.ts`). Runtime grows linearly per project.
**Verdict** — **Adopt with visual regression**, as one door-7 crossing rather
than two.

### User-centric queries
**What it is** — Select elements the way a user perceives them — by role, label,
or visible text — instead of by CSS class or DOM structure. Tests then survive
refactors and implicitly assert accessibility.
**Where it's used** — Testing Library's central premise, now the default style
across the React, Vue, and Angular ecosystems.
**Fit here** — Split. `e2e/app.spec.ts` already does this well, using
`page.getByLabel('Brand')` and `page.getByText`. The Jest specs do not:
`src/app/app.component.spec.ts:37` reaches for `.content span`, a selector that
breaks on any markup change and asserts nothing about usability. Adopting
`@testing-library/angular` would be door 1; simply preferring role- and
text-based queries in new specs costs nothing.
**Cost** — Zero as a convention; door 1 for the library.
**Verdict** — **Adopt now as a convention.** Defer the library.

---

## 3. Integration and contract

Every entry in this section is blocked on the same fact: **there are no HTTP
calls anywhere in `src/`.** `VehicleService` reads a module-private const. There
is no API, no backend, and therefore no integration boundary to protect. These
are documented so that the trigger is recognised when it arrives.

### Consumer-driven contract testing
**What it is** — The consumer declares what it needs from a provider as an
executable contract; the provider verifies it can satisfy every consumer's
contract in its own CI. Integration is verified without ever standing up both
systems together.
**Where it's used** — Pact is the standard tool. The characteristic solution to
microservice integration testing at organisations with many independently
deployed services — the alternative being a shared staging environment that is
permanently broken.
**Fit here** — Nothing to contract with.
**Cost** — Door 1, plus a broker to store contracts.
**Verdict** — **Not applicable until a real API exists** *and* is owned by a
different team or release cycle. With a single team shipping both sides
together, contract testing is usually ceremony.

### API schema validation
**What it is** — Generate types and validate payloads against an OpenAPI or JSON
Schema definition, so a provider's breaking change fails at the boundary with a
precise message rather than as an undefined-property error three layers in.
**Where it's used** — Near-universal wherever an OpenAPI spec exists.
**Fit here** — No API. Worth noting as the *first* thing to add when one
appears, ahead of contract testing: it is cheaper and catches more.
**Cost** — Door 1.
**Verdict** — **Not applicable until a real API exists.**

### Record / replay (VCR)
**What it is** — Record real HTTP interactions once, commit them, replay them
deterministically in tests. Real fixtures without a live dependency.
**Where it's used** — VCR (Ruby), Polly.js, nock recordings. The pragmatic
middle ground between mocking everything and testing against live services.
**Fit here** — Nothing to record. Would be the natural cheap option once the
hardcoded `BRAND_MODELS` const becomes a fetch.
**Cost** — Door 1. Recorded cassettes must be reviewed for secrets before
committing.
**Verdict** — **Not applicable until a real API exists.**

### Service virtualization / request mocking
**What it is** — Intercept at the network layer and serve realistic responses,
so application code runs unmodified and unaware. MSW is the modern form.
**Where it's used** — Widespread in frontend teams; the same mock definitions
serve tests, Storybook, and local development.
**Fit here** — Nothing to intercept. Notable that if it *did* apply, it would
also solve the Storybook gap — MSW handlers would let `ModelListComponent`
stories render populated states without a `moduleMetadata` override.
**Cost** — Door 1.
**Verdict** — **Not applicable until a real API exists.**

---

## 4. Production and delivery

Every entry here is blocked on a second fact: **nothing is deployed.** There is
no environment, no traffic, no telemetry. These describe what testing looks like
once software is running somewhere users can reach it — the half of the
discipline that unit tests cannot touch.

### Canary releases and progressive delivery
**What it is** — Ship to 1% of traffic, watch error and latency metrics against
the control group, advance or roll back automatically. Feature flags decouple
deploy from release, so shipping code and enabling behaviour are separate acts.
**Where it's used** — The default release mechanism at essentially every
large-scale consumer product; LaunchDarkly, Flagger, Argo Rollouts.
**Fit here** — Nothing deployed.
**Cost** — Deployment pipeline, metrics, a flag system.
**Verdict** — **Not applicable until deployed.** The single highest-value
practice in this section when it becomes available: it converts an outage into
a 1% blip.

### Shadow traffic / dark launch
**What it is** — Mirror real production requests to a new implementation without
serving its responses. Compare outputs offline. You get production-scale
validation with zero user-visible risk.
**Where it's used** — The standard technique for de-risking major rewrites and
migrations at scale.
**Fit here** — No traffic to mirror.
**Cost** — Traffic-mirroring infrastructure.
**Verdict** — **Not applicable until deployed** with meaningful traffic.

### Chaos engineering
**What it is** — Deliberately inject failure into production — kill instances,
add latency, partition the network — to verify that resilience assumptions
actually hold, rather than merely being believed.
**Where it's used** — Netflix's Chaos Monkey originated it; now a named practice
with dedicated tooling (Gremlin, Litmus) and scheduled "game days" at most
large infrastructure organisations.
**Fit here** — A single-page frontend with no backend has no failure modes to
inject. Even fully deployed, this stays disproportionate until there is a
distributed system behind it.
**Cost** — Substantial: tooling, observability, and organisational appetite.
**Verdict** — **Not applicable.** Requires distributed infrastructure this
project is unlikely to grow.

### Synthetic monitoring
**What it is** — Scripted "fake users" hit production continuously from multiple
regions, so you learn about an outage before your users report it.
**Where it's used** — Universal for revenue-bearing surfaces; often literally
the same Playwright specs, pointed at production and run on a schedule.
**Fit here** — Nothing deployed. Worth flagging that the existing `e2e/` specs
are already close to reusable for this, which is a genuine argument for keeping
them dependency-light and pointed at a configurable `baseURL` — as
`playwright.config.ts` already does.
**Cost** — A scheduler and an alerting path.
**Verdict** — **Not applicable until deployed**, then unusually cheap here.

### Observability-driven testing
**What it is** — Accept that some defects cannot be reproduced pre-production,
and invest in tracing and high-cardinality telemetry so that production
behaviour is *interrogable* instead. "Testing in production" as a deliberate
strategy rather than an accusation.
**Where it's used** — Articulated most clearly by Honeycomb; standard thinking
in teams running complex distributed systems.
**Fit here** — Nothing deployed, nothing to observe.
**Cost** — Instrumentation and a telemetry backend.
**Verdict** — **Not applicable until deployed.**

### A/B testing and experimentation
**What it is** — Randomise users between variants and measure the effect on a
metric. Tests a product hypothesis rather than a correctness one.
**Where it's used** — Core infrastructure at every large consumer product.
**Fit here** — No users, no metrics. Included because it is frequently called
"testing" and is a different discipline: it validates whether a change is
*desirable*, not whether it is *correct*.
**Cost** — Experimentation platform and statistical discipline.
**Verdict** — **Not applicable.** Different question entirely.

---

## 5. Performance

### Frontend performance budgets
**What it is** — Fail the build when a bundle exceeds a declared size. The
cheapest performance gate that exists, because regression is gradual and
invisible without one.
**Where it's used** — Standard in frontend build pipelines.
**Fit here** — **Already present and enforced.** `angular.json` sets production
budgets of 2mb warning / 5mb error on the initial bundle and 6kb / 10kb per
component style. This repo owns a real performance gate already; it is worth
knowing that, and worth not weakening it — `angular.json` is door 7 precisely
because relaxing a budget makes the number go green without the bundle
shrinking.
**Cost** — Already paid.
**Verdict** — **Already adopted.** Do not weaken without a door-7 crossing.

### Lighthouse CI
**What it is** — Run Lighthouse on every change and gate on performance,
accessibility, and best-practice scores over time.
**Where it's used** — Common in content and commerce frontends where load
performance is a revenue metric.
**Fit here** — Plausible once CI exists, though it overlaps the accessibility
entry (Lighthouse uses axe under the hood) and the budgets already cover bundle
size. Its distinct value is runtime metrics — layout shift, time to interactive
— which nothing here measures.
**Cost** — Door 1, plus CI, plus tolerance for score noise between runs.
**Verdict** — **Optional after CI.** Lower priority than the axe integration it
partly duplicates.

### Load and stress testing
**What it is** — Drive synthetic concurrent load and measure latency percentiles
and error rates at and beyond expected peak.
**Where it's used** — k6, Gatling, Locust; mandatory pre-launch practice for any
service with a capacity limit.
**Fit here** — There is no server. A static Angular bundle's scaling properties
are its CDN's.
**Cost** — Tooling plus an environment to hammer.
**Verdict** — **Not applicable.** No server-side component to load.

---

## 6. Process and scale

These are not tools. They are the practices that decide whether a test suite
stays trustworthy as it and the team grow — the part that is usually the actual
bottleneck.

### Flaky test detection and quarantine
**What it is** — Detect tests that pass and fail non-deterministically,
automatically remove them from the blocking set, and file them as bugs. The
alternative — a culture of "just re-run it" — destroys the suite's authority,
because once re-running is normal, a real failure gets re-run too.
**Where it's used** — Google's internal infrastructure quarantines flaky targets
automatically; every large monorepo grows some version of this.
**Fit here** — Nothing to build yet: 5 spec files, run locally, no history to
mine. Worth knowing early because the *cultural* rule can be adopted before the
tooling — this repo's harness already refuses to treat a re-run as evidence.
Note `playwright.config.ts` sets `retries: 2` under CI, which quietly *hides*
flakes rather than surfacing them; that is a reasonable default and a thing to
revisit once CI produces history.
**Cost** — Requires CI history. Meaningless without it.
**Verdict** — **Not applicable until CI has run history.** Adopt the norm now,
the tooling much later.

### Test impact analysis
**What it is** — Map which tests exercise which code, then run only the tests a
given diff could affect. Turns a monorepo's hours-long suite into minutes.
**Where it's used** — Google's TAP, Meta's internal systems; Nx and Turborepo's
affected-graph in open source.
**Fit here** — The full suite is 4 spec files. Selecting a subset would take
longer than running everything.
**Cost** — Significant infrastructure.
**Verdict** — **Not applicable.** Correct answer at 10,000 tests, waste at 12.

### Exploratory testing charters
**What it is** — Timeboxed, chartered manual investigation by someone trying to
break the product, with findings logged. Session-based test management makes it
accountable without scripting it.
**Where it's used** — Standard in mature QA organisations, deliberately retained
*alongside* automation because it finds the defects nobody thought to automate —
automation only ever checks what someone already imagined.
**Fit here** — Applicable today, at any scale, at zero tooling cost. The
distinction worth preserving: this is not "clicking around before shipping", it
is a chartered session with a written record.
**Cost** — Human time only.
**Verdict** — **Adopt as a practice** whenever a human is in the loop.

### Bug bars and release readiness
**What it is** — Written, agreed severity thresholds defining what blocks a
release versus what ships as a known issue, decided *before* the argument.
**Where it's used** — Standard release-management practice; Microsoft's "bug
bar" terminology is the widely borrowed one.
**Fit here** — No release process to gate. The transferable idea is already
present in this repo's harness in a different form: stop conditions and doors
are a bug bar for *agent* behaviour, decided in advance rather than negotiated
under pressure.
**Cost** — Agreement, written down.
**Verdict** — **Not applicable until there are releases** with stakeholders.

### Security scanning
**What it is** — Three distinct things usually lumped together: dependency
scanning (known CVEs in your tree), SAST (static analysis for vulnerable
patterns), and DAST (probing a running application).
**Where it's used** — Dependabot, Snyk, CodeQL, OWASP ZAP. Dependency scanning
in particular is close to universal and nearly free.
**Fit here** — Dependency scanning applies **today** and is the one entry in
this section with an immediate answer: this repo pins an Angular 14 toolchain
with a large transitive tree and no scanning of any kind. SAST has little to
chew on in ~60 lines with no user input, no `innerHTML`, and no auth. DAST needs
a deployed target.
**Cost** — Dependency scanning is free on GitHub and needs no dependency of its
own; note that acting on findings means version bumps, which are door 1.
**Verdict** — **Adopt dependency scanning with CI.** SAST/DAST not applicable.

### LLM-assisted test generation
**What it is** — Use a model to propose edge cases, draft specs from a signature
and docstring, or suggest property-based invariants. Strongest as a generator of
*candidates* a human accepts or rejects — its weakness is confidently writing
tests that assert current behaviour rather than intended behaviour, which
converts bugs into permanent requirements.
**Where it's used** — Rapidly becoming ordinary. Meta has reported production
use of LLM-generated test improvements gated behind human review.
**Fit here** — Reflexively relevant: this repo carries a whole agent harness in
`.ai/`, and the specs discussed throughout this catalog were themselves written
in that loop. The mitigation is already institutional rather than aspirational —
`.ai/prompts/test.md` requires reading your own test diff and asking what would
have to break for each spec to fail, which is precisely the check that catches a
generated test asserting the status quo. Mutation testing is the mechanical
version of the same check.
**Cost** — Zero marginal; already in use.
**Verdict** — **In use.** Pair it with mutation testing, which is the only
technique here that can *prove* a generated test asserts something.

---

## Index by verdict

| Verdict | Techniques |
|---|---|
| **Adopt now** | Storybook interaction tests · Accessibility (axe) · User-centric queries (as convention) · Exploratory testing charters |
| **Adopt now-ish** | Property-based testing |
| **Already adopted** | Frontend performance budgets · LLM-assisted generation |
| **Adopt after CI** | Visual regression · Cross-browser/viewport matrix · Mutation testing · Changed-lines coverage gating · Dependency scanning |
| **Adopt in showcase phase** | Metamorphic testing · Model-based testing · Golden master/approval testing |
| **Optional** | Lighthouse CI |
| **Not recommended** | Snapshot testing |
| **Not applicable until a real API exists** | Contract testing · Schema validation · Record/replay · Service virtualization · Differential testing |
| **Not applicable until deployed** | Canary/progressive delivery · Shadow traffic · Synthetic monitoring · Observability-driven testing |
| **Not applicable** | Fuzzing · Combinatorial/pairwise · Chaos engineering · A/B testing · Load testing · Test impact analysis · Bug bars · SAST/DAST |

Sequencing, prerequisites, and the doors each phase crosses are in
[`testing-roadmap.md`](./testing-roadmap.md).
