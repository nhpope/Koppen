# System-Level Test Design - Koppen

**Project:** Koppen Climate Classification Visualization Tool
**Test Architect:** Murat (BMM tea agent)
**Date:** 2025-12-21
**Phase:** Solutioning (Phase 2) - Pre-Implementation Testability Review
**Architecture:** Vite 7.2.6 + Vanilla JavaScript + Leaflet.js 1.9.4 + TopoJSON 3.0.2

---

## Executive Summary

**Testability Assessment:** ✅ **READY FOR IMPLEMENTATION**

Koppen's architecture (static frontend SPA with no backend) is **highly testable**. The absence of backend complexity, combined with deterministic client-side calculations and URL-based state persistence, creates a testing-friendly environment. Key strengths include perfect controllability (no database seeding), excellent observability (all state in browser), and minimal integration complexity.

**Testing Concerns:** No critical blockers. Minor friction around TopoJSON mock data, Leaflet cleanup, and event isolation—all solvable with standard fixture patterns.

**Confidence Level:** HIGH

---

## Testability Assessment

### Controllability: ✅ PASS

**Can we control system state for testing?**

| Aspect | Assessment | Evidence |
|--------|------------|----------|
| **Data Setup** | ✅ Excellent | Static TopoJSON file → Predictable, repeatable scenarios. No database seeding required. |
| **State Management** | ✅ Excellent | URL params + SessionStorage → Easy to set initial conditions via navigation. |
| **Classification Engine** | ✅ Excellent | Client-side pure functions → Deterministic calculations with controlled inputs. |
| **Map Control** | ✅ Good | Leaflet API provides programmatic control (zoom, pan, click simulation). |
| **External Dependencies** | ✅ Minimal | Only dependency: TopoJSON file load. Easily mocked via `page.route()`. |

**Risk Score:** **LOW** (Score: 1×1 = 1)

**Key Advantages:**
- No backend → No API mocking, no auth flows, no database reset
- Static data → Same TopoJSON on every test run
- URL state → Tests can navigate to exact state via query params

**Controllability Conclusion:** Tests can trivially set up any scenario (Köppen preset, custom classification, specific zoom level, filtered view) via URL parameters or programmatic API calls.

---

### Observability: ✅ PASS

**Can we inspect system state?**

| Aspect | Assessment | Evidence |
|--------|------------|----------|
| **State Visibility** | ✅ Excellent | All state accessible: DOM, URL params, SessionStorage, Leaflet map API. |
| **Network Requests** | ✅ Excellent | Minimal (1 TopoJSON load). Easy to intercept and validate. |
| **Event Communication** | ✅ Good | Custom `koppen:*` events fire on state changes. Tests can listen and assert. |
| **Error Logging** | ✅ Good | Architecture mandates `[Koppen]` prefix on console errors. Playwright can capture. |
| **Deterministic Results** | ✅ Excellent | No random data, no async race conditions (beyond initial TopoJSON load). |

**Risk Score:** **LOW** (Score: 1×1 = 1)

**Key Advantages:**
- No hidden backend state to debug
- All mutations visible in browser DevTools
- Custom events provide clear integration points for test assertions

**Observability Conclusion:** Tests can validate all state transitions by inspecting DOM, URL, events, and Leaflet API. No black boxes.

---

### Reliability: ⚠️ CONCERNS

**Are tests isolated and reproducible?**

| Aspect | Assessment | Evidence |
|--------|------------|----------|
| **Test Isolation** | ⚠️ Needs discipline | Shared TopoJSON data, global event listeners, Leaflet instances require cleanup. |
| **Parallel Safety** | ⚠️ Requires setup | Tests must use isolated DOM containers to avoid collisions. |
| **Failure Reproducibility** | ✅ Good | Deterministic calculations → Failures repeat reliably. |
| **State Leakage** | ⚠️ Moderate risk | URL params, SessionStorage, event listeners could leak between tests. |
| **Memory Leaks** | ⚠️ Moderate risk | Leaflet map instances must call `destroy()` to prevent accumulation. |

