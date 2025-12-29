/**
 * UI Module - User interface components
 * @module ui
 */

import { createLegend, updateStats } from './legend.js';
import { createTooltip, destroy as destroyTooltip } from './tooltip.js';
import { createClimateInfo, showClimateInfo } from './climate-info.js';
import header from './header.js';
import shareModal from './share-modal.js';  // Story 6.3
import sharedInfoBar from './shared-info-bar.js';  // Story 6.4
import onboardingModal from './onboarding-modal.js';  // First-time user guidance

let infoController = null;

export default {
  /**
   * Initialize all UI components
   */
  init() {
    // Initialize header (donation button, etc.)
    header.init();

    // Create legend
    const legendContainer = document.getElementById('legend-container');
    if (legendContainer) {
      createLegend(legendContainer);
    }

    // Create tooltip
    createTooltip();

    // Create climate info panel
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
      infoController = createClimateInfo(infoPanel);
    }

    // Initialize share modal (Story 6.3)
    shareModal.init();

    // Initialize shared info bar (Story 6.4)
    sharedInfoBar.init();

    // Initialize onboarding modal for first-time users
    onboardingModal.init();

    console.log('[Koppen] UI module initialized');
  },

  /**
   * Update legend stats
   * @param {Object} stats - Stats by climate type
   */
  updateLegend(stats) {
    if (stats) {
      updateStats(stats);
    }
  },

  /**
   * Show tooltip
   * @param {Object} _data - Tooltip data
   */
  showTooltip(_data) {
    // Tooltip handles this via events
  },

  /**
   * Show climate info panel
   * @param {Object} data - Climate data
   */
  showClimateInfo(data) {
    showClimateInfo(data);
  },

  /**
   * Show a message to the user
   * @param {string} message - Message text
   * @param {string} type - Message type (info, error, success)
   */
  showMessage(message, type = 'info') {
    const msgEl = document.createElement('div');
    msgEl.className = `message message--${type}`;
    msgEl.textContent = message;
    document.body.appendChild(msgEl);

    setTimeout(() => {
      msgEl.classList.add('message--fade');
      setTimeout(() => msgEl.remove(), 300);
    }, 3000);
  },

  /**
   * Destroy all UI components
   */
  destroy() {
    destroyTooltip();
    if (infoController) {
      infoController.destroy();
      infoController = null;
    }
    shareModal.destroy();  // Story 6.3
    sharedInfoBar.destroy();  // Story 6.4
    onboardingModal.destroy();
    console.log('[Koppen] UI module destroyed');
  },
};

// Re-export components
export { createLegend, updateStats } from './legend.js';
export { createTooltip } from './tooltip.js';
export { createClimateInfo, showClimateInfo } from './climate-info.js';
