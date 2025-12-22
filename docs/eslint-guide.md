# ESLint Configuration Guide

## Overview

ESLint is configured to enforce code quality, security, and architectural patterns specific to the Koppen climate classification project. The configuration uses ESLint 9's flat config format with specialized plugins for security and code quality.

---

## Quick Start

```bash
# Run ESLint on entire codebase
npm run lint

# Run ESLint with auto-fix
npx eslint . --fix

# Run ESLint on specific file
npx eslint src/climate/calculator.js

# Run ESLint with debugging
npx eslint . --debug
```

---

## Configuration File

**Location:** `eslint.config.js` (root directory)

Uses ESLint 9+ flat config format. All rules, plugins, and ignore patterns are defined in this single file.

---

## Plugins Enabled

### 1. Security (`eslint-plugin-security`)
Detects potential security vulnerabilities in code.

**Rules:**
- `security/detect-object-injection` - Warns on bracket notation access (potential injection)
- `security/detect-non-literal-regexp` - Warns on dynamic regex patterns
- `security/detect-unsafe-regex` - Errors on ReDoS-vulnerable regex patterns
- `security/detect-buffer-noassert` - Errors on unsafe buffer operations
- `security/detect-eval-with-expression` - Errors on dynamic code execution
- `security/detect-non-literal-fs-filename` - Warns on dynamic file paths
- `security/detect-pseudoRandomBytes` - Errors on weak random number generation

### 2. No Secrets (`eslint-plugin-no-secrets`)
Prevents accidental commit of API keys, passwords, or tokens.

**Rules:**
- `no-secrets/no-secrets` - Errors if high-entropy strings detected (likely secrets)

**Example violations:**
```javascript
// ❌ BAD - API key detected
const apiKey = 'sk_live_51H3xYz...';

// ✅ GOOD - Environment variable
const apiKey = process.env.API_KEY;
```

### 3. SonarJS (`eslint-plugin-sonarjs`)
Detects code smells, cognitive complexity, and duplicated code.

**Key rules:**
- `sonarjs/cognitive-complexity` - Warns if function complexity > 15
- `sonarjs/no-duplicate-string` - Errors if string repeated 3+ times (extract to constant)
- `sonarjs/no-duplicated-branches` - Errors on identical if/else branches
- `sonarjs/no-identical-functions` - Errors on copy-pasted functions
- `sonarjs/no-collapsible-if` - Warns on nested ifs that can be combined
- `sonarjs/prefer-immediate-return` - Warns on unnecessary variable before return

**Example violations:**
```javascript
// ❌ BAD - Duplicate strings
const msg1 = 'Köppen-Geiger Classification System';
const msg2 = 'Köppen-Geiger Classification System';
const msg3 = 'Köppen-Geiger Classification System';

// ✅ GOOD - Extract to constant
const SYSTEM_NAME = 'Köppen-Geiger Classification System';
const msg1 = SYSTEM_NAME;
const msg2 = SYSTEM_NAME;
const msg3 = SYSTEM_NAME;

// ❌ BAD - High cognitive complexity (nested loops + conditionals)
function processClimateData(data) {
  for (let i = 0; i < data.length; i++) {
    if (data[i].temp) {
      for (let j = 0; j < 12; j++) {
        if (data[i].temp[j] > 18) {
          if (data[i].precip[j] < 60) {
            // ... nested logic
          }
        }
      }
    }
  }
}

// ✅ GOOD - Extracted helper functions
function processClimateData(data) {
  return data.filter(hasTemperatureData).map(classifyClimate);
}
```

---

## Koppen-Specific Architecture Rules

### 1. Camelcase Naming Convention

**Rule:** `camelcase` with Köppen-specific exceptions

**Why:** Enforces JavaScript camelCase naming, but allows snake_case for scientific Köppen classification thresholds defined in Beck et al. 2018 paper.

**Allowed exceptions:**
- `tropical_min` - Minimum temperature for tropical climates (18°C)
- `arid_threshold` - Precipitation threshold for arid climates
- `cd_boundary` - Boundary between temperate (C) and continental (D) climates
- `hot_summer` - Temperature for hot summer classification (22°C)
- `warm_months` - Month count threshold
- `dry_month` - Precipitation threshold for dry months