**Risk Score:** **MEDIUM** (Score: 2×2 = 4)

**Testability Concerns:**
1. **TopoJSON mock required:** 5MB file slows E2E tests (3s load per test). Mitigation: Mock with 10-cell fixture.
2. **Leaflet cleanup discipline:** `map.remove()` must be called in `afterEach`. Mitigation: Enforce via test setup helper.
3. **Event listener cleanup:** `koppen:*` listeners must be removed. Mitigation: Use `{ once: true }` or explicit cleanup.
4. **Global CSS/DOM pollution:** BEM classes and DOM elements could conflict. Mitigation: Use unique test containers.

**Reliability Conclusion:** Architecture is reliable with proper test hygiene. No fundamental blockers—just standard cleanup patterns.

---

## Architecturally Significant Requirements (ASRs)

ASRs are quality requirements that drive architecture decisions and require special test infrastructure.

| ASR ID | Category | Requirement | Threshold | Test Challenge | Risk Score (P×I) |
|--------|----------|-------------|-----------|----------------|------------------|
| **ASR-1** | PERF | NFR1: Page Load Time | LCP < 3s on 4G | Measure real network, TopoJSON compression | 2×2 = **4 (MEDIUM)** |
| **ASR-2** | PERF | NFR4: Classification Update | Slider → map < 100ms | Profile client-side calc with ~1.6M cells | 2×3 = **6 (HIGH)** |
| **ASR-3** | DATA | NFR17: Köppen Accuracy | Match Beck et al. 2018 | Validate against reference implementation | 2×3 = **6 (HIGH)** |
| **ASR-4** | BUS | NFR8-12: Accessibility | WCAG AA partial | Automated axe-core + manual keyboard testing | 2×2 = **4 (MEDIUM)** |
| **ASR-5** | PERF | NFR3: Map Interaction | Pan/zoom < 50ms | Measure Leaflet rendering performance | 2×2 = **4 (MEDIUM)** |

### High-Priority ASRs (Score ≥ 6)

**ASR-2: Classification Update Performance (Score: 6)**

- **Risk:** User adjusts slider → map freezes for >100ms → breaks "sandbox" UX
- **Test Strategy:**
  - Unit test: Benchmark Köppen calculation for 1.6M cells
  - E2E test: Measure `performance.now()` delta from slider input to map render complete
  - Profile with Chrome DevTools to identify bottlenecks (likely GeoJSON style function)
- **Mitigation:** Consider Web Worker for heavy calculation, debounce slider input to 50ms
- **Owner:** Dev team
- **Acceptance:** All tests show < 100ms with 95th percentile < 150ms

**ASR-3: Classification Accuracy (Score: 6)**

- **Risk:** Köppen calculations don't match Beck et al. 2018 → scientific credibility lost
- **Test Strategy:**
  - Unit test: Validate against 100 reference cases from Beck paper
  - Data validation: Compare preprocessed TopoJSON against ECMWF ERA5 source
  - Edge case testing: Boundary conditions (e.g., exactly 18°C tropical threshold)
- **Mitigation:** Use reference implementation for cross-validation during preprocessing
- **Owner:** Data pipeline + Dev team
- **Acceptance:** 100% match on reference test cases, zero tolerance for misclassification

---

## Test Levels Strategy

### Recommended Test Distribution

| Test Level | % of Tests | Volume (est.) | Rationale |
|------------|------------|---------------|-----------|
| **Unit** | 40% | ~50 tests | Köppen classification engine, URL encoding, pure functions |
| **Integration** | 20% | ~25 tests | Module interactions (builder→map, export→state), event communication |
| **E2E** | 40% | ~50 tests | User journeys, map interactions, visual validation, accessibility |

**Total Estimated Test Count:** ~125 tests

### Rationale for 40/20/40 Split

This is **not** a typical 70/20/10 API-heavy split. The interactive/visual nature of Koppen justifies higher E2E percentage:

