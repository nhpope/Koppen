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

  // Calculate legend height based on category count
  const categoryCount = legendData.length;
  const cols = 6;
  const rows = Math.ceil(categoryCount / cols);
  const itemHeight = 35; // Reduced from 40
  const legendHeight = 80 + (rows * itemHeight) + 40; // Title + items + padding

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
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const title = isCustomMode ? 'Custom Categories' : 'Climate Types';
  ctx.fillText(title, width / 2, legendY + 20);

  if (!legendData || legendData.length === 0) return;

  // Render ALL categories in grid (no truncation)
  const cols = 6;
  const itemWidth = (width - 80) / cols; // Reduced margin
  const itemHeight = 35; // Reduced from 40
  const startX = 40; // Reduced from 50
  const startY = legendY + 65; // Reduced top padding

  ctx.font = '16px sans-serif'; // Increased from 14px
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Render all categories (no slice/limit)
  legendData.forEach((item, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = startX + col * itemWidth;
    const y = startY + row * itemHeight;

    // Larger color swatch
    ctx.fillStyle = item.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y - 10, 24, 20); // Increased from 20x16
    ctx.strokeRect(x, y - 10, 24, 20);

    // Label with bigger font
    ctx.fillStyle = '#334155';
    const label = item.name.slice(0, 22); // Slightly longer
    ctx.fillText(label, x + 32, y);
  });

  logger.log(`[Koppen] Rendered ${legendData.length} legend categories`);
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
