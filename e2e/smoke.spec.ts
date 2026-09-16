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

test('a plain (non-forced, non-evaluate) click reaches the submit button', async ({ page }) => {
  // decision 0005's live-reload iframe (ng serve's dev client, full-viewport,
  // max z-index) intercepted every real pointer click and forced
  // e2e/app.spec.ts to dispatch clicks via el.click() instead of a real
  // mouse event. That workaround is a property of the DEV server, not the
  // app - this spec runs against the built artifact (verify.sh smoke/deep
  // point HARNESS_DEEP's webServer at e2e/serve-dist.mjs, not `ng serve`),
  // so a real Playwright .click() should land with no iframe involved.
  await page.goto('/advanced-form');
  const submit = page.getByRole('button', { name: 'Submit' });
  await expect(submit).toBeVisible();
  await submit.click();
  // No assertion on the result of the click - a real invalid/empty form is
  // expected to show validation errors, not submit. The point is only that
  // the click itself reached the button without being swallowed by an
  // intercepting overlay - see app.spec.ts for the full submit flow.
});
