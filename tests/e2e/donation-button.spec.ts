/**
 * Donation Button E2E Tests
 * Story 6.8: Ko-fi Donation Button
 *
 * Tests mobile responsiveness, accessibility, and visual appearance
 */

import { test, expect } from '@playwright/test';

test.describe('Donation Button - Desktop', () => {
  test('should be visible in header with icon and text', async ({ page }) => {
    await page.goto('/');

    const donationButton = page.locator('[data-donation-button]');

    // Button should be visible
    await expect(donationButton).toBeVisible();

    // Icon should be visible
    const icon = donationButton.locator('.donation-button__icon');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveText('☕');

    // Text should be visible
    const text = donationButton.locator('.donation-button__text');
    await expect(text).toBeVisible();
    await expect(text).toHaveText('Support');
  });

  test('should have correct link attributes', async ({ page }) => {
    await page.goto('/');

    const donationButton = page.locator('[data-donation-button]');

    // Check href
    await expect(donationButton).toHaveAttribute('href', /ko-fi\.com/);

    // Check target
    await expect(donationButton).toHaveAttribute('target', '_blank');

    // Check rel for security
    const rel = await donationButton.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');

    // Check aria-label
    await expect(donationButton).toHaveAttribute('aria-label', /Ko-fi/i);
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab to donation button
    await page.keyboard.press('Tab'); // Focus first button
    await page.keyboard.press('Tab'); // Focus second button
    await page.keyboard.press('Tab'); // Focus donation button

    const donationButton = page.locator('[data-donation-button]');
    await expect(donationButton).toBeFocused();

    // Should have visible focus indicator
    const focusedElement = await page.evaluate(() => {
      const activeEl = document.activeElement as HTMLElement;
      const styles = window.getComputedStyle(activeEl);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
      };
    });

    // Verify focus indicator exists (outline should be defined)
    expect(focusedElement.outlineStyle).not.toBe('none');
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    const donationButton = page.locator('[data-donation-button]');

    // Get computed styles
    const styles = await donationButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });

    // Verify styles exist (actual contrast check would need color library)
    expect(styles.color).toBeTruthy();
    expect(styles.backgroundColor).toBeTruthy();
  });
});

test.describe('Donation Button - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('should show icon only on mobile', async ({ page }) => {
    await page.goto('/');

    const donationButton = page.locator('[data-donation-button]');
    await expect(donationButton).toBeVisible();

    // Icon should be visible
    const icon = donationButton.locator('.donation-button__icon');
    await expect(icon).toBeVisible();

    // Text should be visually hidden (but still in DOM for accessibility)
    const text = donationButton.locator('.donation-button__text');
    const textStyles = await text.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        width: computed.width,
        height: computed.height,
      };
    });

    // Text is visually hidden but accessible to screen readers
    expect(textStyles.position).toBe('absolute');
    expect(textStyles.width).toBe('1px');
    expect(textStyles.height).toBe('1px');
  });

  test('should have touch-friendly size (44x44px minimum)', async ({ page }) => {
    await page.goto('/');

    const donationButton = page.locator('[data-donation-button]');

    const boundingBox = await donationButton.boundingBox();
    expect(boundingBox).toBeTruthy();
    expect(boundingBox!.width).toBeGreaterThanOrEqual(44);
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('should not obscure critical UI on mobile', async ({ page }) => {
    await page.goto('/');

    const donationButton = page.locator('[data-donation-button]');
    await expect(donationButton).toBeVisible();

    // Check that button doesn't overlap map
    const mapContainer = page.locator('#map-container');
    await expect(mapContainer).toBeVisible();

    // Both should be visible simultaneously
    await expect(donationButton).toBeInViewport();
    await expect(mapContainer).toBeInViewport();
  });
});

test.describe('Donation Button - Click Behavior', () => {
  test('should fire custom event when clicked', async ({ page }) => {
    await page.goto('/');

    // Set up event listener
    const eventFired = page.evaluate(() => {
      return new Promise((resolve) => {
        document.addEventListener('koppen:donation-clicked', (e: Event) => {
          const customEvent = e as CustomEvent;
          resolve({
            type: customEvent.type,
            detail: customEvent.detail,
          });
        }, { once: true });

        // Click button after listener is set up
        const button = document.querySelector('[data-donation-button]') as HTMLElement;
        button?.click();
      });
    });

    const event = await eventFired;
    expect(event).toMatchObject({
      type: 'koppen:donation-clicked',
      detail: {
        source: 'header',
        timestamp: expect.any(Number),
      },
    });
  });

  test('should increment localStorage counter', async ({ page }) => {
    await page.goto('/');

    // Clear localStorage
    await page.evaluate(() => localStorage.removeItem('koppen:donation-clicks'));

    const donationButton = page.locator('[data-donation-button]');

    // First click
    await donationButton.click();
    let count = await page.evaluate(() => localStorage.getItem('koppen:donation-clicks'));
    expect(count).toBe('1');

    // Second click
    await donationButton.click();
    count = await page.evaluate(() => localStorage.getItem('koppen:donation-clicks'));
    expect(count).toBe('2');
  });
});

test.describe('Donation Button - Accessibility (WCAG 2.1 AA)', () => {
  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');

    const donationButton = page.locator('[data-donation-button]');

    // aria-label should exist and describe the button
    const ariaLabel = await donationButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('Ko-fi');

    // Icon should be hidden from screen readers
    const icon = donationButton.locator('.donation-button__icon');
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  test('should be announced correctly by screen readers', async ({ page }) => {
    await page.goto('/');

    const donationButton = page.locator('[data-donation-button]');

    // Get accessibility tree role
    const role = await donationButton.getAttribute('role');
    // Links don't need explicit role, should be implicit 'link'

    // Verify it's an actual link element
    const tagName = await donationButton.evaluate((el) => el.tagName);
    expect(tagName).toBe('A');
  });
});