**Why 40% E2E (not 10%):**
- **Visual Output:** Map rendering, climate colors, legend display
- **Interactive UI:** Slider adjustments → real-time map updates
- **User Journeys:** Explore → Create → Compare → Export → Share
- **Accessibility:** Keyboard navigation, screen reader compatibility
- **Export Quality:** PNG generation with watermarks, URL encoding

**Why 40% Unit (not 70%):**
- **Critical Algorithm:** Köppen classification must be scientifically accurate
- **Edge Cases:** Climate boundaries (e.g., 18°C tropical threshold)
- **Pure Functions:** URL encoding/decoding, color palette logic
- **Performance:** Benchmark classification calculation speed

**Why 20% Integration (not 20%):**
- **No Backend API:** Limited integration points (no REST endpoints to test)
- **Event-Driven:** Module communication via `koppen:*` custom events
- **State Synchronization:** Builder changes → Map updates → Export reflects state

### Test Level Mapping

| Component | Unit | Integration | E2E | Rationale |
|-----------|------|-------------|-----|-----------|
| **Köppen Classification Engine** (`src/climate/`) | ✅ | ❌ | ❌ | Pure logic, no UI dependencies |
| **Builder Sliders** (`src/builder/`) | ✅ | ✅ | ✅ | Logic (unit), state sync (integration), UX (E2E) |
| **Map Rendering** (`src/map/`) | ❌ | ✅ | ✅ | Leaflet integration (not unit-testable) |
| **Export** (`src/export/`) | ✅ | ✅ | ✅ | URL encoding (unit), state (integration), PNG quality (E2E) |
| **Legend & UI** (`src/ui/`) | ❌ | ❌ | ✅ | Visual/interactive, test via E2E |

---

## NFR Testing Approach

### Security (LOW PRIORITY)

**Status:** ✅ **PASS with Caveats**

Koppen has minimal security surface (no auth, no backend, no PII). However:

| Validation | Test Approach | Risk |
|------------|---------------|------|
| **No secrets in client code** | Grep build output for patterns like `API_KEY`, `SECRET`, `.env` | MEDIUM |
| **Ko-fi link secure** | E2E test donation flow doesn't leak user data | LOW |
| **XSS prevention** | Validate user input sanitization (classification names) | LOW |

**Tools:** ESLint `no-secrets` plugin, manual code review

**Test Coverage:** 5% of total (minimal security surface)

---

### Performance (HIGH PRIORITY)

**Status:** ⚠️ **CONCERNS** - Requires active validation

| NFR | Threshold | Test Strategy | Tools | Risk |
|-----|-----------|---------------|-------|------|
| **NFR1: Page Load** | LCP < 3s on 4G | Lighthouse CI on every PR | `@lhci/cli` in GitHub Actions | MEDIUM (4) |
| **NFR4: Classification Update** | < 100ms slider→map | Playwright `performance.now()` timing | Playwright + Chrome DevTools | HIGH (6) |
| **NFR3: Map Pan/Zoom** | < 50ms interaction | Playwright interaction timing | Playwright tracing | MEDIUM (4) |

**Performance Test Example:**

```javascript
// tests/nfr/performance.spec.ts
import { test, expect } from '@playwright/test';

test('classification update completes within 100ms', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Start timing
  const startTime = await page.evaluate(() => performance.now());

  // Adjust slider (tropical minimum 18°C → 16°C)
  await page.locator('[data-slider="tropical-min"]').fill('16');

  // Wait for map update (custom event)
  await page.waitForFunction(() => window.lastClassificationComplete);

  // End timing
  const endTime = await page.evaluate(() => performance.now());
  const duration = endTime - startTime;

  // Assert under 100ms threshold
  expect(duration).toBeLessThan(100);
});

test('page load meets LCP < 3s on simulated 4G', async ({ page }) => {
  // Emulate slow 4G network
  await page.route('**/*', route => {
    return new Promise(resolve => {
      setTimeout(() => resolve(route.continue()), 300); // 300ms latency
    });
  });

  const startTime = Date.now();
  await page.goto('/');

  // Wait for LCP (Largest Contentful Paint)
  const lcpTime = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.renderTime || lastEntry.loadTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
  });

  expect(lcpTime - startTime).toBeLessThan(3000);
});
```

