import { test, expect, type Page } from '@playwright/test';

// Real pointer clicks against the production build, and no sleeps: each expectation polls until the
// state it names appears. The optimistic state is asserted first because the fake answers after a
// fixed delay (ACK_DELAY_MS), so it is on screen when the first poll runs.
async function acknowledgeFirstIncident(page: Page) {
  await page.getByRole('button', { name: 'INC-2891' }).click();
  await page.getByRole('complementary', { name: 'Incident details' }).getByRole('button', { name: 'Acknowledge' }).click();
}

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  return errors;
}

test('acknowledging a live incident shows it as acknowledged, with no error', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/board');

  await acknowledgeFirstIncident(page);

  await expect(page.getByRole('row').filter({ hasText: 'INC-2891' })).toContainText('ACKED');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a failed acknowledgement is rolled back and reported', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/board?scenario=ack-failed');
  const row = page.getByRole('row').filter({ hasText: 'INC-2891' });

  await acknowledgeFirstIncident(page);
  await expect(row).toContainText('ACKED');

  await expect(page.getByRole('alert')).toContainText('INC-2891');
  await expect(row).toContainText('LIVE');
  await expect(page.getByRole('complementary', { name: 'Incident details' }).getByRole('button', { name: 'Acknowledge' })).toBeVisible();
  expect(errors).toEqual([]);
});
