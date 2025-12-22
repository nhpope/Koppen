/**
 * Climate Layer Module
 * Handles rendering and interaction with climate data on the map
 */

import L from 'leaflet';
import { getClimateColor } from '../utils/colors.js';
import { CLIMATE_TYPES, KOPPEN_RULES } from '../climate/koppen-rules.js';
import { KOPPEN_PRESETS } from '../climate/presets.js';

let climateLayer = null;
let classifiedFeatures = null;
let selectedLayer = null;
let activeFilter = null;
let map = null;

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

/**
 * Classify all features using Köppen rules
 * @param {Array} features - GeoJSON features
 * @param {Object} thresholds - Classification thresholds
 * @returns {Array} Classified features
 */
function classifyFeatures(features, thresholds = KOPPEN_PRESETS.koppen) {
  return features.map(feature => {
    const props = feature.properties;

    // Extract monthly temperature and precipitation
    const temps = [];
    const precips = [];
    for (let i = 1; i <= 12; i++) {
      temps.push(props[`t${i}`] ?? 0);
      precips.push(props[`p${i}`] ?? 0);
    }

    // Classify using Köppen rules
    const climateType = KOPPEN_RULES.classify(
      { temp: temps, precip: precips, lat: props.lat || 0 },
      thresholds,
    );

    const climateInfo = CLIMATE_TYPES[climateType] || { name: 'Unknown', group: '?' };

    return {
      ...feature,
      properties: {
        ...props,
        climate_type: climateType,
        climate_name: climateInfo.name,
        climate_group: climateInfo.group,
      },
    };
  });
}

/**
 * Get style for a feature
 * @param {Object} feature - GeoJSON feature
 * @returns {Object} Leaflet style object
 */
function getFeatureStyle(feature) {
  const type = feature.properties.climate_type;
  const isMatch = !activeFilter || type === activeFilter;

  return {
    fillColor: getClimateColor(type),
    fillOpacity: isMatch ? DEFAULT_STYLE.fillOpacity : DIMMED_STYLE.fillOpacity,
    color: isMatch ? DEFAULT_STYLE.color : DIMMED_STYLE.color,
    weight: isMatch ? DEFAULT_STYLE.weight : DIMMED_STYLE.weight,
    opacity: isMatch ? DEFAULT_STYLE.opacity : DIMMED_STYLE.opacity,
  };
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
      type: props.climate_type,
      name: props.climate_name,
      group: props.climate_group,
      data: props,
    },
  }));

  // Also select in legend
  document.dispatchEvent(new CustomEvent('koppen:climate-selected', {
    detail: { type: props.climate_type, fromMap: true },
  }));

  console.log(`[Koppen] Cell selected: ${props.climate_type} at [${props.lat}, ${props.lon}]`);
}

/**
 * Deselect current cell
 */
export function deselectCell() {
  if (!selectedLayer) return;

  const props = selectedLayer.feature.properties;
  selectedLayer.setStyle(getFeatureStyle(selectedLayer.feature));
  selectedLayer = null;

  document.dispatchEvent(new CustomEvent('koppen:cell-deselected', {
    detail: { type: props.climate_type },
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

  console.log(`[Koppen] Climate layer created: ${classifiedFeatures.length} features`);

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

  if (!climateLayer) return;

  // Update all feature styles
  climateLayer.eachLayer(layer => {
    const featureType = layer.feature.properties.climate_type;
    const isMatch = !type || featureType === type;

    layer.setStyle(getFeatureStyle(layer.feature));

    // Bring matching features to front
    if (isMatch && type) {
      layer.bringToFront();
    }
  });

  // Keep selected layer on top
  if (selectedLayer) {
    selectedLayer.bringToFront();
  }

  // Dispatch filter event
  document.dispatchEvent(new CustomEvent('koppen:filter-changed', {
    detail: { type, active: !!type },
  }));

  console.log(`[Koppen] Filter ${type ? 'applied: ' + type : 'cleared'}`);
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
 * @param {Object} thresholds - New thresholds
 */
export function reclassify(thresholds) {
  if (!climateLayer || !classifiedFeatures) return;

  // Get original features (before classification)
  const originalFeatures = classifiedFeatures.map(f => ({
    ...f,
    properties: { ...f.properties },
  }));

  // Reclassify
  classifiedFeatures = classifyFeatures(originalFeatures, thresholds);

  // Update layer
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

  // Calculate new stats
  const stats = calculateStats(classifiedFeatures);

  // Dispatch event
  document.dispatchEvent(new CustomEvent('koppen:classification-updated', {
    detail: {
      count: classifiedFeatures.length,
      stats,
    },
  }));
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
  climateLayer = null;
  classifiedFeatures = null;
  selectedLayer = null;
  activeFilter = null;
}

export default {
  createClimateLayer,
  removeClimateLayer,
  filterByType,
  clearFilter,
  getActiveFilter,
  reclassify,
  getFeatures,
  getSelectedCell,
  deselectCell,
};
