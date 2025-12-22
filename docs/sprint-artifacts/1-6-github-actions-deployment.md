# Story 1.6: GitHub Actions Deployment

## Story

As a **developer**,
I want **automated deployment to GitHub Pages on push to main**,
So that **the application is always up-to-date**.

## Status

| Field | Value |
|-------|-------|
| **Epic** | 1 - Foundation & Data Pipeline |
| **Story ID** | 1.6 |
| **Status** | review |
| **Prerequisites** | Story 1.1 |
| **Story Points** | 2 |

## Requirements Traceability

**PRD References:** `/Users/NPope97/Koppen/docs/prd.md`
- Implements NFR6 (Maintainability - static hosting on GitHub Pages)
- Supports FR40 (Zero-friction experience - no login, always available)
- Supports NFR4 (Performance - optimized build process)

**Architecture References:** `/Users/NPope97/Koppen/docs/architecture.md`
- **Deployment decision:** Lines 185-186
  - GitHub Pages selected for static hosting
  - Free, reliable, CDN-backed
- **Base path configuration:** Line 98
  - vite.config.js: `base: '/koppen/'`
  - Required for GitHub Pages subpath
- **Build commands:** Lines 525-531
  - `npm run build` generates dist/
  - Deployment workflow specification

## Business Value

### User Impact
**User Type:** Developers (internal team) and end users (site visitors)
**Value Delivered:** Continuous deployment ensures site is always up-to-date with latest changes

### Success Metrics
- **Deployment reliability:** 100% success rate for valid builds
- **Deployment speed:** <2 minutes from push to live
- **Build success rate:** >95% (failures only due to code errors)
- **Uptime:** 99.9% (GitHub Pages SLA)

### Business Justification
- **Developer velocity:** Automated deployment saves 10+ minutes per release
- **Reliability:** Eliminates manual deployment errors
- **Cost:** $0/month (GitHub Pages free for public repos)

## Acceptance Criteria

**Given** code is pushed to the main branch
**When** GitHub Actions workflow runs
**Then** `.github/workflows/deploy.yml`:
- Checks out code with actions/checkout@v4
- Sets up Node.js 20.x environment
- Installs dependencies with `npm ci` (clean install)
- Runs `npm run build` successfully
- Configures GitHub Pages
- Uploads dist/ as artifact
- Deploys to GitHub Pages
- Completes in <2 minutes

**And** the deployed site is accessible at `https://<username>.github.io/koppen/`
**And** workflow shows green checkmark on success, red X on failure
**And** workflow status is visible in repository Actions tab
**And** failed builds show clear error messages

## Expected Outputs

**.github/workflows/deploy.yml (complete implementation):**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch: # Allow manual trigger

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Allow only one concurrent deployment, skipping runs queued between the run in-progress and latest queued.
# However, do NOT cancel in-progress runs as we want to allow these production deployments to complete.
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      # 1. Checkout code
      - name: Checkout
        uses: actions/checkout@v4

      # 2. Set up Node.js environment
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # 3. Install dependencies (clean install for reproducibility)
      - name: Install dependencies
        run: npm ci

      # 4. Run build
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

      # 5. Configure GitHub Pages
      - name: Setup Pages
        uses: actions/configure-pages@v4

      # 6. Upload build artifact
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

      # 7. Deploy to GitHub Pages
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

      # 8. Verify deployment
      - name: Verify deployment
        run: |
          echo "Deployed to: ${{ steps.deployment.outputs.page_url }}"
          curl -f -s -o /dev/null -w "%{http_code}" "${{ steps.deployment.outputs.page_url }}" || exit 1
```

**README.md addition (deployment section):**
```markdown
## Deployment

### Automatic Deployment

The site is automatically deployed to GitHub Pages on every push to the `main` branch.

**Deployment URL:** https://\<username\>.github.io/koppen/

**Workflow:** `.github/workflows/deploy.yml`

### Manual Deployment

To manually trigger a deployment:
1. Go to Actions tab in GitHub repository
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow"

### Deployment Status

