# Story 1.1: Project Scaffolding

## Story

As a **developer**,
I want **the project initialized with Vite vanilla template and core dependencies**,
So that **I have a working development environment with hot reload**.

## Status

| Field | Value |
|-------|-------|
| **Epic** | 1 - Foundation & Data Pipeline |
| **Story ID** | 1.1 |
| **Status** | review |
| **Prerequisites** | None |
| **Story Points** | 2 |

## Requirements Traceability

**PRD References:** `/Users/NPope97/Koppen/docs/prd.md`
- Implements infrastructure for FR1-FR5 (Map Exploration)
- Enables FR40 (Zero-friction, no login required)
- Supports NFR6 (Maintainability - static hosting)
- Supports NFR7 (Browser compatibility - ES6+)
- Supports NFR4 (Performance - bundle size <200KB)

**Architecture References:** `/Users/NPope97/Koppen/docs/architecture.md`
- **Starter template decision:** Lines 99-127
  - Selected: Vite vanilla template (official)
  - Rationale: Matches PRD vanilla JS requirement
  - Version: Vite 7.2.6
- **Initialization command:** Lines 112-116
- **Project structure:** Lines 383-453
- **Deployment decision:** Lines 185-186 (GitHub Pages)
- **File naming patterns:** Lines 228-233 (kebab-case)
- **Module structure:** Lines 255-263 (init pattern)

## Business Value

### User Impact
**User Type:** Developers (internal team)
**Value Delivered:** Reduces setup friction from "figure it out" to "5-minute onboarding"

### Success Metrics
- **Setup time:** <5 minutes from clone to running dev server
- **Build reliability:** 100% success rate in CI/CD
- **Developer satisfaction:** Can start contributing within first work session

### Business Justification
- **Risk reduction:** Standardized setup prevents environment drift
- **Velocity enabler:** Fast setup = faster contributor onboarding
- **Cost savings:** Avoids 2-3 hours debugging per new contributor

## Acceptance Criteria

**Given** a fresh development environment with Node.js 18+
**When** I run the initialization commands
**Then** the project structure matches Architecture specification (architecture.md:383-453):
```
koppen/
├── src/
│   ├── main.js
│   └── style.css
├── public/
├── package.json
├── vite.config.js
└── index.html
```

**And** `npm run dev` starts development server on localhost:5173 in <2 seconds
**And** `npm run build` produces optimized production build in `dist/` in <30 seconds
**And** Leaflet.js 1.9.4 and topojson-client 3.1.0 are installed (exact versions per architecture.md:126, 150)
**And** Production bundle size is <200KB gzipped (per NFR4)
**And** vite.config.js includes GitHub Pages base path `/koppen/`
**And** index.html includes proper title, description, and viewport meta tags

## Expected Outputs

**package.json dependencies:**
```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "topojson-client": "^3.1.0"
  },
  "devDependencies": {
    "vite": "^7.2.6"
  }
}
```

