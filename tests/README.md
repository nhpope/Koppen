# Koppen Test Suite

Complete test infrastructure for the Koppen climate classification visualization tool.

## 🎯 Overview

This test suite implements the test strategy defined in `docs/test-design-system.md`:
- **40% Unit Tests** - Köppen algorithm, utilities, pure functions
- **20% Integration Tests** - Module interactions, event communication
- **40% E2E Tests** - User journeys, map interactions, accessibility

**Target Coverage:** ≥70% overall, ≥80% on `src/climate/`

---

## 🚀 Quick Start

```bash
# Install Playwright browsers (first time only)
npm run playwright:install

# Run all tests
npm test

# Run tests in watch mode
npm run test:unit:watch

# Run E2E tests with UI
npm run test:e2e:ui

# Run with coverage report
npm run test:coverage
```

---

## 📁 Directory Structure

```
tests/
├── unit/                    # Vitest unit tests
│   ├── koppen-accuracy.test.ts   # Köppen reference test suite (30+ cases)
│   └── smoke.test.ts              # Vitest setup validation
│
├── integration/             # Vitest integration tests
│   └── (module interaction tests)
│
├── e2e/                     # Playwright E2E tests
│   ├── helpers.ts                 # Test fixtures and utilities
│   ├── smoke.spec.ts              # Playwright setup validation
│   └── accessibility.spec.ts      # WCAG AA compliance tests
│
├── fixtures/                # Test data
│   └── mock-climate-tiny.json     # 10-cell TopoJSON for fast E2E
│
├── setup.ts                 # Vitest global setup
└── README.md                # This file
```

---

## 🧪 Test Types

### Unit Tests (Vitest)

**What:** Pure functions, business logic, algorithms
**Tool:** Vitest with jsdom
**Coverage Target:** ≥80% for `src/climate/`

```bash
npm run test:unit           # Run once
npm run test:unit:watch     # Watch mode
npm run test:unit:ui        # UI mode
```

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { calculateKoppen } from '@/climate/calculator';

describe('Köppen Classification', () => {
  it('should classify Af (Tropical Rainforest)', () => {
    const result = calculateKoppen({
      temp: [26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26],
      precip: [250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250],
    });
    expect(result).toBe('Af');
  });
});
```

---

### Integration Tests (Vitest)

**What:** Module interactions, event communication
**Tool:** Vitest with jsdom
**Coverage Target:** ≥70%

```bash
npm run test:unit  # Integration tests run with unit tests
```

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import map from '@/map';
import builder from '@/builder';

describe('Builder → Map Integration', () => {
  it('should update map when threshold changes', () => {
    const container = document.createElement('div');
    map.init(container);

    builder.setThreshold('tropical_min', 16);

    // Should fire koppen:classification-changed event
    // Map should re-render
  });
});
```

---

### E2E Tests (Playwright)

**What:** User journeys, UI interactions, accessibility
**Tool:** Playwright
**Browsers:** Chromium, Firefox, WebKit
**Coverage Target:** Critical user paths

```bash
npm run test:e2e            # Run all browsers
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:debug      # Debug mode with inspector
npm run test:a11y           # Accessibility tests only
```

**Example:**
```typescript
import { test, expect } from './helpers';

test('user can filter map to single climate type', async ({ page, mockClimateData }) => {
  await page.goto('/');

  // Click legend item
  await page.locator('.legend__item[data-type="Csb"]').click();

  // Map should show only Csb regions
  const activeClimate = await page.locator('.legend__item--active').textContent();
  expect(activeClimate).toContain('Csb');
});
```

---

## 🎨 Test Fixtures & Helpers

### TopoJSON Mock Fixture

**File:** `tests/fixtures/mock-climate-tiny.json`
**Purpose:** Fast E2E tests without 5MB data load
**Contents:** 10 representative climate cells

```typescript
import { test } from './helpers';

test('use mock data', async ({ mockClimateData, page }) => {
  // Automatically intercepts /data/climate.topojson
  await page.goto('/');
  // Test runs with 10 cells instead of 1.6M
});
```

### Isolated Map Fixture

**Purpose:** Clean Leaflet map instance per test
**Cleanup:** Automatic `map.remove()` and DOM cleanup

```typescript
import { test } from './helpers';

test('use isolated map', async ({ isolatedMap, page }) => {
  await page.goto('/');
  // Map instance cleaned up automatically after test
});
```

### Helper Functions

```typescript
import { waitForKoppenEvent, measurePerformance } from './helpers';

// Wait for custom events
const detail = await waitForKoppenEvent(page, 'koppen:data-loaded');

// Measure performance
const duration = await measurePerformance(page, async () => {
  await page.locator('[data-slider="tropical-min"]').fill('16');
});
expect(duration).toBeLessThan(100); // NFR4: <100ms
```

---

## 🎯 Critical Test Suites

### 1. Köppen Reference Test Suite

**File:** `tests/unit/koppen-accuracy.test.ts`
**Priority:** HIGH (ASR-3)
**Cases:** 30+ reference test cases from Beck et al. 2018
**Coverage:** All climate groups (A, B, C, D, E) + edge cases

```bash
npm run test:unit -- tests/unit/koppen-accuracy.test.ts
```

