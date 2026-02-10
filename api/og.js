/**
 * OpenGraph Image Generation API
 * Renders simplified world map with classification colors
 */

import { createCanvas } from 'canvas';
import { gunzipSync } from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMA_VERSION = 2;

// Cache base layer data to avoid repeated file reads
let cachedBaseLayer = null;

function loadBaseLayer() {
  if (cachedBaseLayer) return cachedBaseLayer;

  try {
    // In Vercel, public files are accessible from process.cwd()
    const dataPath = path.join(process.cwd(), 'public', 'data', 'climate-1deg.geojson');
    console.log('Attempting to load base layer from:', dataPath);
    console.log('File exists:', fs.existsSync(dataPath));

    const geojson = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    cachedBaseLayer = geojson.features;
    console.log(`Loaded base layer: ${cachedBaseLayer.length} features`);
    return cachedBaseLayer;
  } catch (error) {
    console.error('Failed to load base layer:', error);
    console.error('Error details:', error.message);
    return [];
  }
}

function decodeState(encoded) {
  try {
    if (!encoded) return null;
    const decoded = Buffer.from(decodeURIComponent(encoded), 'base64');
    const decompressed = gunzipSync(decoded);
    const minimalState = JSON.parse(decompressed.toString());
    if (minimalState.v !== 1 && minimalState.v !== 2) return null;
    return minimalState;
  } catch (error) {
    return null;
  }
}

function expandCategories(minified) {
  if (!minified || !minified.c) return { categories: [], customParamMap: new Map() };

  console.log('Expanding categories. Has custom params?', !!minified.q);
  console.log('Custom params count:', minified.q?.length || 0);

  // Build custom parameter map from minified data
  const customParamMap = new Map();
  if (minified.q && Array.isArray(minified.q)) {
    minified.q.forEach(param => {
      console.log(`Registering custom param: ${param.i} = ${param.f}`);
      customParamMap.set(param.i, param.f);
    });
  }

  // Two-pass expansion for parent-child relationships
  const categories = minified.c.map(minCat => ({
    name: minCat.n || 'Unnamed',
    color: minCat.o || '#888888',
    priority: minCat.p ?? 0,
    enabled: minCat.e !== false,
    parentId: null,
    rules: (minCat.r || []).map(minRule => ({
      parameter: minRule.a,
      operator: minRule.b,
      value: minRule.v,
    })),
  }));

  // Rebuild parent-child relationships using indices
  minified.c.forEach((minCat, idx) => {
    if (minCat.x !== undefined && minCat.x !== null) {
      const parentIndex = minCat.x;
      if (parentIndex >= 0 && parentIndex < categories.length) {
        categories[idx].parentId = parentIndex;
      }
    }
  });

  return { categories, customParamMap };
}

// Helper functions for derived parameters
function getMonthlyPrecip(props) {
  return Array.from({length: 12}, (_, i) => props[`p${i+1}`] || 0);
}

function getMonthlyTemp(props) {
  return Array.from({length: 12}, (_, i) => props[`t${i+1}`] || 0);
}

// Simple parameter calculators for server-side classification
const PARAMS = {
  MAT: (props) => props.mat || 0,
  Tmax: (props) => Math.max(...getMonthlyTemp(props)),
  Tmin: (props) => Math.min(...getMonthlyTemp(props)),
  MAP: (props) => props.map || 0,
  Pdry: (props) => Math.min(...getMonthlyPrecip(props)),
  Pwet: (props) => Math.max(...getMonthlyPrecip(props)),
  AridityIndex: (props) => {
    const mat = props.mat || 0;
    const map = props.map || 0;
    return map / (mat + 10);
  },

  // Summer/winter precipitation
  Psdry: (props) => {
    const precips = getMonthlyPrecip(props);
    const isNorthern = (props.lat ?? 0) >= 0;
    const summerMonths = isNorthern ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 0, 1, 2];
    return Math.min(...summerMonths.map(i => precips[i]));
  },

  Pswet: (props) => {
    const precips = getMonthlyPrecip(props);
    const isNorthern = (props.lat ?? 0) >= 0;
    const summerMonths = isNorthern ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 0, 1, 2];
    return Math.max(...summerMonths.map(i => precips[i]));
  },

  Pwdry: (props) => {
    const precips = getMonthlyPrecip(props);
    const isNorthern = (props.lat ?? 0) >= 0;
    const winterMonths = isNorthern ? [9, 10, 11, 0, 1, 2] : [3, 4, 5, 6, 7, 8];
    return Math.min(...winterMonths.map(i => precips[i]));
  },

  Pwwet: (props) => {
    const precips = getMonthlyPrecip(props);
    const isNorthern = (props.lat ?? 0) >= 0;
    const winterMonths = isNorthern ? [9, 10, 11, 0, 1, 2] : [3, 4, 5, 6, 7, 8];
    return Math.max(...winterMonths.map(i => precips[i]));
  },
};

