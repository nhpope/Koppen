/**
 * Climate Module - Köppen classification engine
 * @module climate
 */

import { KOPPEN_RULES } from './koppen-rules.js';
import { KOPPEN_PRESET } from './presets.js';
import logger from '../utils/logger.js';

let currentThresholds = null;

export default {
  /**
   * Initialize the climate module
   * @param {Object} _options - Configuration options
   */
  init(_options = {}) {
    // Load default Köppen preset
    currentThresholds = { ...KOPPEN_PRESET.thresholds };
    logger.log('[Koppen] Climate module initialized with Köppen preset');
  },

  /**
   * Get current classification thresholds
   * @returns {Object} Current thresholds
   */
  getThresholds() {
    return { ...currentThresholds };
  },

  /**
   * Set classification thresholds
   * @param {Object} thresholds - New thresholds
   */
  setThresholds(thresholds) {
    currentThresholds = { ...currentThresholds, ...thresholds };
    document.dispatchEvent(new CustomEvent('koppen:classification-changed', {
      detail: { thresholds: currentThresholds },
    }));
  },

  /**
   * Reset to Köppen preset
   */
  resetToKoppen() {
    currentThresholds = { ...KOPPEN_PRESET.thresholds };
    document.dispatchEvent(new CustomEvent('koppen:classification-changed', {
      detail: { thresholds: currentThresholds },
    }));
  },

  /**
   * Classify a location based on climate data
   * @param {Object} data - Climate data (temp, precip arrays)
   * @returns {string} Köppen climate type code
   */
  classify(data) {
    return KOPPEN_RULES.classify(data, currentThresholds);
  },

  /**
   * Get climate type info
   * @param {string} code - Köppen code (e.g., 'Cfa')
   * @returns {Object} Climate type information
   */
  getClimateInfo(code) {
    return KOPPEN_RULES.getClimateInfo(code);
  },

  /**
   * Destroy the module
   */
  destroy() {
    currentThresholds = null;
    logger.log('[Koppen] Climate module destroyed');
  },
};
