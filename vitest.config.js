import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '.wrangler/',
        'scripts/',
        '**/*.config.js',
        '**/*.config.ts',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },
    include: [
      'apps/*/src/**/*.{test,spec}.{js,ts,tsx}',
      'packages/*/src/**/*.{test,spec}.{js,ts,tsx}'
    ],
    exclude: ['**/node_modules/**', 'dist', 'build', '.wrangler', 'tests/e2e/**'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    isolate: true,
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  }
});
