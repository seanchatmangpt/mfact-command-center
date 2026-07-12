import { test, expect } from '@playwright/test';

test.describe('Navigation and Routing', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    await page.goto('/');
  });

  test('should display the brand name', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('MFACT // Autonomic SAFe');
  });

  test('should have all navigation tabs visible', async ({ page }) => {
    const tabs = [
      '[OVERVIEW] SYS.OVERVIEW',
      '[LPM] LEAN.PORTFOLIO.MGT',
      '[FLOW] PRODUCT.DEV.FLOW',
      '[REVOPS] REVOPS.TURBULENCE',
      '[DEVOPS] DEVOPS.POLONIUS',
      '[TOPOLOGY] MATH.TOPOLOGIES',
      '[UNRDF] UNRDF.SEMANTICS',
      '[WARGAMES] WARGAMES.SIM',
      '[PEERS] PEER.DISCOVERY',
      '[PAPERS] RESEARCH.PAPERS',
    ];

    for (const tab of tabs) {
      await expect(page.locator(`.nav-item:has-text("${tab}")`)).toBeVisible();
    }
  });

  test('should highlight the active tab and update the header title', async ({ page }) => {
    // Overview is active by default
    await expect(page.locator('.nav-item:has-text("[OVERVIEW] SYS.OVERVIEW")')).toHaveClass(/active/);
    await expect(page.locator('.header-title')).toContainText('OVERVIEW');

    // Click on LPM
    await page.click('.nav-item:has-text("[LPM] LEAN.PORTFOLIO.MGT")');
    await expect(page.locator('.nav-item:has-text("[LPM] LEAN.PORTFOLIO.MGT")')).toHaveClass(/active/);
    await expect(page.locator('.header-title')).toContainText('LPM');
  });

  test('should show the engine status as active', async ({ page }) => {
    await expect(page.locator('text=KERNEL STATUS')).toBeVisible();
    await expect(page.locator('text=ACTIVE / SUB-KOLMOGOROV')).toBeVisible();
  });
});
