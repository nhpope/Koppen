/**
 * Utils Module - Shared utilities
 * @module utils
 */

export { loadClimateData, getClimateData } from './data-loader.js';
export { CLIMATE_COLORS, getClimateColor } from './colors.js';
export { encodeState, decodeState } from './url-state.js';
export { CONSTANTS } from './constants.js';
import logger from './logger.js';

export default {
  init() {
    logger.log('[Koppen] Utils module initialized');
  },
  destroy() {
    logger.log('[Koppen] Utils module destroyed');
  },
};
