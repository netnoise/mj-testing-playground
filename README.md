# MjTestingPlayground

This project runs on [Angular CLI](https://github.com/angular/angular-cli) 14.2. `CLAUDE.md` is the source of truth for build, test, and lint commands; the notes below are a quick orientation.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npm run build` to build the project into `dist/`. The production configuration (AOT, output hashing, bundle budgets) is the default in Angular 14 — there is no `--prod` flag.

## Running unit tests

Run `npm test` to execute the unit tests via [Jest](https://jestjs.io/) (using [jest-preset-angular](https://github.com/thymikee/jest-preset-angular)). `npm run test:watch` and `npm run test:coverage` are also available.

## Running end-to-end tests

Run `npm run e2e` to execute the end-to-end tests via [Playwright](https://playwright.dev/), which serves the app automatically. `npm run e2e:ui` opens Playwright's interactive UI.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## AI harness

This repo carries a small, portable harness for working with coding agents:
plain markdown plus four shell scripts, no dependencies.

- `docs/vibe-harness.html` — the design, and why each piece exists
- `.ai/HARNESS.md` — the one-page rules an agent reads
- `.ai/harness/verify.sh [fast|full|deep]` — the only gate contract

## Testing

- `docs/testing-techniques.md` — a catalog of testing techniques, each with a
  verdict for this repo (including the ones that don't apply, and why)
- `docs/testing-roadmap.md` — the phased plan for adopting them

It is tool-agnostic: `CLAUDE.md` and `AGENTS.md` are three-line pointers at
`.ai/`, so switching agents is a one-file change.
