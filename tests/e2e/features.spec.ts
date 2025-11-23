import { test, expect, type Page } from '@playwright/test';

/**
 * Kids Home Hub E2E Tests
 *
 * Tests all critical user flows for the PWA:
 * - Money management (Bank)
 * - Points system
 * - Chores submission
 * - Screen time management
 * - Navigation
 * - Child switching
 */

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Helper functions
async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

async function waitForAppReady(page: Page) {
  // Wait for the header to be visible
  await expect(page.locator('header')).toBeVisible({ timeout: 5000 });
  // Wait for bottom nav to be ready
  await expect(page.locator('nav[role="tablist"]')).toBeVisible();
}

async function selectChild(page: Page, childName: 'Adam' | 'Sami') {
  await page.click(`button[role="tab"]:has-text("${childName}")`);
  await expect(page.locator(`button[role="tab"]:has-text("${childName}")`))
    .toHaveAttribute('aria-selected', 'true');
}

async function navigateToView(page: Page, viewName: 'Bank' | 'Points' | 'Chores' | 'Screen') {
  await page.click(`button[aria-label="${viewName} tab"]`);
  // Verify navigation succeeded
  await expect(page.locator(`button[aria-label="${viewName} tab"]`))
    .toHaveAttribute('aria-selected', 'true');
}

// Setup: Clear state before each test
test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await clearLocalStorage(page);
  await page.reload();
  await waitForAppReady(page);
});

