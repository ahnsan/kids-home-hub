import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Models for Kids Home Hub E2E Tests
 *
 * These classes provide a clean API for interacting with the app in tests.
 */

/**
 * Base page object with common functionality
 */
export class BasePage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async waitForReady() {
    await this.page.locator('header').waitFor({ state: 'visible' });
    await this.page.locator('nav[role="tablist"]').waitFor({ state: 'visible' });
  }
}

/**
 * Child switcher component
 */
export class ChildSwitcher {
  private readonly container: Locator;

  constructor(private readonly page: Page) {
    this.container = page.locator('[role="tablist"][aria-label="Choose child"]');
  }

  async selectAdam() {
    await this.page.click('button[role="tab"]:has-text("Adam")');
  }

  async selectSami() {
    await this.page.click('button[role="tab"]:has-text("Sami")');
  }

  async selectChild(name: 'Adam' | 'Sami') {
    if (name === 'Adam') {
      await this.selectAdam();
    } else {
      await this.selectSami();
    }
  }

  getSelectedChild(): Locator {
    return this.container.locator('button[aria-selected="true"]');
  }
}

/**
 * Bottom navigation component
 */
export class BottomNav {
  private readonly nav: Locator;

  constructor(private readonly page: Page) {
    this.nav = page.locator('nav[role="tablist"][aria-label="Main navigation"]');
  }

  async goToBank() {
    await this.page.click('button[aria-label="Bank tab"]');
  }

  async goToPoints() {
    await this.page.click('button[aria-label="Points tab"]');
  }

  async goToChores() {
    await this.page.click('button[aria-label="Chores tab"]');
  }

  async goToScreen() {
    await this.page.click('button[aria-label="Screen tab"]');
  }

  async navigateTo(view: 'Bank' | 'Points' | 'Chores' | 'Screen') {
    const methods = {
      Bank: this.goToBank,
      Points: this.goToPoints,
      Chores: this.goToChores,
      Screen: this.goToScreen,
    };
    await methods[view].call(this);
  }

  getActiveTab(): Locator {
    return this.nav.locator('button[aria-selected="true"]');
  }
}

/**
 * Bank view page object
 */
export class BankView {
  private readonly amountInput: Locator;
  private readonly reasonInput: Locator;
  private readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    this.reasonInput = page.locator('input[name="reason"], input[name="note"], textarea').first();
    this.submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
  }

  async addMoney(amount: number, reason: string) {
    // Select "Add" if there's a radio/toggle
    const addOption = this.page.locator('input[value="add"], button:has-text("Add")').first();
    if (await addOption.isVisible()) {
      await addOption.click();
    }

    await this.amountInput.fill(amount.toString());
    await this.reasonInput.fill(reason);
    await this.submitButton.click();
    await this.page.waitForTimeout(500);
  }

  async deductMoney(amount: number, reason: string) {
    // Select "Deduct" if there's a radio/toggle
    const deductOption = this.page.locator('input[value="deduct"], button:has-text("Deduct")').first();
    if (await deductOption.isVisible()) {
      await deductOption.click();
    }

    await this.amountInput.fill(amount.toString());
    await this.reasonInput.fill(reason);
    await this.submitButton.click();
    await this.page.waitForTimeout(500);
  }

  getBalance(): Locator {
    return this.page.locator('text=/£\\d+\\.\\d{2}/').first();
  }

  getAUDEquivalent(): Locator {
    return this.page.locator('text=/A\\$\\d+\\.\\d{2}/').first();
  }
}

/**
 * Points view page object
 */
