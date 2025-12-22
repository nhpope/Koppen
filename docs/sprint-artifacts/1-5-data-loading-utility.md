# Story 1.5: Data Loading Utility

## Story

As a **developer**,
I want **a utility module that loads and parses the TopoJSON climate data**,
So that **other modules can access climate data consistently**.

## Status

| Field | Value |
|-------|-------|
| **Epic** | 1 - Foundation & Data Pipeline |
| **Story ID** | 1.5 |
| **Status** | review |
| **Prerequisites** | Story 1.4 |
| **Story Points** | 3 |

## Requirements Traceability

**PRD References:** `/Users/NPope97/Koppen/docs/prd.md`
- Enables all 42 functional requirements (data foundation)
- Implements NFR4 (Performance - optimized loading, caching)
- Implements NFR7 (Browser Compatibility - modern fetch API)
- Supports FR40 (Zero-friction experience - fast loading)

**Architecture References:** `/Users/NPope97/Koppen/docs/architecture.md`
- **Loading strategy:** Lines 151
  - Single file + lazy parsing
  - Client-side data access
- **Event pattern:** Lines 282-298
  - Dispatch `koppen:data-loaded` event
  - Event-driven architecture
- **Error handling:** Lines 300-312
  - User-friendly error messages
  - Graceful degradation
- **Module structure:** Lines 255-263
  - Init/destroy pattern
  - ES6 module exports

## Business Value

### User Impact
**User Type:** All end users (climate researchers, educators, students)
**Value Delivered:** Fast, reliable data access enables smooth application experience

### Success Metrics
- **Load time:** <3 seconds on 4G connection (NFR4)
- **Reliability:** 99.9% successful loads
- **Cache hit rate:** >95% on subsequent page views
- **Error recovery:** Retry succeeds on 80% of network failures

### Business Justification
- **User retention:** Fast loading prevents bounce
- **Reliability:** Caching reduces server load and costs
- **UX quality:** Smooth loading states build trust

## Acceptance Criteria

**Given** the climate.topojson file exists in `public/data/`
**When** the application initializes via `getClimateData()`
**Then** `src/utils/data-loader.js`:
- Fetches climate.topojson asynchronously (fetch API)
- Parses TopoJSON to GeoJSON features using topojson-client
- Returns Promise<GeoJSON FeatureCollection>
- Dispatches `koppen:data-loaded` custom event on completion
- Shows loading state during fetch (via `koppen:data-loading` event)
- Handles errors gracefully with user-friendly message
- Provides retry mechanism on failure

**And** data is cached in memory after first successful load
**And** subsequent calls return cached data immediately (no re-fetch)
**And** loading takes <3 seconds on 4G connection (NFR4)
**And** file not found (404) shows clear error message
**And** invalid JSON shows parse error message
**And** network failure allows retry

## Expected Outputs

**src/utils/data-loader.js (complete implementation):**
```javascript
/**
 * Data Loader Utility
 * Loads and caches Köppen climate TopoJSON data
 * @module utils/data-loader
 */

import * as topojson from 'topojson-client';

let cachedData = null;
let loadingPromise = null;
const DATA_URL = '/data/climate.topojson';

/**
 * Load and parse climate data from TopoJSON
 * Implements caching to avoid re-fetching
 *
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 * @throws {Error} If data cannot be loaded or parsed
 */
export async function getClimateData() {
  // Return cached data if available
  if (cachedData) {
    console.log('[Koppen] Returning cached climate data');
    return cachedData;
  }

  // Return existing loading promise if already fetching
  if (loadingPromise) {
    console.log('[Koppen] Data load already in progress');
    return loadingPromise;
  }

  // Start new load
  console.log('[Koppen] Loading climate data from', DATA_URL);

  // Dispatch loading event
  document.dispatchEvent(new CustomEvent('koppen:data-loading', {
    detail: { url: DATA_URL },
  }));

  loadingPromise = fetchAndParseData()
    .then(data => {
      cachedData = data;
      loadingPromise = null;

      // Dispatch loaded event
      document.dispatchEvent(new CustomEvent('koppen:data-loaded', {
        detail: {
          featureCount: data.features.length,
          loadTime: performance.now(),
        },
      }));

      console.log(`[Koppen] Climate data loaded: ${data.features.length} features`);
      return data;
    })
    .catch(error => {
      loadingPromise = null;

      // Dispatch error event
      document.dispatchEvent(new CustomEvent('koppen:data-error', {
        detail: {
          error: error.message,
          url: DATA_URL,
        },
      }));

      console.error('[Koppen] Failed to load climate data:', error);
      throw error;
    });

  return loadingPromise;
}

/**
 * Fetch and parse TopoJSON data
 * @private
 * @returns {Promise<Object>} Parsed GeoJSON FeatureCollection
 */
async function fetchAndParseData() {
  const startTime = performance.now();

  try {
    // Fetch TopoJSON file
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch climate data: ${response.status} ${response.statusText}`);
    }

    // Parse JSON
    const topoData = await response.json();

    // Convert TopoJSON to GeoJSON
    const geojson = convertTopoJSONToGeoJSON(topoData);

    const loadTime = performance.now() - startTime;
    console.log(`[Koppen] Data parsed in ${loadTime.toFixed(0)}ms`);

    return geojson;

  } catch (error) {
    // Enhanced error messages
    if (error.name === 'SyntaxError') {
      throw new Error('Climate data file is corrupted or invalid JSON');
    } else if (error.message.includes('404')) {
      throw new Error('Climate data file not found. Please ensure data pipeline has been run.');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error loading climate data. Please check your connection.');
    } else {
      throw error;
    }
  }
}

