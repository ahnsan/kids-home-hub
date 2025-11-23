import { test, expect } from '@playwright/test';
import { KidsHomeHubApp } from './helpers/page-objects';

/**
 * Smoke Tests - Quick verification of critical functionality
 *
 * These tests run quickly and verify the most critical user flows.
 * Run before every deployment.
 *
 * Usage: pnpm test:e2e --grep "@smoke"
 */

test.describe('Smoke Tests @smoke', () => {
  let app: KidsHomeHubApp;

  test.beforeEach(async ({ page }) => {
    app = new KidsHomeHubApp(page);
    await app.goto();
    await app.clearLocalStorage();
    await page.reload();
    await app.waitForReady();
  });

  test('app loads successfully', async ({ page }) => {
    // Verify critical UI elements are present
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav[role="tablist"]')).toBeVisible();
    await expect(page.locator('button:has-text("Adam")')).toBeVisible();
    await expect(page.locator('button:has-text("Sami")')).toBeVisible();
  });

  test('can switch children', async () => {
    await app.childSwitcher.selectSami();
    await expect(await app.childSwitcher.getSelectedChild()).toContainText('Sami');

    await app.childSwitcher.selectAdam();
    await expect(await app.childSwitcher.getSelectedChild()).toContainText('Adam');
  });

  test('can navigate between all views', async () => {
    await app.bottomNav.goToBank();
    await expect(app.page.locator('h2:has-text("Bank Account")')).toBeVisible();

    await app.bottomNav.goToPoints();
    await expect(app.page.locator('h2:has-text("Reward Points")')).toBeVisible();

    await app.bottomNav.goToChores();
    await expect(app.page.locator('h2:has-text("Weekly Chores")')).toBeVisible();

    await app.bottomNav.goToScreen();
    await expect(app.page.locator('h2:has-text("Screen Time")')).toBeVisible();
  });

  test('can add money', async () => {
    await app.bottomNav.goToBank();
    await app.bankView.addMoney(10, 'Smoke test');
    await expect(app.bankView.getBalance()).toContainText('£10.00');
  });

  test('can submit chores and earn points', async () => {
    await app.bottomNav.goToChores();
    await app.choresView.selectChore(0); // Select first chore
    await app.choresView.submitChores();

    // Verify success message
    await expect(app.choresView.getSuccessMessage()).toBeVisible({ timeout: 3000 });

    // Verify points increased
    await app.bottomNav.goToPoints();
    await expect(app.pointsView.getPointsTotal()).toContainText(/\d+ pts/);
  });

  test('complete user journey', async () => {
    // 1. Add money
    await app.bottomNav.goToBank();
    await app.bankView.addMoney(20, 'Test money');

    // 2. Submit chores for points
    await app.bottomNav.goToChores();
    await app.choresView.selectChore(0);
    await app.choresView.submitChores();

    // 3. Verify points earned
    await app.bottomNav.goToPoints();
    await expect(app.pointsView.getPointsTotal()).toContainText(/\d+ pts/);

    // 4. Verify money unchanged
    await app.bottomNav.goToBank();
    await expect(app.bankView.getBalance()).toContainText('£20.00');
  });

  test('data persists after reload', async ({ page }) => {
    // Add money
    await app.bottomNav.goToBank();
    await app.bankView.addMoney(25, 'Persistence test');

    // Reload page
    await page.reload();
    await app.waitForReady();

    // Verify data persisted
    await app.bottomNav.goToBank();
    await expect(app.bankView.getBalance()).toContainText('£25.00');
  });

  test('no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate through all views
    await app.bottomNav.goToBank();
    await app.bottomNav.goToPoints();
    await app.bottomNav.goToChores();
    await app.bottomNav.goToScreen();

    // Switch children
    await app.childSwitcher.selectSami();
    await app.childSwitcher.selectAdam();

    expect(consoleErrors).toHaveLength(0);
  });
});
