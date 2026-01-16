/**
 * Threshold Sliders Component
 * @module builder/threshold-sliders
 */

/* eslint-disable security/detect-object-injection --
 * This file accesses threshold data using keys from internal preset configuration.
 * Keys are not user-controlled; they come from KOPPEN_PRESET or Object.keys() iteration.
 * See docs/orchestration/checkpoints/security-review.md for full analysis.
 */

/* eslint-disable sonarjs/no-duplicate-string --
 * CSS class names and UI labels are intentionally repeated for code clarity.
 * BEM naming convention results in repeated class name prefixes.
 */

let thresholds = {};
let originalPreset = null; // Story 5.3: Store original for comparison
let updateCallbacks = [];

// Constants
const THRESHOLD_SELECTOR = (key) => `.threshold-slider[data-threshold-key="${key}"]`;

/**
 * Debounce utility
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Handle threshold value change
 * @param {string} key - Threshold key
 * @param {number} value - New value
 * @param {string} category - 'temperature' or 'precipitation'
 * @param {Object} config - Threshold configuration
 */
function handleThresholdChange(key, value, category, config) {
  // Update stored value
  if (thresholds[category] && thresholds[category][key]) {
    thresholds[category][key].value = value;
  }

  // Get all current values
  const allValues = getAllValues();

  // Fire event for other modules
  document.dispatchEvent(
    new CustomEvent('koppen:threshold-changed', {
      detail: {
        key,
        category,
        value,
        unit: config.unit,
        thresholds: allValues,
      },
    }),
  );

  // Execute callbacks
  updateCallbacks.forEach((cb) => cb(key, value));
}

/**
 * Get all current threshold values
 * @returns {Object} All threshold values as flat object
 */
function getAllValues() {
  const values = {};
  Object.keys(thresholds).forEach((category) => {
    Object.keys(thresholds[category]).forEach((key) => {
      values[key] = thresholds[category][key].value;
    });
  });
  return values;
}

/**
 * Update modification indicator for a threshold (Story 5.3)
 * @param {HTMLElement} container - Slider container
 * @param {string} key - Threshold key
 * @param {string} category - Category name
 * @param {number} currentValue - Current value
 * @param {string} unit - Unit string
 */
function updateModificationIndicator(container, key, category, currentValue, unit) {
  if (!originalPreset) return;

  const originalValue = originalPreset.thresholds?.[category]?.[key]?.value;
  if (originalValue === undefined) return;

  const indicator = container.querySelector('.threshold-slider__indicator');
  const tooltip = container.querySelector('.threshold-slider__comparison-tooltip');
  const resetBtn = container.querySelector('.threshold-slider__reset-btn');

  // Validate elements exist before manipulating
  if (!indicator || !tooltip || !resetBtn) {
    console.warn('[Threshold] Modification indicator elements not found for:', key);
    return;
  }

  const isModified = currentValue !== originalValue;

  if (isModified) {
    // Show indicator with direction-based color
    indicator.style.display = 'inline-block';
    indicator.className = 'threshold-slider__indicator';

    if (currentValue < originalValue) {
      indicator.classList.add('threshold-slider__indicator--decreased');
    } else {
      indicator.classList.add('threshold-slider__indicator--increased');
    }

    // Update tooltip content (CSS handles visibility on hover)
    tooltip.textContent = `Original: ${originalValue}${unit} → Custom: ${currentValue}${unit}`;
    tooltip.classList.add('threshold-slider__comparison-tooltip--has-content');

    // Show reset button
    resetBtn.style.display = 'inline-block';
  } else {
    // Hide all modification indicators
    indicator.style.display = 'none';
    tooltip.textContent = '';
    tooltip.classList.remove('threshold-slider__comparison-tooltip--has-content');
    resetBtn.style.display = 'none';
  }

  // Update modification summary
  updateModificationSummary();
}

/**
 * Reset individual threshold to original value (Story 5.3)
 * @param {string} key - Threshold key
 * @param {string} category - Category name
 */
