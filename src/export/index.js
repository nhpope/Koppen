/**
 * Export Module - PNG/URL/JSON export functionality - Story 6.1
 * @module export
 */

import pngGenerator from './png-generator.js';
import fullResExport from './full-res-export.js';
import { generateFilename, downloadBlob } from './utils.js';
import { exportJSON, importJSON } from './json-export.js';  // Story 6.5
import logger from '../utils/logger.js';
import { getFeatures, getClassificationMode, loadAllDetailTiles } from '../map/climate-layer.js';

let exportButton = null;
let includeLegendCheckbox = null;
let loadingModal = null;

/**
 * Create loading modal element
 */
function createLoadingModal() {
  const modal = document.createElement('div');
  modal.className = 'export-loading-modal';

  const content = document.createElement('div');
  content.className = 'export-loading-modal__content';

  const spinner = document.createElement('div');
  spinner.className = 'export-loading-modal__spinner';

  const message = document.createElement('div');
  message.className = 'export-loading-modal__message';

  const progressContainer = document.createElement('div');
  progressContainer.className = 'export-loading-modal__progress';

  const progressBar = document.createElement('div');
  progressBar.className = 'export-loading-modal__progress-bar';

  progressContainer.appendChild(progressBar);
  content.appendChild(spinner);
  content.appendChild(message);
  content.appendChild(progressContainer);
  modal.appendChild(content);

  return modal;
}

/**
 * Show loading modal with progress
 */
function showLoadingModal(messageText, current, total) {
  if (!loadingModal) {
    loadingModal = createLoadingModal();
    document.body.appendChild(loadingModal);
  }

  const messageEl = loadingModal.querySelector('.export-loading-modal__message');
  const progressBar = loadingModal.querySelector('.export-loading-modal__progress-bar');

  if (messageEl) messageEl.textContent = messageText;
  if (progressBar) {
    const percent = total > 0 ? (current / total) * 100 : 0;
    progressBar.style.width = `${percent}%`;
  }

  loadingModal.style.display = 'flex';
}

/**
 * Update loading modal progress
 */
function updateLoadingModal(messageText, current, total) {
  if (!loadingModal) return;

  const messageEl = loadingModal.querySelector('.export-loading-modal__message');
  const progressBar = loadingModal.querySelector('.export-loading-modal__progress-bar');

  if (messageEl) messageEl.textContent = messageText;
  if (progressBar) {
    const percent = total > 0 ? (current / total) * 100 : 0;
    progressBar.style.width = `${percent}%`;
  }
}

/**
 * Hide loading modal
 */
function hideLoadingModal() {
  if (loadingModal) {
    loadingModal.style.display = 'none';
  }
}

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

    document.dispatchEvent(new CustomEvent('koppen:export-started'));

    // Get classification name for filename
    const classificationName = document.querySelector('[data-classification-name]')?.value || document.getElementById('classification-name')?.value || 'koppen';

    const mode = getClassificationMode();
    const isCustomMode = mode === 'custom';

    let blob, duration;

    // Use full-resolution export if legend is checked
    if (includeLegendCheckbox?.checked) {
      // Show progress modal
      showLoadingModal('Loading tiles for export...', 0, 100);

      try {
        // Load ALL detail tiles with progress tracking
        exportButton.textContent = 'Loading tiles...';

        const allFeatures = await loadAllDetailTiles((loaded, total) => {
          const progress = Math.round((loaded / total) * 100);
          updateLoadingModal(`Loading tiles: ${loaded}/${total}`, progress, 100);
          exportButton.textContent = `Loading ${progress}%...`;
        });

        exportButton.textContent = 'Rendering...';
        updateLoadingModal('Rendering map...', 100, 100);

        blob = await fullResExport.exportFullResolution({
          features: allFeatures,
          classificationName,
          isCustomMode,
        });
        duration = 0;
      } finally {
        hideLoadingModal();
      }
    } else {
      // Viewport screenshot (no legend)
      exportButton.textContent = 'Exporting...';
      const result = await pngGenerator.generatePNG({
        includeLegend: false,
        includeWatermark: true,
      });
      blob = result.blob;
      duration = result.duration;
    }

    // Download
    const filename = generateFilename(classificationName);
    downloadBlob(blob, filename);

    // Success feedback
    logger.log(`[Koppen] Exported as ${filename}`);

    document.dispatchEvent(new CustomEvent('koppen:export-completed', {
      detail: { filename, duration, size: blob.size },
    }));

  } catch (error) {
    console.error('[Koppen] Export failed:', error);

    document.dispatchEvent(new CustomEvent('koppen:export-failed', {
      detail: { error: error.message },
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

    // Enable button when map is ready (listen to both events)
    const enableButton = () => {
      exportButton.disabled = false;
      logger.log('[Koppen] Export button enabled');
    };

    document.addEventListener('koppen:map-ready', enableButton);
    document.addEventListener('koppen:layer-ready', enableButton);
    document.addEventListener('koppen:data-loaded', enableButton);

    logger.log('[Koppen] Export module initialized');
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

      logger.log(`[Koppen] Exported JSON: ${filename} (${size} bytes)`);

      document.dispatchEvent(new CustomEvent('koppen:json-export-completed', {
        detail: { filename, size },
      }));

      return { json, filename, size };
    } catch (error) {
      console.error('[Koppen] JSON export failed:', error);

      document.dispatchEvent(new CustomEvent('koppen:json-export-failed', {
        detail: { error: error.message },
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

          logger.log('[Koppen] Imported classification:', classification.name);

          document.dispatchEvent(new CustomEvent('koppen:json-import-completed', {
            detail: { name: classification.name, version: classification.version },
          }));

          resolve(classification);
        } catch (error) {
          console.error('[Koppen] JSON import failed:', error);

          document.dispatchEvent(new CustomEvent('koppen:json-import-failed', {
            detail: { error: error.message },
          }));

          reject(error);
        }
      };

      reader.onerror = () => {
        const error = new Error('Failed to read file');
        console.error('[Koppen] FileReader error:', error);

        document.dispatchEvent(new CustomEvent('koppen:json-import-failed', {
          detail: { error: error.message },
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
    logger.log('[Koppen] Export module destroyed');
  },
};
