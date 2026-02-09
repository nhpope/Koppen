/**
 * OpenGraph Image Generation API
 * Generates PNG preview images using node-canvas
 */

import { createCanvas } from 'canvas';
import { gunzipSync } from 'zlib';

const SCHEMA_VERSION = 2;

function decodeState(encoded) {
  try {
    if (!encoded) return null;
    const decoded = Buffer.from(decodeURIComponent(encoded), 'base64');
    const decompressed = gunzipSync(decoded);
    const minimalState = JSON.parse(decompressed.toString());
    if (minimalState.v !== 1 && minimalState.v !== 2) return null;
    return minimalState;
  } catch (error) {
    console.error('Failed to decode:', error);
    return null;
  }
}

function expandCategories(minified) {
  if (!minified || !minified.c) return [];
  return minified.c.map(minCat => ({
    name: minCat.n || 'Unnamed',
    color: minCat.o || '#888888',
  })).slice(0, 16);
}

function generateImage(title, categories, isCustom) {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // White card with shadow effect
  ctx.fillStyle = 'white';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  roundRect(ctx, 60, 80, width - 120, height - 160, 24);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Title
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 56px -apple-system, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, width / 2, 180);

  // Subtitle
  ctx.fillStyle = '#64748b';
  ctx.font = '24px -apple-system, system-ui, sans-serif';
  const subtitle = isCustom ? 'Custom Climate Classification' : 'Modified Köppen Classification';
  ctx.fillText(subtitle, width / 2, 240);

  // Categories (4 per row)
  if (categories.length > 0) {
    const cols = 4;
    const badgeWidth = 250;
    const badgeHeight = 40;
    const gap = 15;
    const startX = (width - (cols * badgeWidth + (cols - 1) * gap)) / 2;
    const startY = 320;

    ctx.font = '16px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'left';

    categories.forEach((cat, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = startX + col * (badgeWidth + gap);
      const y = startY + row * (badgeHeight + gap);

      // Badge background
      ctx.fillStyle = '#f1f5f9';
      roundRect(ctx, x, y, badgeWidth, badgeHeight, 6);
      ctx.fill();

      // Color swatch
      ctx.fillStyle = cat.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      roundRect(ctx, x + 10, y + 10, 20, 20, 3);
      ctx.fill();
      ctx.stroke();

      // Category name
      ctx.fillStyle = '#334155';
      ctx.fillText(cat.name.slice(0, 20), x + 40, y + 25);
    });

    // Show "+X more" if over 16
    if (categories.length > 16) {
      const row = Math.floor(16 / cols);
      const col = 16 % cols;
      const x = startX + col * (badgeWidth + gap);
      const y = startY + row * (badgeHeight + gap);

      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(`+${categories.length - 16} more`, x + badgeWidth / 2, y + badgeHeight / 2);
    }
  }

  // Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px -apple-system, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('View on koppen.io', width / 2, height - 100);

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

    let title = 'Köppen Climate Classification';
    let categories = [];
    let isCustom = false;

    if (stateParam) {
      const state = decodeState(stateParam);
      if (state) {
        title = state.n || 'Custom Classification';
        const mode = state.v === 1 ? 't' : (state.m || 't');
        if (mode === 'c' && state.r) {
          isCustom = true;
          categories = expandCategories(state.r);
        }
      }
    }

    const png = generateImage(title, categories, isCustom);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(png);
  } catch (error) {
    console.error('OG image error:', error);

    // Fallback simple image
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = '#64748b';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Köppen Climate Classification', 600, 315);

    res.setHeader('Content-Type', 'image/png');
    res.send(canvas.toBuffer('image/png'));
  }
}
