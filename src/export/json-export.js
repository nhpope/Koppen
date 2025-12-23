/**
 * JSON Export/Import Module - Story 6.5
 * Serializes and deserializes classification to/from JSON format
 * @module export/json-export
 */

import { KOPPEN_PRESET } from '../climate/presets.js';

const SCHEMA_VERSION = '1.0';
const APP_VERSION = '0.1.0';

/**
 * Export classification as JSON
 * @param {Object} classification - Classification state
 * @param {string} classification.name - Classification name
 * @param {Object} classification.thresholds - Threshold values
 * @param {Object} [classification.view] - Optional map view state
 * @returns {Object} { json, filename, size }
 */
export function exportJSON(classification) {
  try {
    // Build JSON structure
    const data = {
      name: classification.name || 'Custom Classification',
      version: SCHEMA_VERSION,
      created: new Date().toISOString(),
      appVersion: APP_VERSION,
      thresholds: classification.thresholds,
      view: classification.view || null,
    };

    // Serialize with formatting (2-space indent for readability)
    const json = JSON.stringify(data, null, 2);

    // Generate filename
    const filename = generateFilename(classification.name);

    // Calculate size
    const size = new Blob([json]).size;

    return { json, filename, size };
  } catch (error) {
    console.error('[Koppen] JSON export failed:', error);
    throw new Error('Failed to export classification as JSON');
  }
}

/**
 * Import classification from JSON
 * @param {string} json - JSON string
 * @returns {Object} Parsed and validated classification
 * @throws {Error} If JSON is invalid or incompatible
 */
export function importJSON(json) {
  try {
    // Parse JSON
    const data = JSON.parse(json);

    // Validate structure
    validateSchema(data);

    // Check version compatibility
    checkVersionCompatibility(data.version);

    // Sanitize threshold values
    const sanitized = sanitizeThresholds(data.thresholds);

    return {
      name: data.name,
      version: data.version,
      thresholds: sanitized,
      view: data.view || null,
      metadata: {
        created: data.created,
        appVersion: data.appVersion,
      },
    };
  } catch (error) {
    console.error('[Koppen] JSON import failed:', error);
    throw error; // Re-throw with original error type
  }
}

/**
 * Validate JSON schema structure
 * @param {Object} data - Parsed JSON data
 * @throws {Error} If validation fails
 */
function validateSchema(data) {
  // Check required fields
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Missing or invalid "name" field');
  }

  if (!data.version || typeof data.version !== 'string') {
    throw new Error('Missing or invalid "version" field');
  }

  if (!data.thresholds || typeof data.thresholds !== 'object') {
    throw new Error('Missing or invalid "thresholds" field');
  }

  // Check threshold categories
  const requiredCategories = ['temperature', 'precipitation'];
  for (const category of requiredCategories) {
    if (!data.thresholds[category] || typeof data.thresholds[category] !== 'object') {
      throw new Error(`Missing or invalid "thresholds.${category}" field`);
    }
  }

  // Validate created timestamp (if present)
  if (data.created && !isValidISO8601(data.created)) {
    console.warn('[Koppen] Invalid created timestamp:', data.created);
    // Non-fatal, just warn
  }

  return true;
}

/**
 * Check version compatibility
 * @param {string} version - Version string (e.g., "1.0")
 * @throws {Error} If version is incompatible
 */
function checkVersionCompatibility(version) {
  const [major, minor] = version.split('.').map(Number);
  const [currentMajor, currentMinor] = SCHEMA_VERSION.split('.').map(Number);

  // Major version mismatch = incompatible
  if (major > currentMajor) {
    throw new Error(`Incompatible version: ${version} (current: ${SCHEMA_VERSION})`);
  }

  // Minor version mismatch = warning only
  if (major === currentMajor && minor > currentMinor) {
    console.warn('[Koppen] JSON from newer minor version:', version);
    // Allow import but log warning
  }

  // Older versions = compatible (backward compatibility)
  if (major < currentMajor) {
    console.log('[Koppen] JSON from older version, will attempt migration:', version);
    // Migration handled by caller if needed
  }

  return true;
}

/**
 * Sanitize threshold values (range checking, type coercion)
 * @param {Object} thresholds - Threshold data from JSON
 * @returns {Object} Sanitized thresholds
 */
function sanitizeThresholds(thresholds) {
  const sanitized = {};

  Object.keys(thresholds).forEach((category) => {
    sanitized[category] = {};

    Object.keys(thresholds[category]).forEach((key) => {
      const threshold = thresholds[category][key];

      // Handle both full object and value-only formats
      if (typeof threshold === 'object' && threshold.value !== undefined) {
        // Full threshold object
        sanitized[category][key] = {
          value: clampValue(threshold.value, threshold.range),
          unit: threshold.unit || '',
          range: threshold.range || getDefaultRange(category),
          description: threshold.description || '',
        };
      } else if (typeof threshold === 'number') {
        // Value-only format (legacy or URL-encoded)
        sanitized[category][key] = {
          value: threshold,
          unit: getDefaultUnit(category),
          range: getDefaultRange(category),
          description: '',
        };
      } else {
        console.warn('[Koppen] Invalid threshold format:', category, key, threshold);
        // Skip invalid thresholds
      }
    });
  });

  return sanitized;
}

/**
 * Clamp value to valid range
 * @param {number} value - Value to clamp
 * @param {Object} range - Range object with min/max
 * @returns {number} Clamped value
 */
function clampValue(value, range) {
  if (!range) return value;

  const { min, max } = range;
  if (value < min) {
    console.warn('[Koppen] Clamping value to min:', value, '→', min);
    return min;
  }
  if (value > max) {
    console.warn('[Koppen] Clamping value to max:', value, '→', max);
    return max;
  }
  return value;
}

/**
 * Generate filename from classification name
 * @param {string} name - Classification name
 * @returns {string} Sanitized filename
 */
export function generateFilename(name = 'koppen') {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return `koppen-${sanitized}-${date}.json`;
}

/**
 * Validate ISO 8601 timestamp
 * @param {string} str - Timestamp string
 * @returns {boolean} True if valid
 */
function isValidISO8601(str) {
  const date = new Date(str);
  return date instanceof Date && !isNaN(date);
}

/**
 * Get default unit for category
 * @param {string} category - Category name
 * @returns {string} Default unit
 */
function getDefaultUnit(category) {
  const units = {
    temperature: '°C',
    precipitation: 'mm',
  };
  return units[category] || '';
}

/**
 * Get default range for category
 * @param {string} category - Category name
 * @returns {Object} Default range {min, max}
 */
function getDefaultRange(category) {
  // Return conservative ranges
  if (category === 'temperature') {
    return { min: -100, max: 100 };
  }
  if (category === 'precipitation') {
    return { min: 0, max: 10000 };
  }
  return { min: -Infinity, max: Infinity };
}

export default {
  exportJSON,
  importJSON,
  generateFilename,
};
