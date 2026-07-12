import { test, expect } from '@playwright/test';

test.describe('Dashboard Metrics and Bento Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display all top-level metrics', async ({ page }) => {
    const workflowCard = page.locator('.metric-panel', { hasText: 'Workflow Multifractal D(q)' });
    await expect(workflowCard).toBeVisible();
    await expect(workflowCard.locator('.metric-value')).toHaveText('1.492031');
    await expect(workflowCard).toContainText('BOUND: STRUCTURALLY_MAINTAINED');

    const revOpsCard = page.locator('.metric-panel', { hasText: 'RevOps Handoff Friction' });
    await expect(revOpsCard).toBeVisible();
    await expect(revOpsCard.locator('.metric-value')).toHaveText('4.218%');
    await expect(revOpsCard).toContainText('LIMIT: SUB-KOLMOGOROV_ENGAGED');

    const artCard = page.locator('.metric-panel', { hasText: 'Active ART Modularity' });
    await expect(artCard).toBeVisible();
    await expect(artCard.locator('.metric-value')).toHaveText('0.8901');
    await expect(artCard).toContainText('GRAPH: WEIGHTED_RANDOM_NETWORK');
  });

  test('should display Live Topological Fracture Boundaries', async ({ page }) => {
    const topologyCard = page.locator('.metric-panel', { hasText: 'Topological Fracture Boundaries' });
    await expect(topologyCard).toBeVisible();
    await expect(topologyCard).toContainText('RUST_EXEC_SPACE');
    await expect(topologyCard).toContainText('LEAN4_PROVEN');
  });
});
