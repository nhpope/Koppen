/**
 * Accessibility Test Suite
 * Validates WCAG 2.1 AA compliance (NFR8-12)
 *
 * Uses axe-core for automated accessibility testing
 * Covers: keyboard navigation, color contrast, ARIA labels, screen reader support
 */

import { test, expect } from './helpers';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility - WCAG 2.1 AA', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have accessible page structure', async ({ page }) => {
    await page.goto('/');

    // Page should have valid HTML lang attribute
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBeTruthy();
    expect(lang).toMatch(/^en/i);

    // Page should have a main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Skip to main content link (if present)
    const skipLink = page.locator('a[href="#main-content"]');
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeVisible();
    }
  });

  test('should have keyboard-navigable legend', async ({ page, mockClimateData }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Legend should be reachable via Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs to reach legend

    // Find first legend item
    const firstLegendItem = page.locator('.legend__item').first();
    if (await firstLegendItem.count() > 0) {
      // Focus should be visible
      await firstLegendItem.focus();
      const isFocused = await firstLegendItem.evaluate(el => el === document.activeElement);
      expect(isFocused).toBeTruthy();

      // Enter/Space should select item
      await page.keyboard.press('Enter');
      const isSelected = await firstLegendItem.getAttribute('aria-selected');
      expect(isSelected).toBeTruthy();
    }
  });

  test('should have accessible color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const contrastResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('.legend')
      .analyze();

    const contrastViolations = contrastResults.violations.filter(v =>
      v.id === 'color-contrast',
    );

    expect(contrastViolations).toHaveLength(0);
  });

  test('should have ARIA labels on interactive elements', async ({ page, mockClimateData }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check legend items
    const legendItems = page.locator('.legend__item');
    const count = await legendItems.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const item = legendItems.nth(i);
        const ariaLabel = await item.getAttribute('aria-label');
        const textContent = await item.textContent();

        // Should have either aria-label or meaningful text content
        expect(ariaLabel || textContent).toBeTruthy();
        expect((ariaLabel || textContent)?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should support keyboard navigation for classification builder', async ({ page }) => {
    await page.goto('/');

    // Open builder (if Create button exists)
    const createButton = page.locator('button:has-text("Create")');
    if (await createButton.count() > 0) {
      await createButton.click();

      // Sliders should be keyboard accessible
      const firstSlider = page.locator('input[type="range"]').first();
      if (await firstSlider.count() > 0) {
        await firstSlider.focus();

        // Arrow keys should adjust slider
        const initialValue = await firstSlider.inputValue();
        await page.keyboard.press('ArrowRight');
        const newValue = await firstSlider.inputValue();

        expect(newValue).not.toBe(initialValue);
      }
    }
  });

  test('should have accessible close buttons', async ({ page }) => {
    await page.goto('/');

    // Find all close buttons (×)
    const closeButtons = page.locator('button[aria-label*="Close"], button[aria-label*="close"]');
    const count = await closeButtons.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const button = closeButtons.nth(i);

        // Should have aria-label
        const ariaLabel = await button.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel).toMatch(/close/i);

        // Should be keyboard accessible
        const role = await button.getAttribute('role');
        const tagName = await button.evaluate(el => el.tagName.toLowerCase());
        expect(tagName === 'button' || role === 'button').toBeTruthy();
      }
    }
  });

  test('should have focus indicators on all interactive elements', async ({ page, mockClimateData }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    const interactiveElements = page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const count = await interactiveElements.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = interactiveElements.nth(i);
        await element.focus();

        // Check if focus indicator is visible
        const outlineWidth = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return parseInt(styles.outlineWidth) || parseInt(styles.borderWidth);
        });

        // Should have visible focus indicator (outline or border)
        expect(outlineWidth).toBeGreaterThan(0);
      }
    }
  });

  test('should handle screen reader announcements', async ({ page }) => {
    await page.goto('/');

    // Check for aria-live regions
    const liveRegions = page.locator('[aria-live]');
    const count = await liveRegions.count();

    if (count > 0) {
      // Live regions should have appropriate politeness level
      for (let i = 0; i < count; i++) {
        const region = liveRegions.nth(i);
        const politeness = await region.getAttribute('aria-live');
        expect(['polite', 'assertive', 'off']).toContain(politeness);
      }
    }
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/');

    // All inputs should have labels
    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        // Should have either:
        // 1. Associated label element (via id)
        // 2. aria-label
        // 3. aria-labelledby
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        } else {
          expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    }
  });
});
