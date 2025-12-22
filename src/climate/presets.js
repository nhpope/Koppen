/**
 * Köppen-Geiger Climate Classification Presets
 * @module climate/presets
 */

// Standard Köppen-Geiger classification thresholds (Beck et al. 2018)
export const KOPPEN_PRESET = {
  name: 'Köppen-Geiger',
  version: 'Beck et al. 2018',
  description: 'Standard Köppen climate classification system',
  author: 'Beck et al.',
  year: 2018,
  citation:
    'Beck, H.E., et al. (2018). Present and future Köppen-Geiger climate classification maps at 1-km resolution. Scientific Data 5, 180214.',

  thresholds: {
    // Temperature thresholds (Celsius)
    temperature: {
      tropical_min: {
        value: 18,
        unit: '°C',
        description: 'Minimum temperature for tropical (A) climates',
        range: [10, 25],
        step: 0.5,
      },
      cold_month_min: {
        value: 0,
        unit: '°C',
        description: 'C/D boundary - coldest month threshold',
        range: [-10, 10],
        step: 0.5,
      },
      hot_summer: {
        value: 22,
        unit: '°C',
        description: 'Hot summer (a) vs warm summer (b) threshold',
        range: [18, 28],
        step: 0.5,
      },
      warm_months_threshold: {
        value: 10,
        unit: '°C',
        description: 'Tundra (ET) threshold - warmest month',
        range: [0, 15],
        step: 0.5,
      },
      warm_months_count: {
        value: 4,
        unit: 'months',
        description: 'Number of months ≥10°C for c vs d',
        range: [1, 6],
        step: 1,
      },
    },

    // Precipitation thresholds
    precipitation: {
      dry_month: {
        value: 60,
        unit: 'mm',
        description: 'Dry month threshold for s/w suffixes',
        range: [20, 100],
        step: 5,
      },
      dry_season_factor: {
        value: 3,
        unit: 'ratio',
        description: 'Wettest/driest month ratio for s/w',
        range: [2, 5],
        step: 0.5,
      },
      monsoon_threshold: {
        value: 60,
        unit: 'mm',
        description: 'Annual precip - 25×driest month for Am',
        range: [40, 100],
        step: 5,
      },
      arid_summer_factor: {
        value: 0.7,
        unit: 'ratio',
        description: 'Summer precipitation ratio for P_threshold',
        range: [0.5, 1.0],
        step: 0.05,
      },
    },
  },

  metadata: {
    loaded_at: null, // Set when loaded
    modified: false, // Track if user changed values
    source: 'preset', // 'preset' | 'scratch' | 'imported'
  },
};

/**
 * Get all threshold values as flat object
 * @param {Object} preset - Preset with nested thresholds
 * @returns {Object} Flat object with threshold keys and values
 */
export function getThresholdValues(preset) {
  const values = {};
  Object.keys(preset.thresholds).forEach((category) => {
    Object.keys(preset.thresholds[category]).forEach((key) => {
      values[key] = preset.thresholds[category][key].value;
    });
  });
  return values;
}

/**
 * Validate preset structure
 * @param {Object} preset - Preset to validate
 * @returns {boolean} True if valid
 * @throws {Error} If invalid structure
 */
export function validatePreset(preset) {
  const required = ['name', 'version', 'thresholds'];
  const missing = required.filter((field) => !preset[field]);

  if (missing.length > 0) {
    throw new Error(`Invalid preset: missing ${missing.join(', ')}`);
  }

  return true;
}

/**
 * Scratch preset with neutral/extreme defaults (Story 4.6)
 * All thresholds set to extremes so everything starts unclassified
 */
export const SCRATCH_PRESET = {
  name: 'Scratch',
  version: 'Custom',
  description: 'Build your own classification system from scratch',
  author: 'Custom',
  year: new Date().getFullYear(),
  citation: 'Custom classification system',

  thresholds: {
    // Temperature thresholds - set to extremes
    temperature: {
      tropical_min: {
        value: 30,  // Extreme high (nothing will be tropical)
        unit: '°C',
        description: 'Minimum temperature for tropical (A) climates',
        range: [10, 25],
        step: 0.5,
      },
      cold_month_min: {
        value: -50,  // Extreme low
        unit: '°C',
        description: 'C/D boundary - coldest month threshold',
        range: [-10, 10],
        step: 0.5,
      },
      hot_summer: {
        value: 40,  // Extreme high
        unit: '°C',
        description: 'Hot summer (a) vs warm summer (b) threshold',
        range: [18, 28],
        step: 0.5,
      },
      warm_months_threshold: {
        value: 50,  // Extreme high
        unit: '°C',
        description: 'Tundra (ET) threshold - warmest month',
        range: [0, 15],
        step: 0.5,
      },
      warm_months_count: {
        value: 12,  // Extreme (nothing will qualify)
        unit: 'months',
        description: 'Number of months ≥10°C for c vs d',
        range: [1, 6],
        step: 1,
      },
    },

    // Precipitation thresholds - set to extremes
    precipitation: {
      dry_month: {
        value: 500,  // Extreme high (nothing will be dry)
        unit: 'mm',
        description: 'Dry month threshold for s/w suffixes',
        range: [20, 100],
        step: 5,
      },
      dry_season_factor: {
        value: 10,  // Extreme high
        unit: 'ratio',
        description: 'Wettest/driest month ratio for s/w',
        range: [2, 5],
        step: 0.5,
      },
      monsoon_threshold: {
        value: 500,  // Extreme high
        unit: 'mm',
        description: 'Annual precip - 25×driest month for Am',
        range: [40, 100],
        step: 5,
      },
      arid_summer_factor: {
        value: 2.0,  // Extreme high
        unit: 'ratio',
        description: 'Summer precipitation ratio for P_threshold',
        range: [0.5, 1.0],
        step: 0.05,
      },
    },
  },

  metadata: {
    loaded_at: null,
    modified: false,
    source: 'scratch',
  },
};

/**
 * Example locations for each climate type
 * Maps climate codes to example locations
 */
export const EXAMPLE_LOCATIONS = {
  // TODO: Populate with actual example locations
};
