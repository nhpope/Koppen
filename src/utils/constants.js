/**
 * Application Constants
 */

export const CONSTANTS = {
  // Map defaults
  DEFAULT_CENTER: [20, 0],
  DEFAULT_ZOOM: 2,
  MIN_ZOOM: 2,
  MAX_ZOOM: 10,

  // Data - Hybrid loading configuration
  CLIMATE_DATA_URL: '/koppen/data/climate.topojson',
  CLIMATE_BASE_LAYER_URL: '/koppen/data/climate-1deg.geojson',
  CLIMATE_TILE_INDEX_URL: '/koppen/data/tile-index.json',
  CLIMATE_DATA_DIR: '/koppen/data',
  GRID_RESOLUTION: 0.25,
  BASE_LAYER_RESOLUTION: 1.0,

  // Hybrid loading thresholds
  DETAIL_ZOOM_THRESHOLD: 5, // Switch to detail tiles at zoom >= 5
  TILE_SIZE: 10, // 10x10 degree tiles

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