**Performance Budgets (enforced in CI):**
- Total JavaScript: < 200KB gzipped
- TopoJSON data: < 5MB gzipped
- Initial HTML/CSS: < 50KB
- Time to Interactive: < 4s

**Test Coverage:** 20% of total (high priority due to ASRs)

---

### Reliability (MEDIUM PRIORITY)

**Status:** ✅ **PASS** - Standard error handling

| Scenario | Test Strategy | Tools | Risk |
|----------|---------------|-------|------|
| **TopoJSON load failure** | Simulate network error → verify friendly message | Playwright `page.route()` | MEDIUM (4) |
| **Invalid URL params** | Corrupt ruleset in URL → fallback to Köppen | Unit tests with malformed JSON | LOW (3) |
| **Map rendering errors** | Inject corrupted TopoJSON → error boundary | E2E with invalid data | LOW (3) |

**Reliability Test Example:**

```javascript
// tests/nfr/reliability.spec.ts
test('graceful degradation when TopoJSON fails to load', async ({ page }) => {
  // Simulate network failure
  await page.route('**/data/climate.topojson', route => {
    route.abort('failed');
  });

  await page.goto('/');

  // Should show user-friendly error (not blank page)
  await expect(page.getByText('Unable to load climate data')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();

  // No JavaScript errors in console
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.waitForTimeout(1000); // Let errors surface
  expect(errors).toHaveLength(0);
});

test('corrupted URL params fallback to Köppen preset', () => {
  const corruptedURL = '?rules=INVALID_BASE64!!!&name=Test';
  const state = decodeURLState(corruptedURL);

  // Should fallback to Köppen, not crash
  expect(state.name).toBe('Köppen-Geiger');
  expect(state.thresholds.tropical_min).toBe(18);
});
```

**Test Coverage:** 15% of total

---

### Maintainability (MEDIUM PRIORITY)

**Status:** ✅ **PASS** - Architecture supports maintainability

| Aspect | Target | Measurement | Tools | Risk |
|--------|--------|-------------|-------|------|
| **Test Coverage** | ≥70% for classification engine | Line + branch coverage | Vitest coverage (c8/v8) | LOW (3) |
| **Code Duplication** | < 3% duplicate blocks | Copy-paste detection | ESLint `sonarjs/no-duplicate-string` | LOW (2) |
| **Pattern Consistency** | 100% adherence to BEM, event naming | Manual + automated rules | Custom ESLint rules | LOW (2) |
| **Error Logging** | All errors prefixed with `[Koppen]` | Console log validation | Playwright console listener | LOW (2) |

**Quality Gates (must pass before merge):**
1. Test coverage ≥ 70% on `src/climate/`
2. Zero ESLint errors
3. All tests pass (no skipped tests)
4. Lighthouse score ≥ 90

**Test Coverage:** 10% of total

---

## Test Environment Requirements

### Local Development

| Requirement | Tool | Configuration |
|-------------|------|---------------|
| **Unit/Integration** | Vitest 1.0+ | `vitest.config.ts` with jsdom environment |
| **E2E** | Playwright 1.40+ | `playwright.config.ts` with Chromium/Firefox/Safari |
| **Performance Profiling** | Chrome DevTools | Lighthouse CLI for local audits |

**Setup:**
```bash
npm install -D vitest @vitest/ui @playwright/test
npm install -D @axe-core/playwright # Accessibility testing
npm install -D @lhci/cli # Lighthouse CI
```

---

### CI/CD (GitHub Actions)

| Stage | Tool | Purpose |
|-------|------|---------|
| **Lint** | ESLint + TypeScript | Code quality checks |
| **Unit/Integration** | Vitest | Fast feedback (< 30s) |
| **E2E** | Playwright | Browser testing (< 5min) |
| **Performance** | Lighthouse CI | Performance budgets |
| **Accessibility** | axe-core | WCAG AA validation |

