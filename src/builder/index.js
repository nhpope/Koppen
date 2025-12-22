/**
 * Builder Module - Classification builder UI
 * @module builder
 */

let builderPanel = null;
let isOpen = false;

export default {
  /**
   * Initialize the builder module
   * @param {Object} _options - Configuration options
   */
  init(_options = {}) {
    builderPanel = document.getElementById('builder-panel');
    console.log('[Koppen] Builder module initialized');
  },

  /**
   * Open the builder panel
   */
  open() {
    if (builderPanel) {
      builderPanel.classList.add('builder-panel--open');
      isOpen = true;
      document.dispatchEvent(new CustomEvent('koppen:builder-opened'));
    }
  },

  /**
   * Close the builder panel
   */
  close() {
    if (builderPanel) {
      builderPanel.classList.remove('builder-panel--open');
      isOpen = false;
      document.dispatchEvent(new CustomEvent('koppen:builder-closed'));
    }
  },

  /**
   * Toggle the builder panel
   */
  toggle() {
    if (isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  /**
   * Check if builder is open
   * @returns {boolean}
   */
  isOpen() {
    return isOpen;
  },

  /**
   * Destroy the module
   */
  destroy() {
    builderPanel = null;
    isOpen = false;
    console.log('[Koppen] Builder module destroyed');
  },
};
