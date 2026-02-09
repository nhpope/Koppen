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
// v1 = threshold modifications only
// v2 = full custom rules support
const SCHEMA_VERSION = 2;

// Maximum URL length (conservative limit for cross-browser compatibility)
const MAX_URL_LENGTH = 2000;

// Extended limit for custom rules (some platforms support longer URLs)
const MAX_URL_LENGTH_EXTENDED = 8000;

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
 * Generate a simple ID for categories/rules during decode
 * @returns {string} Simple unique ID
 */
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * Minify custom rules for URL encoding
 * Uses single-letter keys to reduce size before compression
 * Uses array indices for parent-child relationships instead of IDs
 * @param {Object} customRules - Custom rules engine JSON (from toJSON())
 * @returns {Object} Minified rules object
 */
function minifyCustomRules(customRules) {
  if (!customRules || !customRules.categories) {
    return null;
  }

  // Build ID to index map for parent references
  const idToIndex = new Map();
  customRules.categories.forEach((cat, idx) => {
    idToIndex.set(cat.id, idx);
  });

  return {
    c: customRules.categories.map(cat => {
      const minCat = {
        n: cat.name,        // name
        o: cat.color,       // color (o for hue/colOr)
      };

      // Only include non-default values
      if (cat.description) minCat.d = cat.description;
      if (cat.priority !== 0 && cat.priority !== undefined) minCat.p = cat.priority;
      if (cat.enabled === false) minCat.e = false;

      // Store parent index instead of ID
      if (cat.parentId) {
        const parentIndex = idToIndex.get(cat.parentId);
        if (parentIndex !== undefined) {
          minCat.x = parentIndex;  // x = parent index
        }
      }

      // Minify rules
      if (cat.rules && cat.rules.length > 0) {
        minCat.r = cat.rules.map(rule => {
          const minRule = {
            a: rule.parameter,  // a for pArameter
            b: rule.operator,   // b for operator (op)
            v: rule.value,      // v for value
          };
          return minRule;
        });
      }

      return minCat;
    }),

    // Include custom parameters if present
    ...(customRules.customParameters && customRules.customParameters.length > 0 ? {
      q: customRules.customParameters.map(param => ({
        i: param.id,
        n: param.name,
        f: param.formula,
        ...(param.unit ? { u: param.unit } : {}),
        ...(param.description ? { d: param.description } : {}),
      })),
    } : {}),
  };
}

/**
 * Expand minified custom rules back to full format
 * Rebuilds parent-child relationships using array indices
 * @param {Object} minified - Minified rules from URL
 * @returns {Object} Full custom rules JSON for CustomRulesEngine.fromJSON()
 */