**Validates:**
- Tropical climates (Af, Am, Aw, As)
- Dry climates (BWh, BWk, BSh, BSk)
- Temperate climates (Csa, Csb, Cfa, Cfb, Cwa, Cwb)
- Continental climates (Dfa, Dfb, Dfc, Dfd, Dwa, Dwb, Dwc, Dwd)
- Polar climates (ET, EF)
- Boundary conditions (18°C, 0°C, 22°C, 10°C)

### 2. Accessibility Test Suite

**File:** `tests/e2e/accessibility.spec.ts`
**Priority:** MEDIUM (NFR8-12)
**Tool:** @axe-core/playwright
**Standard:** WCAG 2.1 AA (partial)

```bash
npm run test:a11y
```

**Validates:**
- Zero axe-core violations
- Keyboard navigation (Tab, Enter, Arrow keys)
- Color contrast ≥ 4.5:1
- ARIA labels on interactive elements
- Focus indicators visible
- Screen reader announcements

### 3. Performance Tests

**File:** `.lighthouserc.js`
**Priority:** HIGH (NFR1, NFR4)
**Tool:** Lighthouse CI

```bash
npm run test:lighthouse
```

**Thresholds:**
- Lighthouse score ≥ 90
- LCP < 3s (NFR1)
- FCP < 2s
- JavaScript < 200KB
- Total size < 5MB

---

## 🔧 Configuration Files

### Vitest Config

**File:** `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      thresholds: {
        lines: 70,
        'src/climate/**': { lines: 80 },
      }
    }
  }
});
```

### Playwright Config

**File:** `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90 * 1000,  // 90s per test
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
  ],
});
```

### Lighthouse Config

**File:** `.lighthouserc.js`

Performance budgets enforced:
- LCP < 3000ms
- JavaScript < 200KB
- Lighthouse score ≥ 90

---

## 🤖 CI/CD Integration

**Workflow:** `.github/workflows/test.yml`

**Jobs:**
1. **Lint** - ESLint + TypeScript
2. **Unit** - Vitest with coverage → Codecov
3. **E2E** - Playwright (Chromium, Firefox, WebKit)
4. **Performance** - Lighthouse CI
5. **Accessibility** - axe-core
6. **Quality Gate** - All must pass

**Artifacts:**
- Coverage reports → Codecov
- Playwright traces (on failure)
- Lighthouse results
- Accessibility violations

---

## 📊 Quality Gates

Tests must pass before merging to main:

| Gate | Threshold | Blocker? |
|------|-----------|----------|
| **All tests pass** | 100% | ✅ YES |
| **Köppen accuracy** | 100% on reference cases | ✅ YES |
| **Performance** | Lighthouse ≥ 90, LCP < 3s | ✅ YES |
| **Coverage** | ≥70% overall, ≥80% climate | ✅ YES |
| **Accessibility** | 0 axe violations (critical) | ⚠️ WARN |

---

## 🐛 Debugging Tests

### Vitest

```bash
# Run specific test file
npm run test:unit tests/unit/koppen-accuracy.test.ts

# Run tests matching pattern
npm run test:unit -- -t "tropical"

# UI mode (interactive debugging)
npm run test:unit:ui
```

### Playwright

```bash
# Debug mode (opens inspector)
npm run test:e2e:debug

# Run specific test
npx playwright test tests/e2e/accessibility.spec.ts

# Show trace viewer
npx playwright show-trace test-results/trace.zip

# Headed mode (see browser)
npx playwright test --headed
```

### Lighthouse

```bash
# Run locally
npm run build
npm run test:lighthouse

# View results
open .lighthouseci/lhr-*.html
```

---

## 📝 Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup (runs before each test)
  });

  it('should do something specific', () => {
    // Arrange
    const input = createTestData();

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from './helpers';

test.describe('Feature Name', () => {
  test('should allow user to...', async ({ page, mockClimateData }) => {
    // Navigate
    await page.goto('/');

    // Interact
    await page.locator('.some-button').click();

    // Assert
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

---

## 🚨 Common Issues

### Issue: Playwright browsers not installed

```bash
npm run playwright:install
```

### Issue: Tests timeout on slow machine

Edit `playwright.config.ts`:
```typescript
timeout: 120 * 1000,  // Increase to 2 minutes
```

### Issue: Coverage not generated

```bash
npm run test:coverage
```

Check `coverage/` directory for reports.

### Issue: Lighthouse fails with network error

Ensure production build exists:
```bash
npm run build
npm run preview  # Verify preview server works
```

---

## 📚 Resources

- **Test Design:** `docs/test-design-system.md`
- **Vitest Docs:** https://vitest.dev
- **Playwright Docs:** https://playwright.dev
- **Lighthouse CI:** https://github.com/GoogleChrome/lighthouse-ci
- **axe-core:** https://github.com/dequelabs/axe-core

---

## ✅ Next Steps

1. **Verify setup:** Run `npm test` to validate framework
2. **Implement Köppen engine:** Write `src/climate/calculator.ts`
3. **Add tests incrementally:** One story → tests → implementation
4. **Monitor coverage:** Run `npm run test:coverage` regularly
5. **Fix failing tests:** All tests must pass before merge

---

**Test coverage is a quality gate. Write tests first, then implement features. 🧪**
