/**
 * Side-by-Side View Component
 * @module builder/side-by-side
 *
 * Story 5.4: Dual synchronized Leaflet instances for comparing custom vs Köppen
 */

import L from 'leaflet';
import { CONSTANTS } from '../utils/constants.js';

let state = {
  isActive: false,
  customMap: null,
  koppenMap: null,
  customLayer: null,
  koppenLayer: null,
  customClassification: null,
  koppenClassification: null,
  syncingPosition: false, // Prevent infinite loops during sync
  initialized: false,
};

/**
 * Initialize side-by-side mode
 * @param {Object} customClassification - Custom classification GeoJSON
 * @param {Object} koppenClassification - Köppen classification GeoJSON
 */
function init(customClassification, koppenClassification) {
  // Prevent duplicate initialization
  if (state.initialized) {
    console.warn('Side-by-side module already initialized');
    return;
  }

  state.customClassification = customClassification;
  state.koppenClassification = koppenClassification;
  state.initialized = true;
}

/**
 * Create side-by-side container and toggle button
 * @returns {HTMLElement} Container with toggle button
 */
function createUI() {
  try {
    const container = document.createElement('div');
    container.className = 'builder-panel__side-by-side';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'builder-panel__side-by-side-toggle';
  toggleBtn.textContent = 'Side by Side';
  toggleBtn.setAttribute('aria-pressed', 'false');
  toggleBtn.setAttribute('aria-label', 'Toggle side-by-side comparison view');

  // Hide on mobile
  if (window.innerWidth < 768) {
    toggleBtn.style.display = 'none';
  }

  toggleBtn.addEventListener('click', () => {
    if (state.isActive) {
      exitSideBySide();
    } else {
      enterSideBySide();
    }
  });

  // Re-check on window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
      toggleBtn.style.display = 'none';
      if (state.isActive) {
        exitSideBySide();
      }
    } else {
      toggleBtn.style.display = 'inline-block';
    }
  });

    container.appendChild(toggleBtn);

    return container;
  } catch (error) {
    console.error('Failed to create side-by-side UI:', error);
    // Return minimal fallback
    const fallback = document.createElement('div');
    fallback.className = 'builder-panel__side-by-side';
    return fallback;
  }
}

/**
 * Enter side-by-side mode
 */
function enterSideBySide() {
  if (state.isActive) return;
  if (!state.customClassification || !state.koppenClassification) {
    console.warn('[Side-by-Side] Missing classification data');
    return;
  }

  state.isActive = true;

  // Fire event
  document.dispatchEvent(
    new CustomEvent('koppen:side-by-side-entered', {
      detail: {
        customClassification: state.customClassification,
        koppenClassification: state.koppenClassification,
      },
    }),
  );

  // Create split view containers
  createSplitView();

  // Initialize both maps
  initializeMaps();

  // Update button state
  const toggleBtn = document.querySelector('.builder-panel__side-by-side-toggle');
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-pressed', 'true');
    toggleBtn.textContent = 'Exit Split View';
  }
}

/**
 * Exit side-by-side mode
 */
function exitSideBySide() {
  if (!state.isActive) return;

  state.isActive = false;

  // Destroy maps
  if (state.customMap) {
    state.customMap.remove();
    state.customMap = null;
  }
  if (state.koppenMap) {
    state.koppenMap.remove();
    state.koppenMap = null;
  }

  state.customLayer = null;
  state.koppenLayer = null;

  // Remove split view containers
  const splitContainer = document.querySelector('.side-by-side-container');
  if (splitContainer) {
    splitContainer.remove();
  }

  // Fire event
  document.dispatchEvent(new CustomEvent('koppen:side-by-side-exited'));

  // Update button state
  const toggleBtn = document.querySelector('.builder-panel__side-by-side-toggle');
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-pressed', 'false');
    toggleBtn.textContent = 'Side by Side';
  }
}

/**
 * Create split view DOM structure
 */
