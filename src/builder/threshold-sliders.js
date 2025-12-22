/**
 * Threshold Sliders Component
 * @module builder/threshold-sliders
 */

let thresholds = {};
let updateCallbacks = [];

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
    })
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

  // Label
  const label = document.createElement('label');
  label.className = 'threshold-slider__label';
  label.htmlFor = `threshold-${key}`;
  label.textContent = config.description;
  container.appendChild(label);

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

  valueWrapper.appendChild(textInput);
  valueWrapper.appendChild(unit);
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
  });

  textInput.addEventListener('change', (e) => {
    let value = parseFloat(e.target.value);

    // Clamp to range
    if (value < config.range[0]) value = config.range[0];
    if (value > config.range[1]) value = config.range[1];

    // Round to step
    value = Math.round(value / config.step) * config.step;

    textInput.value = value;
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
        preset.thresholds.temperature
      );
      container.appendChild(tempGroup);
    }

    // Precipitation thresholds
    if (preset.thresholds.precipitation) {
      const precipGroup = createSliderGroup(
        'precipitation',
        preset.thresholds.precipitation
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
          `${config.value} ${config.unit}`
        );
      }
    });

    // Fire reset event
    document.dispatchEvent(
      new CustomEvent('koppen:thresholds-reset', {
        detail: { thresholds: getAllValues() },
      })
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
