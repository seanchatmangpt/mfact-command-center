import { test, expect } from '@playwright/test';

test('Autonomic SAFe Workflow stabilization simulation', async ({ page }) => {
  await page.goto('/');

  // Ensure dashboard and sidebar loaded
  await expect(page.locator('.brand')).toHaveText('Autonomic SAFe');
  await expect(page.locator('text=Overview Command Center')).toBeVisible();

  // Verify the autonomic swarm simulation starts injecting events
  // The AutonomicSimulationManager should trigger events like 'Swarm optimization achieved', etc.
  const streamLocator = page.locator('.data-stream');
  await expect(streamLocator).toContainText(/optimization achieved|self-healing|latency resolved|consensus reached/, { timeout: 10000 });
  
  // Verify other bento cards are present
  await expect(page.locator('text=Workflow Multifractal D(q)')).toBeVisible();
  await expect(page.locator('text=Live Math Binding Stream')).toBeVisible();
});
