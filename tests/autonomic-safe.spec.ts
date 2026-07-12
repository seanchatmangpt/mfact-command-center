import { test, expect } from '@playwright/test';

test('Autonomic SAFe Workflow stabilization simulation', async ({ page }) => {
  await page.goto('/');

  // Ensure dashboard and sidebar loaded
  await expect(page.locator('h1')).toHaveText('MFACT // Autonomic SAFe');
  await expect(page.locator('.header-title')).toContainText('OVERVIEW');

  // Verify other panels are present
  await expect(page.locator('text=Workflow Multifractal D(q)')).toBeVisible();
  await expect(page.locator('text=Live Math Binding Stream')).toBeVisible();
});
