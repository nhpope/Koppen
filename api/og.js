/**
 * OpenGraph Image Generation API
 * Generates dynamic PNG preview images for shared classifications
 * Uses sharp for SVG to PNG conversion
 */

import sharp from 'sharp';
import { gunzipSync } from 'zlib';

// Schema version constant (matches client-side)
const SCHEMA_VERSION = 2;

/**
 * Decode URL parameter to get classification state
 */
function decodeState(encoded) {
  try {
    if (!encoded) return null;

    // Decode base64
    const decoded = Buffer.from(decodeURIComponent(encoded), 'base64');

    // Decompress with gzip
    const decompressed = gunzipSync(decoded);

    // Parse JSON
    const minimalState = JSON.parse(decompressed.toString());

    // Validate schema version
    if (minimalState.v !== 1 && minimalState.v !== 2) {
      throw new Error(`Unsupported schema version: ${minimalState.v}`);
    }

    return minimalState;
  } catch (error) {
    console.error('Failed to decode state:', error);
    return null;
  }
}

/**
 * Expand minified categories
 */
function expandCategories(minified) {
  if (!minified || !minified.c) return [];

  return minified.c.map(minCat => ({
    name: minCat.n || 'Unnamed',
    color: minCat.o || '#888888',
    priority: minCat.p ?? 0,
    enabled: minCat.e !== false,
  })).filter(cat => cat.enabled).slice(0, 16); // Limit to 16 for display
}

/**
 * Generate SVG image
 */
function generateSVG(title, categories, isCustom) {
  const width = 1200;
  const height = 630;

  // Escape HTML in text
  const escapeHtml = (text) => String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const subtitle = isCustom ? 'Custom Climate Classification' : 'Modified Köppen Classification';

  // Category badges (4 per row, max 16 total)
  let categoryBadges = '';
  const cols = 4;
  const badgeWidth = 250;
  const badgeHeight = 40;
  const gap = 15;
  const startX = (width - (cols * badgeWidth + (cols - 1) * gap)) / 2;
  const startY = 320;

  categories.forEach((cat, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const x = startX + col * (badgeWidth + gap);
    const y = startY + row * (badgeHeight + gap);

    categoryBadges += `
      <g transform="translate(${x}, ${y})">
        <rect width="${badgeWidth}" height="${badgeHeight}" rx="6" fill="#f1f5f9"/>
        <rect x="10" y="10" width="20" height="20" rx="3" fill="${escapeHtml(cat.color)}" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        <text x="40" y="25" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#334155" dominant-baseline="middle">
          ${escapeHtml(cat.name.slice(0, 20))}
        </text>
      </g>
    `;
  });

  if (categories.length > 16) {
    const row = Math.floor(16 / cols);
    const col = 16 % cols;
    const x = startX + col * (badgeWidth + gap);
    const y = startY + row * (badgeHeight + gap);

    categoryBadges += `
      <text x="${x + badgeWidth / 2}" y="${y + badgeHeight / 2}"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="18" fill="#64748b" text-anchor="middle" dominant-baseline="middle">
        +${categories.length - 16} more categories
      </text>
    `;
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bg)"/>

      <!-- Card -->
      <rect x="60" y="80" width="${width - 120}" height="${height - 160}" rx="24" fill="white" filter="drop-shadow(0 20px 40px rgba(0,0,0,0.3))"/>

      <!-- Title -->
      <text x="${width / 2}" y="180"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="56" font-weight="bold" fill="#1e293b"
            text-anchor="middle">
        ${escapeHtml(title)}
      </text>

      <!-- Subtitle -->
      <text x="${width / 2}" y="240"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="24" fill="#64748b"
            text-anchor="middle">
        ${subtitle}
      </text>

      <!-- Categories -->
      ${categoryBadges}

      <!-- Footer -->
      <text x="${width / 2}" y="${height - 100}"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="20" fill="#94a3b8"
            text-anchor="middle">
        View on koppen.io
      </text>
    </svg>
  `;
}

export default async function handler(req, res) {
  try {
    const { searchParams } = new URL(req.url);
    const encoded = searchParams.get('s');

    // Default values
    let title = 'Köppen Climate Classification';
    let categories = [];
    let isCustom = false;

    // Decode if state parameter exists
    if (encoded) {
      const state = decodeState(encoded);

      if (state) {
        title = state.n || 'Custom Classification';
        const mode = state.v === 1 ? 't' : (state.m || 't');

        if (mode === 'c' && state.r) {
          // Custom rules mode
          isCustom = true;
          categories = expandCategories(state.r);
        }
      }
    }

    // Generate SVG
    const svg = generateSVG(title, categories, isCustom);

    // Convert SVG to PNG using sharp
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    // Return as PNG
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(pngBuffer);
  } catch (error) {
    console.error('OG image generation error:', error);

    // Return fallback SVG converted to PNG
    const fallbackSVG = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#f8f9fa"/>
        <text x="600" y="315" font-family="sans-serif" font-size="48" fill="#64748b" text-anchor="middle">
          Köppen Climate Classification
        </text>
      </svg>
    `;

    try {
      const pngBuffer = await sharp(Buffer.from(fallbackSVG))
        .png()
        .toBuffer();

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(pngBuffer);
    } catch {
      // Ultimate fallback - just send the SVG
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(fallbackSVG);
    }
  }
}
