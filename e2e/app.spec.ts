import { test, expect } from '@playwright/test';

test('should display welcome message', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('mj-testing-playground app is running!')).toBeVisible();
});

test('selecting a brand shows that brand\'s models', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Select a brand to see its models.')).toBeVisible();

  await page.getByLabel('Brand').selectOption('Toyota');

  await expect(page.getByText('Corolla')).toBeVisible();
  await expect(page.getByText('Select a brand to see its models.')).not.toBeVisible();
});
