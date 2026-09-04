# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Angular CLI 9.1 application (`mj-testing-playground`). The codebase is currently a near-default `ng new` scaffold: a single root `AppComponent`, an empty `AppRoutingModule` (`routes: Routes = []`), and no business logic yet. Treat new feature work as adding the first real code — generate via `ng generate` rather than building parallel structures.

## Commands

All commands run via the local Angular CLI (`npx ng …` or the npm scripts below).

- `npm start` — dev server at http://localhost:4200/ (alias for `ng serve`).
- `npm run build` — production-capable build to `dist/mj-testing-playground/`. Add `--prod` for the optimized configuration (AOT, hashing, budgets enforced: 2mb/5mb initial, 6kb/10kb per component style).
- `npm test` — Karma + Jasmine in watch mode (Chrome). `singleRun: false` by default; for CI use `npx ng test --watch=false --browsers=ChromeHeadless`.
- Run a single test file: `npx ng test --include='**/app.component.spec.ts'`. To focus a single spec, use Jasmine's `fdescribe` / `fit` in the spec.
- `npm run lint` — TSLint over `tsconfig.app.json`, `tsconfig.spec.json`, and `e2e/tsconfig.json`.
- `npm run e2e` — Protractor against a freshly-served app (`ng serve` is started automatically).
- Scaffolding: `npx ng generate component <name>` (and `directive|pipe|service|class|guard|interface|enum|module`).

## Conventions enforced by tooling

These come from `tslint.json` / `angular.json` and will fail lint/build if violated — follow them when generating code:

- **Selectors**: components use element selectors with prefix `app-` in **kebab-case** (e.g. `app-foo-bar`); directives use attribute selectors with prefix `app` in **camelCase**.
- **Component styles**: SASS (`.sass`, indented syntax — not SCSS). `ng generate component` is configured to emit `.sass` files; the global stylesheet is `src/styles.sass`.
- **TS style**: single quotes, semicolons required, 140-char max line, member ordering `static-field → instance-field → static-method → instance-method`, `no-non-null-assertion`, `no-console` (except `log`/`warn`/`error`).
- **TypeScript target**: `es2015` with `lib: [es2018, dom]`; Angular compiler runs `fullTemplateTypeCheck` and `strictInjectionParameters`.
- **RxJS**: importing from `rxjs/Rx` is blacklisted — import from `rxjs` / `rxjs/operators`.

## Layout notes

- `src/app/` — root module (`AppModule`), root component (`AppComponent`), routing module. New features should be added here (or as feature modules imported by `AppModule`).
- `src/environments/` — `environment.ts` is replaced by `environment.prod.ts` in the production build via `fileReplacements` in `angular.json`.
- `e2e/` — Protractor specs (`*.e2e-spec.ts`) and page objects (`*.po.ts`); has its own `tsconfig.json`.
- `tsconfig.app.json` (app build) and `tsconfig.spec.json` (Karma) both extend the root `tsconfig.json`.

## The .ai harness

This repo uses the `.ai` harness. Read `.ai/HARNESS.md` before any non-trivial
change, and follow it. Structure and invariants live in `.ai/MODEL.md`; runnable
prompts in `.ai/prompts/`; the design write-up in `docs/vibe-harness.html`.

The gate is `bash .ai/harness/verify.sh [fast|full|deep]` — it is the only gate
contract. `deep` does not prove the app boots; there is no runtime oracle yet.

This file remains the single owner of build commands and code conventions.
Nothing in `.ai/` restates them.
