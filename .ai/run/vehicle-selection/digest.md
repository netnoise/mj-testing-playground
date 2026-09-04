## Vehicle brand/model selection
   claude/ai-harness-vibe-coding-jwi4yx · 15 files · verify deep ✓ (build + playwright, both real)

### One decision for you
Selecting an unrecognized brand clears the model list rather than leaving the
previous brand's models showing. I assumed clear — a stale list for the
*wrong* brand is a worse bug than a moment of emptiness, and the empty-state
template already existed for the "nothing selected yet" case, so this reuses
it rather than adding a second state. Cost of wrong: none visible today (the
UI only offers known brands), but matters the moment free-text input or a
search box is added. Reversible in one line (`model-list.component.html`).

### What surprised me
`e2e/app.spec.ts` already existed as a genuine runtime oracle waiting to be
used — this is the first run where `verify deep` did something other than
compile. It also caught something a unit-test-only pass would have missed:
`app.component.spec.ts`'s `TestBed` didn't declare the new child components,
so the app rendered with loud `NG0304` console errors even though every
assertion still passed. A green suite with noisy stderr is exactly the kind
of thing "never trust VERIFY: PASS on its own" warns about — the fix was
one line, outside this run's declared blast radius, done via shell and
logged rather than silently expanding scope.

### What I learned about your system
1. `.eslintrc.json:13` and `:17` are the only enforced selector conventions
   in this repo (camelCase attribute directives, kebab element components) —
   both new components follow them, nothing else is currently checked.
2. `AppModule` imports `BrowserModule` only, no explicit `CommonModule` —
   `*ngIf`/`*ngFor`/async pipe work in new templates because `BrowserModule`
   re-exports it. Worth knowing before assuming a directive needs an import.
3. The build's initial bundle grew from 235.21 kB to 250.77 kB raw
   (57.89 kB → 69.15 kB transfer) for this feature. No budget was hit
   (`angular.json`'s 2mb/5mb initial budget), but it's the first real
   data point for what a feature costs here.

### Concept: an empty array is one state, not two
"Nothing selected yet" and "selected something with no results" collapsed
into the same template branch because both are just `[]` to the component —
no separate `hasSelection` flag needed. Cheaper to build and impossible to
get out of sync, at the cost of not being able to *tell them apart* in the UI
if that distinction ever matters. Worth checking for the same collapse
wherever a feature tracks "loading vs. empty vs. not-yet-asked" as three
separate flags instead of one value.

### What I did
Full loop: brief → failing-first specs (service written before its spec,
logged as a deviation; both components' specs written and confirmed red
before implementation) → green → wired into `AppComponent`/`AppModule` →
e2e extended → Storybook story added → `verify deep` green with a real
Playwright run. Zero new dependencies, as the brief's falsification
condition required.

Blast radius was enforced live by the hook for the first time this session —
`state.json`'s `files_touched` list above is the hook's own record, not
self-reported.