function createSplitView() {
  // Hide original map container
  const originalMapContainer = document.getElementById('map');
  if (originalMapContainer) {
    originalMapContainer.style.display = 'none';
  }

  // Create split container
  const splitContainer = document.createElement('div');
  splitContainer.className = 'side-by-side-container';

  // Left panel (Custom)
  const leftPanel = document.createElement('div');
  leftPanel.className = 'side-by-side-container__panel side-by-side-container__panel--left';

  const leftLabel = document.createElement('div');
  leftLabel.className = 'side-by-side-container__label';
  leftLabel.textContent = 'Custom Classification';

  const leftMap = document.createElement('div');
  leftMap.id = 'map-custom';
  leftMap.className = 'side-by-side-container__map';

  leftPanel.appendChild(leftLabel);
  leftPanel.appendChild(leftMap);

  // Right panel (Köppen)
  const rightPanel = document.createElement('div');
  rightPanel.className = 'side-by-side-container__panel side-by-side-container__panel--right';

  const rightLabel = document.createElement('div');
  rightLabel.className = 'side-by-side-container__label';
  rightLabel.textContent = 'Köppen Classification';

  const rightMap = document.createElement('div');
  rightMap.id = 'map-koppen';
  rightMap.className = 'side-by-side-container__map';

  rightPanel.appendChild(rightLabel);
  rightPanel.appendChild(rightMap);

  // Assemble
  splitContainer.appendChild(leftPanel);
  splitContainer.appendChild(rightPanel);

  // Insert into DOM
  const appContainer = document.querySelector('.koppen-app') || document.body;
  appContainer.appendChild(splitContainer);
}

/**
 * Initialize both Leaflet map instances
 */
function initializeMaps() {
  // Create custom map
  state.customMap = L.map('map-custom', {
    center: CONSTANTS.DEFAULT_CENTER,
    zoom: CONSTANTS.DEFAULT_ZOOM,
    minZoom: CONSTANTS.MIN_ZOOM,
    maxZoom: CONSTANTS.MAX_ZOOM,
    zoomControl: false, // Will be added manually
  });

  // Add zoom control to custom map
  L.control.zoom({ position: 'topleft' }).addTo(state.customMap);

  // Create Köppen map
  state.koppenMap = L.map('map-koppen', {
    center: CONSTANTS.DEFAULT_CENTER,
    zoom: CONSTANTS.DEFAULT_ZOOM,
    minZoom: CONSTANTS.MIN_ZOOM,
    maxZoom: CONSTANTS.MAX_ZOOM,
    zoomControl: false,
  });

  // Add base tiles to both maps
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
  const tileOptions = {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  };

  L.tileLayer(tileUrl, tileOptions).addTo(state.customMap);
  L.tileLayer(tileUrl, tileOptions).addTo(state.koppenMap);

  // Add classification layers
  state.customLayer = L.geoJSON(state.customClassification, {
    style: getFeatureStyle,
  }).addTo(state.customMap);

  state.koppenLayer = L.geoJSON(state.koppenClassification, {
    style: getFeatureStyle,
  }).addTo(state.koppenMap);

  // Synchronize map movements
  synchronizeMaps();

  // Fire maps ready event
  document.dispatchEvent(
    new CustomEvent('koppen:side-by-side-maps-ready', {
      detail: {
        customMap: state.customMap,
        koppenMap: state.koppenMap,
      },
    }),
  );
}

/**
 * Get feature style (same logic as main climate-layer.js)
 * @param {Object} feature - GeoJSON feature
 * @returns {Object} Leaflet style object
 */
