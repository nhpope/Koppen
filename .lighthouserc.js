/**
 * Lighthouse CI Configuration
 * Enforces performance budgets per test design (NFR1: LCP < 3s, NFR4: < 100ms updates)
 *
 * Run locally: npx lhci autorun
 * Runs automatically in CI via GitHub Actions
 */

module.exports = {
  ci: {
    collect: {
      // Build and serve the production build
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      url: ['http://localhost:4173/'],
      numberOfRuns: 3, // Run 3 times for median score
      settings: {
        // Use desktop config (primary target per PRD)
        preset: 'desktop',
        // Throttling (simulated fast 3G)
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      // Performance budgets (CRITICAL - gate blockers)
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }], // Lighthouse score >= 90
        'categories:accessibility': ['warn', { minScore: 0.9 }], // WCAG AA target
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['off'], // SEO not priority per PRD

        // Core Web Vitals (NFR1: LCP < 3s)
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }], // <3s
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }], // <2s
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }], // Minimal layout shift
        'total-blocking-time': ['warn', { maxNumericValue: 300 }], // <300ms blocking

        // Resource budgets (NFR: JS < 200KB, Data < 5MB)
        'resource-summary:script:size': ['error', { maxNumericValue: 204800 }], // 200KB
        'resource-summary:document:size': ['warn', { maxNumericValue: 51200 }], // 50KB HTML
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 51200 }], // 50KB CSS
        'resource-summary:total:size': ['warn', { maxNumericValue: 5242880 }], // 5MB total (inc. TopoJSON)

        // Performance best practices
        'uses-text-compression': 'error',
        'uses-responsive-images': 'warn',
        'offscreen-images': 'warn',
        'modern-image-formats': 'warn',
        'efficient-animated-content': 'warn',

        // Accessibility (NFR8-12: WCAG AA partial)
        'color-contrast': 'warn', // Color contrast 4.5:1
        'valid-lang': 'error',
        'html-has-lang': 'error',
        'button-name': 'error',
        'link-name': 'error',
        'image-alt': 'warn',
        'aria-valid-attr': 'error',
        'aria-allowed-attr': 'error',
      },
    },
    upload: {
      // Upload results to temporary public storage (optional)
      target: 'temporary-public-storage',
    },
  },
};
