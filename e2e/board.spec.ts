import { test, expect, type Page } from '@playwright/test';

// Every locator is by role and accessible name, and every click is a real pointer click: `deep`
// runs against the production build (playwright.config.ts's HARNESS_DEEP branch), so there is no
// dev-server overlay to work around.
const INCIDENT_COUNT = 12;
const CRITICAL_COUNT = 3;

test('filters by severity and shows the details of a clicked incident', async ({ page }) => {
  await page.goto('/board');
  await expect(page.getByRole('heading', { level: 1, name: 'Incident Board' })).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(INCIDENT_COUNT + 1);

  await page.getByRole('button', { name: /^Critical/ }).click();
  await expect(page.getByRole('row')).toHaveCount(CRITICAL_COUNT + 1);

  await page.getByRole('button', { name: 'INC-2891' }).click();
  const details = page.getByRole('complementary', { name: 'Incident details' });
  await expect(details.getByRole('heading', { level: 2, name: 'INC-2891' })).toBeVisible();
  await expect(details).toContainText('Critical');
});

test('is operable by keyboard alone, with a visible focus indicator', async ({ page }) => {
  await page.goto('/board');

  await page.keyboard.press('Tab');
  const allFilter = page.getByRole('button', { name: /^All/ });
  await expect(allFilter).toBeFocused();
  await expect(allFilter).toHaveCSS('outline-style', 'solid');
  await expect(allFilter).toHaveCSS('outline-width', '2px');

  // Three more filters, then the first row's button.
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
  }
  const firstRow = page.getByRole('button', { name: 'INC-2891' });
  await expect(firstRow).toBeFocused();
  await expect(firstRow).toHaveCSS('outline-style', 'solid');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('complementary', { name: 'Incident details' }).getByRole('heading', { level: 2 })).toHaveText('INC-2891');
});

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  return errors;
}

test.describe('non-happy states are reachable by URL and raise no errors', () => {
  test('loading', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/board?scenario=loading');
    await expect(page.getByRole('status')).toHaveText('Loading incidents…');
    await expect(page.getByRole('table')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('empty', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/board?scenario=empty');
    await expect(page.getByRole('status')).toHaveText('No incidents right now.');
    await expect(page.getByRole('table')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('failed', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/board?scenario=failed');
    await expect(page.getByRole('alert')).toContainText('Could not load incidents');
    await expect(page.getByRole('table')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('stale keeps the table and says how old it is', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/board?scenario=stale');
    await expect(page.getByRole('status')).toContainText('last updated 14m ago');
    await expect(page.getByRole('row')).toHaveCount(INCIDENT_COUNT + 1);
    expect(errors).toEqual([]);
  });
});
