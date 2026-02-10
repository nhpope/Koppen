/**
 * Climate Layer Module
 * Handles rendering and interaction with climate data on the map
 * Supports hybrid loading: base layer (1°) + detail tiles (0.25°)
 * Supports both Koppen threshold-based and custom rule-based classification
 */

/* eslint-disable security/detect-object-injection --
 * This file accesses climate data using keys from internal classification structures.
 * Keys are not user-controlled; they come from KOPPEN_PRESET or Object.keys() iteration.
 * See docs/orchestration/checkpoints/security-review.md for full analysis.
 */

import L from 'leaflet';
import { getClimateColor } from '../utils/colors.js';
import { CLIMATE_TYPES, KOPPEN_RULES } from '../climate/koppen-rules.js';
import { KOPPEN_PRESET, getThresholdValues } from '../climate/presets.js';
import { CONSTANTS } from '../utils/constants.js';
import {
  loadBaseLayer,
  loadTileIndex,
  loadTile,
  getTilesForBounds,
} from '../utils/data-loader.js';
import logger from '../utils/logger.js';

// Cache the default thresholds as a flat object for the classify function
const DEFAULT_THRESHOLDS = getThresholdValues(KOPPEN_PRESET);

let climateLayer = null;
let baseLayer = null; // Base layer (1° resolution)
let detailLayer = null; // Detail tiles layer (0.25° resolution)
let classifiedFeatures = null;
let originalBaseFeatures = null; // Store original unclassified base layer features
let selectedLayer = null;
let activeFilter = null;
let map = null;
let currentMode = 'base'; // 'base' or 'detail'
let isLoadingTiles = false; // Module-level flag to prevent concurrent tile loads
let isSwitchingMode = false; // Flag to prevent re-entry during mode switch
const loadedTileFiles = new Set(); // Track which tiles are loaded
const loadedTileFeatures = new Map(); // Store original unclassified tile features for reclassification

// Track current thresholds for dynamically loaded tiles
let currentThresholds = DEFAULT_THRESHOLDS;

// Custom rules support
 
let classificationMode = 'koppen'; // 'koppen' or 'custom'
// eslint-disable-next-line no-unused-vars -- Reference stored for future custom rules integration
let customRulesEngine = null; // Reference to CustomRulesEngine when in custom mode

// Style constants
const DEFAULT_STYLE = {
  fillOpacity: 0.85,
  color: '#ffffff',
  weight: 0.5,
  opacity: 0.5,
};

const SELECTED_STYLE = {
  color: '#1e293b',
  weight: 3,
  opacity: 1,
};

const DIMMED_STYLE = {
  fillOpacity: 0.15,
  color: '#cccccc',
  weight: 0.25,
  opacity: 0.15,
};

// Style for unclassified features (custom rules mode)
const UNCLASSIFIED_STYLE = {
  fillColor: '#E5E5E5',
  fillOpacity: 0.3,
  color: '#AAAAAA',
  weight: 0.25,
  opacity: 0.3,
};

/**
 * Classify all features using Köppen rules
 * Optimized for performance with 21,893+ features
 * @param {Array} features - GeoJSON features
 * @param {Object} thresholds - Classification thresholds
 * @returns {Array} Classified features
 */
function classifyFeatures(features, thresholds = DEFAULT_THRESHOLDS) {
  // Pre-compute reusable values outside the loop
  const featureCount = features.length;
  const result = new Array(featureCount);

  // Process features with optimized property access
  for (let idx = 0; idx < featureCount; idx++) {
    const feature = features[idx];
    const props = feature.properties;

    // If climate_type is already present (pre-classified), use it
    if (props.climate_type) {
      result[idx] = {
        ...feature,
        properties: {
          ...props,
          classifiedType: props.climate_type,
        },
      };
      continue;
    }

    // Otherwise, classify from monthly data
    // Optimized: direct property access instead of dynamic key construction
    const temps = [
      props.t1 ?? 0, props.t2 ?? 0, props.t3 ?? 0, props.t4 ?? 0,
      props.t5 ?? 0, props.t6 ?? 0, props.t7 ?? 0, props.t8 ?? 0,
      props.t9 ?? 0, props.t10 ?? 0, props.t11 ?? 0, props.t12 ?? 0,
    ];
    const precips = [
      props.p1 ?? 0, props.p2 ?? 0, props.p3 ?? 0, props.p4 ?? 0,
      props.p5 ?? 0, props.p6 ?? 0, props.p7 ?? 0, props.p8 ?? 0,
      props.p9 ?? 0, props.p10 ?? 0, props.p11 ?? 0, props.p12 ?? 0,
    ];

    // Classify using Köppen rules
    const climateType = KOPPEN_RULES.classify(
      { temp: temps, precip: precips, lat: props.lat || 0 },
      thresholds,
    );

    const climateInfo = CLIMATE_TYPES[climateType] || { name: 'Unknown', group: '?' };

    result[idx] = {
      ...feature,
      properties: {
        ...props,
        climate_type: climateType,
        climate_name: climateInfo.name,
        climate_group: climateInfo.group,
      },
    };
  }

  return result;
}

