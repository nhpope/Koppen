/**
 * Application Constants
 */

export const CONSTANTS = {
  // Map defaults
  DEFAULT_CENTER: [20, 0],
  DEFAULT_ZOOM: 2,
  MIN_ZOOM: 2,
  MAX_ZOOM: 10,

  // Data
  CLIMATE_DATA_URL: '/data/climate.topojson',
  GRID_RESOLUTION: 0.25,

  // Performance
  DEBOUNCE_MS: 50,
  CLASSIFICATION_DEBOUNCE_MS: 100,

  // UI
  INFO_PANEL_WIDTH: 320,
  BUILDER_PANEL_WIDTH: 360,
  LEGEND_COLLAPSED_WIDTH: 40,

  // Export
  WATERMARK_TEXT: 'Made with Koppen - koppen.app',
  MAX_URL_LENGTH: 2000,

  // Events namespace
  EVENT_PREFIX: 'koppen:',
};
