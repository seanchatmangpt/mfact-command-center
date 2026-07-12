import { test, expect } from '@playwright/test';

test.describe('Dashboard Metrics and Bento Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display all top-level metrics', async ({ page }) => {
    // Workflow Multifractal D(q)
    const workflowCard = page.locator('.bento-card', { hasText: 'Workflow Multifractal D(q)' });
    await expect(workflowCard).toBeVisible();
    await expect(workflowCard.locator('.metric-value')).toHaveText('1.492');
    await expect(workflowCard).toContainText('Bound structurally maintained');

    // RevOps Handoff Friction
    const revOpsCard = page.locator('.bento-card', { hasText: 'RevOps Handoff Friction' });
    await expect(revOpsCard).toBeVisible();
    await expect(revOpsCard.locator('.metric-value')).toHaveText('4.2%');
    await expect(revOpsCard).toContainText('Sub-Kolmogorov limits engaged');

    // Active ART Modularity
    const artCard = page.locator('.bento-card', { hasText: 'Active ART Modularity' });
    await expect(artCard).toBeVisible();
    await expect(artCard.locator('.metric-value')).toHaveText('0.89');
    await expect(artCard).toContainText('Weighted random network scaling');
  });

  test('should display Live Topological Fracture Boundaries', async ({ page }) => {
    const topologyCard = page.locator('.bento-card', { hasText: 'Live Topological Fracture Boundaries' });
    await expect(topologyCard).toBeVisible();
    await expect(topologyCard.locator('.topology-visual')).toBeVisible();
    await expect(topologyCard).toContainText('Rust Execution Space');
    await expect(topologyCard).toContainText('Lean 4 Proven Constraints');
  });

  test('should render SVG icons in metrics headers', async ({ page }) => {
    const workflowCard = page.locator('.bento-card', { hasText: 'Workflow Multifractal D(q)' });
    await expect(workflowCard.locator('svg')).toBeVisible();

    const revOpsCard = page.locator('.bento-card', { hasText: 'RevOps Handoff Friction' });
    await expect(revOpsCard.locator('svg')).toBeVisible();

    const artCard = page.locator('.bento-card', { hasText: 'Active ART Modularity' });
    await expect(artCard.locator('svg')).toBeVisible();
  });
});