function getFeatureStyle(feature) {
  const climateType = feature.properties?.climate_type;

  // Import colors dynamically (to avoid circular dependencies)
  const CLIMATE_COLORS = {
    Af: '#0000FF',
    Am: '#0078FF',
    Aw: '#46A9FF',
    As: '#82C8FF',
    BWh: '#FF0000',
    BWk: '#FF9696',
    BSh: '#F5A500',
    BSk: '#FFDC64',
    Csa: '#FFFF00',
    Csb: '#C8C800',
    Csc: '#969600',
    Cwa: '#96FF96',
    Cwb: '#64C864',
    Cwc: '#329632',
    Cfa: '#C8FF50',
    Cfb: '#64FF00',
    Cfc: '#32C800',
    Dsa: '#FF00FF',
    Dsb: '#C800C8',
    Dsc: '#960096',
    Dsd: '#640064',
    Dwa: '#AE9BFF',
    Dwb: '#8269FF',
    Dwc: '#6E3CFF',
    Dwd: '#5A0AFF',
    Dfa: '#00FFFF',
    Dfb: '#37C8FF',
    Dfc: '#007D7D',
    Dfd: '#004646',
    ET: '#B2B2B2',
    EF: '#686868',
  };

  const color = CLIMATE_COLORS[climateType] || '#CCCCCC';

  return {
    fillColor: color,
    fillOpacity: 0.7,
    color: '#ffffff',
    weight: 0.5,
    opacity: 0.5,
  };
}

/**
 * Synchronize zoom and pan between both maps
 */
function synchronizeMaps() {
  // Sync custom → Köppen
  state.customMap.on('move', () => {
    if (state.syncingPosition) return;
    state.syncingPosition = true;
    state.koppenMap.setView(state.customMap.getCenter(), state.customMap.getZoom(), {
      animate: false,
    });
    state.syncingPosition = false;
  });

  state.customMap.on('zoom', () => {
    if (state.syncingPosition) return;
    state.syncingPosition = true;
    state.koppenMap.setZoom(state.customMap.getZoom(), { animate: false });
    state.syncingPosition = false;
  });

  // Sync Köppen → custom
  state.koppenMap.on('move', () => {
    if (state.syncingPosition) return;
    state.syncingPosition = true;
    state.customMap.setView(state.koppenMap.getCenter(), state.koppenMap.getZoom(), {
      animate: false,
    });
    state.syncingPosition = false;
  });

  state.koppenMap.on('zoom', () => {
    if (state.syncingPosition) return;
    state.syncingPosition = true;
    state.customMap.setZoom(state.koppenMap.getZoom(), { animate: false });
    state.syncingPosition = false;
  });

  // Click synchronization
  state.customMap.on('click', (e) => {
    document.dispatchEvent(
      new CustomEvent('koppen:cell-clicked', {
        detail: { latlng: e.latlng, source: 'custom' },
      }),
    );
  });

  state.koppenMap.on('click', (e) => {
    document.dispatchEvent(
      new CustomEvent('koppen:cell-clicked', {
        detail: { latlng: e.latlng, source: 'koppen' },
      }),
    );
  });
}

/**
 * Update classifications (when thresholds change)
 * @param {Object} customClassification - New custom classification
 * @param {Object} koppenClassification - Köppen classification (unchanged)
 */
function updateClassifications(customClassification, koppenClassification) {
  state.customClassification = customClassification;
  state.koppenClassification = koppenClassification;

  if (!state.isActive) return;

  // Update custom layer
  if (state.customLayer && state.customMap) {
    state.customMap.removeLayer(state.customLayer);
    state.customLayer = L.geoJSON(customClassification, {
      style: getFeatureStyle,
    }).addTo(state.customMap);
  }

  // Update Köppen layer (usually doesn't change, but refresh anyway)
  if (state.koppenLayer && state.koppenMap) {
    state.koppenMap.removeLayer(state.koppenLayer);
    state.koppenLayer = L.geoJSON(koppenClassification, {
      style: getFeatureStyle,
    }).addTo(state.koppenMap);
  }

  document.dispatchEvent(new CustomEvent('koppen:side-by-side-updated'));
}

/**
 * Cleanup and destroy module
 */
function destroy() {
  if (state.isActive) {
    exitSideBySide();
  }

  state = {
    isActive: false,
    customMap: null,
    koppenMap: null,
    customLayer: null,
    koppenLayer: null,
    customClassification: null,
    koppenClassification: null,
    syncingPosition: false,
    initialized: false,
  };
}

export default {
  init,
  createUI,
  enterSideBySide,
  exitSideBySide,
  updateClassifications,
  destroy,
  getState: () => state,
};
