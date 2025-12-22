/**
 * Utils Module - Shared utilities
 * @module utils
 */

export { loadClimateData, getClimateData } from './data-loader.js';
export { CLIMATE_COLORS, getClimateColor } from './colors.js';
export { encodeState, decodeState } from './url-state.js';
export { CONSTANTS } from './constants.js';

export default {
  init() {
    console.log('[Koppen] Utils module initialized');
  },
  destroy() {
    console.log('[Koppen] Utils module destroyed');
  },
};