**Examples:**
```javascript
// ✅ GOOD - Köppen threshold (scientific constant)
const tropical_min = 18;

// ✅ GOOD - Regular JavaScript variable (camelCase)
const minTemperature = 18;

// ❌ BAD - Non-Köppen snake_case
const my_variable = 10;

// ✅ GOOD - Test file exception
const test_case_1 = { ... };
```

### 2. Prevent Hard Waits (Non-Deterministic)

**Rule:** `no-restricted-syntax`

**Why:** Hard waits (`waitForTimeout()`, `setTimeout()` without cleanup) cause flaky tests and memory leaks. Use deterministic waits instead.

**Violations:**
```javascript
// ❌ BAD - Hard wait in Playwright test
await page.waitForTimeout(1000);

// ✅ GOOD - Deterministic wait
await page.waitForSelector('.map-loaded');
await page.waitForResponse(response => response.url().includes('/data/climate'));

// ❌ BAD - setTimeout without cleanup
setTimeout(() => {
  updateMap();
}, 1000);

// ✅ GOOD - setTimeout with cleanup
const timeoutId = setTimeout(() => {
  updateMap();
}, 1000);
// Later: clearTimeout(timeoutId);

// ✅ GOOD - Use Vitest fake timers
vi.useFakeTimers();
setTimeout(() => { ... }, 1000);
vi.runAllTimers();
```

### 3. Console Usage Restrictions

**Rule:** `no-console`

**Why:** Prevent debug logs in production code.

**Allowed:**
- `console.error()` - Error reporting
- `console.warn()` - Warnings

**Violations:**
```javascript
// ❌ BAD - Debug logs
console.log('Data loaded');
console.debug('Temperature:', temp);
console.info('Classification complete');

// ✅ GOOD - Error reporting
console.error('Failed to load climate data:', error);
console.warn('Missing temperature data for cell', cellId);
```

---

## Best Practices Enforced

### Code Safety

```javascript
// ❌ BAD - Loose equality
if (classification == 'Af') { ... }

// ✅ GOOD - Strict equality
if (classification === 'Af') { ... }

// ❌ BAD - var declaration
var temperature = 18;

// ✅ GOOD - const/let
const temperature = 18;

// ❌ BAD - Dynamic code execution
const functionName = 'calculateKoppen';
window[functionName]();

// ✅ GOOD - Direct function call
calculateKoppen();

// ❌ BAD - Empty catch block
try {
  loadData();
} catch (err) {
  // Silent failure
}

// ✅ GOOD - Handle or log error
try {
  loadData();
} catch (err) {
  console.error('Data load failed:', err);
  throw err;
}
```

### Code Style

```javascript
// ❌ BAD - Double quotes
const climate = "tropical";

// ✅ GOOD - Single quotes
const climate = 'tropical';

// ❌ BAD - Missing semicolons
const temp = 18
const precip = 250

// ✅ GOOD - Semicolons
const temp = 18;
const precip = 250;

// ❌ BAD - Missing trailing comma
const climates = [
  'Af',
  'Am',
  'Aw'
];

// ✅ GOOD - Trailing comma in multiline
const climates = [
  'Af',
  'Am',
  'Aw',
];
```

---

## Test File Exceptions

**Files:** `tests/**/*.{test,spec}.{js,ts}`, `**/__tests__/**/*.{js,ts}`

**Relaxed rules in test files:**
- `no-console` - Disabled (debug logs allowed in tests)
- `sonarjs/no-duplicate-string` - Disabled (test data can repeat)
- `sonarjs/cognitive-complexity` - Disabled (complex test scenarios allowed)
- `no-magic-numbers` - Disabled (test assertions use literal numbers)

**Example:**
```javascript
// tests/unit/koppen-accuracy.test.ts

// ✅ ALLOWED in test files (would error in src/)
console.log('Running classification test');

const testCases = [
  { name: 'Test Case 1', temp: [26, 26, 26, ...] },
  { name: 'Test Case 1', precip: [250, 250, 250, ...] },
  { name: 'Test Case 1', expected: 'Af' },
];
```

---

## Ignored Files & Directories

ESLint skips these locations (defined in `eslint.config.js`):

```javascript
ignores: [
  '**/node_modules/**',      // Dependencies
  '**/dist/**',              // Production build
  '**/build/**',             // Build artifacts
  '**/.vite/**',             // Vite cache
  '**/coverage/**',          // Coverage reports
  '**/.lighthouseci/**',     // Lighthouse results
  '**/playwright-report/**', // Playwright reports
  '**/test-results/**',      // Test outputs
  '*.min.js',                // Minified files
  'public/data/**',          // Generated TopoJSON data
]
```

