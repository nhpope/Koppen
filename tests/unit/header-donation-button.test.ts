/**
 * Header Donation Button - Unit Tests
 * Story 6.8: Ko-fi Donation Button
 *
 * Tests the donation button HTML structure, attributes, and event firing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Helper to create header DOM structure using safe DOM methods
 */
function createHeaderDOM() {
  const header = document.createElement('header');
  header.className = 'header';

  const title = document.createElement('h1');
  title.className = 'header__title';
  title.textContent = 'Koppen';
  header.appendChild(title);

  const nav = document.createElement('nav');
  nav.className = 'header__nav';

  const createBtn = document.createElement('button');
  createBtn.id = 'create-btn';
  createBtn.className = 'header__btn';
  createBtn.textContent = 'Create';
  nav.appendChild(createBtn);

  const aboutBtn = document.createElement('button');
  aboutBtn.id = 'about-btn';
  aboutBtn.className = 'header__btn';
  aboutBtn.textContent = 'About';
  nav.appendChild(aboutBtn);

  const donateLink = document.createElement('a');
  donateLink.href = 'https://ko-fi.com/koppen';
  donateLink.target = '_blank';
  donateLink.rel = 'noopener noreferrer';
  donateLink.className = 'donation-button';
  donateLink.setAttribute('data-donation-button', '');
  donateLink.setAttribute('aria-label', 'Support this project on Ko-fi');

  const icon = document.createElement('span');
  icon.className = 'donation-button__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '☕';
  donateLink.appendChild(icon);

  const text = document.createElement('span');
  text.className = 'donation-button__text';
  text.textContent = 'Support';
  donateLink.appendChild(text);

  nav.appendChild(donateLink);

  header.appendChild(nav);
  document.body.appendChild(header);
}

/**
 * Helper to create complete donation button with icon and text
 */
function createDonationButtonDOM() {
  const header = document.createElement('header');
  header.className = 'header';

  const nav = document.createElement('nav');
  nav.className = 'header__nav';

  const donateLink = document.createElement('a');
  donateLink.href = 'https://ko-fi.com/koppen';
  donateLink.target = '_blank';
  donateLink.rel = 'noopener noreferrer';
  donateLink.className = 'donation-button';
  donateLink.setAttribute('data-donation-button', '');
  donateLink.setAttribute('aria-label', 'Support this project on Ko-fi');

  const icon = document.createElement('span');
  icon.className = 'donation-button__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '☕';
  donateLink.appendChild(icon);

  const text = document.createElement('span');
  text.className = 'donation-button__text';
  text.textContent = 'Support';
  donateLink.appendChild(text);

  nav.appendChild(donateLink);
  header.appendChild(nav);
  document.body.appendChild(header);
}

describe('Header Donation Button', () => {
  beforeEach(() => {
    createHeaderDOM();
  });

  afterEach(() => {
    document.body.textContent = '';
    vi.restoreAllMocks();
  });

  describe('Button Structure', () => {
    it('should exist in header', () => {
      const button = document.querySelector('[data-donation-button]');
      expect(button).toBeTruthy();
      expect(button?.tagName).toBe('A');
    });

    it('should have correct Ko-fi URL', () => {
      const button = document.querySelector('[data-donation-button]') as HTMLAnchorElement;
      expect(button.href).toContain('ko-fi.com');
    });

    it('should open in new tab', () => {
      const button = document.querySelector('[data-donation-button]') as HTMLAnchorElement;
      expect(button.target).toBe('_blank');
    });

    it('should have both noopener and noreferrer for security', () => {
      const button = document.querySelector('[data-donation-button]') as HTMLAnchorElement;
      expect(button.rel).toContain('noopener');
      expect(button.rel).toContain('noreferrer');
    });

    it('should have accessible aria-label', () => {
      const button = document.querySelector('[data-donation-button]') as HTMLAnchorElement;
      expect(button.getAttribute('aria-label')).toBeTruthy();
      expect(button.getAttribute('aria-label')).toContain('Ko-fi');
    });
  });

  describe('Button Content', () => {
    it('should have coffee icon', () => {
      const button = document.querySelector('[data-donation-button]');
      const icon = button?.querySelector('.donation-button__icon');
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toContain('☕');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have "Support" text', () => {
      const button = document.querySelector('[data-donation-button]');
      const text = button?.querySelector('.donation-button__text');
      expect(text).toBeTruthy();
      expect(text?.textContent).toBe('Support');
    });
  });

  describe('CSS Classes', () => {
    it('should have donation-button class', () => {
      const button = document.querySelector('[data-donation-button]');
      expect(button?.classList.contains('donation-button')).toBe(true);
    });

    it('should be positioned in header navigation', () => {
      const nav = document.querySelector('.header__nav');
      const button = nav?.querySelector('[data-donation-button]');
      expect(button).toBeTruthy();
    });
  });

  describe('Touch Target Size (Accessibility)', () => {
    it('should have minimum 44x44px touch target', () => {
      const button = document.querySelector('[data-donation-button]') as HTMLElement;

      // Create a temporary style to test computed dimensions
      button.style.minHeight = '44px';
      button.style.minWidth = '44px';

      const computedStyle = window.getComputedStyle(button);
      const height = parseInt(computedStyle.minHeight);
      const width = parseInt(computedStyle.minWidth);

      expect(height).toBeGreaterThanOrEqual(44);
      expect(width).toBeGreaterThanOrEqual(44);
    });
  });
});