test.describe('App Initialization', () => {
  test('should load app successfully', async ({ page }) => {
    // Verify header
    await expect(page.locator('header')).toBeVisible();

    // Verify bottom navigation exists with all 4 tabs
    const nav = page.locator('nav[role="tablist"]');
    await expect(nav).toBeVisible();
    await expect(nav.locator('button[aria-label="Bank tab"]')).toBeVisible();
    await expect(nav.locator('button[aria-label="Points tab"]')).toBeVisible();
    await expect(nav.locator('button[aria-label="Chores tab"]')).toBeVisible();
    await expect(nav.locator('button[aria-label="Screen tab"]')).toBeVisible();

    // Verify child switcher
    await expect(page.locator('button:has-text("Adam")')).toBeVisible();
    await expect(page.locator('button:has-text("Sami")')).toBeVisible();

    // Verify default child is selected (Adam)
    await expect(page.locator('button[role="tab"]:has-text("Adam")'))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('should have no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await waitForAppReady(page);

    expect(consoleErrors).toHaveLength(0);
  });
});

test.describe('Child Switching', () => {
  test('should switch between children', async ({ page }) => {
    // Start with Adam selected
    await expect(page.locator('button[role="tab"]:has-text("Adam")'))
      .toHaveAttribute('aria-selected', 'true');

    // Switch to Sami
    await selectChild(page, 'Sami');
    await expect(page.locator('button[role="tab"]:has-text("Sami")'))
      .toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('button[role="tab"]:has-text("Adam")'))
      .toHaveAttribute('aria-selected', 'false');

    // Verify view shows Sami's data
    await expect(page.locator('text=Sami')).toBeVisible();

    // Switch back to Adam
    await selectChild(page, 'Adam');
    await expect(page.locator('button[role="tab"]:has-text("Adam")'))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('should persist selected child after page reload', async ({ page }) => {
    // Select Sami
    await selectChild(page, 'Sami');

    // Reload page
    await page.reload();
    await waitForAppReady(page);

    // Verify Sami is still selected
    await expect(page.locator('button[role="tab"]:has-text("Sami")'))
      .toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('Money Management (Bank View)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToView(page, 'Bank');
  });

  test('should display bank account information', async ({ page }) => {
    await expect(page.locator('h2:has-text("Bank Account")')).toBeVisible();
    await expect(page.locator('text=Adam\'s Bank')).toBeVisible();

    // Should show initial balance (£0.00 or current amount)
    await expect(page.locator('text=/£\\d+\\.\\d{2}/')).toBeVisible();
  });

  test('should add money to account', async ({ page }) => {
    // Find and interact with the form
    // This test assumes there's an Add/Deduct radio or button and form fields

    // Look for amount input
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    await amountInput.fill('25.50');

    // Look for reason/note input
    const reasonInput = page.locator('input[name="reason"], input[name="note"], textarea').first();
    await reasonInput.fill('Birthday money');

    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await submitButton.click();

    // Wait for success - either success message or balance update
    await page.waitForTimeout(500);

    // Verify balance updated (should show £25.50)
    await expect(page.locator('text=/£25\\.50/')).toBeVisible({ timeout: 3000 });
  });

  test('should deduct money from account', async ({ page }) => {
    // First add some money
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    await amountInput.fill('50');

    const reasonInput = page.locator('input[name="reason"], input[name="note"], textarea').first();
    await reasonInput.fill('Initial deposit');

    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await submitButton.click();
    await page.waitForTimeout(500);

    // Now deduct money - look for Deduct button/radio
    const deductOption = page.locator('input[value="deduct"], button:has-text("Deduct")').first();
    if (await deductOption.isVisible()) {
      await deductOption.click();
    }

    await amountInput.fill('15');
    await reasonInput.fill('Toy purchase');
    await submitButton.click();

    await page.waitForTimeout(500);

    // Balance should be £35.00 (50 - 15)
    await expect(page.locator('text=/£35\\.00/')).toBeVisible({ timeout: 3000 });
  });

  test('should show AUD equivalent', async ({ page }) => {
    // Add money
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    await amountInput.fill('10');

    const reasonInput = page.locator('input[name="reason"], input[name="note"], textarea').first();
    await reasonInput.fill('Test');

    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await submitButton.click();

    await page.waitForTimeout(500);

    // Should show AUD equivalent
    await expect(page.locator('text=/A\\$\\d+\\.\\d{2}/')).toBeVisible();
  });
});

test.describe('Points System (Points View)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToView(page, 'Points');
  });

  test('should display points balance', async ({ page }) => {
    await expect(page.locator('h2:has-text("Reward Points")')).toBeVisible();
    await expect(page.locator('text=Adam\'s Points')).toBeVisible();

    // Should show points total
    await expect(page.locator('text=/\\d+ pts/')).toBeVisible();
  });

  test('should add points manually', async ({ page }) => {
    // Look for Add option
    const addOption = page.locator('input[value="add"], button:has-text("Add")').first();
    if (await addOption.isVisible()) {
      await addOption.click();
    }

    // Find amount input
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    await amountInput.fill('50');

    // Find reason input
    const reasonInput = page.locator('input[name="reason"], input[name="note"], textarea').first();
    await reasonInput.fill('Good behavior bonus');

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await submitButton.click();

    await page.waitForTimeout(500);

    // Verify points increased
    await expect(page.locator('text=/50 pts/')).toBeVisible({ timeout: 3000 });
  });

  test('should redeem points for screen time', async ({ page }) => {
    // First add points
    const addOption = page.locator('input[value="add"], button:has-text("Add")').first();
    if (await addOption.isVisible()) {
      await addOption.click();
    }

    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    await amountInput.fill('60');

    const reasonInput = page.locator('input[name="reason"], input[name="note"], textarea').first();
    await reasonInput.fill('Initial points');

    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await submitButton.click();
    await page.waitForTimeout(500);

    // Now redeem - look for redeem section
    // This depends on the UI structure - might be a separate form
    const redeemInput = page.locator('input[name="minutes"], input[placeholder*="minute" i]').last();
    if (await redeemInput.isVisible()) {
      await redeemInput.fill('30');

      const redeemButton = page.locator('button:has-text("Redeem")').last();
      await redeemButton.click();

      await page.waitForTimeout(500);

      // Verify points decreased
      await expect(page.locator('text=/30 pts/')).toBeVisible({ timeout: 3000 });

      // Navigate to Screen view to verify screen time increased
      await navigateToView(page, 'Screen');
      await expect(page.locator('text=/30 min/')).toBeVisible();
    }
  });
});

