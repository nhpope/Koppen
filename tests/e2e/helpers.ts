/**
 * Playwright E2E test helpers
 * Provides fixtures and utilities for testing Koppen
 */

import { test as base, expect, Page } from '@playwright/test';
import mockClimateTiny from '../fixtures/mock-climate-tiny.json';

/**
 * Extended test fixture with Koppen-specific helpers
 */
export const test = base.extend<{
  isolatedMap: Page;
  mockClimateData: Page;
}>({
  /**
   * Provides isolated map instance with automatic cleanup
   */
  isolatedMap: async ({ page }, use) => {
    // Setup: Create isolated container
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = `koppen-test-${Date.now()}`;
      container.style.width = '100%';
      container.style.height = '600px';
      document.body.appendChild(container);
      return container.id;
    });

    await use(page);

    // Teardown: Destroy Leaflet map and remove container
    await page.evaluate(() => {
      // Destroy Leaflet map instance
      if ((window as any).map) {
        (window as any).map.remove();
        delete (window as any).map;
      }

      // Remove test containers
      document.querySelectorAll('[id^="koppen-test"]').forEach(el => {
        el.remove();
      });

      // Clear URL state
      window.history.replaceState({}, '', window.location.pathname);

      // Clear session storage
      sessionStorage.clear();
    });
  },

  /**
   * Intercepts TopoJSON data load and returns tiny mock fixture
   * Use this for fast E2E tests that don't need full 5MB dataset
   */
  mockClimateData: async ({ page }, use) => {
    // Intercept climate data request
    await page.route('**/data/climate.topojson', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClimateTiny),
      });
    });

    await use(page);
  },
});

export { expect };

/**
 * Wait for Koppen custom event
 */
export async function waitForKoppenEvent(page: Page, eventName: string, timeout = 5000): Promise<any> {
  return page.evaluate(
    ({ event, ms }) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), ms);
        document.addEventListener(event, (e: any) => {
          clearTimeout(timer);
          resolve(e.detail);
        }, { once: true });
      });
    },
    { event: eventName, ms: timeout },
  );
}

/**
 * Get Leaflet map instance from page
 */
export async function getMapInstance(page: Page) {
  return page.evaluate(() => (window as any).map);
}

/**
 * Measure performance timing
 */
export async function measurePerformance(page: Page, action: () => Promise<void>): Promise<number> {
  await page.evaluate(() => {
    (window as any).perfStart = performance.now();
  });

  await action();

  return page.evaluate(() => {
    const end = performance.now();
    const start = (window as any).perfStart;
    delete (window as any).perfStart;
    return end - start;
  });
}
