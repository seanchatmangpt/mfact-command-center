import { test, expect } from '@playwright/test';

test.describe('Navigation and Routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the brand name', async ({ page }) => {
    await expect(page.locator('.brand')).toHaveText('Autonomic SAFe');
  });

  test('should have all navigation tabs visible', async ({ page }) => {
    const tabs = [
      'Overview',
      'Lean Portfolio (LPM)',
      'Product Dev Flow',
      'RevOps/Turbulence',
      'DevOps/Polonius',
      'Math Topologies'
    ];

    for (const tab of tabs) {
      await expect(page.locator(`.nav-item:has-text("${tab}")`)).toBeVisible();
    }
  });

  test('should highlight the active tab and update the header title', async ({ page }) => {
    // Overview is active by default
    await expect(page.locator('.nav-item:has-text("Overview")')).toHaveClass(/active/);
    await expect(page.locator('h1')).toHaveText('Overview Command Center');

    // Click on Lean Portfolio (LPM)
    await page.click('.nav-item:has-text("Lean Portfolio (LPM)")');
    await expect(page.locator('.nav-item:has-text("Lean Portfolio (LPM)")')).toHaveClass(/active/);
    await expect(page.locator('h1')).toHaveText('Lean Portfolio (LPM) Command Center');

    // Click on Math Topologies
    await page.click('.nav-item:has-text("Math Topologies")');
    await expect(page.locator('.nav-item:has-text("Math Topologies")')).toHaveClass(/active/);
    await expect(page.locator('h1')).toHaveText('Math Topologies Command Center');
  });

  test('should show the engine status as active', async ({ page }) => {
    await expect(page.locator('text=Engine Status')).toBeVisible();
    await expect(page.locator('text=mfact-math-compat: Active')).toBeVisible();
    await expect(page.locator('.status-dot').first()).toBeVisible();
  });
});