/**
 * Convert TopoJSON to GeoJSON FeatureCollection
 * @private
 * @param {Object} topoData - TopoJSON Topology object
 * @returns {Object} GeoJSON FeatureCollection
 */
function convertTopoJSONToGeoJSON(topoData) {
  // Validate TopoJSON structure
  if (!topoData || topoData.type !== 'Topology') {
    throw new Error('Invalid TopoJSON: missing type Topology');
  }

  if (!topoData.objects) {
    throw new Error('Invalid TopoJSON: missing objects');
  }

  // Get first object (assumes single FeatureCollection)
  const objectName = Object.keys(topoData.objects)[0];
  const object = topoData.objects[objectName];

  // Convert to GeoJSON
  const geojson = topojson.feature(topoData, object);

  // Validate output
  if (!geojson || geojson.type !== 'FeatureCollection') {
    throw new Error('TopoJSON conversion failed: invalid output');
  }

  if (!geojson.features || geojson.features.length === 0) {
    throw new Error('TopoJSON conversion failed: no features found');
  }

  return geojson;
}

/**
 * Retry loading data after a delay
 * @param {number} retryCount - Number of retry attempts
 * @param {number} delay - Delay in milliseconds (default: 1000)
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export async function retryLoadData(retryCount = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i < retryCount; i++) {
    try {
      console.log(`[Koppen] Retry attempt ${i + 1}/${retryCount}`);

      // Clear cache to force re-fetch
      clearCache();

      // Attempt to load
      return await getClimateData();

    } catch (error) {
      lastError = error;

      if (i < retryCount - 1) {
        console.log(`[Koppen] Retry failed, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${retryCount} retries: ${lastError.message}`);
}

/**
 * Clear cached data (useful for testing or force refresh)
 */
export function clearCache() {
  cachedData = null;
  loadingPromise = null;
  console.log('[Koppen] Data cache cleared');
}

/**
 * Check if data is cached
 * @returns {boolean}
 */
export function isDataCached() {
  return cachedData !== null;
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  return {
    cached: cachedData !== null,
    featureCount: cachedData ? cachedData.features.length : 0,
    loading: loadingPromise !== null,
  };
}

export default {
  getClimateData,
  retryLoadData,
  clearCache,
  isDataCached,
  getCacheStats,
};
```

**Usage Example (in main.js or map module):**
```javascript
import { getClimateData } from './utils/data-loader.js';

// Listen for data loaded event
document.addEventListener('koppen:data-loaded', (e) => {
  console.log(`Data loaded: ${e.detail.featureCount} features`);
});

// Listen for data loading event
document.addEventListener('koppen:data-loading', () => {
  console.log('Loading climate data...');
  // Show loading spinner
});

// Listen for data error event
document.addEventListener('koppen:data-error', (e) => {
  console.error('Data error:', e.detail.error);
  // Show error message to user
});

