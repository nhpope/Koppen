/**
 * OpenGraph Image Generation API
 * Renders simplified world map with classification colors
 */

import { createCanvas } from 'canvas';
import { gunzipSync } from 'zlib';
import fs from 'fs';
import path from 'path';

const SCHEMA_VERSION = 2;

// Cache base layer data to avoid repeated file reads
let cachedBaseLayer = null;

function loadBaseLayer() {
  if (cachedBaseLayer) return cachedBaseLayer;

  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'climate-1deg.geojson');
    const geojson = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    cachedBaseLayer = geojson.features;
    return cachedBaseLayer;
  } catch (error) {
    console.error('Failed to load base layer:', error);
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
  if (!minified || !minified.c) return [];

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

  return categories;
}

// Simple parameter calculators for server-side classification
const PARAMS = {
  MAT: (props) => props.mat || 0,
  Tmax: (props) => Math.max(...Array.from({length: 12}, (_, i) => props[`t${i+1}`] || 0)),
  Tmin: (props) => Math.min(...Array.from({length: 12}, (_, i) => props[`t${i+1}`] || 0)),
  MAP: (props) => props.map || 0,
  Pdry: (props) => Math.min(...Array.from({length: 12}, (_, i) => props[`p${i+1}`] || 0)),
  Pwet: (props) => Math.max(...Array.from({length: 12}, (_, i) => props[`p${i+1}`] || 0)),
  AridityIndex: (props) => {
    const mat = props.mat || 0;
    const map = props.map || 0;
    return map / (mat + 10);
  },
};

function evaluateRule(rule, props) {
  const paramValue = PARAMS[rule.parameter]?.(props);
  if (paramValue === undefined) return false;

  const { operator, value } = rule;

  switch (operator) {
    case '<': return paramValue < value;
    case '<=': return paramValue <= value;
    case '>': return paramValue > value;
    case '>=': return paramValue >= value;
    case '==': return Math.abs(paramValue - value) < 0.001;
    case '!=': return Math.abs(paramValue - value) >= 0.001;
    default: return false;
  }
}

function classifyFeature(feature, categories) {
  // Sort by priority (lower = higher priority)
  const sorted = [...categories].sort((a, b) => a.priority - b.priority);

  for (const category of sorted) {
    if (!category.enabled) continue;

    // Check parent first
    if (category.parentId !== null && category.parentId >= 0) {
      const parent = categories[category.parentId];
      if (parent) {
        const parentMatches = parent.rules.every(rule => evaluateRule(rule, feature.properties));
        if (!parentMatches) continue;
      }
    }

    // Check this category's rules
    const matches = category.rules.every(rule => evaluateRule(rule, feature.properties));
    if (matches) {
      return category.color;
    }
  }

  return null; // Unclassified
}

function generateMapImage(title, categories) {
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
      const color = classifyFeature(feature, categories);
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

  // Title overlay with semi-transparent background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  roundRect(ctx, 40, 40, width - 80, 100, 12);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, width / 2, 90);

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

    if (stateParam) {
      const state = decodeState(stateParam);
      if (state && state.m === 'c' && state.r) {
        title = state.n || 'Custom Classification';
        categories = expandCategories(state.r);
      }
    }

    const png = generateMapImage(title, categories);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(png);
  } catch (error) {
    console.error('OG image error:', error);

    // Fallback
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = '#64748b';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Koppen Climate Classification', 600, 315);

    res.setHeader('Content-Type', 'image/png');
    res.send(canvas.toBuffer('image/png'));
  }
}
