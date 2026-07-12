import { test, expect } from '@playwright/test';

test.describe('Autonomic Telemetry and Live Data Stream', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display stream panel', async ({ page }) => {
    const streamLocator = page.locator('.metric-panel', { hasText: 'Live Math Binding Stream' });
    await expect(streamLocator).toBeVisible();
  });
});
