/**
 * Full Resolution Export Module
 * Exports entire world map at 0.25° resolution with legend
 */

import logger from '../utils/logger.js';

/**
 * Extract unique categories from features for legend
 */
function extractLegendData(features) {
  const categoryMap = new Map();

  features.forEach(feature => {
    const type = feature.properties.climate_type || feature.properties.classifiedType;
    const name = feature.properties.climate_name || type;
    const color = feature.properties.climate_color || feature.properties.classifiedColor;

    if (type && color && feature.properties.classified !== false) {
      if (!categoryMap.has(type)) {
        categoryMap.set(type, { name, color });
      }
    }
  });

  return Array.from(categoryMap.values());
}

/**
 * Export full-resolution map with legend
 * @param {Object} options
 * @param {Array} options.features - All classified features
 * @param {string} options.classificationName - Name for the file
 * @param {boolean} options.isCustomMode - Whether using custom classification
 * @returns {Promise<Blob>}
 */
export async function exportFullResolution(options) {
  const {
    features,
    classificationName = 'koppen',
    isCustomMode = false,
  } = options;

  // Extract legend data from features
  const legendData = extractLegendData(features);

  logger.log('[Koppen] Starting full-resolution export...');
  const startTime = performance.now();

  // Canvas dimensions
  const mapWidth = 2000;
  const mapHeight = 1200;
  const legendHeight = 300;
  const totalHeight = mapHeight + legendHeight;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = mapWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(0, 0, mapWidth, totalHeight);

  // Render map
  renderMap(ctx, features, mapWidth, mapHeight);

  // Render legend below map
  renderLegend(ctx, legendData, mapWidth, mapHeight, legendHeight, isCustomMode);

  // Add watermark
  addWatermark(ctx, mapWidth, totalHeight);

  // Convert to blob
  const blob = await new Promise(resolve => {
    canvas.toBlob(resolve, 'image/png', 0.95);
  });

  const duration = performance.now() - startTime;
  logger.log(`[Koppen] Full-resolution export completed in ${duration.toFixed(0)}ms`);

  return blob;
}

/**
 * Render map features to canvas
 */
function renderMap(ctx, features, width, height) {
  if (!features || features.length === 0) return;

  // Equirectangular projection
  const lonToX = (lon) => ((lon + 180) / 360) * width;
  const latToY = (lat) => ((90 - lat) / 180) * height;

  // Cell size (0.25° = 1/1440 of 360°)
  const cellWidth = width / 1440;
  const cellHeight = height / 720;

  features.forEach(feature => {
    const color = feature.properties.climate_color ||
                  feature.properties.classifiedColor ||
                  '#cccccc';

    // Only render classified features
    if (feature.properties.classified !== false) {
      const coords = feature.geometry.coordinates[0];
      const [[lon, lat]] = coords;

      const x = lonToX(lon);
      const y = latToY(lat);

      ctx.fillStyle = color;
      ctx.fillRect(x, y, cellWidth, cellHeight);
    }
  });

  logger.log(`[Koppen] Rendered ${features.length} features`);
}

/**
 * Render legend below map
 */
function renderLegend(ctx, legendData, width, mapHeight, legendHeight, isCustomMode) {
  const legendY = mapHeight;

  // Legend background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, legendY, width, legendHeight);

  // Title
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const title = isCustomMode ? 'Custom Categories' : 'Climate Types';
  ctx.fillText(title, width / 2, legendY + 20);

  if (!legendData || legendData.length === 0) return;

  // Render categories in grid
  const cols = 6;
  const itemWidth = (width - 100) / cols;
  const itemHeight = 40;
  const startX = 50;
  const startY = legendY + 70;

  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  legendData.slice(0, 18).forEach((item, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = startX + col * itemWidth;
    const y = startY + row * itemHeight;

    // Color swatch
    ctx.fillStyle = item.color;
    ctx.fillRect(x, y - 8, 20, 16);

    // Label
    ctx.fillStyle = '#334155';
    const label = item.name.slice(0, 20);
    ctx.fillText(label, x + 28, y);
  });

  // Show count if more categories
  if (legendData.length > 18) {
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText(
      `+ ${legendData.length - 18} more categories`,
      width / 2,
      startY + Math.ceil(18 / cols) * itemHeight + 10
    );
  }
}

/**
 * Add watermark to canvas
 */
function addWatermark(ctx, width, height) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Made with koppen.io', width - 20, height - 20);
}

export default {
  exportFullResolution,
};
