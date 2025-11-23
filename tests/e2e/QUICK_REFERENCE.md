# E2E Testing Quick Reference

## Common Commands

```bash
# Development
pnpm test:e2e:ui              # Best for development - UI mode
pnpm test:e2e:headed          # See browser while testing
pnpm test:e2e:debug           # Step-by-step debugging

# Run Tests
pnpm test:e2e                 # All tests, all browsers
pnpm test:e2e:smoke           # Quick smoke tests only
pnpm test:e2e:chromium        # Chromium only
pnpm test:e2e:firefox         # Firefox only
pnpm test:e2e:webkit          # Safari/WebKit only
pnpm test:e2e:mobile          # Mobile browsers only

# Specific Tests
pnpm test:e2e features.spec.ts    # Run specific file
pnpm test:e2e --grep "Bank"       # Run tests matching pattern
pnpm test:e2e --grep @smoke       # Run tagged tests
```

## Test Selectors Cheat Sheet

```typescript
// Recommended selectors (stable)
page.locator('button[aria-label="Bank tab"]')      // ARIA label
page.locator('button[role="tab"]')                 // ARIA role
page.locator('text=Submit')                        // Text content
page.locator('[data-testid="submit-button"]')     // Test ID (if added)

// Avoid (brittle)
page.locator('.btn-primary')                       // CSS classes
page.locator('div > div > button')                 // Complex selectors
```

## Page Object Pattern

```typescript
// Create app instance
const app = new KidsHomeHubApp(page);
await app.goto();
await app.waitForReady();

// Use components
await app.childSwitcher.selectSami();
await app.bottomNav.goToPoints();
await app.pointsView.addPoints(50, 'Test');
```

## Common Assertions

```typescript
// Visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Text content
await expect(element).toHaveText('Expected text');
await expect(element).toContainText('partial');
await expect(element).toContainText(/regex/);

// Attributes
await expect(element).toHaveAttribute('aria-selected', 'true');
await expect(element).toHaveClass(/active/);

// Count
await expect(elements).toHaveCount(5);

// Value
await expect(input).toHaveValue('25.50');

// State
await expect(button).toBeEnabled();
await expect(button).toBeDisabled();
await expect(checkbox).toBeChecked();
```

## Common Waits

```typescript
// Wait for element
await page.waitForSelector('button');
await element.waitFor({ state: 'visible' });

// Wait for navigation
await page.waitForURL('**/points');

// Wait for load state
await page.waitForLoadState('networkidle');

// Timeout (use sparingly)
await page.waitForTimeout(500);
```

## Test Patterns

### Setup/Teardown
```typescript
test.beforeEach(async ({ page }) => {
  const app = new KidsHomeHubApp(page);
  await app.goto();
  await app.clearLocalStorage();
  await page.reload();
  await app.waitForReady();
});
```

### Form Submission
```typescript
await page.fill('input[name="amount"]', '25.50');
await page.fill('textarea', 'Test reason');
await page.click('button[type="submit"]');
await page.waitForTimeout(500); // Wait for processing
```

### Navigation
```typescript
await page.click('button[aria-label="Points tab"]');
await expect(page.locator('h2:has-text("Points")')).toBeVisible();
```

### Conditional Logic
```typescript
const element = page.locator('button:has-text("Add")');
if (await element.isVisible()) {
  await element.click();
}
```

## Debugging Tips

### Check what Playwright sees
```typescript
// Get text content
const text = await element.textContent();
console.log('Element text:', text);

// Get attribute
const attr = await element.getAttribute('aria-selected');
console.log('Attribute:', attr);

// Take screenshot
await page.screenshot({ path: 'debug.png' });

// Check if visible
const visible = await element.isVisible();
console.log('Visible:', visible);
```

### Playwright Inspector
```bash
pnpm test:e2e:debug

# Then in test file:
await page.pause(); // Pauses execution
```

### View trace
```bash
npx playwright show-trace test-results/path/to/trace.zip
```

## Common Issues & Solutions

### Element not found
```typescript
// Add timeout
await expect(element).toBeVisible({ timeout: 10000 });

// Wait explicitly
await element.waitFor({ state: 'visible' });

// Check selector
const count = await page.locator('your-selector').count();
console.log('Found elements:', count);
```

### Flaky tests
```typescript
// Use waitFor instead of timeout
await expect(element).toBeVisible(); // Good
await page.waitForTimeout(1000);     // Bad

// Add retry logic
test.describe.configure({ retries: 2 });
```

### Timeout errors
```typescript
// Increase timeout for slow operations
test.setTimeout(60000);

// Or per assertion
await expect(element).toBeVisible({ timeout: 30000 });
```

## Environment Variables

```bash
# Custom test URL
TEST_URL=http://localhost:4000 pnpm test:e2e

# CI mode
CI=true pnpm test:e2e

# Headed mode
HEADED=1 pnpm test:e2e
```

## Test Data

### Reset State
```typescript
await page.evaluate(() => localStorage.clear());
await page.reload();
```

### Mock Data
```typescript
await page.addInitScript(() => {
  localStorage.setItem('childData', JSON.stringify({
    adam: { moneyTotal: 50, pointsTotal: 100, screenTotal: 60 },
    sami: { moneyTotal: 25, pointsTotal: 50, screenTotal: 30 }
  }));
});
```

## CI/CD Integration

Tests run automatically on:
- Pull requests → All tests
- Push to main → Smoke tests
- Deployment → Pre-deployment smoke tests

View results:
- GitHub Actions tab
- Artifacts: playwright-report
- Test summary in PR comments

## Performance

### Parallel execution
```bash
# Run in parallel (default in CI)
pnpm test:e2e --workers=4

# Run serially
pnpm test:e2e --workers=1
```

### Skip tests
```typescript
test.skip('not ready yet', async ({ page }) => {
  // Skipped
});

test.only('focus on this', async ({ page }) => {
  // Only this runs
});
```

## Reporting

```bash
# View HTML report
npx playwright show-report

# Generate custom report
pnpm test:e2e --reporter=html,json,junit
```

## Resources

- [Playwright Docs](https://playwright.dev)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [E2E Test Guide](/Users/Karim/kids-home-hub/E2E_TEST_GUIDE.md)
