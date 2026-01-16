/**
 * URL State Management - Stories 6.4, 6.7
 * Story 6.4: Basic state loading from shared URLs
 * Story 6.7: Full state synchronization and persistence
 * @module utils/url-state
 */

import { decodeURL, hasSharedState, generateURL } from '../export/url-encoder.js';
import { debounce } from './debounce.js';
import logger from './logger.js';

/**
 * Encode classification state to URL-safe string (DEPRECATED)
 * Use generateURL() from url-encoder.js instead
 * @param {Object} state - Classification state
 * @returns {string} Encoded string
 */
export function encodeState(state) {
  try {
    const json = JSON.stringify(state);
    return btoa(json);
  } catch (e) {
    console.error('[Koppen] Failed to encode state:', e);
    return '';
  }
}

/**
 * Decode URL state to object (DEPRECATED - backward compatibility)
 * @param {string} encoded - Encoded string
 * @returns {Object|null} Decoded state
 */
export function decodeState(encoded) {
  try {
    const json = atob(encoded);
    return JSON.parse(json);
  } catch (e) {
    console.error('[Koppen] Failed to decode state:', e);
    return null;
  }
}

/**
 * Get state from current URL (Story 6.4)
 * Supports both new compressed format (?s=) and old format (?rules=)
 * @returns {Object|null} State from URL or null
 */
export function getStateFromURL() {
  try {
    // Try new compressed format first (?s=) - Story 6.3
    if (hasSharedState()) {
      const state = decodeURL();
      if (state) {
        logger.log(`[Koppen] Loaded shared classification: "${state.name}"`);
        return state;
      }
    }

    // Fallback to old format (?rules=) for backward compatibility
    const params = new URLSearchParams(window.location.search);
    const rules = params.get('rules');

    if (!rules) return null;

    console.warn('[Koppen] Using deprecated URL format. URLs will be migrated to compressed format.');

    const thresholds = decodeState(rules);
    if (!thresholds) return null;

    const state = {
      name: params.get('name') ? decodeURIComponent(params.get('name')) : 'Shared Classification',
      thresholds,
      metadata: {
        source: 'url-legacy',
        loaded_at: new Date().toISOString(),
        modified: false,
      },
    };

    // Parse view parameter if present
    const view = params.get('view');
    if (view) {
      const [lat, lng, zoom] = view.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoom)) {
        state.view = { lat, lng, zoom };
      }
    }

    return state;
  } catch (error) {
    console.error('[Koppen] Failed to load state from URL:', error);

    // Fire error event
    document.dispatchEvent(new CustomEvent('koppen:url-decode-failed', {
      detail: { error: error.message },
    }));

    return null;
  }
}

/**
 * Update URL with current state
 * @param {Object} state - State to encode
 * @param {boolean} replace - Replace history instead of push
 */
export function updateURL(state, replace = false) {
  const params = new URLSearchParams();

  if (state.thresholds) {
    params.set('rules', encodeState(state.thresholds));
  }

  if (state.name) {
    params.set('name', encodeURIComponent(state.name));
  }

  if (state.view) {
    params.set('view', `${state.view.lat},${state.view.lng},${state.view.zoom}`);
  }

  const url = `${window.location.pathname}?${params.toString()}`;

  if (replace) {
    window.history.replaceState(state, '', url);
  } else {
    window.history.pushState(state, '', url);
  }
}

/**
 * Clear URL state
 */
export function clearURLState() {
  window.history.replaceState({}, '', window.location.pathname);
}

// ===== Story 6.7: Full State Synchronization =====

/**
 * Default application state
 */
const DEFAULT_STATE = {
  view: { lat: 0, lng: 0, zoom: 2 },
  filter: null,
  selected: null,
  classification: null,
};

/** Current application state */
let currentState = { ...DEFAULT_STATE };

/** Flag to prevent update loops during state restoration */
let isRestoring = false;

/** Reserved: Debounced URL update function (for continuous events like map pan) */
const _DEBOUNCED_URL_UPDATE = null;