function expandCustomRules(minified) {
  if (!minified || !minified.c) {
    return null;
  }

  // First pass: Create categories with new IDs
  const categories = minified.c.map(minCat => ({
    id: generateId(),
    name: minCat.n || 'Unnamed',
    color: minCat.o || '#888888',
    description: minCat.d || '',
    priority: minCat.p ?? 0,
    enabled: minCat.e !== false,
    parentId: null,  // Will be set in second pass
    children: [],    // Will be set in second pass
    rules: (minCat.r || []).map(minRule => ({
      id: generateId(),
      parameter: minRule.a,
      operator: minRule.b,
      value: minRule.v,
    })),
  }));

  // Second pass: Rebuild parent-child relationships using indices
  minified.c.forEach((minCat, idx) => {
    if (minCat.x !== undefined && minCat.x !== null) {
      const parentIndex = minCat.x;
      if (parentIndex >= 0 && parentIndex < categories.length) {
        // Set parentId to the new ID of the parent
        categories[idx].parentId = categories[parentIndex].id;
        // Add this category to parent's children array
        categories[parentIndex].children.push(categories[idx].id);
      }
    }
  });

  return {
    version: '1.0.0',
    type: 'custom-rules',
    categories,

    // Expand custom parameters if present
    ...(minified.q ? {
      customParameters: minified.q.map(p => ({
        id: p.i || generateId(),
        name: p.n,
        formula: p.f,
        unit: p.u || '',
        description: p.d || '',
        range: [0, 100],
        step: 1,
      })),
    } : {}),
  };
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
 * Supports both threshold modifications and full custom rules
 * @param {Object} state - Classification state
 * @param {string} state.name - Classification name
 * @param {Object} [state.thresholds] - Threshold values (for modified Köppen)
 * @param {Object} [state.customRules] - Custom rules engine JSON (for custom classifications)
 * @param {Object} [options] - Options
 * @param {boolean} [options.allowLongURL=false] - Allow URLs up to 8000 chars (for custom rules)
 * @returns {string} Shareable URL
 * @throws {Error} If URL exceeds length limit or compression fails
 */
export function generateURL(state, options = {}) {
  try {
    const { allowLongURL = false } = options;
    const maxLength = allowLongURL ? MAX_URL_LENGTH_EXTENDED : MAX_URL_LENGTH;

    // Sanitize inputs
    const name = sanitizeString(state?.name || 'Custom Classification', 50);

    let minimalState;

    // Check if this is a custom rules classification
    if (state?.customRules && state.customRules.categories) {
      // Custom rules mode - full classification system
      const minifiedRules = minifyCustomRules(state.customRules);

      minimalState = {
        v: SCHEMA_VERSION,
        m: 'c',              // mode: 'c' = custom rules
        n: name,
        r: minifiedRules,    // minified rules
      };
    } else {
      // Threshold modification mode (existing behavior)
      const thresholds = state?.thresholds || {};

      minimalState = {
        v: SCHEMA_VERSION,
        m: 't',              // mode: 't' = threshold modifications
        n: name,
        t: extractModifiedThresholds(thresholds),
      };
    }

    // Convert to JSON
    const json = JSON.stringify(minimalState);

    // Gzip compress
    const compressed = pako.gzip(json);

    // Convert to base64
    const base64 = btoa(String.fromCharCode.apply(null, compressed));

    // Create URL with encoded state
    const url = `${window.location.origin}${window.location.pathname}?s=${encodeURIComponent(base64)}`;

    // Validate URL length
    if (url.length > maxLength) {
      const suggestion = state?.customRules
        ? 'Try reducing the number of categories or rules.'
        : 'Try using fewer custom thresholds.';
      throw new Error(`URL too long (${url.length} chars, max ${maxLength}). ${suggestion}`);
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
 * Supports both threshold modifications (v1/v2 mode 't') and custom rules (v2 mode 'c')
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

    // Validate schema version (support v1 and v2)
    if (minimalState.v !== 1 && minimalState.v !== 2) {
      throw new Error(`Unsupported schema version: ${minimalState.v}`);
    }

    // Determine mode (v1 is always threshold mode, v2 checks 'm' field)
    const mode = minimalState.v === 1 ? 't' : (minimalState.m || 't');

    if (mode === 'c' && minimalState.r) {
      // Custom rules mode - expand and return custom rules
      const expandedRules = expandCustomRules(minimalState.r);

      return {
        name: sanitizeString(minimalState.n || 'Shared Classification', 50),
        mode: 'custom',
        customRules: expandedRules,
        metadata: {
          source: 'url',
          loaded_at: new Date().toISOString(),
          modified: false,
        },
      };
    } else {
      // Threshold modification mode (existing behavior)
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

      // Return threshold state
      return {
        name: sanitizeString(minimalState.n || 'Shared Classification', 50),
        mode: 'threshold',
        thresholds: fullThresholds,
        metadata: {
          source: 'url',
          loaded_at: new Date().toISOString(),
          modified: false,
        },
      };
    }
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
 * @param {Object} [options] - Options (passed to generateURL)
 * @returns {number} Estimated URL length in characters
 */
export function estimateURLSize(state, options = {}) {
  try {
    return generateURL(state, options).length;
  } catch {
    return -1;  // Error estimating size
  }
}

/**
 * Generate shareable URL for custom rules classification
 * Convenience wrapper for generateURL with custom rules
 * @param {Object} customRulesEngine - CustomRulesEngine instance (must have toJSON method)
 * @param {string} [name] - Classification name
 * @returns {string} Shareable URL
 */
export function generateCustomRulesURL(customRulesEngine, name = 'Custom Classification') {
  if (!customRulesEngine || typeof customRulesEngine.toJSON !== 'function') {
    throw new Error('Invalid custom rules engine: must have toJSON method');
  }

  return generateURL({
    name: name,
    customRules: customRulesEngine.toJSON(),
  }, { allowLongURL: true });
}

/**
 * Check if decoded state is a custom rules classification
 * @param {Object} decodedState - State from decodeURL
 * @returns {boolean} True if custom rules mode
 */
export function isCustomRulesState(decodedState) {
  return decodedState?.mode === 'custom' && decodedState?.customRules;
}
