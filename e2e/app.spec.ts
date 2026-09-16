import { test, expect } from '@playwright/test';

test('should display the app shell and land on the advanced form', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.app-header h1')).toHaveText('mj-testing-playground');
  await expect(page).toHaveURL(/\/advanced-form$/);
  await expect(page.getByRole('heading', { name: 'Advanced Form' })).toBeVisible();
});

test('shows a validation error for an invalid username', async ({ page }) => {
  await page.goto('/advanced-form');

  await page.getByLabel('Username').fill('ab');
  await page.getByLabel('Username').blur();

  await expect(page.getByText('Must be at least 3 characters.')).toBeVisible();
});

test('fills out and submits the form successfully', async ({ page }) => {
  await page.goto('/advanced-form');

  await page.getByLabel('Username').fill('e2euser1');
  await page.locator('#email').fill('e2e@example.com');
  await page.getByLabel('Age').fill('30');
  await page.getByLabel('Password', { exact: true }).fill('Password1');
  await page.getByLabel('Confirm password').fill('Password1');
  await page.getByLabel('Country').selectOption('Canada');
  await page.getByLabel('Street').fill('123 Main St');
  await page.getByLabel('City').fill('Springfield');
  await page.getByLabel('Postal code').fill('12345');
  await page.getByPlaceholder('Skill').fill('Testing');

  await expect(page.getByText('Checking availability…')).not.toBeVisible();

  // ng serve's live-reload client injects a full-viewport, max-z-index
  // iframe that intercepts every real pointer click under the dev server -
  // not app content, so dispatch the click via the DOM directly instead of
  // simulating a mouse event that the iframe would swallow.
  await page.getByRole('button', { name: 'Submit' }).evaluate((el: HTMLElement) => el.click());

  await expect(page.locator('.submitted-value')).toBeVisible();
  await expect(page.locator('.submitted-value')).toContainText('e2euser1');
  await expect(page.getByText('Please fix the errors above before submitting.')).not.toBeVisible();
});
