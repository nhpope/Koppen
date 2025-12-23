/**
 * Export Module - PNG/URL/JSON export functionality - Story 6.1
 * @module export
 */

import pngGenerator from './png-generator.js';
import { generateFilename, downloadBlob } from './utils.js';
import { exportJSON, importJSON, generateFilename as generateJSONFilename } from './json-export.js';  // Story 6.5

let exportButton = null;
let includeLegendCheckbox = null;

/**
 * Handle export button click
 */
async function handleExport() {
  if (pngGenerator.isExporting()) {
    return; // Already exporting
  }

  document.dispatchEvent(new CustomEvent('koppen:export-requested'));

  try {
    // Show loading state
    exportButton.disabled = true;
    exportButton.classList.add('export-button--active');
    const originalText = exportButton.textContent;
    exportButton.textContent = 'Exporting...';

    document.dispatchEvent(new CustomEvent('koppen:export-started'));

    // Get classification name for filename (default to 'koppen')
    const classificationName = document.querySelector('[data-classification-name]')?.value || 'koppen';

    // Generate PNG
    const { blob, duration } = await pngGenerator.generatePNG({
      includeLegend: includeLegendCheckbox?.checked ?? true,
      includeWatermark: true
    });

    // Download
    const filename = generateFilename(classificationName);
    downloadBlob(blob, filename);

    // Success feedback
    console.log(`[Koppen] Exported as ${filename}`);

    document.dispatchEvent(new CustomEvent('koppen:export-completed', {
      detail: { filename, duration, size: blob.size }
    }));

  } catch (error) {
    console.error('[Koppen] Export failed:', error);

    document.dispatchEvent(new CustomEvent('koppen:export-failed', {
      detail: { error: error.message }
    }));

  } finally {
    exportButton.disabled = false;
    exportButton.classList.remove('export-button--active');
    // Restore button text (keep icon)
    const iconSVG = exportButton.querySelector('svg');
    exportButton.textContent = 'Export';
    if (iconSVG) {
      exportButton.insertBefore(iconSVG, exportButton.firstChild);
    }
  }
}

export default {
  /**
   * Initialize the export module
   * @param {Object} _options - Configuration options
   */
  init(_options = {}) {
    exportButton = document.querySelector('[data-export-png]');
    includeLegendCheckbox = document.querySelector('[data-export-legend]');

    if (!exportButton) {
      console.warn('[Koppen] Export button not found');
      return;
    }

    exportButton.addEventListener('click', handleExport);

    // Enable button when map is ready
    document.addEventListener('koppen:map-ready', () => {
      exportButton.disabled = false;
    });

    console.log('[Koppen] Export module initialized');
  },

  /**
   * Export map as PNG
   * @param {Object} options - Export options
   * @returns {Promise<Blob>}
   */
  async exportPNG(options = {}) {
    return await pngGenerator.generatePNG(options);
  },

  /**
   * Generate shareable URL
   * @param {Object} state - Current classification state
   * @returns {string}
   */
  generateURL(state) {
    const encoded = btoa(JSON.stringify(state));
    return `${window.location.origin}${window.location.pathname}?rules=${encoded}`;
  },

  /**
   * Parse URL state
   * @param {string} url - URL to parse
   * @returns {Object|null}
   */
  parseURL(url = window.location.href) {
    try {
      const params = new URLSearchParams(new URL(url).search);
      const rules = params.get('rules');
      if (rules) {
        return JSON.parse(atob(rules));
      }
    } catch (e) {
      console.error('[Koppen] Failed to parse URL state:', e);
    }
    return null;
  },

  /**
   * Export classification as JSON and download it
   * @param {Object} classification - Classification state
   * @param {string} classification.name - Classification name
   * @param {Object} classification.thresholds - Threshold values
   * @param {Object} [classification.view] - Optional map view state
   * @returns {Promise<Object>} { json, filename, size }
   */
  async exportJSONFile(classification) {
    try {
      document.dispatchEvent(new CustomEvent('koppen:json-export-requested'));

      // Use json-export module to generate JSON
      const { json, filename, size } = exportJSON(classification);

      // Download the file
      const blob = new Blob([json], { type: 'application/json' });
      downloadBlob(blob, filename);

      console.log(`[Koppen] Exported JSON: ${filename} (${size} bytes)`);

      document.dispatchEvent(new CustomEvent('koppen:json-export-completed', {
        detail: { filename, size }
      }));

      return { json, filename, size };
    } catch (error) {
      console.error('[Koppen] JSON export failed:', error);

      document.dispatchEvent(new CustomEvent('koppen:json-export-failed', {
        detail: { error: error.message }
      }));

      throw error;
    }
  },

  /**
   * Import classification from JSON file
   * @param {File} file - JSON file
   * @returns {Promise<Object>} Parsed and validated classification
   */
  async importJSONFile(file) {
    return new Promise((resolve, reject) => {
      document.dispatchEvent(new CustomEvent('koppen:json-import-requested'));

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const json = e.target.result;

          // Use json-export module to parse and validate
          const classification = importJSON(json);

          console.log('[Koppen] Imported classification:', classification.name);

          document.dispatchEvent(new CustomEvent('koppen:json-import-completed', {
            detail: { name: classification.name, version: classification.version }
          }));

          resolve(classification);
        } catch (error) {
          console.error('[Koppen] JSON import failed:', error);

          document.dispatchEvent(new CustomEvent('koppen:json-import-failed', {
            detail: { error: error.message }
          }));

          reject(error);
        }
      };

      reader.onerror = () => {
        const error = new Error('Failed to read file');
        console.error('[Koppen] FileReader error:', error);

        document.dispatchEvent(new CustomEvent('koppen:json-import-failed', {
          detail: { error: error.message }
        }));

        reject(error);
      };

      reader.readAsText(file);
    });
  },

  /**
   * Destroy the module
   */
  destroy() {
    if (exportButton) {
      exportButton.removeEventListener('click', handleExport);
    }
    console.log('[Koppen] Export module destroyed');
  },
};
