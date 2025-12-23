/**
 * Difference Highlighter Module - Visual comparison between classifications
 * @module builder/difference-highlighter
 */

import { CLIMATE_TYPES } from '../climate/koppen-rules.js';

let state = {
  enabled: false,
  differences: [],
  summary: null,
  initialized: false,
};

let eventListeners = [];
let uiContainer = null;
let ariaAnnouncer = null;

/**
 * Calculate differences between two classifications
 * @param {Object} customClassification - Custom classification data
 * @param {Object} koppenClassification - Köppen classification data
 * @returns {Object} Difference analysis with summary
 */
function calculateDifferences(customClassification, koppenClassification) {
  if (!customClassification || !koppenClassification) {
    return { differences: [], summary: { total: 0, changed: 0, percentage: '0.0', topPatterns: [] } };
  }

  const differences = [];
  const patterns = {};

  const customFeatures = customClassification.features || [];
  const koppenFeatures = koppenClassification.features || [];

  const totalCells = Math.max(customFeatures.length, koppenFeatures.length);

  // Compare each feature
  customFeatures.forEach((customFeature, index) => {
    const koppenFeature = koppenFeatures[index];
    if (!koppenFeature) return;

    const customType = customFeature.properties?.climate_type;
    const koppenType = koppenFeature.properties?.climate_type;

    if (customType !== koppenType) {
      differences.push({
        index,
        from: koppenType,
        to: customType,
        feature: customFeature,
      });

      // Track pattern
      const pattern = `${koppenType}→${customType}`;
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    }
  });

  // Calculate top 5 patterns with names
  const topPatterns = Object.entries(patterns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([pattern, count]) => {
      const [from, to] = pattern.split('→');
      return {
        pattern,
        count,
        from,
        to,
        fromName: getClimateName(from),
        toName: getClimateName(to),
      };
    });

  const summary = {
    total: totalCells,
    changed: differences.length,
    percentage: ((differences.length / totalCells) * 100).toFixed(1),
    topPatterns,
  };

  state.differences = differences;
  state.summary = summary;

  // Update UI if it exists
  if (uiContainer) {
    updateUI();
  }

  // Announce to screen readers
  if (ariaAnnouncer) {
    ariaAnnouncer.textContent = `${summary.changed} cells (${summary.percentage}%) reclassified`;
  }

  // Fire event
  const event = new CustomEvent('koppen:differences-computed', {
    detail: { differences, summary },
  });
  document.dispatchEvent(event);

  return { differences, summary };
}

/**
 * Get human-readable climate type name
 * @param {string} code - Climate type code
 * @returns {string} Full climate name
 */
function getClimateName(code) {
  return CLIMATE_TYPES[code]?.name || code;
}

/**
 * Toggle difference highlighting on/off
 * @param {boolean} enabled - Whether to enable highlighting
 */
function toggle(enabled) {
  state.enabled = enabled;

  const event = new CustomEvent('koppen:differences-toggled', {
    detail: { enabled, differences: state.differences, summary: state.summary },
  });
  document.dispatchEvent(event);
}

/**
 * Get current state
 * @returns {Object} Current difference state
 */
function getState() {
  return { ...state };
}

/**
 * Update UI with current state
 */
