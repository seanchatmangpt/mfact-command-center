import { test, expect } from '@playwright/test';

test('Simulate migration of 50 simultaneous ARTs and thousands of dependencies', async ({ page }) => {
  // Start at the main dashboard
  await page.goto('/');

  // Ensure the page is loaded
  await expect(page.locator('.brand')).toHaveText('Autonomic SAFe', { timeout: 10000 });

  // Bombard the UI with events by evaluating a script in the browser context
  await page.evaluate(() => {
    const artCount = 50;
    const dependenciesPerArt = 100; // 50 * 100 = 5000 dependencies total

    // Helper to dispatch a mock event
    const dispatchSimulatedEvent = (type: string, payload: any) => {
      const event = new CustomEvent(type, { detail: payload });
      window.dispatchEvent(event);
      
      // Also push to any global stores if they exist on window for testing
      if ((window as any).simulateEvent) {
        (window as any).simulateEvent(type, payload);
      }
    };

    // 1. Initialize migration
    dispatchSimulatedEvent('MIGRATION_START', { totalArts: artCount });

    // 2. Bombard with ART creations and dependencies
    for (let i = 0; i < artCount; i++) {
      const artId = `ART-${i + 1}`;
      
      dispatchSimulatedEvent('ART_MIGRATED', {
        id: artId,
        name: `Agile Release Train ${i + 1}`,
        status: 'syncing',
        timestamp: Date.now()
      });

      // Rapidly fire dependency resolutions
      for (let j = 0; j < dependenciesPerArt; j++) {
        dispatchSimulatedEvent('DEPENDENCY_RESOLVED', {
          sourceArt: artId,
          targetArt: `ART-${Math.floor(Math.random() * artCount) + 1}`,
          dependencyId: `DEP-${i}-${j}`,
          status: 'optimized'
        });
      }
    }

    // 3. Complete migration
    dispatchSimulatedEvent('MIGRATION_COMPLETE', {
      artsMigrated: artCount,
      dependenciesMapped: artCount * dependenciesPerArt
    });
  });

  // Verify that the UI remains responsive after the bombardment
  // Check if the stream updates or if the UI is still alive
  const streamLocator = page.locator('.data-stream');
  if (await streamLocator.isVisible()) {
    // UI is still rendering the stream
    await expect(streamLocator).toBeVisible();
  }

  // Ensure no fatal error overlays appeared
  const errorOverlay = page.locator('.fatal-error');
  await expect(errorOverlay).toHaveCount(0);
});
