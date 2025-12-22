/**
 * URL State Management
 */

/**
 * Encode classification state to URL-safe string
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
 * Decode URL state to object
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
 * Get state from current URL
 * @returns {Object|null} State from URL or null
 */
export function getStateFromURL() {
  const params = new URLSearchParams(window.location.search);
  const rules = params.get('rules');
  const name = params.get('name');
  const view = params.get('view');

  if (!rules) return null;

  const state = decodeState(rules);
  if (state) {
    if (name) state.name = decodeURIComponent(name);
    if (view) {
      const [lat, lng, zoom] = view.split(',').map(Number);
      state.view = { lat, lng, zoom };
    }
  }

  return state;
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