/**
 * Initialize state synchronization (Story 6.7)
 * Sets up event listeners for state changes and browser navigation
 */
export function initStateSync() {
  // Restore state from URL on page load
  restoreStateFromURL();

  // Listen for state change events from all modules
  listenForStateChanges();

  // Listen for browser navigation (back/forward)
  listenForNavigation();

  logger.log('[Koppen] URL state synchronization initialized');
}

/**
 * Listen for state change events from all modules
 */
function listenForStateChanges() {
  // Map view changes (debounced - continuous event)
  const mapMoveHandler = debounce((e) => {
    if (isRestoring) return;

    const { lat, lng, zoom } = e.detail;
    updateURLState({ view: { lat, lng, zoom } }, { immediate: false });
  }, 500); // 500ms debounce for smooth panning

  document.addEventListener('koppen:map-moved', mapMoveHandler);

  // Filter changes (immediate - discrete event)
  document.addEventListener('koppen:filter-changed', (e) => {
    if (isRestoring) return;

    updateURLState({ filter: e.detail.activeTypes }, { immediate: true });
  });

  // Climate selection (immediate - discrete event)
  document.addEventListener('koppen:climate-selected', (e) => {
    if (isRestoring) return;

    updateURLState({ selected: e.detail.climateCode }, { immediate: true });
  });

  // Classification changes (immediate - discrete event)
  document.addEventListener('koppen:classification-changed', (e) => {
    if (isRestoring) return;

    updateURLState({ classification: e.detail.classification }, { immediate: true });
  });

  logger.log('[Koppen] State change listeners registered');
}

/**
 * Update URL with new state (Story 6.7)
 * @param {Object} newState - Partial state to update
 * @param {Object} options - Update options
 * @param {boolean} options.immediate - If true, use pushState (discrete event). If false, use replaceState (continuous event)
 */
function updateURLState(newState, options = {}) {
  const { immediate = false } = options;

  // Merge with current state
  currentState = { ...currentState, ...newState };

  // Build URL from state
  const url = buildURLFromState(currentState);

  // Update browser URL
  if (immediate) {
    // Discrete change: add to history (allows back/forward navigation)
    window.history.pushState(currentState, '', url);
  } else {
    // Continuous change: replace history entry (prevents history spam)
    window.history.replaceState(currentState, '', url);
  }

  logger.log('[Koppen] URL updated:', url);
}

/**
 * Build URL from application state
 * Only includes non-default values to keep URL short
 * @param {Object} state - Application state
 * @returns {string} URL with query parameters
 */
function buildURLFromState(state) {
  const params = new URLSearchParams();

  // View parameter (only if non-default)
  if (state.view && !isDefaultView(state.view)) {
    const { lat, lng, zoom } = state.view;
    params.set('v', `${lat.toFixed(4)},${lng.toFixed(4)},${zoom}`);
  }

  // Filter parameter (array of climate codes)
  if (state.filter && state.filter.length > 0) {
    params.set('f', state.filter.join(','));
  }

  // Selected climate
  if (state.selected) {
    params.set('s', state.selected);
  }

  // Custom classification (use compressed encoding from Story 6.3)
  if (state.classification) {
    try {
      const encoded = generateURL(state.classification);
      params.set('r', encoded.encodedState);
      if (state.classification.name) {
        params.set('name', state.classification.name);
      }
    } catch (error) {
      console.error('[Koppen] Failed to encode classification:', error);
    }
  }

  // Build URL
  const queryString = params.toString();
  const url = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

  // Warn if URL is getting too long
  if (url.length > 2000) {
    console.warn(`[Koppen] URL length is ${url.length} characters (> 2000). Consider using JSON export instead.`);
  }

  return url;
}

/**
 * Check if view is default (world view)
 * @param {Object} view - View state {lat, lng, zoom}
 * @returns {boolean} True if default view
 */
function isDefaultView(view) {
  if (!view) return true;

  const { lat, lng, zoom } = view;
  const defaultView = DEFAULT_STATE.view;

  return (
    Math.abs(lat - defaultView.lat) < 0.01 &&
    Math.abs(lng - defaultView.lng) < 0.01 &&
    zoom === defaultView.zoom
  );
}

