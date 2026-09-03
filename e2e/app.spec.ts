import { test, expect } from '@playwright/test';

test('should display welcome message', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('mj-testing-playground app is running!')).toBeVisible();
});