/**
 * Get style for a feature
 * @param {Object} feature - GeoJSON feature
 * @returns {Object} Leaflet style object
 */
function getFeatureStyle(feature) {
  const props = feature.properties;
  const type = props.climate_type;

  // In custom mode, only show as classified if explicitly marked by custom rules
  if (classificationMode === 'custom') {
    // Feature must have classified === true (from custom rules engine)
    if (props.classified !== true) {
      return { ...UNCLASSIFIED_STYLE };
    }
  } else {
    // In Köppen mode, use standard classification check
    const isClassified = props.classified !== false && type != null;
    if (!isClassified) {
      return { ...UNCLASSIFIED_STYLE };
    }
  }

  // Check if feature matches active filter
  const isMatch = !activeFilter || type === activeFilter;

  // Use custom color if available, otherwise use Koppen color
  const fillColor = props.climate_color || getClimateColor(type);

  const style = {
    fillColor,
    fillOpacity: isMatch ? DEFAULT_STYLE.fillOpacity : DIMMED_STYLE.fillOpacity,
    color: isMatch ? DEFAULT_STYLE.color : DIMMED_STYLE.color,
    weight: isMatch ? DEFAULT_STYLE.weight : DIMMED_STYLE.weight,
    opacity: isMatch ? DEFAULT_STYLE.opacity : DIMMED_STYLE.opacity,
  };

  // Debug: Log occasional styles to check values
  if (Math.random() < 0.001) {
    logger.log('[Koppen] getFeatureStyle called:', {
      type,
      activeFilter,
      isMatch,
      fillOpacity: style.fillOpacity,
      expected: DEFAULT_STYLE.fillOpacity,
    });
  }

  return style;
}

/**
 * Handle feature hover
 */
function onFeatureHover(e) {
  const layer = e.target;
  const props = layer.feature.properties;

  // Highlight on hover (unless selected)
  if (layer !== selectedLayer) {
    layer.setStyle({
      weight: 2,
      opacity: 0.8,
    });
  }

  // Dispatch hover event
  document.dispatchEvent(new CustomEvent('koppen:feature-hover', {
    detail: {
      type: props.climate_type,
      name: props.climate_name,
      group: props.climate_group,
      lat: props.lat,
      lon: props.lon,
      latlng: e.latlng,
    },
  }));
}

/**
 * Handle feature hover end
 */
function onFeatureLeave(e) {
  const layer = e.target;

  // Reset style (unless selected)
  if (layer !== selectedLayer) {
    layer.setStyle(getFeatureStyle(layer.feature));
  }

  document.dispatchEvent(new CustomEvent('koppen:feature-leave'));
}

/**
 * Handle feature click
 */
function onFeatureClick(e) {
  L.DomEvent.stopPropagation(e);
  const layer = e.target;

  selectCell(layer);
}

/**
 * Select a cell layer
 * @param {L.Layer} layer - Layer to select
 */
function selectCell(layer) {
  const props = layer.feature.properties;

  // Debug: Log all properties for clicked cell
  logger.log('=== CLICKED CELL DATA ===');
  logger.log('Climate Type:', props.classifiedType || props.climate_type);
  logger.log('Coordinates:', layer.feature.geometry.coordinates[0][0]);
  logger.log('---');
  logger.log('Temperature:');
  logger.log('  MAT (Mean Annual):', props.mat?.toFixed(1), '°C');
  logger.log('  TMAX (Warmest month):', props.tmax?.toFixed(1), '°C');
  logger.log('  TMIN (Coldest month):', props.tmin?.toFixed(1), '°C');
  logger.log('---');
  logger.log('Precipitation (mm):');
  logger.log('  MAP (Mean Annual):', props.map?.toFixed(1), 'mm');
  logger.log('  PDRY (Driest month):', props.pdry?.toFixed(1), 'mm');
  logger.log('  PSUM (Summer total):', props.psum?.toFixed(1), 'mm');
  logger.log('  PWIN (Winter total):', props.pwin?.toFixed(1), 'mm');
  logger.log('---');
  logger.log('Monthly Temperatures (°C):',
    [1,2,3,4,5,6,7,8,9,10,11,12].map(m => props[`t${m}`]?.toFixed(1)).join(', '));
  logger.log('Monthly Precipitation (mm):',
    [1,2,3,4,5,6,7,8,9,10,11,12].map(m => props[`p${m}`]?.toFixed(1)).join(', '));
  logger.log('========================');

  // If clicking same cell, deselect
  if (selectedLayer === layer) {
    deselectCell();
    return;
  }

  // Deselect previous
  if (selectedLayer) {
    selectedLayer.setStyle(getFeatureStyle(selectedLayer.feature));
  }

  // Select new
  selectedLayer = layer;

  // Apply filter to dim all other climate types
  const climateType = props.classifiedType || props.climate_type;
  filterByType(climateType);

  // Apply selected style on top of filter
  layer.setStyle({
    ...getFeatureStyle(layer.feature),
    ...SELECTED_STYLE,
  });
  layer.bringToFront();

  // Dispatch selection event
  document.dispatchEvent(new CustomEvent('koppen:cell-selected', {
    detail: {
      lat: props.lat,
      lon: props.lon,
      type: climateType,
      name: props.climate_name,
      group: props.climate_group,
      data: props,
    },
  }));

  // Also select in legend
  document.dispatchEvent(new CustomEvent('koppen:climate-selected', {
    detail: { type: climateType, fromMap: true },
  }));

  logger.log(`[Koppen] Cell selected: ${climateType} at [${props.lat}, ${props.lon}]`);
}