[![Deploy Status](https://github.com/<username>/koppen/actions/workflows/deploy.yml/badge.svg)](https://github.com/<username>/koppen/actions/workflows/deploy.yml)

### Troubleshooting

**Build fails:**
- Check Actions tab for detailed error logs
- Verify `npm run build` works locally
- Ensure all dependencies are in package.json

**Deployment succeeds but site is broken:**
- Verify base path in vite.config.js is `/koppen/`
- Check browser console for 404 errors
- Verify GitHub Pages is enabled in repository settings

**Deployment takes too long:**
- Check dependency cache is working
- Verify npm ci is using cache (logs should show "Cache restored")
```

**vite.config.js (verify base path):**
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/koppen/', // GitHub Pages subpath - CRITICAL for deployment
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

## Error Scenarios

**Scenario 1: Build fails due to TypeScript/ESLint errors**
- **Cause:** Code pushed with linting or type errors
- **Detection:** `npm run build` exits with non-zero code
- **Handling:** Workflow fails, shows red X, detailed logs in Actions tab
- **User message:** "Build failed - see logs for details"

**Scenario 2: GitHub Pages not enabled in repository settings**
- **Cause:** Pages feature not activated in repository
- **Detection:** deploy-pages action fails with permission error
- **Handling:** Workflow fails at deployment step
- **User message:** "GitHub Pages not enabled. Go to Settings > Pages and select 'GitHub Actions' as source."

**Scenario 3: Permissions error on deployment**
- **Cause:** Workflow lacks necessary permissions
- **Detection:** deploy-pages action fails with 403 error
- **Handling:** Workflow fails, check permissions in deploy.yml
- **User message:** "Permission denied. Verify workflow permissions in deploy.yml."

**Scenario 4: npm ci fails due to package-lock.json mismatch**
- **Cause:** package-lock.json out of sync with package.json
- **Detection:** npm ci command fails
- **Handling:** Workflow fails at dependency installation
- **User message:** "Dependency installation failed. Run 'npm install' locally and commit package-lock.json."

**Scenario 5: Deployment succeeds but site shows 404**
- **Cause:** Incorrect base path in vite.config.js
- **Detection:** Manual verification after deployment
- **Handling:** Assets fail to load, browser shows 404 for CSS/JS
- **User message:** "Site deployed but broken. Verify base: '/koppen/' in vite.config.js."

## Implementation Tasks

### Task 1.6.1: Create .github/workflows directory
- **Command:** `mkdir -p .github/workflows`
- **Verification:** `test -d .github/workflows`
- **AC:** Directory exists

### Task 1.6.2: Create deploy.yml workflow file
- **Action:** Copy complete workflow from "Expected Outputs"
- **Verification:** `test -f .github/workflows/deploy.yml`
- **AC:** File exists with correct syntax

### Task 1.6.3: Verify vite.config.js base path
- **Action:** Check vite.config.js contains `base: '/koppen/'`
- **Verification:** `grep -q "base: '/koppen/'" vite.config.js`
- **AC:** Base path is correctly configured

### Task 1.6.4: Enable GitHub Pages in repository settings
- **Action:** Go to Settings > Pages, select "GitHub Actions" as source
- **Verification:** Pages section shows "GitHub Actions" selected
- **AC:** GitHub Pages is enabled

### Task 1.6.5: Test workflow locally
- **Action:** Run `npm ci && npm run build` to verify it works
- **Verification:** Build succeeds, dist/ folder created
- **AC:** Build completes without errors

### Task 1.6.6: Commit and push workflow
- **Command:** `git add .github/workflows/deploy.yml && git commit -m "Add GitHub Actions deployment" && git push`
- **Verification:** Check Actions tab in GitHub
- **AC:** Workflow runs automatically on push

### Task 1.6.7: Verify deployment
- **Action:** Wait for workflow to complete, visit deployed URL
- **Verification:** Site loads correctly at `https://<username>.github.io/koppen/`
- **AC:** Deployed site is accessible and functional

### Task 1.6.8: Add deployment status badge
- **Action:** Add badge to README.md from "Expected Outputs"
- **Verification:** Badge shows in README, reflects workflow status
- **AC:** Status badge displays correctly

## Test Requirements

### Workflow Validation
**Test file:** `.github/workflows/validate.yml` (optional pre-merge check)

```yaml
name: Validate Build

on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
```

### Deployment Health Check
**Test file:** `tests/e2e/deployment-health.spec.js`

```javascript
import { test, expect } from '@playwright/test';

const DEPLOYMENT_URL = 'https://<username>.github.io/koppen/';

test.describe('Deployment Health Check', () => {
  test('deployed site is accessible', async ({ page }) => {
    await page.goto(DEPLOYMENT_URL);
    await expect(page).toHaveTitle('Köppen Climate Classification Explorer');
  });

  test('assets load correctly', async ({ page }) => {
    await page.goto(DEPLOYMENT_URL);

    // Check CSS loaded
    const styles = await page.locator('link[rel="stylesheet"]').count();
    expect(styles).toBeGreaterThan(0);

    // Check JS loaded
    const scripts = await page.locator('script[type="module"]').count();
    expect(scripts).toBeGreaterThan(0);
  });

  test('no console errors on load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(DEPLOYMENT_URL);
    await page.waitForTimeout(2000);

    expect(errors.length).toBe(0);
  });
});
```

### Build Performance Test
**Test file:** `tests/performance/build-time.test.sh`

```bash
#!/bin/bash
# Measure build time for CI performance monitoring

START_TIME=$(date +%s)

npm ci
npm run build

END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))

echo "Build completed in ${BUILD_TIME} seconds"

if [ "$BUILD_TIME" -gt 120 ]; then
    echo "ERROR: Build took longer than 2 minutes"
    exit 1
fi

echo "✓ Build time acceptable (<2 minutes)"
```

### Quality Gates
- ✅ Workflow file passes YAML syntax validation
- ✅ `npm ci && npm run build` succeeds locally
- ✅ GitHub Pages enabled in repository settings
- ✅ Workflow runs automatically on push to main
- ✅ Build completes in <2 minutes
- ✅ Deployment succeeds (green checkmark in Actions tab)
- ✅ Deployed site accessible at GitHub Pages URL
- ✅ No 404 errors for assets (CSS, JS, data files)
- ✅ Status badge displays correctly in README
- ✅ Failed builds show clear error messages

## Definition of Done

- [ ] .github/workflows/deploy.yml created with complete workflow
- [ ] vite.config.js base path verified (`/koppen/`)
- [ ] GitHub Pages enabled in repository settings (source: GitHub Actions)
- [ ] Workflow committed and pushed to main branch
- [ ] Workflow runs automatically on push
- [ ] Build succeeds in CI environment
- [ ] Deployment completes successfully
- [ ] Deployed site accessible at GitHub Pages URL
- [ ] All assets load correctly (no 404s)
- [ ] Workflow completes in <2 minutes
- [ ] Status badge added to README.md
- [ ] Deployment health check tests pass
- [ ] Documentation updated with deployment instructions
- [ ] Code reviewed and approved
- [ ] Story accepted by Product Owner

## Technical Notes

### GitHub Actions Best Practices
- **`npm ci` vs `npm install`:** Use `npm ci` for reproducible builds
- **Dependency caching:** actions/setup-node@v4 includes automatic npm caching
- **Concurrency control:** Prevents multiple deployments running simultaneously
- **Environment specification:** Uses `github-pages` environment for URL tracking

### GitHub Pages Configuration
- **Source:** Must be set to "GitHub Actions" (not "Deploy from branch")
- **Base path:** Subpath repos require `base: '/repo-name/'` in vite.config
- **404 handling:** Single-page apps need special 404 handling (not needed for this app)

### Workflow Triggers
- **push to main:** Automatic deployment on merge
- **workflow_dispatch:** Allows manual trigger from Actions UI

### Security Considerations
- **Permissions:** Minimal permissions (contents: read, pages: write)
- **Secrets:** No secrets required for public GitHub Pages deployment
- **Environment:** Uses `github-pages` environment for deployment tracking

### References
- **PRD:** `/Users/NPope97/Koppen/docs/prd.md` (NFR6, FR40, NFR4)
- **Architecture:** `/Users/NPope97/Koppen/docs/architecture.md` (Lines 185-186, 98, 525-531)
- **GitHub Actions:** https://docs.github.com/en/actions
- **GitHub Pages:** https://docs.github.com/en/pages
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html#github-pages

## Dev Agent Record

### Implementation Summary
GitHub Actions workflow directory created. Deployment configuration needs verification.

### Files Changed
- `.github/` - GitHub configuration directory exists
- Status: Directory present but workflow files not yet verified

### Implementation Decisions
- **Platform**: GitHub Pages for static hosting
- **Build process**: Vite production build
- **Base path**: Configured for `/koppen/` subpath deployment

### Tests
- Manual deployment verification needed
- Build process validated locally

### Quality Metrics
- ✅ .github directory exists
- ⚠️ Workflow files need verification
- ✅ Vite config ready for GitHub Pages
- ⚠️ Deployment process not yet tested

### Review Findings (Code Review 2025-12-22)
- .github directory exists but workflow files not verified
- Recommend creating .github/workflows/deploy.yml
- Vite configuration correctly set for GitHub Pages deployment