// Load data
try {
  const climateData = await getClimateData();
  console.log('Climate data ready:', climateData);
} catch (error) {
  console.error('Failed to load climate data:', error);
  // Show retry UI
}
```

## Error Scenarios

**Scenario 1: Climate data file not found (404)**
- **Cause:** Data pipeline not run, file deleted, or wrong path
- **Detection:** fetch() returns 404 status
- **Handling:** Throw error with clear message about running data pipeline
- **User message:** "Climate data file not found. Please ensure data pipeline has been run."

**Scenario 2: Invalid TopoJSON structure**
- **Cause:** Corrupted file, incomplete preprocessing, or wrong format
- **Detection:** TopoJSON validation fails (missing type, objects, or features)
- **Handling:** Throw error with specific validation failure
- **User message:** "Climate data file is corrupted or invalid JSON"

**Scenario 3: Network failure during fetch**
- **Cause:** No internet connection, server down, or timeout
- **Detection:** fetch() throws network error
- **Handling:** Dispatch koppen:data-error event, allow retry
- **User message:** "Network error loading climate data. Please check your connection."

**Scenario 4: JSON parse error**
- **Cause:** Corrupted file or incomplete download
- **Detection:** response.json() throws SyntaxError
- **Handling:** Catch SyntaxError and provide user-friendly message
- **User message:** "Climate data file is corrupted or invalid JSON"

**Scenario 5: Empty feature collection**
- **Cause:** Preprocessing generated empty output
- **Detection:** geojson.features.length === 0 after conversion
- **Handling:** Throw error indicating no data
- **User message:** "TopoJSON conversion failed: no features found"

## Implementation Tasks

### Task 1.5.1: Create data-loader.js module
- **Command:** `touch src/utils/data-loader.js`
- **Content:** Copy complete implementation from "Expected Outputs"
- **Verification:** `grep -q "getClimateData" src/utils/data-loader.js`
- **AC:** File exists with correct exports

### Task 1.5.2: Install topojson-client dependency
- **Command:** `npm install topojson-client@^3.1.0`
- **Verification:** `npm list topojson-client`
- **AC:** Package installed at version 3.1.0

### Task 1.5.3: Test data loading in development
- **Action:** Import and call getClimateData() in main.js
- **Verification:** Check console for "Climate data loaded" message
- **AC:** Data loads successfully, events fire

### Task 1.5.4: Verify caching works
- **Action:** Call getClimateData() twice, check console logs
- **Verification:** Second call should log "Returning cached climate data"
- **AC:** No re-fetch on subsequent calls

### Task 1.5.5: Test error handling
- **Action:** Rename climate.topojson temporarily, reload page
- **Verification:** Error message shown, koppen:data-error event fires
- **AC:** User-friendly error displayed

### Task 1.5.6: Test retry functionality
- **Action:** Disconnect network, call retryLoadData()
- **Verification:** Retry attempts logged, eventually fails or succeeds
- **AC:** Retry mechanism works as expected

### Task 1.5.7: Measure load time performance
- **Action:** Use browser DevTools Network tab to measure load time
- **Verification:** climate.topojson loads in <3 seconds on throttled 4G
- **AC:** Performance meets NFR4 requirement

## Test Requirements

### Unit Tests (Vitest)
**Test file:** `tests/unit/utils/data-loader.test.js`

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getClimateData, clearCache, isDataCached, retryLoadData } from '../../../src/utils/data-loader.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Data Loader', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  it('fetches and caches data on first call', async () => {
    const mockTopoJSON = {
      type: 'Topology',
      objects: {
        climate: {
          type: 'GeometryCollection',
          geometries: [
            {
              type: 'Point',
              coordinates: [0, 0],
              properties: { climate_type: 'Af' },
            },
          ],
        },
      },
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockTopoJSON,
    });

    const data = await getClimateData();

    expect(data).toBeDefined();
    expect(data.type).toBe('FeatureCollection');
    expect(data.features.length).toBeGreaterThan(0);
    expect(isDataCached()).toBe(true);
  });

  it('returns cached data on subsequent calls', async () => {
    const mockTopoJSON = {
      type: 'Topology',
      objects: {
        climate: {
          type: 'GeometryCollection',
          geometries: [{ type: 'Point', coordinates: [0, 0], properties: {} }],
        },
      },
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockTopoJSON,
    });

    // First call
    await getClimateData();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Second call (should use cache)
    await getClimateData();
    expect(global.fetch).toHaveBeenCalledTimes(1); // No additional fetch
  });

  it('throws error on 404', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getClimateData()).rejects.toThrow('Climate data file not found');
  });

  it('throws error on network failure', async () => {
    global.fetch.mockRejectedValue(new Error('Failed to fetch'));

    await expect(getClimateData()).rejects.toThrow('Network error');
  });

  it('throws error on invalid JSON', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });

    await expect(getClimateData()).rejects.toThrow('corrupted or invalid JSON');
  });

  it('retries on failure', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'Topology',
          objects: {
            climate: {
              type: 'GeometryCollection',
              geometries: [{ type: 'Point', coordinates: [0, 0], properties: {} }],
            },
          },
        }),
      });

    const data = await retryLoadData(3, 10);

    expect(data).toBeDefined();
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
```

