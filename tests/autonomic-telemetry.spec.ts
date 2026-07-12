import { test, expect } from '@playwright/test';

test.describe('Autonomic Telemetry and Live Data Stream', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display initial hardcoded math binding stream items', async ({ page }) => {
    const streamLocator = page.locator('.data-stream');
    await expect(streamLocator).toBeVisible();

    // Initial items
    await expect(streamLocator).toContainText('Funding RegionAbstraction validated');
    await expect(streamLocator).toContainText('Sub-Kolmogorov intermittency detected');
    await expect(streamLocator).toContainText('Weighted random network modularity computed');
  });

  test('should simulate autonomic swarm events arriving periodically', async ({ page }) => {
    const streamLocator = page.locator('.data-stream');

    // The AutonomicSimulationManager triggers a pulse initially, and then every 3 seconds
    // Wait for one of the random autonomic messages to appear
    await expect(streamLocator).toContainText(/optimization achieved|self-healing|latency resolved|consensus reached/, { timeout: 5000 });

    // Verify it limits to 5 items maximum in the stream
    // We can wait a bit longer to let it accumulate, but playright test shouldn't be too slow
    // 5 seconds should give at least 2 events (initial + 3s).
    await page.waitForTimeout(4000);
    const itemsCount = await page.locator('.stream-item').count();
    expect(itemsCount).toBeLessThanOrEqual(5);
  });

  test('should properly style stream items based on status', async ({ page }) => {
    // Initial critical item should have the correct class
    const criticalItem = page.locator('.stream-item.critical').first();
    await expect(criticalItem).toBeVisible();
    await expect(criticalItem).toContainText('Sub-Kolmogorov intermittency detected');

    // Initial ok item
    const okItem = page.locator('.stream-item.ok').first();
    await expect(okItem).toBeVisible();
  });
});
