/**
 * Köppen-Geiger Climate Classification Presets
 * @module climate/presets
 */

/* eslint-disable security/detect-object-injection --
 * This file accesses threshold data using keys from the preset configuration.
 * Keys are not user-controlled; they are hardcoded threshold identifiers.
 * See docs/orchestration/checkpoints/security-review.md for full analysis.
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
        description: 'Minimum coldest month temperature for tropical (A) climates',
        range: [10, 25],
        step: 0.5,
      },
      temperate_cold_min: {
        value: -3,
        unit: '°C',
        description: 'C/D boundary - coldest month threshold (C if >= this value, standard Köppen uses -3°C)',
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
      polar_tmax: {
        value: 10,
        unit: '°C',
        description: 'Polar (E) threshold - warmest month must be below this',
        range: [0, 15],
        step: 0.5,
      },
      icecap_tmax: {
        value: 0,
        unit: '°C',
        description: 'Ice cap (EF) threshold - warmest month below this',
        range: [-10, 5],
        step: 0.5,
      },
      warm_months: {
        value: 4,
        unit: 'months',
        description: 'Number of months ≥10°C for b vs c classification',
        range: [1, 6],
        step: 1,
      },
      very_cold_winter: {
        value: -38,
        unit: '°C',
        description: 'Extreme cold winter threshold for d suffix',
        range: [-50, -20],
        step: 1,
      },
      arid_hot: {
        value: 18,
        unit: '°C',
        description: 'Hot (h) vs cold (k) arid climate threshold (MAT)',
        range: [10, 25],
        step: 0.5,
      },
    },

    // Precipitation thresholds
    precipitation: {
      tropical_dry: {
        value: 60,
        unit: 'mm',
        description: 'Dry month threshold for Af classification',
        range: [40, 100],
        step: 5,
      },
      dry_summer_threshold: {
        value: 40,
        unit: 'mm',
        description: 'Summer dry month threshold for s suffix',
        range: [20, 60],
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
      arid_coefficient: {
        value: 20,
        unit: '',
        description: 'Arid threshold coefficient (multiplied by MAT)',
        range: [10, 30],
        step: 1,
      },
      arid_summer_offset: {
        value: 280,
        unit: 'mm',
        description: 'Arid threshold offset for summer-dominant rainfall',
        range: [0, 400],
        step: 20,
      },
      arid_winter_offset: {
        value: 0,
        unit: 'mm',
        description: 'Arid threshold offset for winter-dominant rainfall',
        range: [0, 200],
        step: 20,
      },
      arid_even_offset: {
        value: 140,
        unit: 'mm',
        description: 'Arid threshold offset for evenly distributed rainfall',
        range: [0, 300],
        step: 20,
      },
      arid_seasonal_concentration: {
        value: 0.7,
        unit: '',
        description: 'Seasonal concentration threshold (70% = 0.7)',
        range: [0.5, 0.9],
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
    // Temperature thresholds - set to extremes so everything starts unclassified
    temperature: {
      tropical_min: {
        value: 30,  // Extreme high (nothing will be tropical)
        unit: '°C',
        description: 'Minimum coldest month temperature for tropical (A) climates',
        range: [10, 25],
        step: 0.5,
      },
      temperate_cold_min: {
        value: -50,  // Extreme low (everything will be C, not D)
        unit: '°C',
        description: 'C/D boundary - coldest month threshold (C if > this value)',
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
      polar_tmax: {
        value: -50,  // Extreme low (nothing will be polar)
        unit: '°C',
        description: 'Polar (E) threshold - warmest month must be below this',
        range: [0, 15],
        step: 0.5,
      },
      icecap_tmax: {
        value: -80,  // Extreme low
        unit: '°C',
        description: 'Ice cap (EF) threshold - warmest month below this',
        range: [-10, 5],
        step: 0.5,
      },
      warm_months: {
        value: 12,  // Extreme (nothing will qualify)
        unit: 'months',
        description: 'Number of months ≥10°C for b vs c classification',
        range: [1, 6],
        step: 1,
      },
      very_cold_winter: {
        value: -80,  // Extreme low
        unit: '°C',
        description: 'Extreme cold winter threshold for d suffix',
        range: [-50, -20],
        step: 1,
      },
      arid_hot: {
        value: 50,  // Extreme high
        unit: '°C',
        description: 'Hot (h) vs cold (k) arid climate threshold (MAT)',
        range: [10, 25],
        step: 0.5,
      },
    },

    // Precipitation thresholds - set to extremes
    precipitation: {
      tropical_dry: {
        value: 500,  // Extreme high (nothing will be Af)
        unit: 'mm',
        description: 'Dry month threshold for Af classification',
        range: [40, 100],
        step: 5,
      },
      dry_summer_threshold: {
        value: 0,  // Extreme low (everything will have dry summer)
        unit: 'mm',
        description: 'Summer dry month threshold for s suffix',
        range: [20, 60],
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
      arid_coefficient: {
        value: 10,  // Extreme low
        unit: '',
        description: 'Arid threshold coefficient (multiplied by MAT)',
        range: [10, 30],
        step: 1,
      },
      arid_summer_offset: {
        value: 0,  // Extreme low (more arid climates)
        unit: 'mm',
        description: 'Arid threshold offset for summer-dominant rainfall',
        range: [0, 400],
        step: 20,
      },
      arid_winter_offset: {
        value: 0,  // Keep at 0
        unit: 'mm',
        description: 'Arid threshold offset for winter-dominant rainfall',
        range: [0, 200],
        step: 20,
      },
      arid_even_offset: {
        value: 0,  // Extreme low
        unit: 'mm',
        description: 'Arid threshold offset for evenly distributed rainfall',
        range: [0, 300],
        step: 20,
      },
      arid_seasonal_concentration: {
        value: 0.9,  // Extreme high (hard to qualify as seasonal)
        unit: '',
        description: 'Seasonal concentration threshold (70% = 0.7)',
        range: [0.5, 0.9],
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
