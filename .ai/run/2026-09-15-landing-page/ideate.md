# Ideate: a professional-looking landing page for this project

## 1. Frame

**Question:** What should a professional-looking landing page for
`mj-testing-playground` actually say and look like, given the repo is a
near-default Angular scaffold whose real content is `.ai/` — a harness for
running AI agents on this codebase — not a product with users, features, or a
business?

**What a good answer lets us decide:** which single audience and narrative
the page commits to (visitor-as-customer vs. visitor-as-engineer-evaluating-
the-harness vs. something else), so that `/intake` can scope one `AppComponent`
rewrite instead of a vague "make it look nice" brief that has no way to
know when it's done.

Checked before writing this: `src/app/app.component.html` is still the
`ng new` default (`<h1>{{ title }}</h1>` + `<router-outlet>`), `routes = []`,
and there is no existing marketing copy anywhere in `src/`. `docs/vibe-harness.html`
already exists as a design write-up of the harness itself, published outside
the Angular app. That's the one fact that shapes several ideas below.

## 2. Generate

### Obvious: SaaS-template hero page
Pitch         — Standard landing-page template: hero with headline + subhead + CTA button, a three-column "features" grid, a footer. Swap in Angular Material or a hand-rolled SCSS grid, replace the default `<h1>` in `AppComponent`.
Must be true  — "Professional" means "looks like every SaaS marketing site," and that template still reads as credible when the thing it's marketing has no users, no signup, and no business behind it.
Cheapest test — Write the headline and three feature-card labels in five minutes and read them aloud. If they describe capabilities nobody can click on, the template has already failed.

### Invert: guarantee it fails, then flip
Pitch (fails)  — Ship SaaS copy that implies this is a live product: fake testimonials, a pricing table, a "Get Started" button wired to nothing, stock-photo team section. Anyone who opens the repo after reading the page (a recruiter, a collaborator, future-you) hits an immediate credibility gap between claim and code.
Flip           — An **honest meta-page**: it names itself as a testing playground for an AI-agent harness (`.ai/`), states what's real (an Angular CLI scaffold + a harness experiment) and what isn't (a product), and links to `docs/vibe-harness.html` for the real substance. Professional here means "the claims survive someone reading the source," not "looks expensive."
Must be true  — The actual audience for this page is someone who already has repo access or is about to get it (collaborator, reviewer, future-you) — not a cold visitor being sold something.
Cheapest test — Draft the one-paragraph "what this is" copy and hand it to someone who hasn't seen the repo; ask them what they think they could click or sign up for. If they expect a working product, the honesty didn't land.

### Drop a constraint: landing page = docs page
Pitch         — Drop the assumption that "landing page" and "the design write-up" must stay separate. Make `AppComponent`'s route the entry point that embeds or deep-links straight into `docs/vibe-harness.html` content (or a condensed version of it) instead of writing new marketing copy from scratch.
Must be true  — `docs/vibe-harness.html` is already the best available description of what this repo is for, and duplicating that narrative in a second, Angular-flavored voice would drift out of sync with it rather than adding value.
Cheapest test — Skim `docs/vibe-harness.html` and `docs/index.html`'s framing for one page; if a single paragraph from there could stand alone as the landing page's lede, the merge is viable — if it reads as internal/reference-y rather than introductory, it isn't.

### 10× smaller: the one-hour version
Pitch         — Don't design a page. Replace the two lines in `app.component.html` with: an `<h1>` real title, one sentence of what the repo is, and a small row of factual badges (Angular 14.2, Jest, Playwright, `.ai/` harness) pulled from files that already exist (`package.json`, `angular.json`). Hand-convert to `.scss` per the existing convention. No new routes, no new dependencies, no new components.
Must be true  — "Professionally looking" for this project can be satisfied by clean typography and accurate, minimal text — it doesn't require new sections, illustrations, or a component library.
Cheapest test — Time-box it: 45 minutes to write the HTML/SCSS by hand and run `npm start`. If it already looks acceptable at that point, anything beyond it is scope the question didn't ask for.

### Borrow: the dev-tool homepage shape
Pitch         — Borrow the shape used by OSS dev-tool sites (Vite, Astro, shadcn/ui): logo/wordmark, one-line tagline, a code/command snippet block (`npm start`, `npx ng generate component …`), a short "why this exists" paragraph, and a row of links (repo, docs, harness). No testimonials, no pricing — the "product" is the tooling itself, and the target reader is another engineer deciding whether to look further.
Must be true  — The most credible audience for this repo is engineers evaluating the harness/scaffold as a technique, not end users of an app — so a docs-homepage register reads as more professional here than a marketing register would.
Cheapest test — Mock the hero + snippet block only (no CSS polish) and check whether the command snippet you'd feature (`npm start`, or a `.ai/` command like `/ideate`) is actually representative of what a visitor would do next.

### Do nothing: what actually breaks?
Pitch         — Skip the landing page. Nothing in `angular.json`'s budgets, the test suite, or the harness gates depends on `AppComponent`'s markup being more than the default scaffold — no CI check, no stakeholder, no user is waiting on it.
Must be true  — There is no external audience who will judge the repo by `localhost:4200`'s home screen before reading `README`/`CLAUDE.md`/`docs/`, i.e. the audience this page would serve doesn't currently exist or already has a better entry point (`docs/index.html`).
Cheapest test — Ask: has anyone, ever, opened `ng serve` on this repo expecting a finished landing page rather than a scaffold? If the honest answer is "no, and no one will before this is asked for again," the null option is live.

## 3. Judge

**Shortlisted:**

1. **Invert's flip — the honest meta-page.** It wins over the obvious SaaS
   template because the template's core assumption (a credible visitor who
   might convert) doesn't hold for this repo, and a mismatch between glossy
   copy and an empty scaffold reads as *less* professional, not more, to the
   only audience that will realistically see it. This idea also absorbs the
   good part of "do nothing" — it's cheap — while still answering the actual
   ask instead of declining it.

2. **Borrow — the dev-tool homepage shape.** It gives the honest meta-page a
   concrete, well-worn visual register to imitate (hero + snippet + links)
   instead of inventing one from scratch, and it's the shape actually used by
   comparable projects (tooling/scaffolds, not consumer products), which is
   the strongest available proxy for "what does professional mean *for this
   kind of thing*."

**Why the obvious idea lost:** "professional" was read as "template-shaped,"
but the template's credibility depends on the page's claims being at least
plausibly true, and here they wouldn't be — a features grid for a project
with zero business logic is the failure mode Invert names directly, not a
hypothetical.

**Not shortlisted, but worth keeping in view:** the 10×-smaller version isn't
a competing direction — it's a scope control that applies to *either*
shortlisted idea (build the honest/dev-tool-shaped page small first, expand
only if it still looks thin).

## 4. Hand back

Pick one of:
- **Invert's flip** (honest meta-page) as-is,
- **Borrow** (dev-tool homepage shape) as-is,
- **combine** them (they compose naturally: Borrow supplies the layout,
  Invert's flip supplies the copy register — note per the ideate rules that
  this combination is itself a third idea and would want its own "must be
  true" written down before `/intake`), or
- **none of the above** — say what's missing from the frame.

Any of these, once picked, is valid input to `/intake`.
