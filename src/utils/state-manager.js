/**
 * State Manager - Classification state operations - Story 6.6
 * Handles deep cloning, forking, and state comparison
 * @module utils/state-manager
 */

/* eslint-disable security/detect-object-injection --
 * This file accesses classification state using keys from validated internal structures.
 * Keys are not user-controlled; validation via validateStructure() ensures safe access.
 * See docs/orchestration/checkpoints/security-review.md for full analysis.
 */

/**
 * Deep clone classification state
 * Uses JSON serialization to avoid reference sharing
 * @param {Object} classification - Original classification
 * @returns {Object} Independent copy
 * @throws {Error} If cloning fails or structure is invalid
 */
export function deepClone(classification) {
  try {
    // Use JSON serialization for deep copy
    // This avoids reference sharing between original and clone
    const json = JSON.stringify(classification);
    const clone = JSON.parse(json);

    // Validate cloned structure
    if (!validateStructure(clone)) {
      throw new Error('Cloned classification has invalid structure');
    }

    return clone;

  } catch (error) {
    console.error('[Koppen] Deep clone failed:', error);
    throw new Error('Failed to clone classification');
  }
}

/**
 * Create fork of classification with metadata
 * @param {Object} classification - Original classification
 * @param {string} [sourceURL=null] - URL of original (optional)
 * @returns {Object} Forked classification with "(Modified)" suffix and metadata
 */
export function forkClassification(classification, sourceURL = null) {
  // Deep clone to avoid reference sharing
  const forked = deepClone(classification);

  // Update name with "(Modified)" suffix
  forked.name = generateForkName(classification.name);

  // Add fork metadata
  forked.metadata = {
    ...(forked.metadata || {}),
    forkedFrom: sourceURL,
    forkedAt: new Date().toISOString(),
    originalName: classification.name,
    forkGeneration: (classification.metadata?.forkGeneration || 0) + 1,
  };

  return forked;
}

/**
 * Generate fork name with "(Modified)" suffix
 * Handles edge cases: long names, existing suffixes
 * @param {string} originalName - Original classification name
 * @param {number} [maxLength=100] - Maximum name length
 * @returns {string} Name with "(Modified)" suffix
 */
export function generateForkName(originalName, maxLength = 100) {
  // Remove ALL existing "(Modified)" suffixes to avoid cumulative suffixes
  let baseName = originalName;
  while (baseName.includes('(Modified)')) {
    baseName = baseName.replace(/\s*\(Modified\)\s*/g, ' ');
  }
  baseName = baseName.trim();

  const suffix = '(Modified)';
  const maxBase = maxLength - suffix.length - 1; // -1 for space before suffix

  // Truncate if base name too long (accounting for "..." characters)
  const truncatedBase = baseName.length > maxBase
    ? baseName.substring(0, maxBase - 3) + '...'
    : baseName;

  // Only add space before suffix if there's a base name
  return truncatedBase ? `${truncatedBase} ${suffix}` : suffix;
}

/**
 * Validate classification structure
 * Ensures required fields exist and have correct types
 * @param {Object} classification - Classification to validate
 * @returns {boolean} True if valid
 */
export function validateStructure(classification) {
  if (!classification || typeof classification !== 'object') {
    return false;
  }

  // Must have thresholds
  if (!classification.thresholds || typeof classification.thresholds !== 'object') {
    return false;
  }

  // Must have name
  if (!classification.name || typeof classification.name !== 'string') {
    return false;
  }

  return true;
}

/**
 * Check if classification has been modified from original
 * Compares threshold values only
 * @param {Object} current - Current state
 * @param {Object} original - Original state
 * @returns {boolean} True if modified
 */
export function isModified(current, original) {
  if (!current || !original) return false;

  // Compare threshold values only (ignore metadata, view, etc.)
  try {
    const currentJSON = JSON.stringify(current.thresholds);
    const originalJSON = JSON.stringify(original.thresholds);

    return currentJSON !== originalJSON;
  } catch (error) {
    console.warn('[Koppen] Modification check failed:', error);
    return false;
  }
}

/**
 * Get list of modified thresholds
 * @param {Object} current - Current state
 * @param {Object} original - Original state
 * @returns {Array} List of modified threshold keys in format "category.key"
 */
export function getModifiedThresholds(current, original) {
  const modified = [];

  if (!current?.thresholds || !original?.thresholds) {
    return modified;
  }

  // Iterate through categories (temperature, precipitation)
  Object.keys(current.thresholds).forEach((category) => {
    if (!current.thresholds[category] || !original.thresholds[category]) {
      return;
    }

    // Iterate through threshold keys within category
    Object.keys(current.thresholds[category]).forEach((key) => {
      const currentValue = current.thresholds[category][key]?.value;
      const originalValue = original.thresholds[category][key]?.value;

      if (currentValue !== originalValue) {
        modified.push(`${category}.${key}`);
      }
    });
  });

  return modified;
}

export default {
  deepClone,
  forkClassification,
  generateForkName,
  validateStructure,
  isModified,
  getModifiedThresholds,
};