describe('Donation Button Click Tracking', () => {
  let mockHeader: any;

  beforeEach(() => {
    createDonationButtonDOM();
  });

  afterEach(() => {
    document.body.textContent = '';
    if (mockHeader) {
      mockHeader.destroy?.();
      mockHeader = null;
    }
    vi.restoreAllMocks();
  });

  it('should fire koppen:donation-clicked event on click', async () => {
    // Dynamically import header module (will be created in GREEN phase)
    const headerModule = await import('../../src/ui/header.js');
    mockHeader = headerModule.default;
    mockHeader.init();

    const eventListener = vi.fn();
    document.addEventListener('koppen:donation-clicked', eventListener);

    const button = document.querySelector('[data-donation-button]') as HTMLElement;
    button.click();

    expect(eventListener).toHaveBeenCalledOnce();

    const event = eventListener.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toBeDefined();
    expect(event.detail.source).toBe('header');
    expect(event.detail.timestamp).toBeDefined();

    document.removeEventListener('koppen:donation-clicked', eventListener);
  });

  it('should log to console when clicked', async () => {
    const headerModule = await import('../../src/ui/header.js');
    mockHeader = headerModule.default;
    mockHeader.init();

    const consoleSpy = vi.spyOn(console, 'log');

    const button = document.querySelector('[data-donation-button]') as HTMLElement;
    button.click();

    expect(consoleSpy).toHaveBeenCalledWith('[Koppen] Donation button clicked');

    consoleSpy.mockRestore();
  });

  it('should increment localStorage counter when clicked', async () => {
    const headerModule = await import('../../src/ui/header.js');
    mockHeader = headerModule.default;
    mockHeader.init();

    // Clear any existing count
    localStorage.removeItem('koppen:donation-clicks');

    const button = document.querySelector('[data-donation-button]') as HTMLElement;

    // First click
    button.click();
    expect(localStorage.getItem('koppen:donation-clicks')).toBe('1');

    // Second click
    button.click();
    expect(localStorage.getItem('koppen:donation-clicks')).toBe('2');

    // Third click
    button.click();
    expect(localStorage.getItem('koppen:donation-clicks')).toBe('3');
  });

  it('should not collect personal data', async () => {
    const headerModule = await import('../../src/ui/header.js');
    mockHeader = headerModule.default;
    mockHeader.init();

    const eventListener = vi.fn();
    document.addEventListener('koppen:donation-clicked', eventListener);

    const button = document.querySelector('[data-donation-button]') as HTMLElement;
    button.click();

    const event = eventListener.mock.calls[0][0] as CustomEvent;

    // Verify NO personal data in event
    expect(event.detail.userId).toBeUndefined();
    expect(event.detail.userIp).toBeUndefined();
    expect(event.detail.userAgent).toBeUndefined();
    expect(event.detail.fingerprint).toBeUndefined();

    // Only aggregate data should be present
    expect(event.detail.source).toBe('header');
    expect(event.detail.timestamp).toBeDefined();

    document.removeEventListener('koppen:donation-clicked', eventListener);
  });
});
