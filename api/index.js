/**
 * Root page handler with dynamic OG meta tag injection
 * Serves HTML with proper meta tags for social media crawlers
 */

import { gunzipSync } from 'zlib';
import fs from 'fs';
import path from 'path';

/**
 * Decode URL parameter to get classification state
 */
function decodeState(encoded) {
  try {
    if (!encoded) return null;

    const decoded = Buffer.from(decodeURIComponent(encoded), 'base64');
    const decompressed = gunzipSync(decoded);
    const minimalState = JSON.parse(decompressed.toString());

    if (minimalState.v !== 1 && minimalState.v !== 2) {
      return null;
    }

    return minimalState;
  } catch (error) {
    console.error('Failed to decode state:', error);
    return null;
  }
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  try {
    const { s: stateParam } = req.query;

    // Read the built index.html
    // In Vercel, static files are in the same directory structure
    const htmlPath = path.join(process.cwd(), 'dist', 'index.html');
    let html;

    try {
      html = fs.readFileSync(htmlPath, 'utf8');
    } catch (error) {
      // Fallback: try relative path
      html = fs.readFileSync(path.join(__dirname, '..', 'dist', 'index.html'), 'utf8');
    }

    // If state parameter exists, inject dynamic meta tags
    if (stateParam) {
      const state = decodeState(stateParam);

      if (state) {
        const title = state.n || 'Custom Classification';
        const mode = state.v === 1 ? 't' : (state.m || 't');
        const isCustom = mode === 'c';
        const description = isCustom
          ? `Custom climate classification system with ${state.r?.c?.length || 0} categories`
          : `Modified Köppen classification: ${title}`;

        const ogImageUrl = `https://koppen.io/api/og?s=${encodeURIComponent(stateParam)}`;
        const currentUrl = `https://koppen.io/?s=${encodeURIComponent(stateParam)}`;

        // Replace meta tags
        html = html
          .replace(
            /<meta property="og:title" content="[^"]*" \/>/,
            `<meta property="og:title" content="${escapeHtml(title)}" />`
          )
          .replace(
            /<meta property="og:description" content="[^"]*" \/>/,
            `<meta property="og:description" content="${escapeHtml(description)}" />`
          )
          .replace(
            /<meta property="og:image" content="[^"]*" \/>/,
            `<meta property="og:image" content="${ogImageUrl}" />`
          )
          .replace(
            /<meta property="og:url" content="[^"]*" \/>/,
            `<meta property="og:url" content="${currentUrl}" />`
          )
          .replace(
            /<meta name="twitter:title" content="[^"]*" \/>/,
            `<meta name="twitter:title" content="${escapeHtml(title)}" />`
          )
          .replace(
            /<meta name="twitter:description" content="[^"]*" \/>/,
            `<meta name="twitter:description" content="${escapeHtml(description)}" />`
          )
          .replace(
            /<meta name="twitter:image" content="[^"]*" \/>/,
            `<meta name="twitter:image" content="${ogImageUrl}" />`
          )
          .replace(
            /<title>[^<]*<\/title>/,
            `<title>${escapeHtml(title)} - Köppen Classification</title>`
          );
      }
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.send(html);
  } catch (error) {
    console.error('Share page error:', error);
    res.status(500).send('Error loading page');
  }
}