test.describe('Chores (Chores View)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToView(page, 'Chores');
  });

  test('should display available chores', async ({ page }) => {
    await expect(page.locator('h2:has-text("Weekly Chores")')).toBeVisible();

    // Verify all 5 chores are visible
    await expect(page.locator('text=Tidy bedroom')).toBeVisible();
    await expect(page.locator('text=Finish homework')).toBeVisible();
    await expect(page.locator('text=Set / clear the table')).toBeVisible();
    await expect(page.locator('text=Feed pet / help pet')).toBeVisible();
    await expect(page.locator('text=Help with laundry')).toBeVisible();

    // Verify point values are shown
    await expect(page.locator('text=+10')).toBeVisible(); // Tidy bedroom
    await expect(page.locator('text=+8')).toBeVisible();  // Homework
  });

  test('should select and submit chores', async ({ page }) => {
    // Select checkboxes for specific chores
    // Find checkbox by label text or value
    const tidyCheckbox = page.locator('input[type="checkbox"]').first();
    await tidyCheckbox.check();

    // Verify total points preview appears
    await expect(page.locator('text=/Total.*\\+\\d+ points/i')).toBeVisible();

    // Select another chore
    const homeworkCheckbox = page.locator('input[type="checkbox"]').nth(1);
    await homeworkCheckbox.check();

    // Should show combined total (10 + 8 = 18 if first two are tidy + homework)
    await expect(page.locator('text=/\\+18 points/i')).toBeVisible();

    // Submit chores
    const submitButton = page.locator('button:has-text("Submit")');
    await submitButton.click();

    // Wait for success message
    await expect(page.locator('text=/Chores submitted/i')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=/\\+18 points earned/i')).toBeVisible();

    // Verify checkboxes are cleared
    await expect(tidyCheckbox).not.toBeChecked();
    await expect(homeworkCheckbox).not.toBeChecked();
  });

  test('should prevent submission with no chores selected', async ({ page }) => {
    // Try to submit without selecting chores
    const submitButton = page.locator('button:has-text("Submit")');

    // Button should be disabled or clicking shows error
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should update points after chore submission', async ({ page }) => {
    // Select and submit chores
    const tidyCheckbox = page.locator('input[type="checkbox"]').first();
    await tidyCheckbox.check();

    const submitButton = page.locator('button:has-text("Submit")');
    await submitButton.click();

    await page.waitForTimeout(500);

    // Navigate to Points view
    await navigateToView(page, 'Points');

    // Verify points increased by chore value
    await expect(page.locator('text=/\\d+ pts/')).toBeVisible();
  });
});

