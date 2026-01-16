/**
 * URL Encoder Module - Shareable URL generation - Story 6.3
 * @module export/url-encoder
 */

/* eslint-disable security/detect-object-injection --
 * This file accesses threshold data using keys from internal preset configuration.
 * Keys are not user-controlled; they come from KOPPEN_PRESET or Object.keys() iteration.
 * See docs/orchestration/checkpoints/security-review.md for full analysis.
 */

import pako from 'pako';
import { KOPPEN_PRESET } from '../climate/presets.js';

// Schema version for forward compatibility
const SCHEMA_VERSION = 1;

// Maximum URL length (conservative limit for cross-browser compatibility)
const MAX_URL_LENGTH = 2000;

/**
 * Sanitize string input to prevent XSS/injection
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized string
 */
function sanitizeString(str, maxLength = 100) {
  if (typeof str !== 'string') return '';

  // Remove HTML tags, control characters, and limit length
  return str
    .replace(/<[^>]*>/g, '')  // Strip HTML tags
    // eslint-disable-next-line no-control-regex -- Intentionally matching control chars for security
    .replace(/[\u0000-\u001F\u007F]/g, '')  // Remove control chars
    .trim()
    .slice(0, maxLength);
}

/**
 * Extract only modified thresholds (compared to Köppen preset)
 * This minimizes payload size by only encoding changes
 * @param {Object} thresholds - Current threshold values
 * @returns {Object} Only modified thresholds
 */
function extractModifiedThresholds(thresholds) {
  const modified = {};

  if (!thresholds || typeof thresholds !== 'object') {
    return modified;
  }

  // Compare each category
  Object.keys(thresholds).forEach((category) => {
    if (!thresholds[category]) return;

    const baseCategory = KOPPEN_PRESET.thresholds[category];
    if (!baseCategory) {
      // New category not in Köppen - include all
      modified[category] = { ...thresholds[category] };
      return;
    }

    Object.keys(thresholds[category]).forEach((key) => {
      const currentValue = thresholds[category][key]?.value;
      const baseValue = baseCategory[key]?.value;

      // Only include if different from Köppen
      if (currentValue !== undefined && currentValue !== baseValue) {
        if (!modified[category]) {
          modified[category] = {};
        }
        // Store only value, not full config (reduces size)
        modified[category][key] = { value: currentValue };
      }
    });
  });

  return modified;
}

/**
 * Generate shareable URL from classification state
 * @param {Object} state - Classification state
 * @param {string} state.name - Classification name
 * @param {Object} state.thresholds - Threshold values
 * @returns {string} Shareable URL
 * @throws {Error} If URL exceeds length limit or compression fails
 */
export function generateURL(state) {
  try {
    // Sanitize inputs
    const name = sanitizeString(state?.name || 'Custom Classification', 50);
    const thresholds = state?.thresholds || {};

    // Create minimal state object (only modified thresholds)
    const minimalState = {
      v: SCHEMA_VERSION,  // Schema version
      n: name,            // Name (shortened key)
      t: extractModifiedThresholds(thresholds),  // Only modified thresholds
    };

    // Convert to JSON
    const json = JSON.stringify(minimalState);

    // Gzip compress
    const compressed = pako.gzip(json);

    // Convert to base64
    const base64 = btoa(String.fromCharCode.apply(null, compressed));

    // Create URL with encoded state
    const url = `${window.location.origin}${window.location.pathname}?s=${encodeURIComponent(base64)}`;

    // Validate URL length
    if (url.length > MAX_URL_LENGTH) {
      throw new Error(`URL too long (${url.length} chars, max ${MAX_URL_LENGTH}). Try using fewer custom thresholds.`);
    }

    return url;
  } catch (error) {
    if (error.message.includes('URL too long')) {
      throw error;
    }
    throw new Error(`Failed to generate URL: ${error.message}`);
  }
}

/**
 * Decode URL and restore classification state
 * @param {string} url - URL to decode (defaults to current URL)
 * @returns {Object|null} Decoded state or null if no state in URL
 * @throws {Error} If decoding fails or state is invalid
 */
export function decodeURL(url = window.location.href) {
  try {
    // Parse URL parameters
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    const encoded = params.get('s');

    if (!encoded) {
      return null;  // No state in URL
    }

    // Decode base64
    const decoded = atob(decodeURIComponent(encoded));

    // Convert to Uint8Array
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }

    // Decompress with gzip
    const decompressed = pako.ungzip(bytes, { to: 'string' });

    // Parse JSON
    const minimalState = JSON.parse(decompressed);

    // Validate schema version
    if (minimalState.v !== SCHEMA_VERSION) {
      throw new Error(`Unsupported schema version: ${minimalState.v}`);
    }

    // Restore full state by merging with Köppen preset
    const fullThresholds = JSON.parse(JSON.stringify(KOPPEN_PRESET.thresholds));

    // Merge modified thresholds
    if (minimalState.t) {
      Object.keys(minimalState.t).forEach((category) => {
        if (!fullThresholds[category]) {
          fullThresholds[category] = {};
        }

        Object.keys(minimalState.t[category]).forEach((key) => {
          if (!fullThresholds[category][key]) {
            // New threshold not in Köppen - create minimal config
            fullThresholds[category][key] = {
              value: minimalState.t[category][key].value,
              unit: '',
              description: '',
              range: [0, 100],
              step: 1,
            };
          } else {
            // Update existing threshold value
            fullThresholds[category][key].value = minimalState.t[category][key].value;
          }
        });
      });
    }

    // Return full state
    return {
      name: sanitizeString(minimalState.n || 'Shared Classification', 50),
      thresholds: fullThresholds,
      metadata: {
        source: 'url',
        loaded_at: new Date().toISOString(),
        modified: false,
      },
    };
  } catch (error) {
    console.error('[Koppen] Failed to decode URL:', error);
    throw new Error(`Invalid share URL: ${error.message}`);
  }
}

/**
 * Check if current URL contains a shared state
 * @returns {boolean} True if URL has state parameter
 */
export function hasSharedState() {
  const params = new URLSearchParams(window.location.search);
  return params.has('s');
}

/**
 * Get estimated URL size for current state (before encoding)
 * Used for validation and user feedback
 * @param {Object} state - Classification state
 * @returns {number} Estimated URL length in characters
 */
export function estimateURLSize(state) {
  try {
    return generateURL(state).length;
  } catch {
    return -1;  // Error estimating size
  }
}