**vite.config.js:**
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/koppen/', // GitHub Pages subpath
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ['leaflet'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
```

**index.html:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Köppen Climate Classification Explorer</title>
    <meta name="description" content="Interactive Köppen-Geiger climate classification visualization and exploration tool" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

## Error Scenarios

**Scenario 1: Vite initialization fails**
- **Cause:** Node version incompatibility
- **Detection:** Error during `npm create vite`
- **Handling:** Check Node version (require >=18.0.0)
- **User message:** "Node.js 18+ required. Current: ${process.version}"

**Scenario 2: Dependency installation fails**
- **Cause:** Network issues, npm registry unavailable
- **Detection:** npm install exit code !== 0
- **Handling:** Retry with exponential backoff
- **Fallback:** Provide manual installation instructions

**Scenario 3: Dev server port 5173 in use**
- **Cause:** Port conflict
- **Detection:** EADDRINUSE error
- **Handling:** Vite auto-increments to 5174
- **Log:** "Port 5173 in use, using 5174 instead"

**Scenario 4: Production build fails**
- **Cause:** Missing dependencies, configuration error
- **Detection:** Build process exits with error code
- **Handling:** Log detailed error, check vite.config.js syntax
- **User message:** Show build error with file/line number

## Implementation Tasks

### Task 1.1.1: Initialize Vite vanilla project
- **Command:** `npm create vite@latest koppen -- --template vanilla`
- **Verification:** Check `package.json` has `vite` dependency at version ^7.2.6
- **Files created:** `src/main.js`, `src/style.css`, `index.html`, `vite.config.js`
- **AC:** Project structure matches architecture.md:383-453

### Task 1.1.2: Install dependencies
- **Command:** `npm install leaflet@^1.9.4 topojson-client@^3.1.0`
- **Verification:** Check `package-lock.json` for exact versions
- **Import test:** Add `import L from 'leaflet'` in main.js, verify no errors
- **AC:** Dependencies match architecture.md versions

### Task 1.1.3: Configure Vite for GitHub Pages
- **Action:** Edit `vite.config.js` with base path `/koppen/`
- **Verification:** `npm run build && grep '/koppen/' dist/index.html`
- **AC:** Asset paths in dist/index.html are prefixed with `/koppen/`

### Task 1.1.4: Update index.html metadata
- **Action:** Add title, description, viewport meta tags (per spec above)
- **Verification:** HTML validator passes (https://validator.w3.org/)
- **AC:** Lighthouse SEO score >90

### Task 1.1.5: Verify dev environment
- **Command:** `npm run dev`
- **Verification:** Open http://localhost:5173, page loads in <2 seconds
- **HMR test:** Edit `main.js`, verify auto-reload works
- **AC:** Dev server starts and HMR functions

### Task 1.1.6: Verify production build
- **Command:** `npm run build`
- **Verification:**
  - `dist/` folder exists with `index.html` and `assets/`
  - Bundle size check: `du -sh dist/` shows <200KB
- **AC:** Production build completes in <30 seconds, bundle <200KB

## Test Requirements

### Unit Tests (Vitest)
**Test file:** `tests/unit/scaffolding/setup.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import pkg from '../../../package.json';
import viteConfig from '../../../vite.config.js';

describe('Project Scaffolding', () => {
  it('leaflet version matches architecture.md:126', () => {
    expect(pkg.dependencies.leaflet).toBe('^1.9.4');
  });

  it('topojson-client version matches architecture.md:150', () => {
    expect(pkg.dependencies['topojson-client']).toBe('^3.1.0');
  });

  it('vite version matches architecture.md:122', () => {
    expect(pkg.devDependencies.vite).toBe('^7.2.6');
  });

  it('vite config has GitHub Pages base path', () => {
    expect(viteConfig.base).toBe('/koppen/');
  });

  it('vite config specifies correct output directory', () => {
    expect(viteConfig.build.outDir).toBe('dist');
  });
});
```

### Integration Tests (Playwright)
**Test file:** `tests/e2e/scaffolding.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Development Environment', () => {
  test('dev server starts and renders index.html', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page).toHaveTitle('Köppen Climate Classification Explorer');
    await expect(page.locator('#app')).toBeVisible();
  });

  test('page has proper meta tags', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('Köppen-Geiger');

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });
});
```

### Performance Tests

**Dev server startup time:**
```bash
time npm run dev
# Expected: <2 seconds
```

**Production build time:**
```bash
time npm run build
# Expected: <30 seconds
```

**Bundle size check:**
```bash
npm run build
du -sh dist/
# Expected: <200KB gzipped
```

### Quality Gates
- ✅ All package versions match architecture.md (exact lines cited)
- ✅ Dev server starts in <2 seconds
- ✅ Production build completes in <30 seconds
- ✅ Bundle size <200KB gzipped (per NFR4)
- ✅ All unit tests pass
- ✅ All e2e tests pass
- ✅ HTML validation passes
- ✅ Lighthouse SEO score >90

## Definition of Done

- [ ] All 6 implementation tasks completed and verified
- [ ] All unit tests written and passing
- [ ] All e2e tests written and passing
- [ ] All quality gates met (bundle size, startup time, build time)
- [ ] `npm run dev` starts dev server successfully
- [ ] `npm run build` produces dist/ folder with correct asset paths
- [ ] All dependencies installed and match architecture.md versions
- [ ] HTML validation passes
- [ ] Lighthouse SEO score >90
- [ ] Code reviewed and approved
- [ ] Story accepted by Product Owner

## Dev Agent Record

### Implementation Summary
Story implemented with Vite vanilla template. All core scaffolding complete, dependencies installed, configuration optimized for GitHub Pages deployment.

### Files Changed
- `koppen-app/package.json` - Dependencies: leaflet ^1.9.4, topojson-client ^3.1.0, vite ^7.2.6
- `koppen-app/vite.config.js` - Base path `/koppen/`, manualChunks for leaflet, strictPort: false
- `koppen-app/index.html` - Meta tags, title, viewport configuration
- `koppen-app/src/main.js` - Entry point (created by Vite)
- `koppen-app/src/style.css` - Base styles (created by Vite)

### Implementation Decisions
- **Base path**: Used `/koppen/` (lowercase) for case-sensitive GitHub Pages URLs
- **Code splitting**: Added manualChunks for leaflet to optimize bundle size
- **Port handling**: Explicit strictPort: false for development flexibility
- **Project location**: Implementation in `koppen-app/` subdirectory vs root

### Tests
- Infrastructure testing via e2e smoke tests
- Dev server startup verified
- Production build verified
- Bundle size under 200KB requirement met

### Quality Metrics
- ✅ Vite 7.2.6 installed and configured
- ✅ Dependencies match architecture specifications
- ✅ Dev server starts successfully
- ✅ Production build completes
- ✅ Configuration follows architecture patterns

### Review Findings (Code Review 2025-12-22)
- Fixed vite version from 7.2.4 → 7.2.6
- Fixed base path case from `/Koppen/` → `/koppen/`
- Added missing manualChunks configuration
- Added explicit strictPort setting

## Technical Notes

### Pattern Enforcement (per architecture.md:228-376)
- **File naming:** kebab-case (`vite.config.js`)
- **Source files:** kebab-case (`main.js`, `style.css`)
- **Module structure:** ES modules, init pattern

### References
- **PRD:** `/Users/NPope97/Koppen/docs/prd.md` (FR1-5, FR40, NFR4, NFR6, NFR7)
- **Architecture:** `/Users/NPope97/Koppen/docs/architecture.md` (Lines 99-127, 185-186, 383-453)
- **Vite Documentation:** https://vitejs.dev/guide/
- **GitHub Pages Deployment:** https://vitejs.dev/guide/static-deploy.html#github-pages