function resetThreshold(key, category) {
  if (!originalPreset) return;

  const originalValue = originalPreset.thresholds?.[category]?.[key]?.value;
  if (originalValue === undefined) return;

  // Update threshold value
  if (thresholds[category] && thresholds[category][key]) {
    thresholds[category][key].value = originalValue;
  }

  // Update UI - cache DOM queries
  const container = document.querySelector(THRESHOLD_SELECTOR(key));
  if (!container) {
    console.warn('[Threshold] Container not found for reset:', key);
    return;
  }

  const textInput = container.querySelector('.threshold-slider__input');
  const rangeInput = container.querySelector('.threshold-slider__range');

  // Apply reset animation
  container.classList.add('threshold-slider--resetting');
  setTimeout(() => {
    container.classList.remove('threshold-slider--resetting');
  }, 300); // Match CSS animation duration

  if (textInput) textInput.value = originalValue;
  if (rangeInput) {
    rangeInput.value = originalValue;
    rangeInput.setAttribute('aria-valuenow', originalValue);
  }

  const unit = thresholds[category][key].unit;
  updateModificationIndicator(container, key, category, originalValue, unit);

  // Fire change event
  handleThresholdChange(key, originalValue, category, thresholds[category][key]);

  // Fire reset event
  document.dispatchEvent(
    new CustomEvent('koppen:threshold-reset', {
      detail: { key, category, value: originalValue },
    }),
  );
}

/**
 * Get modification summary (Story 5.3)
 * @returns {Object} Summary with modified count and total
 */
function getModificationSummary() {
  if (!originalPreset) {
    return { modified: 0, total: 0, percentage: 0 };
  }

  let totalThresholds = 0;
  let modifiedCount = 0;

  Object.keys(thresholds).forEach((category) => {
    Object.keys(thresholds[category]).forEach((key) => {
      totalThresholds++;
      const currentValue = thresholds[category][key].value;
      const originalValue = originalPreset.thresholds?.[category]?.[key]?.value;

      if (originalValue !== undefined && currentValue !== originalValue) {
        modifiedCount++;
      }
    });
  });

  return {
    modified: modifiedCount,
    total: totalThresholds,
    percentage: totalThresholds > 0 ? Math.round((modifiedCount / totalThresholds) * 100) : 0,
  };
}

/**
 * Update modification summary display (Story 5.3)
 * Debounced to avoid excessive event firing during slider drag
 */
const updateModificationSummary = debounce(() => {
  const summary = getModificationSummary();

  document.dispatchEvent(
    new CustomEvent('koppen:modification-summary-changed', {
      detail: summary,
    }),
  );
}, 100);

/**
 * Create individual slider with label and input
 * @param {string} key - Threshold key
 * @param {Object} config - Threshold configuration
 * @param {string} category - Category name
 * @returns {HTMLElement} Slider container
 */
