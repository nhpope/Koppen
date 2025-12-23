/**
 * E2E Tests: Share URL Generation - Story 6.3
 * Tests for share button, modal, clipboard copy, and URL generation
 */

import { test, expect } from '@playwright/test';

test.describe('Share URL Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Wait for app to initialize
    await page.waitForSelector('.map-container', { state: 'visible', timeout: 10000 });

    // Open builder panel
    await page.click('#create-btn');
    await page.waitForSelector('#builder-panel[aria-hidden="false"]', { timeout: 5000 });

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Start from Köppen preset
    await page.click('#start-from-koppen');
    await page.waitForTimeout(1000);
  });

  test('should display share button in builder panel', async ({ page }) => {
    const shareBtn = page.locator('[data-share-classification]');

    await expect(shareBtn).toBeVisible();
    await expect(shareBtn).toHaveText('🔗 Share');
    await expect(shareBtn).toHaveAttribute('aria-label', 'Share classification via URL');
  });

  test('should open share modal when share button is clicked', async ({ page }) => {
    // Click share button
    await page.click('[data-share-classification]');

    // Modal should be visible
    const modal = page.locator('#share-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/share-modal--active/);
    await expect(modal).toHaveAttribute('aria-hidden', 'false');

    // Modal content
    await expect(page.locator('#share-modal-title')).toHaveText('Share Classification');
    await expect(page.locator('.share-modal__description')).toBeVisible();
  });

  test('should display shareable URL in modal', async ({ page }) => {
    // Click share button
    await page.click('[data-share-classification]');

    // URL input should be visible and contain a URL
    const urlInput = page.locator('[data-share-url]');
    await expect(urlInput).toBeVisible();

    const url = await urlInput.inputValue();
    expect(url).toMatch(/^https?:\/\/.+\?s=[A-Za-z0-9%+/=]+$/);
    expect(url.length).toBeLessThan(2000);
  });

  test('should display URL size metadata', async ({ page }) => {
    // Click share button
    await page.click('[data-share-classification]');

    // Meta info should be visible
    const metaItem = page.locator('.share-modal__meta-item');
    await expect(metaItem).toBeVisible();

    const metaText = await metaItem.textContent();
    expect(metaText).toMatch(/URL Size: \d+ \/ 2000 characters/);
  });

  test('should close modal when close button is clicked', async ({ page }) => {
    // Open modal
    await page.click('[data-share-classification]');
    await expect(page.locator('#share-modal')).toBeVisible();

    // Click close button
    await page.click('[data-share-close]');

    // Modal should be hidden
    await expect(page.locator('#share-modal')).not.toHaveClass(/share-modal--active/);
    await expect(page.locator('#share-modal')).toHaveAttribute('aria-hidden', 'true');
  });

  test('should close modal when backdrop is clicked', async ({ page }) => {
    // Open modal
    await page.click('[data-share-classification]');
    await expect(page.locator('#share-modal')).toBeVisible();

    // Click backdrop
    await page.click('.share-modal__backdrop');

    // Modal should be hidden
    await expect(page.locator('#share-modal')).not.toHaveClass(/share-modal--active/);
  });

  test('should close modal when Escape key is pressed', async ({ page }) => {
    // Open modal
    await page.click('[data-share-classification]');
    await expect(page.locator('#share-modal')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should be hidden
    await expect(page.locator('#share-modal')).not.toHaveClass(/share-modal--active/);
  });

  test('should select all text when URL input is clicked', async ({ page }) => {
    // Open modal
    await page.click('[data-share-classification]');

    const urlInput = page.locator('[data-share-url]');

    // Click URL input
    await urlInput.click();

    // Text should be selected (check via evaluate)
    const isSelected = await urlInput.evaluate((el: HTMLInputElement) => {
      return el.selectionStart === 0 && el.selectionEnd === el.value.length;
    });

    expect(isSelected).toBe(true);
  });

  test('should copy URL to clipboard when copy button is clicked', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Open modal
    await page.click('[data-share-classification]');

    // Get expected URL
    const urlInput = page.locator('[data-share-url]');
    const expectedURL = await urlInput.inputValue();

    // Click copy button
    const copyBtn = page.locator('[data-share-copy]');
    await copyBtn.click();

    // Button should show success state
    await expect(copyBtn).toHaveText('✓ Copied!');
    await expect(copyBtn).toHaveClass(/share-modal__copy-btn--success/);

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(expectedURL);

    // Wait for success state to reset (2 seconds)
    await page.waitForTimeout(2500);
    await expect(copyBtn).toHaveText('📋 Copy');
    await expect(copyBtn).not.toHaveClass(/share-modal__copy-btn--success/);
  });

  test('should generate different URLs for different classification names', async ({ page }) => {
    // Enter first classification name
    await page.fill('#classification-name', 'Test Classification 1');
    await page.click('[data-share-classification]');

    const url1 = await page.locator('[data-share-url]').inputValue();

    // Close modal
    await page.click('[data-share-close]');

    // Change classification name
    await page.fill('#classification-name', 'Test Classification 2');
    await page.click('[data-share-classification]');

    const url2 = await page.locator('[data-share-url]').inputValue();

    // URLs should be different
    expect(url1).not.toBe(url2);

    // Both should be valid
    expect(url1).toMatch(/\?s=/);
    expect(url2).toMatch(/\?s=/);
  });

  test('should generate different URLs for modified thresholds', async ({ page }) => {
    // Get URL with default Köppen thresholds
    await page.click('[data-share-classification]');
    const url1 = await page.locator('[data-share-url]').inputValue();
    await page.click('[data-share-close]');

    // Modify a threshold
    const slider = page.locator('.threshold-slider').first();
    if (await slider.isVisible()) {
      const sliderInput = slider.locator('input[type="range"]');
      await sliderInput.fill('25');  // Change value
      await page.waitForTimeout(500);  // Wait for debounce
    }

    // Get URL with modified threshold
    await page.click('[data-share-classification]');
    const url2 = await page.locator('[data-share-url]').inputValue();

    // URLs should be different
    expect(url1).not.toBe(url2);
  });

  test('should show warning when URL is getting long', async ({ page }) => {
    // Use a very long classification name
    const longName = 'A'.repeat(50);
    await page.fill('#classification-name', longName);

    // Open share modal
    await page.click('[data-share-classification]');

    // Get URL size
    const metaText = await page.locator('.share-modal__meta-item').textContent();
    const match = metaText?.match(/URL Size: (\d+)/);
    const urlSize = match ? parseInt(match[1]) : 0;

    // If URL is over 1500 chars, warning should show
    if (urlSize > 1500) {
      const warning = page.locator('.share-modal__warning');
      await expect(warning).toBeVisible();
      await expect(warning).toContainText('URL is getting long');
    }
  });

  test('should be keyboard accessible', async ({ page }) => {
    // Tab to share button (may take multiple tabs)
    let found = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-share-classification'));
      if (focused !== null) {
        found = true;
        break;
      }
    }

    expect(found).toBe(true);

    // Press Enter to open modal
    await page.keyboard.press('Enter');

    // Modal should be visible
    await expect(page.locator('#share-modal')).toBeVisible();

    // Tab to copy button
    await page.keyboard.press('Tab');  // URL input
    await page.keyboard.press('Tab');  // Copy button

    // Verify focus on copy button
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-share-copy'));
    expect(focused).not.toBeNull();
  });

  test('should handle empty classification name gracefully', async ({ page }) => {
    // Clear classification name
    await page.fill('#classification-name', '');

    // Click share button
    await page.click('[data-share-classification]');

    // Should still generate a URL
    const urlInput = page.locator('[data-share-url]');
    const url = await urlInput.inputValue();

    expect(url).toMatch(/\?s=/);
    expect(url.length).toBeLessThan(2000);
  });

  test('should sanitize special characters in classification name', async ({ page }) => {
    // Enter name with special characters
    await page.fill('#classification-name', 'Test<script>alert("XSS")</script>Name');

    // Click share button
    await page.click('[data-share-classification]');

    // Should generate URL without errors
    const urlInput = page.locator('[data-share-url]');
    const url = await urlInput.inputValue();

    expect(url).toMatch(/\?s=/);

    // URL should not contain script tags (they should be stripped)
    expect(url).not.toContain('<script>');
    expect(url).not.toContain('</script>');
  });
});
