/**
 * Köppen Preset Loader Module
 * @module builder/preset-loader
 */

import {
  KOPPEN_PRESET,
  validatePreset,
  getThresholdValues,
} from '../climate/presets.js';
import logger from '../utils/logger.js';

let currentPreset = null;

export default {
  /**
   * Load Köppen preset into builder
   * @returns {Promise<Object>} Preset data with thresholds
   */
  async loadKoppenPreset() {
    try {
      // Validate structure
      validatePreset(KOPPEN_PRESET);

      // Deep clone to prevent mutation of original
      currentPreset = JSON.parse(JSON.stringify(KOPPEN_PRESET));
      currentPreset.metadata.loaded_at = new Date().toISOString();
      currentPreset.metadata.source = 'preset';

      logger.log('[Koppen] Köppen preset loaded:', currentPreset.name);

      // Fire event with preset data
      document.dispatchEvent(
        new CustomEvent('koppen:preset-loaded', {
          detail: {
            preset: currentPreset,
            thresholds: getThresholdValues(currentPreset),
          },
        }),
      );

      return currentPreset;
    } catch (error) {
      console.error('[Koppen] Failed to load Köppen preset:', error);

      document.dispatchEvent(
        new CustomEvent('koppen:preset-load-error', {
          detail: { error: error.message },
        }),
      );

      throw error;
    }
  },

  /**
   * Get currently loaded preset
   * @returns {Object|null} Current preset or null if none loaded
   */
  getCurrentPreset() {
    return currentPreset;
  },

  /**
   * Check if preset has been modified
   * @returns {boolean} True if modified
   */
  isModified() {
    return currentPreset?.metadata?.modified || false;
  },

  /**
   * Mark preset as modified
   */
  markModified() {
    if (currentPreset) {
      currentPreset.metadata.modified = true;
      logger.log('[Koppen] Preset marked as modified');
    }
  },

  /**
   * Reset to original Köppen values
   * @returns {Promise<Object>} Fresh preset data
   */
  resetToKoppen() {
    logger.log('[Koppen] Resetting to original Köppen values');
    return this.loadKoppenPreset();
  },

  /**
   * Clear module state (for testing)
   */
  _reset() {
    currentPreset = null;
  },
};
