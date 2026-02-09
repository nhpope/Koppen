/**
 * Koppen - Interactive Climate Classification Explorer
 * Main Entry Point
 */

/* eslint-disable security/detect-object-injection --
 * This file coordinates module initialization using internal event handling.
 * Keys are not user-controlled; they come from the app's internal event system.
 * See docs/orchestration/checkpoints/security-review.md for full analysis.
 */

import './style.css';
import logger from './utils/logger.js';

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

  logger.log('[Koppen] Initializing application...');

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

    // Initialize URL state synchronization (Story 6.7)
    // This handles both initial restoration AND ongoing sync
    await initializeStateSync();

    // Legacy: Check for shared URL (Story 6.4 - still needed for shared-info-bar)
    await restoreFromURL();

    app.initialized = true;
    logger.log('[Koppen] Application initialized successfully');

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

  // Keyboard map navigation (WCAG 2.1.1 - keyboard accessible)
  document.addEventListener('keydown', (e) => {
    // Only handle arrow keys when not focused on input/textarea
    if (e.target.matches('input, textarea, select')) {
      return;
    }

    const panAmount = 50; // pixels to pan
    const map = app.modules.map?.getMap?.();

    if (!map) return;

    switch(e.key) {
      case 'ArrowUp':
        e.preventDefault();
        map.panBy([0, -panAmount]);
        break;
      case 'ArrowDown':
        e.preventDefault();
        map.panBy([0, panAmount]);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        map.panBy([-panAmount, 0]);
        break;
      case 'ArrowRight':
        e.preventDefault();
        map.panBy([panAmount, 0]);
        break;
      case '+':
      case '=':
        e.preventDefault();
        map.zoomIn();
        break;
      case '-':
      case '_':
        e.preventDefault();
        map.zoomOut();
        break;
    }
  });

  // Climate data loaded
  document.addEventListener('koppen:data-loaded', (e) => {
    logger.log(`[Koppen] Data loaded: ${e.detail.features} features`);
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
 * Initialize URL state synchronization (Story 6.7)
 */
async function initializeStateSync() {
  try {
    const { initStateSync } = await import('./utils/url-state.js');
    initStateSync();
    logger.log('[Koppen] URL state synchronization active');
  } catch (error) {
    console.error('[Koppen] Failed to initialize state sync:', error);
  }
}

/**
 * Restore state from URL if present (Story 6.4)
 */
async function restoreFromURL() {
  const { getStateFromURL } = await import('./utils/url-state.js');
  const state = getStateFromURL();

  if (state) {
    logger.log('[Koppen] Restoring state from URL');

    // Check if this is a custom rules classification
    if (state.mode === 'custom' && state.customRules) {
      // Custom rules mode
      logger.log('[Koppen] Restoring custom rules classification');

      // Fire rules-loaded event for shared info bar
      document.dispatchEvent(new CustomEvent('koppen:rules-loaded', {
        detail: {
          name: state.name || 'Shared Classification',
          customRules: state.customRules,
          source: state.metadata?.source || 'url',
        },
      }));

      // Open builder panel
      app.modules.builder.open();

      // Wait for builder to initialize, then start from scratch
      setTimeout(() => {
        // Trigger "Start from Scratch" to enter custom rules mode
        const scratchBtn = document.getElementById('start-from-scratch');
        if (scratchBtn) {
          scratchBtn.click();

          // Wait for custom rules mode to initialize, then load the rules
          setTimeout(() => {
            // Set classification name
            const nameInput = document.getElementById('classification-name');
            if (nameInput && state.name) {
              nameInput.value = state.name;
            }

            // Load custom rules into the engine
            // Fire import event with the custom rules data
            document.dispatchEvent(new CustomEvent('koppen:import-custom-rules', {
              detail: {
                customRules: state.customRules,
                fromURL: true,
              },
            }));

            logger.log('[Koppen] Loaded custom rules classification from URL');
          }, 500);
        }
      }, 300);
    }
    // Apply thresholds if present (threshold modification mode)
    else if (state.thresholds) {
      // Fire rules-loaded event for shared info bar
      document.dispatchEvent(new CustomEvent('koppen:rules-loaded', {
        detail: {
          name: state.name || 'Shared Classification',
          thresholds: state.thresholds,
          source: state.metadata?.source || 'url',
        },
      }));

      // Open builder panel and load classification
      app.modules.builder.open();

      // Wait for builder to initialize, then start from Köppen
      // NOTE: Intentional fire-and-forget async - URL restoration happens in background
      // No await needed as this is non-blocking UI enhancement
      setTimeout(async () => {
        // Trigger Köppen preset load (will be modified by thresholds)
        const koppenBtn = document.getElementById('start-from-koppen');
        if (koppenBtn) {
          koppenBtn.click();

          // Wait for preset to load, then apply shared thresholds
          setTimeout(() => {
            // Set classification name
            const nameInput = document.getElementById('classification-name');
            if (nameInput && state.name) {
              nameInput.value = state.name;
            }

            // Apply shared thresholds
            // This will trigger reclassification via koppen:threshold-changed events
            Object.keys(state.thresholds).forEach((category) => {
              Object.keys(state.thresholds[category]).forEach((key) => {
                const value = state.thresholds[category][key].value;
                const slider = document.querySelector(`[data-threshold-key="${key}"] input[type="range"]`);
                if (slider && value !== undefined) {
                  slider.value = value;
                  slider.dispatchEvent(new Event('input', { bubbles: true }));
                }
              });
            });

            logger.log('[Koppen] Applied shared classification thresholds');
          }, 500);
        }
      }, 300);
    }

    // Apply map view if present
    if (state.view) {
      setTimeout(() => {
        app.modules.map.flyTo(state.view.lat, state.view.lng, state.view.zoom);
      }, 1000);
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

  // Use textContent to prevent XSS
  const p = document.createElement('p');
  p.textContent = message;

  const button = document.createElement('button');
  button.textContent = 'Reload';
  button.addEventListener('click', () => location.reload());

  errorDiv.appendChild(p);
  errorDiv.appendChild(button);
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
