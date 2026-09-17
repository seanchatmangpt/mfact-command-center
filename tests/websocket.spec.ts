import { test, expect } from '@playwright/test';
import { WebSocketServer } from 'ws';

let wss: WebSocketServer;

test.beforeAll(async () => {
  wss = new WebSocketServer({ port: 3030 });
  wss.on('connection', (ws) => {
    // Seed data from Axum websocket fixture
    const payload = {
        source: "prop_thermo3.lean",
        event: "Manufactures.step",
        thermodynamic_state: {
            S: "entropy_value",
            G: "capability_gradient",
            F_S_G: true
        }
    };
    // Give it a tiny bit of time to connect
    setTimeout(() => {
        ws.send(JSON.stringify(payload));
    }, 500);
  });
});

test.afterAll(async () => {
  wss.close();
});

test('verify seeded data from Axum WebSocket is rendering perfectly', async ({ page }) => {
  await page.goto('/');

  // Check connection status
  await expect(page.locator('[data-testid="status"]')).toContainText('Connected');

  // Verify the data card table body exists
  const dataCard = page.locator('[data-testid="data-card"]');
  await expect(dataCard).toBeVisible();

  // Verify the specific seeded data is rendered
  await expect(dataCard).toContainText('Manufactures.step');
  await expect(dataCard).toContainText('prop_thermo3.lean');
  await expect(dataCard).toContainText('entropy_value');
  await expect(dataCard).toContainText('capability_gradient');
});
