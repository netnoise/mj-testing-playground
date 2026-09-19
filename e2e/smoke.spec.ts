import { test, expect, type Page } from '@playwright/test';
import { SMOKE_ROUTES as ROUTES } from './smoke-routes';

// Generic runtime smoke, not a feature spec. docs/reviews/harness-v4.2-
// implementation-audit-2026-09-08.md 1.2/§1.2: app.spec.ts is entirely the
// "feature-driving spec" shape - it asserts on copy and breaks on any
// wording change. This is the other shape: does the app actually run, for
// every route, independent of what the copy says. It should break only
// when the app is genuinely broken, and it's meant to sit in verify.sh's
// `smoke` tier so it can catch a runtime contradiction inside the fix loop,
// not just once at hand-back in `deep`.
//
// Deliberately asserts NOTHING about text content. If this spec needs to
// change because a heading's wording changed, it has drifted from its job.
//
// ROUTES now lives in ./smoke-routes.ts, checked against the Angular
// routing module by src/app/smoke-routes.spec.ts - see that file's header.

function trackErrors(page: Page) {
  const pageErrors: Error[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  return { pageErrors, consoleErrors };
}

for (const route of ROUTES) {
  test(`${route} mounts with no uncaught error and a non-empty root`, async ({ page }) => {
    const { pageErrors, consoleErrors } = trackErrors(page);

    const response = await page.goto(route);
    expect(response?.ok()).toBeTruthy();

    // Angular has bootstrapped: app-root has rendered something.
    await expect(page.locator('app-root')).not.toBeEmpty();

    // No horizontal overflow - the cheapest, broadest layout-breakage signal.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflow).toBe(false);

    expect(pageErrors, `uncaught page errors on ${route}: ${pageErrors.map((e) => e.message).join('; ')}`).toHaveLength(0);
    expect(consoleErrors, `console errors on ${route}: ${consoleErrors.join('; ')}`).toHaveLength(0);
  });
}
