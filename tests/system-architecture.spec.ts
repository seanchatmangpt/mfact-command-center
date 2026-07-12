import { test, expect } from '@playwright/test';

test.describe('System Architecture Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the header and active status', async ({ page }) => {
    await expect(page.locator('.header')).toContainText('LIVE TELEMETRY ACTIVE');
    await expect(page.locator('.pulse').first()).toBeVisible();
  });
});
