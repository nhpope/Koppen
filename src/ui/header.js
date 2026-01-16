/**
 * Header Module - Donation button and header interactions
 * Story 6.8: Ko-fi Donation Button
 * @module ui/header
 */

import logger from '../utils/logger.js';

export default {
  /**
   * Initialize header components
   */
  init() {
    this.initDonationButton();
    logger.log('[Koppen] Header module initialized');
  },

  /**
   * Initialize donation button click tracking
   * Privacy-respecting: only aggregate data, no personal information
   */
  initDonationButton() {
    const donationButton = document.querySelector('[data-donation-button]');

    if (!donationButton) {
      console.warn('[Koppen] Donation button not found');
      return;
    }

    // Track clicks (aggregate only, no user data)
    donationButton.addEventListener('click', () => {
      // Fire custom event for analytics
      document.dispatchEvent(new CustomEvent('koppen:donation-clicked', {
        detail: {
          timestamp: Date.now(),
          source: 'header',
          // NO personal data: no userId, no IP, no userAgent, no fingerprinting
        },
      }));

      // Log to console (for debugging)
      logger.log('[Koppen] Donation button clicked');

      // Track aggregate click count (privacy-respecting)
      this.trackDonationClick();

      // Note: Link opens Ko-fi in new tab (native browser behavior)
      // No need to prevent default or handle programmatically
    });

    logger.log('[Koppen] Donation button initialized');
  },

  /**
   * Track donation button clicks (privacy-respecting, aggregate only)
   * No personal data collected - only total click count
   */
  trackDonationClick() {
    // Aggregate tracking only (privacy-respecting)
    // No personal data, no user IDs, no IP addresses

    // Increment counter in localStorage (aggregate count only)
    const clickCount = parseInt(localStorage.getItem('koppen:donation-clicks') || '0');
    localStorage.setItem('koppen:donation-clicks', (clickCount + 1).toString());

    // Optional: Send to analytics (if privacy-respecting analytics enabled)
    // Only send if explicitly enabled and using privacy-safe service (Plausible, Fathom, etc.)
    if (window.KOPPEN_ANALYTICS_ENABLED) {
      window.trackEvent?.('donation', 'click', {
        source: 'header',
        aggregate: true, // No user identification
      });
    }
  },

  /**
   * Destroy header module (cleanup)
   */
  destroy() {
    // Remove event listeners if needed
    // Currently using native link, so no cleanup required
    logger.log('[Koppen] Header module destroyed');
  },
};