/**
 * Deselect current cell
 */
export function deselectCell() {
  if (!selectedLayer) return;

  const props = selectedLayer.feature.properties;
  const climateType = props.classifiedType || props.climate_type;

  // Clear filter to restore full opacity to all cells
  clearFilter();

  selectedLayer.setStyle(getFeatureStyle(selectedLayer.feature));
  selectedLayer = null;

  document.dispatchEvent(new CustomEvent('koppen:cell-deselected', {
    detail: { type: climateType },
  }));
}

/**
 * Create the climate layer from GeoJSON data
 * @param {Object} geojson - GeoJSON feature collection
 * @param {L.Map} mapInstance - Leaflet map instance
 * @param {Object} thresholds - Classification thresholds
 * @returns {L.GeoJSON} The climate layer
 */
export function createClimateLayer(geojson, mapInstance, thresholds) {
  map = mapInstance;

  // Classify features
  classifiedFeatures = classifyFeatures(geojson.features, thresholds);

  // Create layer
  climateLayer = L.geoJSON({
    type: 'FeatureCollection',
    features: classifiedFeatures,
  }, {
    style: getFeatureStyle,
    onEachFeature: (feature, layer) => {
      layer.on({
        mouseover: onFeatureHover,
        mouseout: onFeatureLeave,
        click: onFeatureClick,
      });
    },
  });

  climateLayer.addTo(map);

  // Handle base map clicks to deselect
  map.on('click', () => {
    deselectCell();
    clearFilter();
  });

  // Calculate stats
  const stats = calculateStats(classifiedFeatures);

  // Dispatch ready event
  document.dispatchEvent(new CustomEvent('koppen:layer-ready', {
    detail: {
      count: classifiedFeatures.length,
      stats,
    },
  }));

  logger.log(`[Koppen] Climate layer created: ${classifiedFeatures.length} features`);

  return climateLayer;
}

/**
 * Calculate statistics for classified features
 * @param {Array} features - Classified features
 * @returns {Object} Stats by climate type
 */
function calculateStats(features) {
  const stats = {};

  features.forEach(f => {
    const type = f.properties.climate_type;
    stats[type] = (stats[type] || 0) + 1;
  });

  return stats;
}

/**
 * Filter the layer to show only a specific climate type
 * @param {string|null} type - Climate type to filter, or null to clear
 */
export function filterByType(type) {
  activeFilter = type;

  logger.log(`[Koppen] Filtering by type: ${type || 'none'}`);

  // Determine which layer(s) to update
  const layersToUpdate = [];
  if (climateLayer) layersToUpdate.push(climateLayer);
  if (baseLayer) layersToUpdate.push(baseLayer);
  if (detailLayer) layersToUpdate.push(detailLayer);

  if (layersToUpdate.length === 0) {
    console.warn('[Koppen] No layers to filter');
    return;
  }

  let matchCount = 0;
  let dimmedCount = 0;

  // Update all feature styles across all layers
  layersToUpdate.forEach(layerGroup => {
    layerGroup.eachLayer(layer => {
      const featureType = layer.feature.properties.climate_type || layer.feature.properties.classifiedType;
      const isMatch = !type || featureType === type;

      layer.setStyle(getFeatureStyle(layer.feature));

      // Bring matching features to front
      if (isMatch && type) {
        layer.bringToFront();
        matchCount++;
      } else if (type) {
        dimmedCount++;
      }
    });
  });

  logger.log(`[Koppen] Filter applied: ${matchCount} matching, ${dimmedCount} dimmed`);

  // Keep selected layer on top
  if (selectedLayer) {
    selectedLayer.bringToFront();
  }

  // Dispatch filter event
  document.dispatchEvent(new CustomEvent('koppen:filter-changed', {
    detail: { type, active: !!type },
  }));

  logger.log(`[Koppen] Filter ${type ? 'applied: ' + type : 'cleared'}`);
}