function evaluateRule(rule, props, customParamMap) {
  let paramValue;

  // Check if it's a built-in parameter
  if (PARAMS[rule.parameter]) {
    paramValue = PARAMS[rule.parameter](props);
  }
  // Check if it's a custom parameter
  else if (customParamMap && customParamMap.has(rule.parameter)) {
    const formula = customParamMap.get(rule.parameter);
    console.log(`Evaluating custom param: ${rule.parameter} = ${formula}`);
    paramValue = evaluateFormula(formula, props);
  }
  else {
    console.log(`Unknown parameter: ${rule.parameter}`);
    return false;
  }

  if (paramValue === undefined || isNaN(paramValue)) {
    console.log(`Invalid param value for ${rule.parameter}: ${paramValue}`);
    return false;
  }

  const { operator, value } = rule;
  const result = (() => {
    switch (operator) {
      case '<': return paramValue < value;
      case '<=': return paramValue <= value;
      case '>': return paramValue > value;
      case '>=': return paramValue >= value;
      case '==': return Math.abs(paramValue - value) < 0.001;
      case '!=': return Math.abs(paramValue - value) >= 0.001;
      default: return false;
    }
  })();

  if (rule.parameter === 'TemperatureSeasonality') {
    console.log(`TemperatureSeasonality check: ${paramValue} ${operator} ${value} = ${result}`);
  }

  return result;
}

/**
 * Evaluate a simple math formula safely
 * Supports common patterns like: (A - B) / abs(C), A / B
 */
function evaluateFormula(formula, props) {
  try {
    // Replace parameter names with their values
    let expr = formula;

    Object.keys(PARAMS).forEach(param => {
      const value = PARAMS[param](props);
      expr = expr.replace(new RegExp(`\\b${param}\\b`, 'g'), value);
    });

    console.log(`Formula: ${formula} -> After substitution: ${expr}`);

    // Handle abs() function by evaluating it first
    while (expr.includes('abs(')) {
      expr = expr.replace(/abs\(([^)]+)\)/g, (match, inner) => {
        // Recursively evaluate inner expression
        const innerValue = Function('Math', `"use strict"; return (${inner})`)(Math);
        const absValue = Math.abs(innerValue);
        console.log(`abs(${inner}) = abs(${innerValue}) = ${absValue}`);
        return absValue;
      });
    }

    console.log(`Final expression: ${expr}`);

    // Use Function constructor with Math passed as parameter
    const result = Function('Math', `"use strict"; return (${expr})`)(Math);
    console.log(`Result: ${result}`);
    return result;
  } catch (error) {
    console.error('Formula evaluation error:', formula, error);
    console.error('Expression was:', expr);
    return 0;
  }
}

function classifyFeature(feature, categories, customParamMap) {
  // Sort by priority (lower = higher priority)
  const sorted = [...categories].sort((a, b) => a.priority - b.priority);

  for (const category of sorted) {
    if (!category.enabled) continue;

    // Check parent first
    if (category.parentId !== null && category.parentId >= 0) {
      const parent = categories[category.parentId];
      if (parent) {
        const parentMatches = parent.rules.every(rule => evaluateRule(rule, feature.properties, customParamMap));
        if (!parentMatches) continue;
      }
    }

    // Check this category's rules
    const matches = category.rules.every(rule => evaluateRule(rule, feature.properties, customParamMap));
    if (matches) {
      return category.color;
    }
  }

  return null; // Unclassified
}

function generateMapImage(title, categories, customParamMap) {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(0, 0, width, height);

  // Load and render features
  const features = loadBaseLayer();

  if (features.length > 0 && categories.length > 0) {
    // Simple equirectangular projection
    const lonToX = (lon) => ((lon + 180) / 360) * width;
    const latToY = (lat) => ((90 - lat) / 180) * height;

    features.forEach(feature => {
      const color = classifyFeature(feature, categories, customParamMap);
      if (color) {
        const coords = feature.geometry.coordinates[0];
        const [[lon, lat]] = coords;

        // Approximate cell size (1°)
        const x = lonToX(lon);
        const y = latToY(lat);
        const cellWidth = width / 360;
        const cellHeight = height / 180;

        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
    });
  }

  // No text overlay - map speaks for itself
  // Title and attribution come from OG meta tags

  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default function handler(req, res) {
  try {
    const { s: stateParam } = req.query;

    let title = 'Koppen Climate Classification';
    let categories = [];
    let customParamMap = new Map();

    if (stateParam) {
      const state = decodeState(stateParam);
      console.log('Decoded state:', state ? 'success' : 'failed');
      if (state && state.m === 'c' && state.r) {
        title = state.n || 'Custom Classification';
        const expanded = expandCategories(state.r);
        categories = expanded.categories;
        customParamMap = expanded.customParamMap;
        console.log(`Loaded ${categories.length} categories, ${customParamMap.size} custom params`);
      }
    }

    const png = generateMapImage(title, categories, customParamMap);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(png);
  } catch (error) {
    console.error('OG image error:', error);
    console.error('Error stack:', error.stack);

    // Fallback - simple colored rectangle
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // White box
    ctx.fillStyle = 'white';
    ctx.fillRect(100, 200, 1000, 230);

    res.setHeader('Content-Type', 'image/png');
    res.send(canvas.toBuffer('image/png'));
  }
}
