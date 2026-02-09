/**
 * OpenGraph Image Generation API
 * Generates dynamic preview images for shared classifications
 * Uses @vercel/og for server-side image generation
 */

import { ImageResponse } from '@vercel/og';

// Schema version constant (matches client-side)
const SCHEMA_VERSION = 2;

/**
 * Decompress gzip data using edge-compatible method
 * Edge runtime supports DecompressionStream
 */
async function gunzip(data) {
  try {
    // Use DecompressionStream for edge runtime compatibility
    const stream = new Response(data).body
      .pipeThrough(new DecompressionStream('gzip'));

    const decompressed = await new Response(stream).arrayBuffer();
    return new TextDecoder().decode(decompressed);
  } catch (error) {
    console.error('Decompression failed:', error);
    throw error;
  }
}

/**
 * Decode URL parameter to get classification state
 */
async function decodeState(encoded) {
  try {
    if (!encoded) return null;

    // Decode base64
    const decoded = Uint8Array.from(
      atob(decodeURIComponent(encoded)),
      c => c.charCodeAt(0)
    );

    // Decompress with gzip
    const decompressed = await gunzip(decoded);

    // Parse JSON
    const minimalState = JSON.parse(decompressed);

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
  })).filter(cat => cat.enabled);
}

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const encoded = searchParams.get('s');

    // Default values
    let title = 'Köppen Climate Classification';
    let categories = [];
    let isCustom = false;

    // Decode if state parameter exists
    if (encoded) {
      const state = await decodeState(encoded);

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

    // Generate image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '60px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxWidth: '90%',
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: 64,
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              {title}
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontSize: 28,
                color: '#64748b',
                marginBottom: 40,
              }}
            >
              {isCustom ? 'Custom Climate Classification' : 'Modified Köppen Classification'}
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  justifyContent: 'center',
                  maxWidth: '1000px',
                }}
              >
                {categories.slice(0, 12).map((cat, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: cat.color,
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                    <div style={{ fontSize: 20, color: '#334155' }}>
                      {cat.name}
                    </div>
                  </div>
                ))}
                {categories.length > 12 && (
                  <div
                    style={{
                      padding: '8px 16px',
                      fontSize: 20,
                      color: '#64748b',
                    }}
                  >
                    +{categories.length - 12} more
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                marginTop: 40,
                fontSize: 24,
                color: '#94a3b8',
              }}
            >
              View on koppen.io
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);

    // Return a fallback error image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
          }}
        >
          <div style={{ fontSize: 48, color: '#64748b' }}>
            Köppen Climate Classification
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
