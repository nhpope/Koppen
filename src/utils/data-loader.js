/**
 * Climate Data Loader
 */

import * as topojson from 'topojson-client';
import { CONSTANTS } from './constants.js';

let cachedData = null;
let loadingPromise = null;

/**
 * Load climate data from TopoJSON file
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

      console.log(`[Koppen] Climate data loaded: ${geojson.features.length} features`);

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
 * Get cached climate data (synchronous)
 * @returns {Object|null} Cached GeoJSON or null
 */
export function getClimateData() {
  return cachedData;
}

/**
 * Clear cached data
 */
export function clearCache() {
  cachedData = null;
  loadingPromise = null;
}
