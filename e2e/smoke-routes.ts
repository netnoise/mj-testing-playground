// Single list of routes e2e/smoke.spec.ts visits. This file is
// hand-maintained (a Playwright spec can't cheaply import the Angular
// routing module - it pulls in the whole component tree through esbuild's
// plain TS transform, no Angular compiler in the loop); src/app/smoke-
// routes.spec.ts is what keeps it honest against src/app/app-routing.
// module.ts's actual routes, so drift fails a fast unit test instead of
// shipping a smoke run that never visits the new route.
//
// docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md's own reproduction
// didn't name this gap - found while fixing the items it did name: smoke's
// route list (e2e/smoke.spec.ts) was a second, unchecked copy of the
// routing config, so "an empty list" (HARNESS.md's own warning) could
// happen to a *new* route rather than an existing check.
export const SMOKE_ROUTES = ['/', '/advanced-form'];