/**
 * Clear the active filter
 */
export function clearFilter() {
  if (activeFilter) {
    filterByType(null);
  }
}

/**
 * Get the active filter type
 * @returns {string|null}
 */
export function getActiveFilter() {
  return activeFilter;
}

/**
 * Reclassify all features with new thresholds
 * Works with both legacy single-layer and hybrid loading
 * @param {Object} thresholds - New thresholds
 */
export function reclassify(thresholds) {
  // Check if we have any layer to reclassify
  const hasLegacyLayer = climateLayer && classifiedFeatures;
  const hasHybridLayers = (baseLayer || detailLayer) && classifiedFeatures;

  if (!hasLegacyLayer && !hasHybridLayers) {
    console.warn('[Koppen] No climate layer to reclassify');
    return;
  }

  // Store current thresholds for use when loading new tiles dynamically
  currentThresholds = thresholds;

  logger.log('[Koppen] Reclassifying with new thresholds...');

  // Update the appropriate layer(s)
  if (climateLayer) {
    // Legacy single-layer approach
    const originalFeatures = classifiedFeatures.map(f => ({
      ...f,
      properties: { ...f.properties },
    }));

    classifiedFeatures = classifyFeatures(originalFeatures, thresholds);

    climateLayer.clearLayers();
    climateLayer.addData({
      type: 'FeatureCollection',
      features: classifiedFeatures,
    });

    // Rebind events
    climateLayer.eachLayer(layer => {
      layer.on({
        mouseover: onFeatureHover,
        mouseout: onFeatureLeave,
        click: onFeatureClick,
      });
    });
  } else if (baseLayer || detailLayer) {
    // Hybrid loading approach - update layers based on current mode
    if (currentMode === 'base' && baseLayer && originalBaseFeatures) {
      // Remove pre-classified climate_type to force reclassification
      const unclassifiedFeatures = originalBaseFeatures.map(f => ({
        ...f,
        properties: {
          ...f.properties,
          climate_type: undefined,
          classifiedType: undefined,
        },
      }));

      // Reclassify base layer using stored original features
      classifiedFeatures = classifyFeatures(unclassifiedFeatures, thresholds);

      baseLayer.clearLayers();
      baseLayer.addData({
        type: 'FeatureCollection',
        features: classifiedFeatures,
      });

      baseLayer.eachLayer(layer => {
        layer.on({
          mouseover: onFeatureHover,
          mouseout: onFeatureLeave,
          click: onFeatureClick,
        });
      });

      // ALSO reclassify cached detail tiles so they're ready when user zooms in
      if (detailLayer && loadedTileFeatures.size > 0) {
        logger.log(`[Koppen] Also reclassifying ${loadedTileFeatures.size} cached detail tiles in background`);
        const allDetailFeatures = [];

        for (const [, features] of loadedTileFeatures) {
          const unclassifiedTileFeatures = features.map(f => ({
            ...f,
            properties: {
              ...f.properties,
              climate_type: undefined,
              classifiedType: undefined,
            },
          }));
          const classifiedTileFeatures = classifyFeatures(unclassifiedTileFeatures, thresholds);
          allDetailFeatures.push(...classifiedTileFeatures);
        }

        // Update detail layer (even though it's not visible)
        detailLayer.clearLayers();
        detailLayer.addData({
          type: 'FeatureCollection',
          features: allDetailFeatures,
        });

        detailLayer.eachLayer(layer => {
          layer.on({
            mouseover: onFeatureHover,
            mouseout: onFeatureLeave,
            click: onFeatureClick,
          });
        });

        logger.log(`[Koppen] Cached detail tiles reclassified: ${allDetailFeatures.length} features`);
      }
    } else if (currentMode === 'detail' && detailLayer) {
      // In detail mode, reclassify ALL loaded detail tiles
      const allDetailFeatures = [];

      // Collect and reclassify all loaded tile features
       
      for (const [, features] of loadedTileFeatures) {
        // Remove pre-classified climate_type to force reclassification
        const unclassifiedFeatures = features.map(f => ({
          ...f,
          properties: {
            ...f.properties,
            climate_type: undefined,
            classifiedType: undefined,
          },
        }));

        const classifiedTileFeatures = classifyFeatures(unclassifiedFeatures, thresholds);
        allDetailFeatures.push(...classifiedTileFeatures);
      }

      logger.log(`[Koppen] Reclassifying ${allDetailFeatures.length} detail features from ${loadedTileFeatures.size} tiles`);

      // Update detail layer
      detailLayer.clearLayers();
      detailLayer.addData({
        type: 'FeatureCollection',
        features: allDetailFeatures,
      });

      detailLayer.eachLayer(layer => {
        layer.on({
          mouseover: onFeatureHover,
          mouseout: onFeatureLeave,
          click: onFeatureClick,
        });
      });

      classifiedFeatures = allDetailFeatures;
    }
  }

  // Calculate new stats
  const stats = calculateStats(classifiedFeatures);

  // Dispatch event
  document.dispatchEvent(new CustomEvent('koppen:classification-updated', {
    detail: {
      count: classifiedFeatures.length,
      stats,
    },
  }));

  logger.log(`[Koppen] Reclassified ${classifiedFeatures.length} features`);
}

