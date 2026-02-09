/**
 * Share page handler - serves HTML with dynamic OG meta tags
 * URL: /share?s=...
 */

import { gunzipSync } from 'zlib';
import fs from 'fs';
import path from 'path';

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

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function handler(req, res) {
  try {
    const { s: stateParam } = req.query;

    // Read index.html from dist
    const htmlPath = path.join(process.cwd(), 'dist', 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    if (stateParam) {
      const state = decodeState(stateParam);

      if (state) {
        const title = state.n || 'Custom Classification';
        const mode = state.v === 1 ? 't' : (state.m || 't');
        const isCustom = mode === 'c';
        const categoryCount = state.r?.c?.length || 0;
        const description = isCustom
          ? `Custom climate classification with ${categoryCount} categories`
          : `Modified Köppen classification: ${title}`;

        const ogImageUrl = `https://koppen.io/api/og?s=${encodeURIComponent(stateParam)}`;
        const shareUrl = `https://koppen.io/share?s=${encodeURIComponent(stateParam)}`;

        // Replace all OG meta tags
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
            `<meta property="og:url" content="${shareUrl}" />`
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
            `<title>${escapeHtml(title)} - Köppen Climate Classification</title>`
          )
          // Redirect browser to main app with state parameter
          .replace(
            '</head>',
            `<script>
              // Redirect to main app if this is a browser (not a crawler)
              if (window.navigator && !navigator.userAgent.includes('bot')) {
                window.location.replace('/?s=${encodeURIComponent(stateParam)}');
              }
            </script></head>`
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