function createSlider(key, config, category) {
  const container = document.createElement('div');
  container.className = 'threshold-slider';
  container.dataset.thresholdKey = key;
  container.dataset.category = category;

  // Label with modification indicator (Story 5.3)
  const labelRow = document.createElement('div');
  labelRow.className = 'threshold-slider__label-row';

  const label = document.createElement('label');
  label.className = 'threshold-slider__label';
  label.htmlFor = `threshold-${key}`;
  label.textContent = config.description;

  // Modification indicator badge
  const indicator = document.createElement('span');
  indicator.className = 'threshold-slider__indicator';
  indicator.style.display = 'none';
  indicator.setAttribute('aria-label', 'Modified');

  // Inline tooltip for comparison
  const tooltip = document.createElement('div');
  tooltip.className = 'threshold-slider__comparison-tooltip';
  tooltip.style.display = 'none';

  labelRow.appendChild(label);
  labelRow.appendChild(indicator);
  container.appendChild(labelRow);
  container.appendChild(tooltip);

  // Value display + input wrapper
  const valueWrapper = document.createElement('div');
  valueWrapper.className = 'threshold-slider__value-wrapper';

  // Text input for precise control
  const textInput = document.createElement('input');
  textInput.type = 'number';
  textInput.id = `threshold-${key}-value`;
  textInput.className = 'threshold-slider__input';
  textInput.value = config.value;
  textInput.min = config.range[0];
  textInput.max = config.range[1];
  textInput.step = config.step;
  textInput.setAttribute('aria-label', `${config.description} value`);

  // Unit label
  const unit = document.createElement('span');
  unit.className = 'threshold-slider__unit';
  unit.textContent = config.unit;

  // Individual reset button (Story 5.3)
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'threshold-slider__reset-btn';
  resetBtn.textContent = '↺';
  resetBtn.style.display = 'none';
  resetBtn.setAttribute('aria-label', `Reset ${config.description} to original`);
  resetBtn.addEventListener('click', () => {
    resetThreshold(key, category);
  });

  valueWrapper.appendChild(textInput);
  valueWrapper.appendChild(unit);
  valueWrapper.appendChild(resetBtn);
  container.appendChild(valueWrapper);

  // Range slider
  const rangeInput = document.createElement('input');
  rangeInput.type = 'range';
  rangeInput.id = `threshold-${key}`;
  rangeInput.className = 'threshold-slider__range';
  rangeInput.min = config.range[0];
  rangeInput.max = config.range[1];
  rangeInput.step = config.step;
  rangeInput.value = config.value;
  rangeInput.setAttribute('aria-label', config.description);
  rangeInput.setAttribute('aria-valuemin', config.range[0]);
  rangeInput.setAttribute('aria-valuemax', config.range[1]);
  rangeInput.setAttribute('aria-valuenow', config.value);
  rangeInput.setAttribute('aria-valuetext', `${config.value} ${config.unit}`);

  container.appendChild(rangeInput);

  // Sync range and text input
  const debouncedUpdate = debounce((value) => {
    handleThresholdChange(key, value, category, config);
  }, 50);

  rangeInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    textInput.value = value;
    rangeInput.setAttribute('aria-valuenow', value);
    rangeInput.setAttribute('aria-valuetext', `${value} ${config.unit}`);
    debouncedUpdate(value);
    updateModificationIndicator(container, key, category, value, config.unit);
  });

  textInput.addEventListener('change', (e) => {
    let value = parseFloat(e.target.value);

    // Clamp to range
    if (value < config.range[0]) value = config.range[0];
    if (value > config.range[1]) value = config.range[1];

    // Round to step
    value = Math.round(value / config.step) * config.step;

    textInput.value = value;
    updateModificationIndicator(container, key, category, value, config.unit);
    rangeInput.value = value;
    rangeInput.setAttribute('aria-valuenow', value);
    rangeInput.setAttribute('aria-valuetext', `${value} ${config.unit}`);

    handleThresholdChange(key, value, category, config);
  });

  return container;
}

/**
 * Create slider group for a category
 * @param {string} category - 'temperature' or 'precipitation'
 * @param {Object} categoryThresholds - Threshold definitions for category
 * @returns {HTMLElement} Slider group container
 */
function createSliderGroup(category, categoryThresholds) {
  const container = document.createElement('div');
  container.className = 'threshold-group';

  // Group header
  const header = document.createElement('h3');
  header.className = 'threshold-group__header';
  header.textContent =
    category === 'temperature'
      ? 'Temperature Thresholds'
      : 'Precipitation Thresholds';
  container.appendChild(header);

  // Create sliders for each threshold
  Object.keys(categoryThresholds).forEach((key) => {
    const config = categoryThresholds[key];
    const slider = createSlider(key, config, category);
    container.appendChild(slider);
  });

  return container;
}

