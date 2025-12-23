/**
 * Comparison Module - Tab switching between Custom and Köppen classifications
 * @module builder/comparison
 *
 * @note Architectural Coupling: This module (Story 5.1) imports modules from Stories 5.2 and 5.4.
 * While functional, this creates tight coupling. Future refactoring should consider:
 * - Event-driven architecture for cross-story communication
 * - Lazy loading of optional features (difference highlighting, side-by-side)
 * - Module registry pattern to decouple dependencies
 */

import differenceHighlighter from './difference-highlighter.js';
import sideBySide from './side-by-side.js';

// Constants
const DEBOUNCE_DELAY_MS = 50;
const TRANSITION_DURATION_MS = 50;

let state = {
  activeView: 'custom', // 'custom' | 'koppen'
  customClassification: null,
  koppenClassification: null,
  thresholdsModified: false,
  initialized: false,
  isUpdating: false, // Prevent concurrent updates
};

let eventListeners = [];
let comparisonContainer = null;
let ariaAnnouncer = null;

/**
 * Initialize comparison module
 * @param {Object} options - Configuration options
 * @param {Object} options.koppenClassification - Original Köppen classification data
 */
function init(options = {}) {
  // Prevent duplicate initialization
  if (state.initialized) {
    console.warn('Comparison module already initialized');
    return;
  }

  if (!options.koppenClassification) {
    console.warn('Comparison module requires Köppen classification data');
    return;
  }

  state.koppenClassification = options.koppenClassification;
  state.initialized = true;

  // Initialize side-by-side module (Story 5.4)
  sideBySide.init(null, options.koppenClassification);

  setupEventListeners();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Listen for threshold changes to show comparison tabs
  const thresholdChangedHandler = (e) => {
    state.thresholdsModified = true;
    state.customClassification = e.detail.classification;

    // Calculate differences (Story 5.2)
    if (state.koppenClassification) {
      differenceHighlighter.calculateDifferences(
        state.customClassification,
        state.koppenClassification,
      );
    }

    // Update side-by-side classifications (Story 5.4)
    sideBySide.updateClassifications(
      state.customClassification,
      state.koppenClassification,
    );

    // Show comparison tabs if they exist
    if (comparisonContainer) {
      comparisonContainer.style.display = 'flex';
    }
  };

  document.addEventListener('koppen:threshold-changed', thresholdChangedHandler);
  eventListeners.push({ event: 'koppen:threshold-changed', handler: thresholdChangedHandler });

  // Listen for reset to Köppen (hide comparison tabs)
  const resetHandler = () => {
    state.thresholdsModified = false;
    state.customClassification = null;
    state.activeView = 'custom';

    if (comparisonContainer) {
      comparisonContainer.style.display = 'none';
    }
  };

  document.addEventListener('koppen:reset-to-koppen', resetHandler);
  eventListeners.push({ event: 'koppen:reset-to-koppen', handler: resetHandler });
}

/**
 * Create comparison tabs UI
 * @returns {HTMLElement} Comparison container element
 */
function createUI() {
  try {
    const container = document.createElement('div');
    container.className = 'builder-panel__comparison';
    container.style.display = state.thresholdsModified ? 'flex' : 'none';

    // Create aria-live announcer for screen readers
    ariaAnnouncer = document.createElement('div');
    ariaAnnouncer.setAttribute('aria-live', 'polite');
    ariaAnnouncer.setAttribute('aria-atomic', 'true');
    ariaAnnouncer.className = 'sr-only'; // Screen reader only (hidden visually)
    container.appendChild(ariaAnnouncer);

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'builder-panel__comparison-tabs';
    tabsContainer.setAttribute('role', 'tablist');
    tabsContainer.setAttribute('aria-label', 'Classification view selector');

    // Custom tab
    const customTab = createTab('custom', 'Custom', 'Your System');
    tabsContainer.appendChild(customTab);

    // Köppen tab
    const koppenTab = createTab('koppen', 'Köppen', 'Original');
    tabsContainer.appendChild(koppenTab);

    container.appendChild(tabsContainer);

    // Add difference toggle UI (Story 5.2)
    const differenceUI = differenceHighlighter.createToggleUI();
    container.appendChild(differenceUI);

    // Add side-by-side toggle UI (Story 5.4)
    const sideBySideUI = sideBySide.createUI();
    container.appendChild(sideBySideUI);

    comparisonContainer = container;

    return container;
  } catch (error) {
    console.error('Failed to create comparison UI:', error);
    // Return minimal fallback container
    const fallback = document.createElement('div');
    fallback.className = 'builder-panel__comparison';
    fallback.style.display = 'none';
    return fallback;
  }
}

/**
 * Create a single tab element
 * @param {string} view - View identifier ('custom' | 'koppen')
 * @param {string} label - Tab label text
 * @param {string} subtitle - Tab subtitle text
 * @returns {HTMLElement} Tab button element
 */