**CI Workflow:**
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3 # Upload coverage

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3 # Upload traces on failure
        if: failure()
        with:
          name: playwright-traces
          path: test-results/

  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npx lhci autorun # Lighthouse CI
```

**No Staging Environment Needed:**
- Static build → Deploy to Vercel/Netlify preview per PR
- No database, no backend config
- E2E tests run against preview deployment URL

---

## Testability Concerns (Risk Register)

| ID | Concern | Severity | Impact | Mitigation | Owner | Status |
|----|---------|----------|--------|------------|-------|--------|
| **TC-1** | TopoJSON 5MB → slow E2E | ⚠️ CONCERN | Tests take 3s to load data | Mock with 10-cell fixture via `page.route()` | QA | OPEN |
| **TC-2** | Leaflet instance cleanup | ⚠️ CONCERN | Memory leaks, DOM pollution | Enforce `map.remove()` in `afterEach` hook | QA | OPEN |
| **TC-3** | Global event listeners leak | ⚠️ CONCERN | Event handlers accumulate | Remove `koppen:*` listeners in cleanup | Dev | OPEN |
| **TC-4** | No dependency injection | 🔵 MINOR | Hard to mock Leaflet | Accept Leaflet as real dependency, test via Playwright | Dev | ACCEPTED |
| **TC-5** | 1.6M cell performance | ⚠️ CONCERN | Profiling complex | Chrome DevTools, Playwright tracing for bottlenecks | Dev | OPEN |

**No Critical Blockers Identified** ✅

---

## Recommendations for Sprint 0

### High Priority (Do First)

1. **Set up Vitest + Playwright**
   - Install dependencies: `npm install -D vitest @playwright/test`
   - Create `vitest.config.ts` and `playwright.config.ts`
   - Write one smoke test per framework to validate setup

2. **Create TopoJSON Mock Fixture**
   ```javascript
   // tests/fixtures/mock-climate-tiny.json
   {
     "type": "Topology",
     "objects": {
       "climate": {
         "type": "GeometryCollection",
         "geometries": [
           // 10 representative cells (not 1.6M!)
           { "coordinates": [0,0], "properties": { "type": "Af" } },
           { "coordinates": [40,-75], "properties": { "type": "Cfa" } },
           // ... 8 more covering main climate types
         ]
       }
     }
   }
   ```

3. **Implement Köppen Reference Test Suite**
   - Create `tests/unit/koppen-accuracy.test.ts`
   - Add 100 test cases from Beck et al. 2018 paper (Appendix A)
   - Run as part of CI (gate check for data accuracy)

4. **Set up Lighthouse CI**
   - Configure performance budgets (LCP < 3s, JS < 200KB)
   - Run on every PR to catch regressions early

---

### Medium Priority (Do During Epic 1-2)

5. **Test Cleanup Helpers**
   ```javascript
   // tests/setup.ts
   import { test as base } from '@playwright/test';

   export const test = base.extend({
     isolatedMap: async ({ page }, use) => {
       // Setup: Create isolated container
       await page.evaluate(() => {
         const container = document.createElement('div');
         container.id = `koppen-test-${Date.now()}`;
         document.body.appendChild(container);
         return container.id;
       });

       await use(page);

       // Teardown: Destroy map and remove container
       await page.evaluate(() => {
         window.map?.remove();
         document.querySelectorAll('[id^="koppen-test"]').forEach(el => el.remove());
       });
     }
   });
   ```

6. **Accessibility Test Suite**
   - Install `@axe-core/playwright`
   - Create `tests/e2e/accessibility.spec.ts`
   - Test keyboard navigation, color contrast, ARIA labels

7. **Performance Baseline**
   - Profile current implementation with Chrome DevTools
   - Document baseline metrics (before optimization)
   - Set target thresholds for NFR4 (< 100ms classification)

---

### Low Priority (Do During Epic 4-6)

8. **Visual Regression Testing** (optional)
   - Consider Playwright visual comparisons for map rendering
   - Useful for export quality validation (PNG watermarks)

9. **Contract Testing** (not applicable)
   - No backend API → Skip Pact/contract testing

10. **Load Testing** (not applicable)
    - Static frontend → No server load to test

---

## Test Coverage Targets

| Component | Unit Coverage | E2E Coverage | Notes |
|-----------|---------------|--------------|-------|
| **`src/climate/`** | ≥ 80% | N/A | Critical algorithm, high unit coverage |
| **`src/builder/`** | ≥ 50% | ≥ 90% | Logic (unit), UX (E2E) |
| **`src/map/`** | N/A | ≥ 80% | Leaflet integration, E2E only |
| **`src/export/`** | ≥ 70% | ≥ 70% | URL encoding (unit), PNG quality (E2E) |
| **`src/ui/`** | N/A | ≥ 60% | Visual components, E2E only |
| **`src/utils/`** | ≥ 80% | N/A | Pure utilities, high unit coverage |

**Overall Target:** ≥ 70% combined coverage

---

## Quality Gate Criteria (Release Readiness)

Before any production deployment, these gates must **PASS**:

| Gate | Criteria | Blocker? |
|------|----------|----------|
| **Test Pass Rate** | 100% of tests pass (no skips, no failures) | ✅ YES |
| **High-Priority ASRs** | ASR-2 (< 100ms update) and ASR-3 (100% accuracy) validated | ✅ YES |
| **Performance Budget** | Lighthouse score ≥ 90, LCP < 3s | ✅ YES |
| **Accessibility** | axe-core violations = 0 (WCAG AA partial) | ⚠️ CONCERNS OK |
| **Test Coverage** | ≥ 70% overall, ≥ 80% on `src/climate/` | ✅ YES |
| **Code Quality** | Zero ESLint errors, zero duplicate code blocks | ⚠️ CONCERNS OK |

**Release Blocked If:**
- Any test fails
- ASR-2 or ASR-3 not validated
- Lighthouse score < 90
- Coverage < 70%

---

## Next Steps (Immediate Actions)

**For Implementation Team:**

1. ✅ **Approve this test design** - Review and sign off on approach
2. ⚡ **Run `/bmad:bmm:workflows:test-framework`** - Initialize test infrastructure (Vitest + Playwright)
3. ⚡ **Create Köppen reference test suite** - Validate classification accuracy early
4. 📊 **Set up Lighthouse CI** - Catch performance regressions before they ship

**For Test Architect (Murat):**

1. Support *framework workflow execution
2. Review test quality during story implementation
3. Monitor ASR validation (especially NFR4 performance)

---

## Appendix: Test Effort Estimates

**Estimated Test Development Time:**

| Epic | Stories | Est. Test Hours | Notes |
|------|---------|-----------------|-------|
| Epic 1: Foundation | 6 | 8h | Setup, data pipeline validation |
| Epic 2: Map Exploration | 6 | 12h | E2E map interactions, Leaflet tests |
| Epic 3: Climate Profiles | 5 | 8h | UI component tests, accessibility |
| Epic 4: Classification Builder | 6 | 16h | Complex: Unit (algorithm) + E2E (sliders) |
| Epic 5: Comparison | 4 | 8h | State management, visual diff |
| Epic 6: Export & Share | 9 | 12h | PNG quality, URL encoding, Ko-fi |

**Total Test Development:** ~64 hours (~8 days for solo developer with AI assistance)

**Ratio:** ~2:1 feature dev to test dev (industry standard for high-quality projects)

---

## Document Metadata

**Version:** 1.0
**Last Updated:** 2025-12-21
**Owner:** NPope97
**Test Architect:** Murat (BMM tea agent)
**Status:** APPROVED - Ready for implementation

**Related Documents:**
- [PRD](./prd.md) - Product requirements
- [Architecture](./architecture.md) - System design
- [Epics & Stories](./epics.md) - Feature breakdown
- [Implementation Readiness Report](./implementation-readiness-report-2025-12-05.md) - Gate check results

---

**🎯 CONCLUSION: Koppen is architecturally ready for test-driven development. No critical testability blockers. Proceed with confidence.**
