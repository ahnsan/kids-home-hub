# E2E Tests

This directory contains end-to-end tests for the Kids Home Hub PWA using Playwright.

## Quick Start

```bash
# Run all E2E tests
pnpm test:e2e

# Run in UI mode (recommended for development)
pnpm test:e2e:ui

# Run smoke tests only (fast)
pnpm test:e2e:smoke

# Run in headed mode (see the browser)
pnpm test:e2e:headed

# Debug tests
pnpm test:e2e:debug
```

## Test Files

- `features.spec.ts` - Comprehensive tests for all app features
- `smoke.spec.ts` - Quick smoke tests for critical paths (tagged with @smoke)
- `helpers/page-objects.ts` - Page object models for clean test code

## Test Structure

### Using Page Objects

Tests use page object models for better maintainability:

```typescript
import { KidsHomeHubApp } from './helpers/page-objects';

test('example test', async ({ page }) => {
  const app = new KidsHomeHubApp(page);
  await app.goto();
  await app.waitForReady();

  // Use page objects
  await app.childSwitcher.selectSami();
  await app.bottomNav.goToPoints();
  await app.pointsView.addPoints(50, 'Test');
});
```

### Available Page Objects

- `BasePage` - Basic navigation and setup
- `ChildSwitcher` - Switch between Adam and Sami
- `BottomNav` - Navigate between views
- `BankView` - Money management operations
- `PointsView` - Points and redemption operations
- `ChoresView` - Chore submission operations
- `ScreenView` - Screen time management operations

## Running Specific Tests

```bash
# Run specific browser
pnpm test:e2e:chromium
pnpm test:e2e:firefox
pnpm test:e2e:webkit

# Run mobile tests
pnpm test:e2e:mobile

# Run specific test file
pnpm test:e2e features.spec.ts
pnpm test:e2e smoke.spec.ts

# Run tests matching pattern
pnpm test:e2e --grep "Bank"
```

## Test Configuration

Configuration is in `/Users/Karim/kids-home-hub/playwright.config.js`:

- Default URL: `http://localhost:3000`
- Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari, iPad
- Timeout: 30 seconds per test
- Retries: 2 retries in CI, 0 locally
- Screenshots: On failure
- Videos: On failure

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to main/develop
- Before deployments

See `.github/workflows/e2e-tests.yml` for CI configuration.

## Writing New Tests

1. Add new test to `features.spec.ts` or create new spec file
2. Use page objects from `helpers/page-objects.ts`
3. Tag smoke tests with `@smoke`
4. Use descriptive test names
5. Clean up state in `beforeEach` hooks

Example:

```typescript
test.describe('New Feature', () => {
  test.beforeEach(async ({ page }) => {
    const app = new KidsHomeHubApp(page);
    await app.goto();
    await app.clearLocalStorage();
    await page.reload();
    await app.waitForReady();
  });

  test('should do something', async ({ page }) => {
    // Your test here
  });
});
```

## Debugging Tests

### UI Mode (Recommended)
```bash
pnpm test:e2e:ui
```
Provides time-travel debugging, watch mode, and visual test runner.

### Debug Mode
```bash
pnpm test:e2e:debug
```
Opens Playwright Inspector for step-by-step debugging.

### View Test Reports
```bash
npx playwright show-report
```

## Troubleshooting

### Tests Failing Locally

1. Ensure dev server is running on `http://localhost:3000`
2. Clear localStorage before tests
3. Check for port conflicts
4. Ensure all dependencies installed: `pnpm install`

### Timeout Issues

Increase timeout in test:
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // test code
});
```

### Flaky Tests

1. Add explicit waits: `await expect(element).toBeVisible()`
2. Use `waitForTimeout` sparingly
3. Check for race conditions
4. Increase timeout for slow operations

## Best Practices

1. Use page objects for reusable interactions
2. Clean state between tests
3. Use meaningful selectors (prefer aria-label, role, text)
4. Avoid hardcoded timeouts when possible
5. Test error states and edge cases
6. Keep tests independent
7. Add assertions for visual feedback

## Resources

- [Playwright Documentation](https://playwright.dev)
- [E2E Test Guide](/Users/Karim/kids-home-hub/E2E_TEST_GUIDE.md)
- [Page Object Pattern](https://playwright.dev/docs/pom)