/**
 * Get all classified features
 * @returns {Array} Classified features
 */
export function getFeatures() {
  return classifiedFeatures;
}

/**
 * Get the selected cell data
 * @returns {Object|null}
 */
export function getSelectedCell() {
  if (!selectedLayer) return null;
  return selectedLayer.feature.properties;
}

/**
 * Remove the climate layer
 */
export function removeClimateLayer() {
  if (climateLayer && map) {
    map.removeLayer(climateLayer);
  }
  if (baseLayer && map) {
    map.removeLayer(baseLayer);
  }
  if (detailLayer && map) {
    map.removeLayer(detailLayer);
  }
  climateLayer = null;
  baseLayer = null;
  detailLayer = null;
  classifiedFeatures = null;
  selectedLayer = null;
  activeFilter = null;
  loadedTileFiles.clear();
}

/**
 * Create hybrid climate layer (base + detail tiles)
 * Loads base layer initially, switches to tiles on zoom
 * @param {L.Map} mapInstance - Leaflet map instance
 * @param {Object} thresholds - Classification thresholds
 * @returns {Promise<void>}
 */
export async function createHybridClimateLayer(mapInstance, thresholds) {
  map = mapInstance;

  try {
    // Load base layer first
    const baseData = await loadBaseLayer();

    // Store original unclassified features for reclassification
    originalBaseFeatures = baseData.features;

    // Classify base layer features
    classifiedFeatures = classifyFeatures(baseData.features, thresholds);

    // Create base layer
    baseLayer = L.geoJSON({
      type: 'FeatureCollection',
      features: classifiedFeatures,
    }, {
      style: getFeatureStyle,
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: onFeatureHover,
          mouseout: onFeatureLeave,
          click: onFeatureClick,
        });
      },
    });

    baseLayer.addTo(map);
    currentMode = 'base';

    logger.log(`[Koppen] Base layer created: ${classifiedFeatures.length} features`);

    // Load tile index in background
    await loadTileIndex();

    // Set up zoom/move handlers for tile loading
    setupHybridLoadingHandlers();

    // Dispatch ready event
    document.dispatchEvent(new CustomEvent('koppen:layer-ready', {
      detail: {
        count: classifiedFeatures.length,
        mode: 'base',
        stats: calculateStats(classifiedFeatures),
      },
    }));

    // Handle base map clicks to deselect
    map.on('click', () => {
      deselectCell();
      clearFilter();
    });

  } catch (error) {
    console.error('[Koppen] Failed to create hybrid climate layer:', error);
    throw error;
  }
}

/**
 * Set up handlers for hybrid loading (zoom/pan events)
 */
function setupHybridLoadingHandlers() {
  let handlerRunning = false; // Prevent re-entry during async operations

  const handleViewChange = async () => {
    // Prevent concurrent execution of this handler
    if (handlerRunning || isSwitchingMode) {
      logger.log('[Koppen] Skipping handleViewChange - already running or switching mode');
      return;
    }
    handlerRunning = true;

    try {
      const zoom = map.getZoom();

      // Switch to detail mode at zoom threshold
      if (zoom >= CONSTANTS.DETAIL_ZOOM_THRESHOLD && currentMode === 'base') {
        await switchToDetailMode();
      }
      // Switch back to base mode when zoomed out
      else if (zoom < CONSTANTS.DETAIL_ZOOM_THRESHOLD && currentMode === 'detail') {
        await switchToBaseMode();
      }
      // Load additional tiles in detail mode
      else if (currentMode === 'detail' && !isLoadingTiles) {
        await loadVisibleTiles();
      }
    } finally {
      handlerRunning = false;
    }
  };

  map.on('zoomend moveend', handleViewChange);
}

/**
 * Switch from base layer to detail tiles
 */
