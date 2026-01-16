/**
 * Climate Data Loader - Hybrid loading with base layer + detail tiles
 */

/* eslint-disable security/detect-object-injection --
 * This file accesses climate data using tile coordinates and internal keys.
 * Keys are not user-controlled; they come from GeoJSON/TopoJSON data structures.
 * See docs/orchestration/checkpoints/security-review.md for full analysis.
 */

import * as topojson from 'topojson-client';
import { CONSTANTS } from './constants.js';
import logger from './logger.js';

let cachedData = null;
let loadingPromise = null;
let baseLayerData = null;
let tileIndex = null;
const loadedTiles = new Map(); // Cache for loaded tiles

/**
 * Load climate data from TopoJSON file (legacy support)
 * @returns {Promise<Object>} GeoJSON features
 */
export async function loadClimateData() {
  // Return cached data if available
  if (cachedData) {
    return cachedData;
  }

  // Return existing promise if loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  document.body.classList.add('is-loading');

  loadingPromise = (async () => {
    try {
      const response = await fetch(CONSTANTS.CLIMATE_DATA_URL);

      if (!response.ok) {
        throw new Error(`Failed to load climate data: ${response.status}`);
      }

      const topoData = await response.json();

      // Convert TopoJSON to GeoJSON
      const objectName = Object.keys(topoData.objects)[0];
      const geojson = topojson.feature(topoData, topoData.objects[objectName]);

      cachedData = geojson;

      // Dispatch success event
      document.dispatchEvent(new CustomEvent('koppen:data-loaded', {
        detail: { features: geojson.features.length },
      }));

      logger.log(`[Koppen] Climate data loaded: ${geojson.features.length} features`);

      return cachedData;
    } catch (error) {
      console.error('[Koppen] Failed to load climate data:', error);

      // Dispatch error event
      document.dispatchEvent(new CustomEvent('koppen:data-error', {
        detail: { error: error.message },
      }));

      throw error;
    } finally {
      document.body.classList.remove('is-loading');
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Load base layer (1° resolution) for initial view
 * @returns {Promise<Object>} GeoJSON features
 */
export async function loadBaseLayer() {
  if (baseLayerData) {
    return baseLayerData;
  }

  try {
    logger.log('[Koppen] Loading base layer (1° resolution)...');
    const response = await fetch(CONSTANTS.CLIMATE_BASE_LAYER_URL);

    if (!response.ok) {
      throw new Error(`Failed to load base layer: ${response.status}`);
    }

    baseLayerData = await response.json();
    logger.log(`[Koppen] Base layer loaded: ${baseLayerData.features.length} features`);

    return baseLayerData;
  } catch (error) {
    console.error('[Koppen] Failed to load base layer:', error);
    throw error;
  }
}

/**
 * Load tile index for detail tiles
 * @returns {Promise<Object>} Tile index
 */
export async function loadTileIndex() {
  if (tileIndex) {
    return tileIndex;
  }

  try {
    logger.log('[Koppen] Loading tile index...');
    const response = await fetch(CONSTANTS.CLIMATE_TILE_INDEX_URL);

    if (!response.ok) {
      throw new Error(`Failed to load tile index: ${response.status}`);
    }

    tileIndex = await response.json();
    logger.log(`[Koppen] Tile index loaded: ${tileIndex.tiles.length} tiles available`);

    return tileIndex;
  } catch (error) {
    console.error('[Koppen] Failed to load tile index:', error);
    throw error;
  }
}

/**
 * Load a specific detail tile
 * @param {string} tileFile - Tile filename from index
 * @returns {Promise<Object>} GeoJSON features
 */
export async function loadTile(tileFile) {
  // Check cache first
  if (loadedTiles.has(tileFile)) {
    return loadedTiles.get(tileFile);
  }

  try {
    // Build URL directly - no encoding needed, +/- work fine in URLs
    const url = `${CONSTANTS.CLIMATE_DATA_DIR}/${tileFile}`;
    logger.log(`[Koppen] Fetching tile: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load tile ${tileFile}: ${response.status}`);
    }

    const geojson = await response.json();

    // Cache the loaded tile
    loadedTiles.set(tileFile, geojson);

    logger.log(`[Koppen] Tile loaded: ${tileFile} (${geojson.features.length} features)`);

    return geojson;
  } catch (error) {
    console.error(`[Koppen] Failed to load tile ${tileFile}:`, error);
    throw error;
  }
}

/**
 * Check if a bounding box intersects with map bounds
 * Handles date line wrap-around (when map view crosses ±180°)
 * @param {Array} tileBbox - Tile bbox [minLon, minLat, maxLon, maxLat]
 * @param {L.LatLngBounds} mapBounds - Leaflet bounds
 * @returns {boolean}
 */
export function bboxIntersects(tileBbox, mapBounds) {
  const [minLon, minLat, maxLon, maxLat] = tileBbox;

  // Convert map bounds to simple bbox
  const mapMinLat = mapBounds.getSouth();
  const mapMaxLat = mapBounds.getNorth();
  const mapMinLon = mapBounds.getWest();
  const mapMaxLon = mapBounds.getEast();

  // Check latitude intersection first (always valid)
  const latIntersects = !(maxLat < mapMinLat || minLat > mapMaxLat);
  if (!latIntersects) {
    return false; // No latitude overlap, definitely no intersection
  }

  // Handle date line wrap-around
  if (mapMaxLon < mapMinLon) {
    // Map view crosses the international date line (±180°)
    // Split into two checks: eastern side (mapMinLon to 180) and western side (-180 to mapMaxLon)
    const intersectsEast = !(maxLon < mapMinLon || minLon > 180);
    const intersectsWest = !(maxLon < -180 || minLon > mapMaxLon);

    return intersectsEast || intersectsWest;
  }

  // Normal case (no wrap-around)
  return !(maxLon < mapMinLon || minLon > mapMaxLon);
}

/**
 * Get tiles that intersect with current map view
 * @param {L.LatLngBounds} bounds - Map bounds
 * @returns {Promise<Array>} Array of tile metadata
 */
export async function getTilesForBounds(bounds) {
  const index = await loadTileIndex();

  return index.tiles.filter(tile => bboxIntersects(tile.bbox, bounds));
}

/**
 * Get cached climate data (synchronous)
 * @returns {Object|null} Cached GeoJSON or null
 */
export function getClimateData() {
  return cachedData;
}

/**
 * Get base layer data
 * @returns {Object|null}
 */
export function getBaseLayerData() {
  return baseLayerData;
}

/**
 * Get number of loaded tiles
 * @returns {number}
 */
export function getLoadedTileCount() {
  return loadedTiles.size;
}

/**
 * Clear cached data
 */
export function clearCache() {
  cachedData = null;
  loadingPromise = null;
  baseLayerData = null;
  tileIndex = null;
  loadedTiles.clear();
}
