import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'vite.config.js',
        'vitest.config.ts',
        'playwright.config.ts',
      ],
      // Thresholds per test design
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
        // Higher threshold for critical climate module
        'src/climate/**': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },

    // Test file patterns
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Test timeout (deterministic tests should be fast)
    testTimeout: 10000, // 10s max per test

    // Reporter
    reporters: ['verbose'],
  },
});