async function switchToDetailMode() {
  // Prevent concurrent mode switches
  if (isSwitchingMode) {
    logger.log('[Koppen] Already switching mode, skipping');
    return;
  }
  isSwitchingMode = true;

  try {
    logger.log('[Koppen] Switching to detail mode (0.25° tiles)');

    // Create detail layer if it doesn't exist
    if (!detailLayer) {
      detailLayer = L.geoJSON(null, {
        style: getFeatureStyle,
        onEachFeature: (feature, layer) => {
          layer.on({
            mouseover: onFeatureHover,
            mouseout: onFeatureLeave,
            click: onFeatureClick,
          });
        },
      });
    }

    // Add detail layer and hide base layer
    detailLayer.addTo(map);
    if (baseLayer) {
      map.removeLayer(baseLayer);
    }

    currentMode = 'detail';

    // Load tiles for current view
    await loadVisibleTiles();

    // Refresh styles on all detail layers to ensure consistency after mode switch
    if (detailLayer) {
      detailLayer.eachLayer(layer => {
        if (layer && layer.feature) {
          layer.setStyle(getFeatureStyle(layer.feature));
        }
      });
    }

    document.dispatchEvent(new CustomEvent('koppen:mode-changed', {
      detail: { mode: 'detail' },
    }));
  } finally {
    isSwitchingMode = false;
  }
}

/**
 * Switch from detail tiles back to base layer
 */
async function switchToBaseMode() {
  // Prevent concurrent mode switches
  if (isSwitchingMode) {
    logger.log('[Koppen] Already switching mode, skipping');
    return;
  }
  isSwitchingMode = true;

  try {
    logger.log('[Koppen] Switching to base mode (1° layer)');

    // Show base layer and hide detail layer
    if (baseLayer) {
      baseLayer.addTo(map);
      // Refresh styles on base layer to ensure consistency
      baseLayer.eachLayer(layer => {
        if (layer && layer.feature) {
          layer.setStyle(getFeatureStyle(layer.feature));
        }
      });
    }
    if (detailLayer) {
      map.removeLayer(detailLayer);
    }

    currentMode = 'base';

    document.dispatchEvent(new CustomEvent('koppen:mode-changed', {
      detail: { mode: 'base' },
    }));
  } finally {
    isSwitchingMode = false;
  }
}

/**
 * Show loading indicator
 */