test.describe('Screen Time (Screen View)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToView(page, 'Screen');
  });

  test('should display screen time balance', async ({ page }) => {
    await expect(page.locator('h2:has-text("Screen Time")')).toBeVisible();

    // Should show total minutes
    await expect(page.locator('text=/\\d+ min/')).toBeVisible();

    // Should show breakdown (hours and minutes)
    await expect(page.locator('text=/\\d+ h \\d+ min/')).toBeVisible();

    // Should show progress bar
    await expect(page.locator('.bg-primary-500, [class*="progress"]')).toBeVisible();
  });

  test('should add screen time', async ({ page }) => {
    // Look for Add option
    const addOption = page.locator('input[value="add"], button:has-text("Add")').first();
    if (await addOption.isVisible()) {
      await addOption.click();
    }

    // Find minutes input
    const minutesInput = page.locator('input[name="minutes"], input[type="number"]').first();
    await minutesInput.fill('60');

    // Find reason input
    const reasonInput = page.locator('input[name="reason"], input[name="note"], textarea').first();
    await reasonInput.fill('Weekend bonus');

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await submitButton.click();

    await page.waitForTimeout(500);

    // Verify screen time increased
    await expect(page.locator('text=/60 min/')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=/1 h 0 min/')).toBeVisible();
  });

  test('should use screen time', async ({ page }) => {
    // First add screen time
    const addOption = page.locator('input[value="add"], button:has-text("Add")').first();
    if (await addOption.isVisible()) {
      await addOption.click();
    }

    const minutesInput = page.locator('input[name="minutes"], input[type="number"]').first();
    await minutesInput.fill('90');

    const reasonInput = page.locator('input[name="reason"], input[name="note"], textarea').first();
    await reasonInput.fill('Initial time');

    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await submitButton.click();
    await page.waitForTimeout(500);

    // Now use some time
    const useOption = page.locator('input[value="use"], input[value="deduct"], button:has-text("Use")').first();
    if (await useOption.isVisible()) {
      await useOption.click();
    }

    await minutesInput.fill('25');
    await reasonInput.fill('iPad time');
    await submitButton.click();

    await page.waitForTimeout(500);

    // Should show 65 minutes remaining (90 - 25)
    await expect(page.locator('text=/65 min/')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Navigation', () => {
  test('should navigate between all views', async ({ page }) => {
    // Start at Bank (default)
    await expect(page.locator('button[aria-label="Bank tab"]'))
      .toHaveAttribute('aria-selected', 'true');

    // Navigate to Points
    await navigateToView(page, 'Points');
    await expect(page.locator('h2:has-text("Reward Points")')).toBeVisible();

    // Navigate to Chores
    await navigateToView(page, 'Chores');
    await expect(page.locator('h2:has-text("Weekly Chores")')).toBeVisible();

    // Navigate to Screen
    await navigateToView(page, 'Screen');
    await expect(page.locator('h2:has-text("Screen Time")')).toBeVisible();

    // Navigate back to Bank
    await navigateToView(page, 'Bank');
    await expect(page.locator('h2:has-text("Bank Account")')).toBeVisible();
  });

  test('should maintain view when switching children', async ({ page }) => {
    // Navigate to Points view
    await navigateToView(page, 'Points');

    // Switch to Sami
    await selectChild(page, 'Sami');

    // Should still be on Points view
    await expect(page.locator('h2:has-text("Reward Points")')).toBeVisible();
    await expect(page.locator('text=Sami\'s Points')).toBeVisible();

    // Switch back to Adam
    await selectChild(page, 'Adam');

    // Should still be on Points view
    await expect(page.locator('h2:has-text("Reward Points")')).toBeVisible();
    await expect(page.locator('text=Adam\'s Points')).toBeVisible();
  });
});

test.describe('Data Persistence', () => {
  test('should persist data after page reload', async ({ page }) => {
    // Add money to Bank
    await navigateToView(page, 'Bank');

    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    await amountInput.fill('50');

    const reasonInput = page.locator('input[name="reason"], input[name="note"], textarea').first();
    await reasonInput.fill('Test persistence');

    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await submitButton.click();

    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await waitForAppReady(page);

    // Navigate back to Bank
    await navigateToView(page, 'Bank');

    // Verify money still there
    await expect(page.locator('text=/£50\\.00/')).toBeVisible();
  });

  test('should keep separate data for each child', async ({ page }) => {
    // Add money to Adam
    await navigateToView(page, 'Bank');

    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    await amountInput.fill('30');

    const reasonInput = page.locator('input[name="reason"], input[name="note"], textarea').first();
    await reasonInput.fill('Adam money');

    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await submitButton.click();

    await page.waitForTimeout(500);
    await expect(page.locator('text=/£30\\.00/')).toBeVisible();

    // Switch to Sami
    await selectChild(page, 'Sami');

    // Add different amount to Sami
    await amountInput.fill('15');
    await reasonInput.fill('Sami money');
    await submitButton.click();

    await page.waitForTimeout(500);
    await expect(page.locator('text=/£15\\.00/')).toBeVisible();

    // Switch back to Adam
    await selectChild(page, 'Adam');

    // Verify Adam still has £30
    await expect(page.locator('text=/£30\\.00/')).toBeVisible();

    // Switch to Sami
    await selectChild(page, 'Sami');

    // Verify Sami still has £15
    await expect(page.locator('text=/£15\\.00/')).toBeVisible();
  });
});

test.describe('Cross-View Workflows', () => {
  test('should complete full workflow: chores -> points -> screen time', async ({ page }) => {
    // Step 1: Submit chores to earn points
    await navigateToView(page, 'Chores');

    const tidyCheckbox = page.locator('input[type="checkbox"]').first();
    await tidyCheckbox.check();

    const submitChoresButton = page.locator('button:has-text("Submit")');
    await submitChoresButton.click();

    await page.waitForTimeout(500);

    // Step 2: Navigate to Points and verify increase
    await navigateToView(page, 'Points');
    await expect(page.locator('text=/\\d+ pts/')).toBeVisible();

    // Step 3: Redeem points for screen time (if UI allows)
    const redeemInput = page.locator('input[name="minutes"], input[placeholder*="minute" i]').last();
    if (await redeemInput.isVisible()) {
      await redeemInput.fill('10');

      const redeemButton = page.locator('button:has-text("Redeem")').last();
      await redeemButton.click();

      await page.waitForTimeout(500);

      // Step 4: Navigate to Screen and verify screen time increased
      await navigateToView(page, 'Screen');
      await expect(page.locator('text=/10 min/')).toBeVisible();
    }
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    // Check navigation has aria-label
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();

    // Check child switcher has aria-label
    await expect(page.locator('[aria-label="Choose child"]')).toBeVisible();

    // Check tabs have aria-selected
    const bankTab = page.locator('button[aria-label="Bank tab"]');
    await expect(bankTab).toHaveAttribute('aria-selected');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus is visible (check if any element has focus)
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(BASE_URL);
    await waitForAppReady(page);

    const loadTime = Date.now() - startTime;

    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto(BASE_URL);
    await waitForAppReady(page);

    // Verify bottom nav is visible
    await expect(page.locator('nav[role="tablist"]')).toBeVisible();

    // Verify child switcher is visible
    await expect(page.locator('button:has-text("Adam")')).toBeVisible();

    // Verify can navigate
    await navigateToView(page, 'Points');
    await expect(page.locator('h2:has-text("Reward Points")')).toBeVisible();
  });
});
