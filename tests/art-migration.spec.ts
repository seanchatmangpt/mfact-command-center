import { test, expect } from '@playwright/test';

test('Simulate migration of 50 simultaneous ARTs', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('MFACT // Autonomic SAFe', { timeout: 10000 });
  await expect(page.locator('.metric-panel', { hasText: 'Workflow Multifractal D(q)' })).toBeVisible();
});
