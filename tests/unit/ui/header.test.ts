/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import header from '../../../src/ui/header.js';
import logger from '../../../src/utils/logger.js';

describe('Header Module (Story 6.8)', () => {
  let donationButton: HTMLAnchorElement;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup DOM with donation button
    donationButton = document.createElement('a');
    donationButton.setAttribute('data-donation-button', '');
    donationButton.href = 'https://ko-fi.com/test';
    document.body.appendChild(donationButton);

    // Clear localStorage
    localStorage.clear();

    // Reset window properties
    // @ts-expect-error - Deleting test properties from window
    delete window.KOPPEN_ANALYTICS_ENABLED;
    // @ts-expect-error - Deleting test properties from window
    delete window.trackEvent;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('init', () => {
    it('should initialize without error', () => {
      expect(() => header.init()).not.toThrow();
    });

    it('should log initialization message', () => {
      header.init();
      expect(logger.log).toHaveBeenCalledWith('[Koppen] Header module initialized');
    });

    it('should call initDonationButton', () => {
      const spy = vi.spyOn(header, 'initDonationButton');
      header.init();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('initDonationButton', () => {
    it('should log success when button found', () => {
      header.initDonationButton();
      expect(logger.log).toHaveBeenCalledWith('[Koppen] Donation button initialized');
    });

    it('should warn when donation button not found', () => {
      document.body.innerHTML = '';
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      header.initDonationButton();

      expect(consoleWarnSpy).toHaveBeenCalledWith('[Koppen] Donation button not found');
      consoleWarnSpy.mockRestore();
    });

    it('should attach click listener to donation button', () => {
      const addEventListenerSpy = vi.spyOn(donationButton, 'addEventListener');

      header.initDonationButton();

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('donation button click behavior', () => {
    beforeEach(() => {
      header.initDonationButton();
    });

    it('should dispatch koppen:donation-clicked event', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:donation-clicked', eventListener);

      donationButton.click();

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail).toHaveProperty('timestamp');
      expect(eventListener.mock.calls[0][0].detail.source).toBe('header');

      document.removeEventListener('koppen:donation-clicked', eventListener);
    });

    it('should log click message', () => {
      donationButton.click();
      expect(logger.log).toHaveBeenCalledWith('[Koppen] Donation button clicked');
    });

    it('should call trackDonationClick', () => {
      const spy = vi.spyOn(header, 'trackDonationClick');

      donationButton.click();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('trackDonationClick', () => {
    it('should increment click count in localStorage', () => {
      expect(localStorage.getItem('koppen:donation-clicks')).toBeNull();

      header.trackDonationClick();
      expect(localStorage.getItem('koppen:donation-clicks')).toBe('1');

      header.trackDonationClick();
      expect(localStorage.getItem('koppen:donation-clicks')).toBe('2');

      header.trackDonationClick();
      expect(localStorage.getItem('koppen:donation-clicks')).toBe('3');
    });

    it('should handle existing click count', () => {
      localStorage.setItem('koppen:donation-clicks', '10');

      header.trackDonationClick();

      expect(localStorage.getItem('koppen:donation-clicks')).toBe('11');
    });

    it('should NOT call window.trackEvent when analytics disabled', () => {
      const mockTrackEvent = vi.fn();
      // @ts-expect-error - Adding test property to window
      window.trackEvent = mockTrackEvent;
      // KOPPEN_ANALYTICS_ENABLED is not set (undefined)

      header.trackDonationClick();

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });

    it('should call window.trackEvent when analytics enabled', () => {
      const mockTrackEvent = vi.fn();
      // @ts-expect-error - Adding test property to window
      window.KOPPEN_ANALYTICS_ENABLED = true;
      // @ts-expect-error - Adding test property to window
      window.trackEvent = mockTrackEvent;

      header.trackDonationClick();

      expect(mockTrackEvent).toHaveBeenCalledWith('donation', 'click', {
        source: 'header',
        aggregate: true,
      });
    });
  });

  describe('destroy', () => {
    it('should log destroy message', () => {
      header.destroy();
      expect(logger.log).toHaveBeenCalledWith('[Koppen] Header module destroyed');
    });

    it('should not throw errors', () => {
      expect(() => header.destroy()).not.toThrow();
    });
  });

  describe('Privacy compliance', () => {
    beforeEach(() => {
      header.initDonationButton();
    });

    it('should NOT include personal data in event detail', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:donation-clicked', eventListener);

      donationButton.click();

      const detail = eventListener.mock.calls[0][0].detail;
      expect(detail).not.toHaveProperty('userId');
      expect(detail).not.toHaveProperty('ip');
      expect(detail).not.toHaveProperty('userAgent');
      expect(detail).not.toHaveProperty('fingerprint');

      document.removeEventListener('koppen:donation-clicked', eventListener);
    });

    it('should only store aggregate count', () => {
      header.trackDonationClick();
      header.trackDonationClick();

      // Check localStorage only has click count
      const keys = Object.keys(localStorage);
      const koppenKeys = keys.filter(k => k.startsWith('koppen:'));

      expect(koppenKeys).toEqual(['koppen:donation-clicks']);
      expect(localStorage.getItem('koppen:donation-clicks')).toMatch(/^\d+$/);
    });
  });
});
