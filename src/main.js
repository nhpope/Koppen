/**
 * Koppen - Interactive Climate Classification Explorer
 * Main Entry Point
 */

import './style.css';

// Module imports
import MapModule from './map/index.js';
import ClimateModule from './climate/index.js';
import BuilderModule from './builder/index.js';
import ExportModule from './export/index.js';
import UIModule from './ui/index.js';
import UtilsModule from './utils/index.js';

// Application state
const app = {
  modules: {},
  initialized: false,
};

/**
 * Initialize all application modules
 */
async function initializeApp() {
  if (app.initialized) {
    console.warn('[Koppen] App already initialized');
    return;
  }

  console.log('[Koppen] Initializing application...');

  try {
    // Initialize modules in order
    app.modules.utils = UtilsModule;
    app.modules.utils.init();

    app.modules.map = MapModule;
    await app.modules.map.init('map-container');

    app.modules.climate = ClimateModule;
    app.modules.climate.init();

    app.modules.ui = UIModule;
    app.modules.ui.init();

    app.modules.builder = BuilderModule;
    app.modules.builder.init();

    app.modules.export = ExportModule;
    app.modules.export.init();

    // Set up event listeners
    setupEventListeners();

    // Check for URL state
    await restoreFromURL();

    app.initialized = true;
    console.log('[Koppen] Application initialized successfully');

    // Dispatch ready event
    document.dispatchEvent(new CustomEvent('koppen:ready'));

  } catch (error) {
    console.error('[Koppen] Failed to initialize:', error);
    showError('Failed to initialize application. Please refresh the page.');
  }
}

/**
 * Set up global event listeners
 */
function setupEventListeners() {
  // Header buttons
  const createBtn = document.getElementById('create-btn');
  const aboutBtn = document.getElementById('about-btn');

  if (createBtn) {
    createBtn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('koppen:toggle-builder'));
    });
  }

  if (aboutBtn) {
    aboutBtn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('koppen:show-about'));
    });
  }

  // Climate data loaded
  document.addEventListener('koppen:data-loaded', (e) => {
    console.log(`[Koppen] Data loaded: ${e.detail.features} features`);
    app.modules.climate.classify();
  });

  // Classification changed
  document.addEventListener('koppen:classification-changed', (e) => {
    app.modules.map.updateLayer(e.detail.features);
    app.modules.ui.updateLegend(e.detail.stats);
  });

  // Threshold changed (Story 4.4: Real-Time Map Updates)
  document.addEventListener('koppen:threshold-changed', (e) => {
    // Trigger reclassification with new thresholds
    document.dispatchEvent(new CustomEvent('koppen:reclassify', {
      detail: { thresholds: e.detail.thresholds },
    }));
  });

  // Classification updated (after reclassification)
  document.addEventListener('koppen:classification-updated', (e) => {
    // Update UI with reclassification count
    showReclassificationCounter(e.detail.count);
  });

  // Feature hover
  document.addEventListener('koppen:feature-hover', (e) => {
    app.modules.ui.showTooltip(e.detail);
  });

  // Feature click
  document.addEventListener('koppen:feature-click', (e) => {
    app.modules.ui.showClimateInfo(e.detail);
  });

  // Navigate to location (from info panel examples)
  document.addEventListener('koppen:navigate-to', (e) => {
    const { lat, lng, zoom } = e.detail;
    if (lat !== undefined && lng !== undefined) {
      app.modules.map.flyTo(lat, lng, zoom || 6);
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);

  // Window resize
  window.addEventListener('resize', debounce(() => {
    app.modules.map.invalidateSize();
  }, 100));
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboard(e) {
  // Ignore if typing in input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }

  switch (e.key) {
    case 'Escape':
      document.dispatchEvent(new CustomEvent('koppen:close-panels'));
      break;
    case 'l':
      if (!e.ctrlKey && !e.metaKey) {
        document.dispatchEvent(new CustomEvent('koppen:toggle-legend'));
      }
      break;
    case 'b':
      if (!e.ctrlKey && !e.metaKey) {
        document.dispatchEvent(new CustomEvent('koppen:toggle-builder'));
      }
      break;
    case 'e':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('koppen:export'));
      }
      break;
  }
}

/**
 * Restore state from URL if present
 */
async function restoreFromURL() {
  const { getStateFromURL } = await import('./utils/url-state.js');
  const state = getStateFromURL();

  if (state) {
    console.log('[Koppen] Restoring state from URL');

    if (state.thresholds) {
      app.modules.climate.setThresholds(state.thresholds);
    }

    if (state.view) {
      app.modules.map.setView(state.view.lat, state.view.lng, state.view.zoom);
    }

    if (state.name) {
      document.dispatchEvent(new CustomEvent('koppen:preset-loaded', {
        detail: { name: state.name },
      }));
    }
  }
}

/**
 * Show error message to user
 */
function showError(message) {
  const app = document.getElementById('app');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `
    <p>${message}</p>
    <button onclick="location.reload()">Reload</button>
  `;
  app.prepend(errorDiv);
}

/**
 * Show reclassification counter (Story 4.4)
 * @param {number} count - Number of cells reclassified
 */
let reclassCounterTimeout;
function showReclassificationCounter(count) {
  // Find or create counter element
  let counter = document.getElementById('reclass-counter');

  if (!counter) {
    counter = document.createElement('div');
    counter.id = 'reclass-counter';
    counter.className = 'reclass-counter';
    counter.setAttribute('role', 'status');
    counter.setAttribute('aria-live', 'polite');
    document.body.appendChild(counter);
  }

  // Update counter text
  counter.textContent = `${count.toLocaleString()} cells reclassified`;
  counter.classList.add('reclass-counter--visible');

  // Clear existing timeout
  if (reclassCounterTimeout) {
    clearTimeout(reclassCounterTimeout);
  }

  // Auto-hide after 2 seconds
  reclassCounterTimeout = setTimeout(() => {
    counter.classList.remove('reclass-counter--visible');
  }, 2000);
}

/**
 * Debounce utility
 */
function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for debugging
window.Koppen = app;
