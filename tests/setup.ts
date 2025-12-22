/**
 * Vitest global setup
 * Runs before all tests to configure the test environment
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Mock console.error to fail tests on React errors
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    // Filter out expected errors (like network failures in error tests)
    const message = args[0]?.toString() || '';
    if (message.includes('[Koppen]')) {
      // Expected Koppen errors are OK
      return;
    }
    originalError.call(console, ...args);
    throw new Error(`Unexpected console.error: ${message}`);
  };
});

afterEach(() => {
  console.error = originalError;
});

// Clean up DOM after each test (safe - clearing to empty, not inserting content)
afterEach(() => {
  // Remove all child nodes safely
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
  while (document.head.firstChild) {
    document.head.removeChild(document.head.firstChild);
  }
});

// Clean up timers
afterEach(() => {
  vi.clearAllTimers();
  vi.clearAllMocks();
});

// Clean up event listeners
afterEach(() => {
  // Remove all custom koppen:* event listeners
  const events = ['koppen:data-loaded', 'koppen:classification-changed', 'koppen:cell-selected', 'koppen:map-ready'];
  events.forEach(event => {
    const listeners = (window as any)._eventListeners?.[event] || [];
    listeners.forEach((listener: EventListener) => {
      document.removeEventListener(event, listener);
    });
  });
});
