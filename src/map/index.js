/**
 * Map Module - Leaflet integration and layer management
 * @module map
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CONSTANTS } from '../utils/constants.js';
import { loadClimateData } from '../utils/data-loader.js';
import {
  createClimateLayer,
  removeClimateLayer,
  filterByType,
  clearFilter,
  getActiveFilter,
  reclassify,
  deselectCell,
} from './climate-layer.js';

let map = null;

/**
 * Initialize the map
 * @param {string} containerId - ID of container element
 * @param {Object} options - Map options
 * @returns {Promise<L.Map>} Leaflet map instance
 */
async function init(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Map container '${containerId}' not found`);
  }

  const defaultOptions = {
    center: CONSTANTS.DEFAULT_CENTER,
    zoom: CONSTANTS.DEFAULT_ZOOM,
    minZoom: CONSTANTS.MIN_ZOOM,
    maxZoom: CONSTANTS.MAX_ZOOM,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Create map
  map = L.map(container, {
    center: mergedOptions.center,
    zoom: mergedOptions.zoom,
    minZoom: mergedOptions.minZoom,
    maxZoom: mergedOptions.maxZoom,
    worldCopyJump: true,
    scrollWheelZoom: true,
    zoomControl: true,
  });

  // Add base tile layer (CartoDB Positron - neutral, no labels)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map);

  // Set up map events
  setupMapEvents();

  // Fire map ready event
  document.dispatchEvent(new CustomEvent('koppen:map-ready', {
    detail: { map },
  }));

  console.log('[Koppen] Map initialized');

  // Load climate data
  try {
    const geojson = await loadClimateData();
    if (geojson && geojson.features) {
      createClimateLayer(geojson, map);
    }
  } catch (error) {
    console.error('[Koppen] Failed to load climate data:', error);
  }

  return map;
}

/**
 * Set up map event handlers
 */
function setupMapEvents() {
  // View change events
  map.on('moveend', () => {
    const center = map.getCenter();
    const zoom = map.getZoom();

    document.dispatchEvent(new CustomEvent('koppen:view-changed', {
      detail: {
        lat: center.lat,
        lng: center.lng,
        zoom,
      },
    }));
  });

  // Resize handling
  map.on('resize', () => {
    map.invalidateSize();
  });

  // Listen for filter requests from legend
  document.addEventListener('koppen:climate-selected', (e) => {
    // Only filter if selection came from legend (not map)
    if (!e.detail.fromMap) {
      if (e.detail.type) {
        filterByType(e.detail.type);
      } else {
        clearFilter();
      }
    }
  });

  // Listen for deselection
  document.addEventListener('koppen:climate-deselected', () => {
    clearFilter();
  });

  // Listen for reclassification requests
  document.addEventListener('koppen:reclassify', (e) => {
    if (e.detail.thresholds) {
      reclassify(e.detail.thresholds);
    }
  });
}

/**
 * Get the Leaflet map instance
 * @returns {L.Map|null}
 */
function getMap() {
  return map;
}

/**
 * Set the map view
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} zoom - Zoom level
 */
function setView(lat, lng, zoom) {
  if (map) {
    map.setView([lat, lng], zoom);
  }
}

/**
 * Get current view
 * @returns {Object} { lat, lng, zoom }
 */
function getView() {
  if (!map) return null;
  const center = map.getCenter();
  return {
    lat: center.lat,
    lng: center.lng,
    zoom: map.getZoom(),
  };
}

/**
 * Invalidate map size (call after container resize)
 */
function invalidateSize() {
  if (map) {
    map.invalidateSize();
  }
}

/**
 * Pan to a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
function panTo(lat, lng) {
  if (map) {
    map.panTo([lat, lng]);
  }
}

/**
 * Fly to a location with animation
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} zoom - Zoom level
 */
function flyTo(lat, lng, zoom) {
  if (map) {
    map.flyTo([lat, lng], zoom || map.getZoom());
  }
}

/**
 * Destroy the map instance
 */
function destroy() {
  if (map) {
    removeClimateLayer();
    map.remove();
    map = null;
    console.log('[Koppen] Map destroyed');
  }
}

export default {
  init,
  getMap,
  setView,
  getView,
  invalidateSize,
  panTo,
  flyTo,
  destroy,
  // Re-export climate layer functions
  filterByType,
  clearFilter,
  getActiveFilter,
  reclassify,
  deselectCell,
};