/**
 * Restore state from URL (Story 6.7)
 * Parses all URL parameters and applies state to application
 */
function restoreStateFromURL() {
  isRestoring = true;

  try {
    const params = new URLSearchParams(window.location.search);
    const state = parseURLState(params);

    // Apply state to application
    applyState(state);

    // Store current state
    currentState = state;

    // Fire event
    document.dispatchEvent(new CustomEvent('koppen:state-restored', {
      detail: { state },
    }));

    logger.log('[Koppen] State restored from URL');

  } catch (error) {
    console.error('[Koppen] Failed to restore state from URL:', error);
    // Continue with default state

  } finally {
    // Small delay to prevent race conditions with event handlers
    setTimeout(() => {
      isRestoring = false;
    }, 100);
  }
}

/**
 * Parse state from URL parameters
 * @param {URLSearchParams} params - URL parameters
 * @returns {Object} Parsed application state
 */
function parseURLState(params) {
  const state = { ...DEFAULT_STATE };

  // Parse view parameter (v=lat,lng,zoom)
  if (params.has('v')) {
    const [lat, lng, zoom] = params.get('v').split(',').map(parseFloat);
    if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoom)) {
      state.view = { lat, lng, zoom };
    }
  }

  // Parse filter parameter (f=Csb,Cfa)
  if (params.has('f')) {
    state.filter = params.get('f').split(',').filter(Boolean);
  }

  // Parse selected climate (s=Csb)
  if (params.has('s')) {
    state.selected = params.get('s');
  }

  // Parse custom classification (r=base64 from Story 6.3)
  if (params.has('r')) {
    try {
      const decoded = decodeURL();
      if (decoded) {
        state.classification = {
          name: decoded.name,
          thresholds: decoded.thresholds,
          metadata: decoded.metadata,
        };
      }
    } catch (error) {
      console.error('[Koppen] Failed to decode classification:', error);
      // Continue without custom classification
    }
  }

  return state;
}

/**
 * Apply state to application
 * Fires events for each module to restore their state
 * @param {Object} state - Application state
 */
function applyState(state) {
  // Apply in order: classification → filter → selected → view
  // This ensures dependencies are satisfied

  // 1. Custom classification (if present)
  if (state.classification) {
    document.dispatchEvent(new CustomEvent('koppen:apply-classification', {
      detail: { classification: state.classification },
    }));
  }

  // 2. Filter
  if (state.filter && state.filter.length > 0) {
    document.dispatchEvent(new CustomEvent('koppen:apply-filter', {
      detail: { climateTypes: state.filter },
    }));
  }

  // 3. Selected climate
  if (state.selected) {
    document.dispatchEvent(new CustomEvent('koppen:apply-selection', {
      detail: { climateCode: state.selected },
    }));
  }

  // 4. Map view
  if (state.view && !isDefaultView(state.view)) {
    document.dispatchEvent(new CustomEvent('koppen:apply-view', {
      detail: state.view,
    }));
  }
}

/**
 * Listen for browser navigation (back/forward buttons)
 */
function listenForNavigation() {
  window.addEventListener('popstate', (event) => {
    logger.log('[Koppen] Browser navigation detected');

    if (event.state) {
      // State stored by pushState
      applyState(event.state);
      currentState = event.state;
    } else {
      // No state: parse URL
      restoreStateFromURL();
    }
  });

  logger.log('[Koppen] Navigation listener registered');
}

/**
 * Get current application state
 * @returns {Object} Current state
 */
export function getCurrentState() {
  return { ...currentState };
}

/**
 * Manually set application state (for testing)
 * @param {Object} state - State to set
 */
export function setCurrentState(state) {
  currentState = { ...DEFAULT_STATE, ...state };
}

// Export for default import
export default {
  // Story 6.4 functions
  getStateFromURL,
  updateURL,
  clearURLState,
  encodeState, // deprecated
  decodeState, // deprecated

  // Story 6.7 functions
  initStateSync,
  getCurrentState,
  setCurrentState,
};