function createTab(view, label, subtitle) {
  const tab = document.createElement('button');
  tab.className = `builder-panel__comparison-tab builder-panel__comparison-tab--${view}`;
  tab.type = 'button';
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-controls', `${view}-view`);
  tab.setAttribute('aria-selected', state.activeView === view ? 'true' : 'false');
  tab.dataset.view = view;

  if (state.activeView === view) {
    tab.classList.add('builder-panel__comparison-tab--active');
  }

  const labelEl = document.createElement('span');
  labelEl.className = 'builder-panel__comparison-tab-label';
  labelEl.textContent = label;

  const subtitleEl = document.createElement('span');
  subtitleEl.className = 'builder-panel__comparison-tab-subtitle';
  subtitleEl.textContent = subtitle;

  tab.appendChild(labelEl);
  tab.appendChild(subtitleEl);

  // Debounced click handler to prevent rapid switching
  let debounceTimeout = null;
  tab.addEventListener('click', () => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      switchToView(view);
    }, DEBOUNCE_DELAY_MS);
  });

  // Keyboard support
  tab.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      switchToView(view);
    }
  });

  return tab;
}

/**
 * Switch to a different view with performance measurement
 * @param {string} view - View to switch to ('custom' | 'koppen')
 */
async function switchToView(view) {
  if (state.isUpdating || view === state.activeView) return;

  const previousView = state.activeView;
  state.isUpdating = true;

  try {
    // Performance measurement start
    performance.mark('comparison-switch-start');

    // Get classification data for active view
    const activeClassification = view === 'custom'
      ? state.customClassification
      : state.koppenClassification;

    // Validate classification exists
    if (!activeClassification) {
      console.warn(`Cannot switch to ${view} view: classification data not available`);
      state.isUpdating = false;
      return;
    }

    // Update state
    state.activeView = view;

    // Update UI immediately
    updateTabStates();

    // Trigger map reclassification via event (map listens to koppen:reclassify)
    const reclassifyEvent = new CustomEvent('koppen:reclassify', {
      detail: {
        classification: activeClassification,
        view,
        previousView,
      },
    });

    document.dispatchEvent(reclassifyEvent);

    // Fire comparison toggled event
    const comparisonToggledEvent = new CustomEvent('koppen:comparison-toggled', {
      detail: {
        activeView: view,
        previousView,
      },
    });

    document.dispatchEvent(comparisonToggledEvent);

    // Performance measurement end
    performance.mark('comparison-switch-end');
    performance.measure(
      'comparison-switch-duration',
      'comparison-switch-start',
      'comparison-switch-end',
    );

    // Development-only performance logging
    if (import.meta.env?.DEV) {
      const measure = performance.getEntriesByName('comparison-switch-duration')[0];
      if (measure && measure.duration > 100) {
        console.warn(`Comparison switch took ${measure.duration.toFixed(2)}ms (target: <100ms)`);
      }
    }

    // Clear performance marks
    performance.clearMarks('comparison-switch-start');
    performance.clearMarks('comparison-switch-end');
    performance.clearMeasures('comparison-switch-duration');

  } catch (error) {
    console.error('Classification switch failed:', error);

    // Rollback to previous view
    state.activeView = previousView;
    updateTabStates();

    // Show error to user
    const errorEvent = new CustomEvent('koppen:error', {
      detail: {
        message: 'Unable to switch view. Please try again.',
        error,
      },
    });
    document.dispatchEvent(errorEvent);
  } finally {
    state.isUpdating = false;
  }
}

/**
 * Update visual state of tabs
 */
function updateTabStates() {
  if (!comparisonContainer) return;

  try {
    const tabs = comparisonContainer.querySelectorAll('.builder-panel__comparison-tab');

    tabs.forEach(tab => {
      const tabView = tab.dataset.view;
      const isActive = tabView === state.activeView;

      tab.classList.toggle('builder-panel__comparison-tab--active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Announce view change to screen readers
    if (ariaAnnouncer) {
      const viewName = state.activeView === 'custom' ? 'Custom' : 'Köppen';
      ariaAnnouncer.textContent = `Switched to ${viewName} classification view`;
    }

    // Use requestAnimationFrame for smooth visual update
    requestAnimationFrame(() => {
      tabs.forEach(tab => {
        tab.style.transition = `all ${TRANSITION_DURATION_MS}ms ease-in-out`;
      });
    });
  } catch (error) {
    console.error('Failed to update tab states:', error);
    // Non-critical failure - UI might look incorrect but app continues
  }
}

/**
 * Get current comparison state
 * @returns {Object} Current state
 */
function getState() {
  return { ...state };
}

/**
 * Destroy module and cleanup
 */
function destroy() {
  // Remove event listeners
  eventListeners.forEach(({ event, handler }) => {
    document.removeEventListener(event, handler);
  });
  eventListeners = [];

  // Destroy side-by-side module (Story 5.4)
  sideBySide.destroy();

  // Clear state
  state = {
    activeView: 'custom',
    customClassification: null,
    koppenClassification: null,
    thresholdsModified: false,
    initialized: false,
    isUpdating: false,
  };

  comparisonContainer = null;
}

export default {
  init,
  createUI,
  switchToView,
  getState,
  destroy,
};