function updateUI() {
  if (!uiContainer) return;

  // Clear existing content except checkbox and aria-announcer
  const label = uiContainer.querySelector('.builder-panel__differences-toggle');
  const announcer = uiContainer.querySelector('[aria-live]');

  while (uiContainer.firstChild) {
    uiContainer.removeChild(uiContainer.firstChild);
  }

  // Re-add checkbox
  if (label) uiContainer.appendChild(label);
  if (announcer) uiContainer.appendChild(announcer);

  // Add updated summary and patterns
  if (state.summary && state.summary.changed > 0) {
    const summary = document.createElement('div');
    summary.className = 'builder-panel__differences-summary';
    summary.textContent = `${state.summary.changed} cells (${state.summary.percentage}%) reclassified`;
    uiContainer.appendChild(summary);

    // Add top patterns
    if (state.summary.topPatterns.length > 0) {
      const patterns = document.createElement('div');
      patterns.className = 'builder-panel__differences-patterns';

      const patternsTitle = document.createElement('h4');
      patternsTitle.textContent = 'Top Reclassifications:';
      patternsTitle.className = 'builder-panel__differences-patterns-title';
      patterns.appendChild(patternsTitle);

      state.summary.topPatterns.forEach(({ count, fromName, toName }) => {
        const patternItem = document.createElement('div');
        patternItem.className = 'builder-panel__differences-pattern-item';
        patternItem.textContent = `${fromName} → ${toName}: ${count} cells`;
        patterns.appendChild(patternItem);
      });

      uiContainer.appendChild(patterns);
    }
  }
}

/**
 * Create difference toggle UI
 * @returns {HTMLElement} Toggle control element
 */
function createToggleUI() {
  try {
    const container = document.createElement('div');
    container.className = 'builder-panel__differences';

    // Create aria-live announcer for screen readers
    ariaAnnouncer = document.createElement('div');
    ariaAnnouncer.setAttribute('aria-live', 'polite');
    ariaAnnouncer.setAttribute('aria-atomic', 'true');
    ariaAnnouncer.className = 'sr-only';
    container.appendChild(ariaAnnouncer);

  const label = document.createElement('label');
  label.className = 'builder-panel__differences-toggle';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'show-differences';
  checkbox.className = 'builder-panel__differences-checkbox';
  checkbox.checked = state.enabled;
  checkbox.addEventListener('change', (e) => {
    toggle(e.target.checked);
  });

  const labelText = document.createElement('span');
  labelText.textContent = 'Show Differences';

  label.appendChild(checkbox);
  label.appendChild(labelText);
  container.appendChild(label);

  // Add summary if available
  if (state.summary && state.summary.changed > 0) {
    const summary = document.createElement('div');
    summary.className = 'builder-panel__differences-summary';
    summary.textContent = `${state.summary.changed} cells (${state.summary.percentage}%) reclassified`;
    container.appendChild(summary);

    // Add top patterns
    if (state.summary.topPatterns.length > 0) {
      const patterns = document.createElement('div');
      patterns.className = 'builder-panel__differences-patterns';

      const patternsTitle = document.createElement('h4');
      patternsTitle.textContent = 'Top Reclassifications:';
      patternsTitle.className = 'builder-panel__differences-patterns-title';
      patterns.appendChild(patternsTitle);

      state.summary.topPatterns.forEach(({ count, fromName, toName }) => {
        const patternItem = document.createElement('div');
        patternItem.className = 'builder-panel__differences-pattern-item';
        patternItem.textContent = `${fromName} → ${toName}: ${count} cells`;
        patterns.appendChild(patternItem);
      });

      container.appendChild(patterns);
    }
  }

    uiContainer = container;
    return container;
  } catch (error) {
    console.error('Failed to create difference UI:', error);
    // Return minimal fallback
    const fallback = document.createElement('div');
    fallback.className = 'builder-panel__differences';
    return fallback;
  }
}

/**
 * Initialize module
 */
function init() {
  // Prevent duplicate initialization
  if (state.initialized) {
    console.warn('Difference highlighter module already initialized');
    return;
  }

  state.initialized = true;
}

/**
 * Destroy module and cleanup
 */
function destroy() {
  eventListeners.forEach(({ event, handler }) => {
    document.removeEventListener(event, handler);
  });
  eventListeners = [];

  state = {
    enabled: false,
    differences: [],
    summary: null,
    initialized: false,
  };

  uiContainer = null;
  ariaAnnouncer = null;
}

export default {
  init,
  calculateDifferences,
  toggle,
  getState,
  createToggleUI,
  getClimateName,
  destroy,
};