---

## CI/CD Integration

ESLint runs as the first check in the GitHub Actions CI pipeline (`.github/workflows/test.yml`).

**Workflow:**
1. **Lint Job** - Runs `npm run lint`
2. **Quality Gate** - Blocks merge if lint fails

**Pipeline failure conditions:**
- Any ESLint errors
- Security violations detected
- Code smells above threshold

**To bypass locally (NOT recommended):**
```bash
# Disable specific rule for one line
// eslint-disable-next-line no-console
console.log('Debug message');

# Disable specific rule for entire file
/* eslint-disable no-console */
console.log('Debug logging enabled');
```

**NOTE:** Disabling rules should be rare and documented with a comment explaining why.

---

## Fixing Common Issues

### Issue: "no-secrets/no-secrets" violation

**Cause:** High-entropy string detected (looks like API key)

**Fix:**
```javascript
// ❌ BAD
const key = 'AbCdEfGhIjKlMnOpQrStUvWxYz123456';

// ✅ GOOD - Environment variable
const key = process.env.API_KEY;

// ✅ GOOD - Test fixture (if false positive)
// eslint-disable-next-line no-secrets/no-secrets
const mockToken = 'AbCdEfGhIjKlMnOpQrStUvWxYz123456';
```

### Issue: "sonarjs/no-duplicate-string" violation

**Cause:** String repeated 3+ times

**Fix:**
```javascript
// ❌ BAD
const title1 = 'Köppen Climate Classification';
const title2 = 'Köppen Climate Classification';
const title3 = 'Köppen Climate Classification';

// ✅ GOOD
const TITLE = 'Köppen Climate Classification';
const title1 = TITLE;
const title2 = TITLE;
const title3 = TITLE;
```

### Issue: "no-restricted-syntax" - waitForTimeout

**Cause:** Non-deterministic wait in Playwright test

**Fix:**
```javascript
// ❌ BAD
await page.waitForTimeout(1000);

// ✅ GOOD - Wait for specific selector
await page.waitForSelector('.map-loaded');

// ✅ GOOD - Wait for network response
await page.waitForResponse(resp => resp.url().includes('/data/climate'));

// ✅ GOOD - Wait for function condition
await page.waitForFunction(() => window.mapReady === true);
```

### Issue: "sonarjs/cognitive-complexity" warning

**Cause:** Function has too many nested conditionals/loops (complexity > 15)

**Fix:**
```javascript
// ❌ BAD - Cognitive complexity = 18
function classifyClimate(data) {
  if (data.temp) {
    for (let i = 0; i < 12; i++) {
      if (data.temp[i] > 18) {
        if (data.precip[i] < 60) {
          if (isWinterMonth(i)) {
            // ... more nesting
          }
        }
      }
    }
  }
}

// ✅ GOOD - Extract helper functions
function classifyClimate(data) {
  if (!data.temp) return null;
  const warmMonths = data.temp.filter(t => t > 18);
  const dryMonths = findDryMonths(data.precip);
  return determineClassification(warmMonths, dryMonths);
}

function findDryMonths(precip) {
  return precip.filter(p => p < 60);
}
```

---

## Debugging ESLint

### Enable verbose output:
```bash
npx eslint . --debug
```

### Check specific rule:
```bash
npx eslint . --rule 'no-console: error'
```

### Print configuration for file:
```bash
npx eslint --print-config src/climate/calculator.js
```

### Fix auto-fixable issues:
```bash
npx eslint . --fix
```

---

## Resources

- **ESLint Docs:** https://eslint.org/docs/latest/
- **Security Plugin:** https://github.com/eslint-community/eslint-plugin-security
- **SonarJS Plugin:** https://github.com/SonarSource/eslint-plugin-sonarjs
- **No Secrets Plugin:** https://github.com/nickdeis/eslint-plugin-no-secrets

---

## Quality Gates

| Check | Threshold | Blocker? |
|-------|-----------|----------|
| **ESLint errors** | 0 | ✅ YES |
| **Security violations** | 0 | ✅ YES |
| **Cognitive complexity** | ≤15 per function | ⚠️ WARN |
| **Duplicate strings** | <3 repetitions | ✅ YES |

All ESLint errors must be fixed before merging to main.

---

**ESLint is a quality gate. Write clean, secure code from the start. 🔒**