### Integration Tests (Playwright)
**Test file:** `tests/e2e/data-loading.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Climate Data Loading', () => {
  test('loads climate data on page load', async ({ page }) => {
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.goto('http://localhost:5173');

    // Wait for data loaded event
    await page.waitForFunction(() => {
      return window.localStorage.getItem('dataLoaded') === 'true';
    }, { timeout: 5000 });

    // Check console messages
    const hasDataLoaded = consoleMessages.some(msg =>
      msg.includes('Climate data loaded')
    );
    expect(hasDataLoaded).toBe(true);
  });

  test('shows loading state during data fetch', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Check for loading indicator (adjust selector based on UI)
    const loadingIndicator = page.locator('.is-loading');
    await expect(loadingIndicator).toBeVisible();

    // Wait for data load
    await page.waitForTimeout(2000);

    // Loading indicator should be hidden
    await expect(loadingIndicator).not.toBeVisible();
  });

  test('handles 404 error gracefully', async ({ page }) => {
    // Intercept and fail the request
    await page.route('**/data/climate.topojson', route => {
      route.fulfill({ status: 404 });
    });

    await page.goto('http://localhost:5173');

    // Error message should be displayed
    const errorMessage = page.locator('.message--error');
    await expect(errorMessage).toContainText('not found');
  });
});
```

### Performance Tests
**Test file:** `tests/performance/data-loading.test.js`

```javascript
import { test, expect } from 'vitest';
import { getClimateData, clearCache } from '../../../src/utils/data-loader.js';

test('data loads in under 3 seconds', async () => {
  clearCache();

  const startTime = performance.now();
  await getClimateData();
  const loadTime = performance.now() - startTime;

  expect(loadTime).toBeLessThan(3000); // <3 seconds
}, { timeout: 5000 });

test('cached data returns instantly', async () => {
  // First load
  await getClimateData();

  // Second load (cached)
  const startTime = performance.now();
  await getClimateData();
  const loadTime = performance.now() - startTime;

  expect(loadTime).toBeLessThan(10); // <10ms for cached data
});
```

### Quality Gates
- ✅ Data loads successfully from public/data/climate.topojson
- ✅ TopoJSON converts to GeoJSON FeatureCollection
- ✅ `koppen:data-loaded` event fires on success
- ✅ `koppen:data-loading` event fires when loading starts
- ✅ `koppen:data-error` event fires on failure
- ✅ Caching works (no re-fetch on subsequent calls)
- ✅ Load time <3 seconds on 4G connection
- ✅ Error messages are user-friendly and actionable
- ✅ Retry mechanism works on network failures
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ All performance tests pass

## Definition of Done

- [ ] src/utils/data-loader.js created with complete implementation
- [ ] topojson-client dependency installed (version 3.1.0)
- [ ] Data loads successfully in development environment
- [ ] Caching mechanism verified (no re-fetch on second call)
- [ ] All three custom events fire correctly (loading, loaded, error)
- [ ] Error handling tested for 404, network failure, invalid JSON
- [ ] Retry functionality works as expected
- [ ] Load time <3 seconds measured on throttled 4G connection
- [ ] All unit tests written and passing
- [ ] All integration tests written and passing
- [ ] All performance tests written and passing
- [ ] Code reviewed and approved
- [ ] Story accepted by Product Owner

## Technical Notes

### Caching Strategy
- **In-memory cache:** Data stored in module-level variable
- **Single fetch guarantee:** Loading promise prevents duplicate requests
- **Cache invalidation:** Manual via clearCache() for testing/debugging

### Event-Driven Architecture (architecture.md:282-298)
Custom events enable loose coupling between modules:
- `koppen:data-loading` - Data fetch started
- `koppen:data-loaded` - Data successfully loaded and parsed
- `koppen:data-error` - Error occurred during loading

### Performance Optimization
- **Lazy parsing:** TopoJSON → GeoJSON conversion only when needed
- **Caching:** Avoid re-fetching on page navigation
- **Async loading:** Non-blocking data fetch
- **Compression:** TopoJSON provides ~5x smaller file vs GeoJSON

### References
- **PRD:** `/Users/NPope97/Koppen/docs/prd.md` (NFR4, NFR7, FR40)
- **Architecture:** `/Users/NPope97/Koppen/docs/architecture.md` (Lines 151, 282-298, 300-312, 255-263)
- **TopoJSON Client:** https://github.com/topojson/topojson-client
- **Fetch API:** https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

## Dev Agent Record

### Implementation Summary
Data loading utility implemented with support for JSON and TopoJSON formats. Handles coordinate transformation, feature parsing, and error handling.

### Files Changed
- `src/utils/data-loader.js` - Data loading and parsing utilities
- `src/utils/constants.js` - Application constants (map bounds, default center, zoom levels)

### Implementation Decisions
- **Format support**: JSON and TopoJSON climate data formats
- **Error handling**: Try-catch with user-facing error messages
- **Coordinate handling**: WGS84 coordinate system support
- **Caching**: Data cached after first load for performance
- **Feature validation**: Validates GeoJSON structure

### Tests
- Integration tests: Data loading verified via map initialization
- Error handling tests: Invalid data format handling
- Format conversion tests: TopoJSON to GeoJSON conversion

### Quality Metrics
- ✅ Data loading working correctly
- ✅ Error handling in place
- ✅ Performance optimized with caching
- ✅ Format validation working
- ✅ Integrated with map module successfully
