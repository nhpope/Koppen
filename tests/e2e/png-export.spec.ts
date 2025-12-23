/**
 * E2E Tests: PNG Export - Story 6.1
 * Tests for PNG export button and functionality
 */

import { test, expect } from '@playwright/test';

test.describe('PNG Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.map-container');
  });

  test('should display export button in header', async ({ page }) => {
    const exportButton = page.locator('[data-export-png]');
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toContainText('Export');
  });

  test('should have export button disabled initially', async ({ page }) => {
    const exportButton = page.locator('[data-export-png]');
    await expect(exportButton).toBeDisabled();
  });

  test('should enable export button when map is ready', async ({ page }) => {
    const exportButton = page.locator('[data-export-png]');

    // Wait for map ready event
    await page.waitForFunction(() => {
      return !document.querySelector('[data-export-png]')?.hasAttribute('disabled');
    }, { timeout: 10000 });

    await expect(exportButton).toBeEnabled();
  });

  test('export button should have correct accessibility attributes', async ({ page }) => {
    const exportButton = page.locator('[data-export-png]');
    await expect(exportButton).toHaveAttribute('aria-label', 'Export map as PNG image');
  });

  test('export button should be keyboard accessible', async ({ page }) => {
    // Wait for export button to be enabled
    await page.waitForFunction(() => {
      return !document.querySelector('[data-export-png]')?.hasAttribute('disabled');
    }, { timeout: 10000 });

    // Tab to export button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const exportButton = page.locator('[data-export-png]');
    await expect(exportButton).toBeFocused();
  });

  test('export button should have touch-friendly size', async ({ page }) => {
    const exportButton = page.locator('[data-export-png]');
    const box = await exportButton.boundingBox();

    expect(box).toBeTruthy();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44); // WCAG 2.1 AA minimum
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('should fire export-requested event on click', async ({ page }) => {
    // Wait for export button to be enabled
    await page.waitForFunction(() => {
      return !document.querySelector('[data-export-png]')?.hasAttribute('disabled');
    }, { timeout: 10000 });

    // Set up event listener
    const exportRequestedPromise = page.evaluate(() => {
      return new Promise((resolve) => {
        document.addEventListener('koppen:export-requested', () => resolve(true), { once: true });
      });
    });

    // Click export button
    await page.click('[data-export-png]');

    // Wait for event
    const eventFired = await exportRequestedPromise;
    expect(eventFired).toBe(true);
  });

  test('should show loading state during export', async ({ page }) => {
    // Wait for export button to be enabled
    await page.waitForFunction(() => {
      return !document.querySelector('[data-export-png]')?.hasAttribute('disabled');
    }, { timeout: 10000 });

    const exportButton = page.locator('[data-export-png]');

    // Click export button
    await exportButton.click();

    // Check for loading state (button should show "Exporting...")
    await expect(exportButton).toContainText('Exporting...');
  });

  test('export button position should be consistent', async ({ page }) => {
    const exportButton = page.locator('[data-export-png]');
    const donationButton = page.locator('[data-donation-button]');

    // Both buttons should be visible
    await expect(exportButton).toBeVisible();
    await expect(donationButton).toBeVisible();

    // Export button should be before donation button in header
    const exportBox = await exportButton.boundingBox();
    const donationBox = await donationButton.boundingBox();

    expect(exportBox).toBeTruthy();
    expect(donationBox).toBeTruthy();

    if (exportBox && donationBox) {
      // Export button should be to the left of donation button (smaller x coordinate)
      expect(exportBox.x).toBeLessThan(donationBox.x);
    }
  });
});
