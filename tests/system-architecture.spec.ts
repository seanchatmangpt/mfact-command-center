import { test, expect } from '@playwright/test';

test.describe('System Architecture Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display System Architecture (Combinatorial Maximalism) card', async ({ page }) => {
    const architectureCard = page.locator('.bento-card', { hasText: 'System Architecture (Combinatorial Maximalism)' });
    await expect(architectureCard).toBeVisible();

    // Check SAFe Entities column
    await expect(architectureCard).toContainText('SAFe Entities');
    await expect(architectureCard.locator('ul').nth(0)).toContainText('Lean Portfolio Management');
    await expect(architectureCard.locator('ul').nth(0)).toContainText('Product Development Flow');
    await expect(architectureCard.locator('ul').nth(0)).toContainText('Team & Technical Agility');

    // Check Mathematical Verification column
    await expect(architectureCard).toContainText('Mathematical Verification');
    await expect(architectureCard.locator('ul').nth(1)).toContainText('500+ generated Rust RegionAbstractions');
    await expect(architectureCard.locator('ul').nth(1)).toContainText('Polonius Symbolic Semantics Enforced');
    await expect(architectureCard.locator('ul').nth(1)).toContainText('Aeneas Backward Function Soundness');
  });
});