export class PointsView {
  private readonly amountInput: Locator;
  private readonly reasonInput: Locator;
  private readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    this.reasonInput = page.locator('input[name="reason"], input[name="note"], textarea').first();
    this.submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
  }

  async addPoints(amount: number, reason: string) {
    const addOption = this.page.locator('input[value="add"], button:has-text("Add")').first();
    if (await addOption.isVisible()) {
      await addOption.click();
    }

    await this.amountInput.fill(amount.toString());
    await this.reasonInput.fill(reason);
    await this.submitButton.click();
    await this.page.waitForTimeout(500);
  }

  async deductPoints(amount: number, reason: string) {
    const deductOption = this.page.locator('input[value="deduct"], button:has-text("Deduct")').first();
    if (await deductOption.isVisible()) {
      await deductOption.click();
    }

    await this.amountInput.fill(amount.toString());
    await this.reasonInput.fill(reason);
    await this.submitButton.click();
    await this.page.waitForTimeout(500);
  }

  async redeemForScreenTime(minutes: number) {
    const redeemInput = this.page.locator('input[name="minutes"], input[placeholder*="minute" i]').last();
    await redeemInput.fill(minutes.toString());

    const redeemButton = this.page.locator('button:has-text("Redeem")').last();
    await redeemButton.click();
    await this.page.waitForTimeout(500);
  }

  getPointsTotal(): Locator {
    return this.page.locator('text=/\\d+ pts/').first();
  }
}

/**
 * Chores view page object
 */
export class ChoresView {
  constructor(private readonly page: Page) {}

  async selectChore(index: number) {
    const checkbox = this.page.locator('input[type="checkbox"]').nth(index);
    await checkbox.check();
  }

  async deselectChore(index: number) {
    const checkbox = this.page.locator('input[type="checkbox"]').nth(index);
    await checkbox.uncheck();
  }

  async submitChores() {
    const submitButton = this.page.locator('button:has-text("Submit")');
    await submitButton.click();
    await this.page.waitForTimeout(500);
  }

  getChoreCheckbox(index: number): Locator {
    return this.page.locator('input[type="checkbox"]').nth(index);
  }

  getPointsPreview(): Locator {
    return this.page.locator('text=/Total.*\\+\\d+ points/i');
  }

  getSuccessMessage(): Locator {
    return this.page.locator('text=/Chores submitted/i');
  }

  getSubmitButton(): Locator {
    return this.page.locator('button:has-text("Submit")');
  }
}

/**
 * Screen view page object
 */
export class ScreenView {
  private readonly minutesInput: Locator;
  private readonly reasonInput: Locator;
  private readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.minutesInput = page.locator('input[name="minutes"], input[type="number"]').first();
    this.reasonInput = page.locator('input[name="reason"], input[name="note"], textarea').first();
    this.submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
  }

  async addScreenTime(minutes: number, reason: string) {
    const addOption = this.page.locator('input[value="add"], button:has-text("Add")').first();
    if (await addOption.isVisible()) {
      await addOption.click();
    }

    await this.minutesInput.fill(minutes.toString());
    await this.reasonInput.fill(reason);
    await this.submitButton.click();
    await this.page.waitForTimeout(500);
  }

  async useScreenTime(minutes: number, reason: string) {
    const useOption = this.page.locator('input[value="use"], input[value="deduct"], button:has-text("Use")').first();
    if (await useOption.isVisible()) {
      await useOption.click();
    }

    await this.minutesInput.fill(minutes.toString());
    await this.reasonInput.fill(reason);
    await this.submitButton.click();
    await this.page.waitForTimeout(500);
  }

  getTotalMinutes(): Locator {
    return this.page.locator('text=/\\d+ min/').first();
  }

  getHoursMinutesBreakdown(): Locator {
    return this.page.locator('text=/\\d+ h \\d+ min/').first();
  }

  getProgressBar(): Locator {
    return this.page.locator('.bg-primary-500, [class*="progress"]').first();
  }
}

/**
 * Main app page object that combines all components
 */
export class KidsHomeHubApp {
  public readonly basePage: BasePage;
  public readonly childSwitcher: ChildSwitcher;
  public readonly bottomNav: BottomNav;
  public readonly bankView: BankView;
  public readonly pointsView: PointsView;
  public readonly choresView: ChoresView;
  public readonly screenView: ScreenView;

  constructor(public readonly page: Page) {
    this.basePage = new BasePage(page);
    this.childSwitcher = new ChildSwitcher(page);
    this.bottomNav = new BottomNav(page);
    this.bankView = new BankView(page);
    this.pointsView = new PointsView(page);
    this.choresView = new ChoresView(page);
    this.screenView = new ScreenView(page);
  }

  async goto() {
    await this.basePage.goto();
  }

  async waitForReady() {
    await this.basePage.waitForReady();
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }
}
