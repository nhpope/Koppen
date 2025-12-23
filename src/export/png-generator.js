/**
 * PNG Generation Engine - Story 6.1
 * Captures Leaflet map with legend and watermark using html2canvas
 * @module export/png-generator
 */

import html2canvas from 'html2canvas';

let isExporting = false;

/**
 * Add watermark to canvas
 * @param {HTMLCanvasElement} canvas - Canvas to add watermark to
 */
function addWatermark(canvas) {
  const ctx = canvas.getContext('2d');
  const text = 'Made with Koppen - koppen.app';

  ctx.save();
  ctx.font = '14px Inter, sans-serif';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  // Position: bottom-right with padding
  const x = canvas.width - 20;
  const y = canvas.height - 20;

  ctx.fillText(text, x, y);
  ctx.restore();
}

export default {
  /**
   * Generate PNG from current map view
   * @param {Object} options - Export options
   * @param {boolean} [options.includeLegend=true] - Include legend in export
   * @param {boolean} [options.includeWatermark=true] - Include watermark
   * @param {number} [options.scale=window.devicePixelRatio] - Canvas scale for high-DPI
   * @param {number} [options.quality=0.95] - Image quality (0-1)
   * @returns {Promise<{blob: Blob, duration: number, width: number, height: number}>}
   */
  async generatePNG(options = {}) {
    if (isExporting) {
      throw new Error('Export already in progress');
    }

    isExporting = true;
    const startTime = performance.now();

    try {
      const {
        includeLegend = true,
        includeWatermark = true,
        scale = window.devicePixelRatio || 1,
        quality = 0.95
      } = options;

      // Get map container
      const mapContainer = document.querySelector('.map-container');
      if (!mapContainer) {
        throw new Error('Map container not found');
      }

      // Prepare for capture - temporarily hide legend if not included
      const legendEl = document.querySelector('.legend');
      let originalDisplay = null;
      if (!includeLegend && legendEl) {
        originalDisplay = legendEl.style.display;
        legendEl.style.display = 'none';
      }

      // Capture with html2canvas
      const canvas = await html2canvas(mapContainer, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8f9fa'
      });

      // Restore legend visibility
      if (!includeLegend && legendEl && originalDisplay !== null) {
        legendEl.style.display = originalDisplay;
      }

      // Add watermark
      if (includeWatermark) {
        addWatermark(canvas);
      }

      // Convert to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', quality);
      });

      const duration = performance.now() - startTime;
      console.log(`[Koppen] PNG export completed in ${duration.toFixed(0)}ms`);

      return { blob, duration, width: canvas.width, height: canvas.height };

    } finally {
      isExporting = false;
    }
  },

  /**
   * Check if export is in progress
   * @returns {boolean}
   */
  isExporting() {
    return isExporting;
  }
};
