/**
 * Vercel Edge Middleware
 * Injects dynamic OG meta tags for shared classification URLs
 */

/**
 * Decode URL parameter to get classification state
 * Uses edge-compatible DecompressionStream
 */
async function decodeState(encoded) {
  try {
    if (!encoded) return null;

    // Decode base64
    const decoded = Uint8Array.from(
      atob(decodeURIComponent(encoded)),
      c => c.charCodeAt(0)
    );

    // Decompress with gzip using DecompressionStream
    const stream = new Response(decoded).body
      .pipeThrough(new DecompressionStream('gzip'));

    const decompressed = await new Response(stream).arrayBuffer();
    const json = new TextDecoder().decode(decompressed);

    const minimalState = JSON.parse(json);

    if (minimalState.v !== 1 && minimalState.v !== 2) {
      return null;
    }

    return minimalState;
  } catch (error) {
    console.error('Failed to decode state:', error);
    return null;
  }
}

export async function middleware(request) {
  const { searchParams, pathname } = new URL(request.url);
  const stateParam = searchParams.get('s');

  // Only inject meta tags for root path with state parameter
  if (pathname === '/' && stateParam) {
    try {
      const state = await decodeState(stateParam);

      if (state) {
        const title = state.n || 'Custom Classification';
        const mode = state.v === 1 ? 't' : (state.m || 't');
        const isCustom = mode === 'c';
        const description = isCustom
          ? `Custom climate classification system: ${title}`
          : `Modified Köppen classification: ${title}`;

        const ogImageUrl = `https://koppen.io/api/og?s=${encodeURIComponent(stateParam)}`;
        const currentUrl = request.url;

        // Fetch the original HTML
        const response = await fetch(request.url, {
          headers: request.headers,
        });

        let html = await response.text();

        // Replace meta tags with dynamic values
        html = html
          .replace(
            '<meta property="og:title" content="Köppen Climate Classification Explorer" />',
            `<meta property="og:title" content="${escapeHtml(title)}" />`
          )
          .replace(
            '<meta property="og:description" content="Interactive climate classification explorer. Create, compare, and share custom classification systems." />',
            `<meta property="og:description" content="${escapeHtml(description)}" />`
          )
          .replace(
            '<meta property="og:image" content="https://koppen.io/api/og" />',
            `<meta property="og:image" content="${ogImageUrl}" />`
          )
          .replace(
            '<meta property="og:url" content="https://koppen.io" />',
            `<meta property="og:url" content="${currentUrl}" />`
          )
          .replace(
            '<meta name="twitter:title" content="Köppen Climate Classification Explorer" />',
            `<meta name="twitter:title" content="${escapeHtml(title)}" />`
          )
          .replace(
            '<meta name="twitter:description" content="Interactive climate classification explorer. Create and share custom classification systems." />',
            `<meta name="twitter:description" content="${escapeHtml(description)}" />`
          )
          .replace(
            '<meta name="twitter:image" content="https://koppen.io/api/og" />',
            `<meta name="twitter:image" content="${ogImageUrl}" />`
          )
          .replace(
            '<title>Koppen - Interactive Climate Classification Explorer</title>',
            `<title>${escapeHtml(title)} - Köppen Classification</title>`
          );

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=0, must-revalidate',
          },
        });
      }
    } catch (error) {
      console.error('Middleware error:', error);
    }
  }

  // Pass through for all other requests
  return fetch(request);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const config = {
  matcher: '/',
};