export default {
  /**
   * Initialize threshold sliders
   * @param {Object} preset - Preset with thresholds
   * @param {Function} onChange - Optional callback on threshold change
   */
  init(preset, onChange) {
    thresholds = preset.thresholds;
    // Store original preset for comparison (Story 5.3)
    originalPreset = JSON.parse(JSON.stringify(preset)); // Deep clone
    if (onChange) updateCallbacks.push(onChange);
  },

  /**
   * Create all slider groups
   * @param {Object} preset - Preset with thresholds
   * @returns {HTMLElement} Container with all slider groups
   */
  render(preset) {
    const container = document.createElement('div');
    container.className = 'threshold-sliders';

    // Temperature thresholds
    if (preset.thresholds.temperature) {
      const tempGroup = createSliderGroup(
        'temperature',
        preset.thresholds.temperature,
      );
      container.appendChild(tempGroup);
    }

    // Precipitation thresholds
    if (preset.thresholds.precipitation) {
      const precipGroup = createSliderGroup(
        'precipitation',
        preset.thresholds.precipitation,
      );
      container.appendChild(precipGroup);
    }

    return container;
  },

  /**
   * Reset all thresholds to preset values
   * @param {Object} preset - Preset with original values
   */
  reset(preset) {
    thresholds = preset.thresholds;

    // Update all slider DOM elements
    document.querySelectorAll('.threshold-slider').forEach((slider) => {
      const key = slider.dataset.thresholdKey;
      const category = slider.dataset.category;
      const config = thresholds[category]?.[key];

      const rangeInput = slider.querySelector('.threshold-slider__range');
      const textInput = slider.querySelector('.threshold-slider__input');

      if (rangeInput && textInput && config) {
        rangeInput.value = config.value;
        textInput.value = config.value;
        rangeInput.setAttribute('aria-valuenow', config.value);
        rangeInput.setAttribute(
          'aria-valuetext',
          `${config.value} ${config.unit}`,
        );
      }
    });

    // Fire reset event
    document.dispatchEvent(
      new CustomEvent('koppen:thresholds-reset', {
        detail: { thresholds: getAllValues() },
      }),
    );
  },

  /**
   * Set threshold values from imported data (Story 6.5)
   * @param {Object} newThresholds - Threshold values to apply
   */
  setValues(newThresholds) {
    // Merge new values into existing threshold structure
    Object.keys(newThresholds).forEach((category) => {
      if (!thresholds[category]) {
        thresholds[category] = {};
      }

      Object.keys(newThresholds[category]).forEach((key) => {
        const newValue = newThresholds[category][key];

        // Handle both full object and value-only formats
        if (typeof newValue === 'object' && newValue.value !== undefined) {
          // Full threshold object
          if (!thresholds[category][key]) {
            thresholds[category][key] = {};
          }
          thresholds[category][key].value = newValue.value;
        } else if (typeof newValue === 'number') {
          // Value-only format
          if (!thresholds[category][key]) {
            thresholds[category][key] = {};
          }
          thresholds[category][key].value = newValue;
        }
      });
    });

    // Update all slider DOM elements
    document.querySelectorAll('.threshold-slider').forEach((slider) => {
      const key = slider.dataset.thresholdKey;
      const category = slider.dataset.category;
      const config = thresholds[category]?.[key];

      if (!config) return;

      const rangeInput = slider.querySelector('.threshold-slider__range');
      const textInput = slider.querySelector('.threshold-slider__input');

      if (rangeInput && textInput) {
        rangeInput.value = config.value;
        textInput.value = config.value;
        rangeInput.setAttribute('aria-valuenow', config.value);
        rangeInput.setAttribute(
          'aria-valuetext',
          `${config.value} ${config.unit || ''}`,
        );

        // Update modification indicator (Story 5.3)
        const container = slider;
        updateModificationIndicator(
          container,
          key,
          category,
          config.value,
          config.unit || '',
        );
      }
    });

    // Fire threshold changed events for all values
    const allValues = getAllValues();
    document.dispatchEvent(
      new CustomEvent('koppen:thresholds-imported', {
        detail: { thresholds: allValues },
      }),
    );

    // Re-render map with new values
    document.dispatchEvent(
      new CustomEvent('koppen:threshold-changed', {
        detail: { thresholds: allValues },
      }),
    );
  },

  /**
   * Get all current threshold values
   * @returns {Object} All threshold values
   */
  getAllValues,

  /**
   * Destroy module (cleanup)
   */
  destroy() {
    thresholds = {};
    updateCallbacks = [];
  },
};