function showLoadingIndicator(message = 'Loading tiles...') {
  let indicator = document.getElementById('koppen-loading');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'koppen-loading';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(20, 184, 166, 0.95);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    document.body.appendChild(indicator);
  }
  indicator.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10" stroke-width="3" opacity="0.25"/>
      <path d="M12 2 A10 10 0 0 1 22 12" stroke-width="3" stroke-linecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
      </path>
    </svg>
    <span>${message}</span>
  `;
  indicator.style.display = 'flex';
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
  const indicator = document.getElementById('koppen-loading');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

/**
 * Load tiles visible in current viewport
 */
async function loadVisibleTiles() {
  // Prevent concurrent tile loading
  if (isLoadingTiles) {
    logger.log('[Koppen] Already loading tiles, skipping');
    return;
  }
  isLoadingTiles = true;

  try {
    const bounds = map.getBounds();
    const visibleTiles = await getTilesForBounds(bounds);

    logger.log(`[Koppen] Checking ${visibleTiles.length} tiles for current view`);
    logger.log(`[Koppen] Map bounds: ${bounds.toBBoxString()}`);

    // Filter out already loaded tiles
    const tilesToLoad = visibleTiles.filter(tile => !loadedTileFiles.has(tile.file));

    if (tilesToLoad.length === 0) {
      logger.log('[Koppen] All visible tiles already loaded');
      return; // All visible tiles already loaded
    }

    logger.log(`[Koppen] Loading ${tilesToLoad.length} visible tiles`);
    logger.log('[Koppen] Tiles to load:', tilesToLoad.map(t => t.file));
    showLoadingIndicator(`Loading ${tilesToLoad.length} tiles...`);

    // Track newly added layers explicitly to avoid relying on array ordering
    const newlyAddedLayers = [];

    // Load all visible tiles in parallel
    const tilePromises = tilesToLoad.map(async (tile) => {
      try {
        const geojson = await loadTile(tile.file);

        // Store original unclassified features for reclassification
        loadedTileFeatures.set(tile.file, geojson.features);

        // Classify tile features based on current mode
        let classifiedTileFeatures;
        if (classificationMode === 'custom' && customRulesEngine) {
          // Use custom rules engine - returns {classified, unclassified}
          const result = customRulesEngine.classifyAll(geojson.features);
          classifiedTileFeatures = [...result.classified, ...result.unclassified];
        } else {
          // Use Köppen classification with current thresholds
          classifiedTileFeatures = classifyFeatures(geojson.features, currentThresholds);
        }

        logger.log(`[Koppen] Tile ${tile.file} - Sample feature (mode: ${classificationMode}):`, {
          climateType: classifiedTileFeatures[0]?.properties.climate_type,
          classifiedType: classifiedTileFeatures[0]?.properties.classifiedType,
          classified: classifiedTileFeatures[0]?.properties.classified,
          hasColor: !!classifiedTileFeatures[0]?.properties.climate_color,
        });

        // Mark as loaded BEFORE adding to layer to prevent race condition
        loadedTileFiles.add(tile.file);

        // Add to detail layer and track the new layers
        if (detailLayer) {
          const layerCountBefore = detailLayer.getLayers().length;
          detailLayer.addData({
            type: 'FeatureCollection',
            features: classifiedTileFeatures,
          });
          // Capture newly added layers
          const allLayers = detailLayer.getLayers();
          for (let i = layerCountBefore; i < allLayers.length; i++) {
            newlyAddedLayers.push(allLayers[i]);
          }
        }

        return classifiedTileFeatures.length;
      } catch (error) {
        console.error(`[Koppen] Failed to load tile ${tile.file}:`, error);
        return 0;
      }
    });

    const counts = await Promise.all(tilePromises);
    const totalFeatures = counts.reduce((sum, count) => sum + count, 0);

    hideLoadingIndicator();

    logger.log(`[Koppen] Loaded ${totalFeatures} features from ${tilesToLoad.length} tiles`);
    logger.log(`[Koppen] Total tiles loaded: ${loadedTileFiles.size}`);

    // Apply styles to ALL newly added layers to ensure consistency
    // This handles both initial styling and any active filter
    if (newlyAddedLayers.length > 0) {
      logger.log(`[Koppen] Applying styles to ${newlyAddedLayers.length} newly added layers`);

      for (const layer of newlyAddedLayers) {
        if (layer && layer.feature) {
          const style = getFeatureStyle(layer.feature);
          layer.setStyle(style);

          // Bring matching filter layers to front
          if (activeFilter) {
            const featureType = layer.feature.properties.climate_type || layer.feature.properties.classifiedType;
            if (featureType === activeFilter) {
              layer.bringToFront();
            }
          }
        }
      }

      // Keep selected layer on top
      if (selectedLayer) {
        selectedLayer.bringToFront();
      }
    }

    document.dispatchEvent(new CustomEvent('koppen:tiles-loaded', {
      detail: {
        tilesLoaded: tilesToLoad.length,
        totalTiles: loadedTileFiles.size,
        features: totalFeatures,
      },
    }));
  } finally {
    isLoadingTiles = false;
  }
}

/**
 * Reclassify all features using custom rules engine
 * @param {CustomRulesEngine} engine - Custom rules engine instance
 */
export function reclassifyWithCustomRules(engine) {
  if (!engine) {
    console.warn('[Koppen] No custom rules engine provided');
    return;
  }

  // Update module state
  classificationMode = 'custom';
  customRulesEngine = engine;

  logger.log('[Koppen] Reclassifying with custom rules...');

  // Get original features to reclassify for the currently visible layer
  let featuresToClassify = [];

  if (currentMode === 'base' && originalBaseFeatures) {
    featuresToClassify = originalBaseFeatures;
  } else if (currentMode === 'detail' && loadedTileFeatures.size > 0) {
    // Collect all detail features
    for (const [, features] of loadedTileFeatures) {
      featuresToClassify.push(...features);
    }
  } else if (classifiedFeatures) {
    // Fallback to current features (strip existing classification)
    featuresToClassify = classifiedFeatures.map(f => ({
      ...f,
      properties: {
        ...f.properties,
        climate_type: undefined,
        climate_name: undefined,
        climate_color: undefined,
        classified: undefined,
      },
    }));
  }

  if (featuresToClassify.length === 0) {
    console.warn('[Koppen] No features to classify');
    return;
  }

  // Classify using custom rules engine
  const result = engine.classifyAll(featuresToClassify);
  const allFeatures = [...result.classified, ...result.unclassified];

  // Update the appropriate layer
  const targetLayer = currentMode === 'base' ? baseLayer : detailLayer || climateLayer;

  if (targetLayer) {
    targetLayer.clearLayers();
    targetLayer.addData({
      type: 'FeatureCollection',
      features: allFeatures,
    });

    // Rebind events
    targetLayer.eachLayer(layer => {
      layer.on({
        mouseover: onFeatureHover,
        mouseout: onFeatureLeave,
        click: onFeatureClick,
      });
    });
  }

  // ALSO reclassify cached detail tiles when in base mode so they're ready when user zooms in
  if (currentMode === 'base' && detailLayer && loadedTileFeatures.size > 0) {
    logger.log(`[Koppen] Also reclassifying ${loadedTileFeatures.size} cached detail tiles with custom rules`);

    // Collect all detail features
    const detailFeaturesToClassify = [];
    for (const [, features] of loadedTileFeatures) {
      detailFeaturesToClassify.push(...features);
    }

    // Classify with custom rules
    const detailResult = engine.classifyAll(detailFeaturesToClassify);
    const allDetailFeatures = [...detailResult.classified, ...detailResult.unclassified];

    // Update detail layer (even though it's not visible)
    detailLayer.clearLayers();
    detailLayer.addData({
      type: 'FeatureCollection',
      features: allDetailFeatures,
    });

    detailLayer.eachLayer(layer => {
      layer.on({
        mouseover: onFeatureHover,
        mouseout: onFeatureLeave,
        click: onFeatureClick,
      });
    });

    logger.log(`[Koppen] Cached detail tiles reclassified with custom rules: ${allDetailFeatures.length} features`);
  }

  // Store classified features
  classifiedFeatures = allFeatures;

  // Dispatch stats event for category manager
  document.dispatchEvent(new CustomEvent('koppen:classification-stats', {
    detail: result.stats,
  }));

  // Dispatch classification updated event
  document.dispatchEvent(new CustomEvent('koppen:classification-updated', {
    detail: {
      count: allFeatures.length,
      stats: result.stats,
      mode: 'custom',
    },
  }));

  logger.log(`[Koppen] Custom rules classification complete: ${result.stats.classified} classified, ${result.stats.unclassified} unclassified`);
}

/**
 * Switch back to Koppen classification mode
 * @param {Object} thresholds - Koppen thresholds to apply
 */
export function switchToKoppenMode(thresholds = DEFAULT_THRESHOLDS) {
  classificationMode = 'koppen';
  customRulesEngine = null;
  reclassify(thresholds);
}

/**
 * Get current classification mode
 * @returns {string} 'koppen' or 'custom'
 */
export function getClassificationMode() {
  return classificationMode;
}

/**
 * Load all detail tiles for full-resolution export
 * @param {Function} onProgress - Progress callback (loaded, total)
 * @returns {Promise<Array>} All classified detail features
 */
export async function loadAllDetailTiles(onProgress) {
  try {
    // Get all tiles globally for export
    const { getAllTiles, loadTile } = await import('../utils/data-loader.js');
    const allTiles = await getAllTiles();

    logger.log(`[Koppen] Loading ${allTiles.length} tiles for export...`);

    // Collect all features
    const allFeatures = [];

    for (let i = 0; i < allTiles.length; i++) {
      const tile = allTiles[i];

      // Check if already in cache
      if (loadedTileFeatures.has(tile.file)) {
        // Use cached features and reclassify them
        const cachedFeatures = loadedTileFeatures.get(tile.file);

        let classifiedFeatures;
        if (classificationMode === 'custom' && customRulesEngine) {
          const result = customRulesEngine.classifyAll(cachedFeatures);
          classifiedFeatures = [...result.classified, ...result.unclassified];
        } else {
          classifiedFeatures = classifyFeatures(cachedFeatures, currentThresholds);
        }

        allFeatures.push(...classifiedFeatures);
      } else {
        // Load and classify the tile
        const geojson = await loadTile(tile.file);
        loadedTileFeatures.set(tile.file, geojson.features);

        let classifiedFeatures;
        if (classificationMode === 'custom' && customRulesEngine) {
          const result = customRulesEngine.classifyAll(geojson.features);
          classifiedFeatures = [...result.classified, ...result.unclassified];
        } else {
          classifiedFeatures = classifyFeatures(geojson.features, currentThresholds);
        }

        allFeatures.push(...classifiedFeatures);
      }

      // Report progress
      if (onProgress) {
        onProgress(i + 1, allTiles.length);
      }
    }

    logger.log(`[Koppen] Loaded ${allFeatures.length} total detail features`);
    return allFeatures;
  } catch (error) {
    console.error('[Koppen] Failed to load all tiles:', error);
    throw error;
  }
}

// Set up event listener for custom rules changes
document.addEventListener('koppen:custom-rules-changed', (e) => {
  const { engine } = e.detail || {};
  if (engine) {
    reclassifyWithCustomRules(engine);
  }
});

// Listen for mode changes
document.addEventListener('koppen:mode-changed', (e) => {
  const { mode } = e.detail || {};
  if (mode === 'koppen') {
    classificationMode = 'koppen';
    customRulesEngine = null;
  }
});

export default {
  createClimateLayer,
  createHybridClimateLayer,
  removeClimateLayer,
  filterByType,
  clearFilter,
  getActiveFilter,
  reclassify,
  reclassifyWithCustomRules,
  switchToKoppenMode,
  getClassificationMode,
  getFeatures,
  getSelectedCell,
  deselectCell,
  loadAllDetailTiles,
};
