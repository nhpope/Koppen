# Epic 4 Implementation Patterns - Reference Guide

**Date:** 2025-12-22
**Based on:** Completed Epic 2 & 3 stories + Epic 4 implementations
**Purpose:** Establish consistency patterns for Epic 6 stories

---

## 1. Event Naming Patterns

### Namespace: `koppen:*`
All custom events use the `koppen:` prefix to avoid conflicts.

**Common Event Names:**
```javascript
// Core lifecycle
document.dispatchEvent(new CustomEvent('koppen:ready'));
document.dispatchEvent(new CustomEvent('koppen:map-ready', { detail: { map } }));
document.dispatchEvent(new CustomEvent('koppen:data-loaded', { detail: { features } }));

// Feature interactions
document.dispatchEvent(new CustomEvent('koppen:climate-selected', { detail: { type, fromMap } }));
document.dispatchEvent(new CustomEvent('koppen:cell-selected', { detail: { type, name, lat, lng, data } }));
document.dispatchEvent(new CustomEvent('koppen:legend-item-click', { detail: { type } }));

// Builder events
document.dispatchEvent(new CustomEvent('koppen:toggle-builder'));
document.dispatchEvent(new CustomEvent('koppen:builder-opened'));
document.dispatchEvent(new CustomEvent('koppen:builder-closed'));
document.dispatchEvent(new CustomEvent('koppen:threshold-changed', { detail: { key, category, value, unit, thresholds } }));
document.dispatchEvent(new CustomEvent('koppen:classification-changed', { detail: { features, stats } }));
document.dispatchEvent(new CustomEvent('koppen:classification-updated', { detail: { count } }));

// Panel management
document.dispatchEvent(new CustomEvent('koppen:close-panels', { detail: { except: 'builder' } }));
document.dispatchEvent(new CustomEvent('koppen:show-about'));
document.dispatchEvent(new CustomEvent('koppen:navigate-to', { detail: { lat, lng, zoom } }));
```

**Pattern:** Event names are kebab-case, detail objects are nested with relevant data.

---

## 2. Module Structure Pattern

### Export Default Pattern
Every module exports a default object with standard lifecycle methods:

```javascript
export default {
  /**
   * Initialize the module
   * @param {Object} options - Configuration options
   */
  init(options = {}) {
    // Setup DOM references
    // Create event listeners
    // Initialize state
    console.log('[Koppen] Module initialized');
  },

  /**
   * Render or display module UI
   */
  render() {
    // Create and display DOM elements
    // Update existing content
  },

  /**
   * Get module state or data
   */
  getValue() {
    // Return current state
  },

  /**
   * Cleanup and teardown
   */
  destroy() {
    // Remove event listeners
    // Clear DOM references
    // Reset state
    console.log('[Koppen] Module destroyed');
  }
};
```

### Example: Builder Module (src/builder/index.js)
```javascript
export default {
  init(_options = {}) {
    builderPanel = document.getElementById('builder-panel');
    setupEventListeners();
    render();
  },
  open,
  close,
  toggle,
  isOpen() { return isOpen; },
  destroy() { /* cleanup */ }
};
```

### File Organization in src/builder/
```
src/builder/
├── index.js                      # Main module, panel UI lifecycle
├── preset-loader.js              # Load Köppen and scratch presets
├── threshold-sliders.js           # Slider component and state management
├── comparison.js                  # Comparison mode tabs and difference logic
├── difference-highlighter.js      # Highlighting changed regions
└── side-by-side.js               # Split-screen comparison view
```

**Pattern:** Main module (index.js) handles lifecycle and panel state. Sub-modules handle specific features. Each exports `{ init, destroy, render }` or relevant functions.

---

## 3. Event Listener Management

### Event Listener Tracking (Important!)
Always track event listeners for proper cleanup in `destroy()`:

```javascript
let eventListeners = [];

function setupEventListeners() {
  const toggleHandler = () => toggle();
  document.addEventListener('koppen:toggle-builder', toggleHandler);
  eventListeners.push({ event: 'koppen:toggle-builder', handler: toggleHandler });

  const closeHandler = (e) => {
    if (e.detail?.except !== 'builder') close();
  };
  document.addEventListener('koppen:close-panels', closeHandler);
  eventListeners.push({ event: 'koppen:close-panels', handler: closeHandler });
}

function destroy() {
  // Remove all tracked listeners
  eventListeners.forEach(({ event, handler }) => {
    document.removeEventListener(event, handler);
  });
  eventListeners = [];

  // Clear state
  builderPanel = null;
  isOpen = false;
}
```

**Why:** Prevents memory leaks and makes cleanup explicit.

---

## 4. CSS/Styling Patterns

### BEM Naming Convention
All CSS classes follow BEM (Block-Element-Modifier):

```css
/* Block */
.builder-panel { }

/* Element */
.builder-panel__header { }
.builder-panel__title { }
.builder-panel__option { }

/* Modifier */
.builder-panel--active { }
.builder-panel__option--primary { }
.legend__item--active { }

/* Nested modifiers */
.threshold-slider__indicator--decreased { }
.threshold-slider__indicator--increased { }
```

### CSS Custom Properties (Design Tokens)
All colors, spacing, and transitions use CSS variables from `:root`:

```css
:root {
  /* Colors */
  --color-primary: #2563eb;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Spacing (4px base unit) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;

  /* Component sizes */
  --builder-panel-width: 360px;
  --legend-width: 280px;
  --info-panel-width: 320px;
}
```

**Use in components:**
```css
.builder-panel {
  width: var(--builder-panel-width);
  background: var(--color-surface);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  transition: transform var(--transition-normal);
}

.threshold-slider {
  margin-bottom: var(--space-4);
  padding: var(--space-3);
}
```

### Layout Patterns
```css
/* Flex for alignment */
.builder-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Grid for organized layout */
.threshold-sliders {
  display: grid;
  gap: var(--space-4);
}

/* Slide-in panels */
.builder-panel {
  position: fixed;
  left: 0;
  top: var(--header-height);
  width: var(--builder-panel-width);
  height: calc(100vh - var(--header-height));
  transform: translateX(-100%);
  transition: transform var(--transition-normal);
}

.builder-panel--active {
  transform: translateX(0);
}
```

---

## 5. File Naming & Organization Patterns

### Filename Conventions
```
index.js              # Main module export, lifecycle management
[feature]-[action].js # Feature-specific file (e.g., threshold-sliders.js)
```

### Export Patterns
```javascript
// File: src/builder/threshold-sliders.js
export default {
  init(preset, onChange) { },
  render(preset) { },
  reset(preset) { },
  getAllValues() { },
  destroy() { }
};

// Usage in index.js
import thresholdSliders from './threshold-sliders.js';

function init() {
  thresholdSliders.init(preset);
}
```

### Organizing Related Features
```
src/builder/
├── index.js                      # Main entry, init/destroy/toggle
├── preset-loader.js              # Preset loading logic
├── threshold-sliders.js           # Slider component
├── comparison.js                  # Comparison mode
└── difference-highlighter.js      # Highlight changed regions
```

Each sub-module is independently testable with its own `init()` and `destroy()`.

---

## 6. Testing Patterns

### Test File Location & Naming
```
tests/unit/builder/builder.test.ts
tests/unit/builder/threshold-sliders-modifications.test.ts
tests/unit/builder/difference-highlighter.test.ts
tests/unit/builder/comparison.test.ts
```

### Test Structure (Vitest)
```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import builderModule from '../../../src/builder/index.js';

describe('Builder Module', () => {
  let builderPanel: HTMLElement;

  beforeEach(() => {
    // Setup DOM with createElement (safe, isolates tests)
    const app = document.createElement('div');
    app.id = 'app';

    const panel = document.createElement('div');
    panel.id = 'builder-panel';
    panel.setAttribute('aria-hidden', 'true');

    app.appendChild(panel);
    document.body.appendChild(app);

    builderPanel = panel;

    // Initialize module
    builderModule.init();
  });

  afterEach(() => {
    // Cleanup in reverse order
    builderModule.destroy();
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  describe('Initialization', () => {
    it('should initialize with builder panel', () => {
      expect(builderPanel).toBeDefined();
      expect(builderPanel.getAttribute('aria-hidden')).toBe('true');
    });

    it('should render header with title and close button', () => {
      const title = builderPanel.querySelector('.builder-panel__title');
      expect(title?.textContent).toBe('Create Classification');
    });
  });

  describe('Opening and Closing', () => {
    it('should open panel when toggle event fired', () => {
      expect(builderModule.isOpen()).toBe(false);

      document.dispatchEvent(new CustomEvent('koppen:toggle-builder'));

      expect(builderModule.isOpen()).toBe(true);
      expect(builderPanel.classList.contains('builder-panel--active')).toBe(true);
    });
  });
});
```

### Key Testing Patterns
1. **Setup/Teardown:** Create DOM elements in beforeEach, cleanup in afterEach
2. **Custom Events:** Use `document.dispatchEvent(new CustomEvent('koppen:*'))` to trigger behaviors
3. **DOM Queries:** Use `querySelector` with BEM class names to verify rendering
4. **State Checks:** Test module state with exported getter methods (`isOpen()`, `getValue()`)
5. **Event Verification:** Check that events are fired with correct detail data

---

## 7. State Management Patterns

### Module-Level State
```javascript
// Private module state (closure pattern)
let thresholds = {};
let originalPreset = null;
let isOpen = false;
let eventListeners = [];

// Controlled access
export default {
  init(preset) {
    thresholds = preset.thresholds;
    originalPreset = JSON.parse(JSON.stringify(preset)); // Deep clone
  },

  getAllValues() {
    return { ...thresholds }; // Return copy, not reference
  },

  destroy() {
    thresholds = {};
    originalPreset = null;
  }
};
```

### Event-Driven State Updates
```javascript
// Listen for changes
document.addEventListener('koppen:threshold-changed', (e) => {
  // Update internal state
  thresholds[e.detail.category][e.detail.key].value = e.detail.value;

  // Fire parent event for other modules
  document.dispatchEvent(new CustomEvent('koppen:reclassify', {
    detail: { thresholds: getAllValues() }
  }));
});
```

---

## 8. Logging Patterns

### Console Logging Style
Use `[Koppen]` prefix for all console messages:

```javascript
console.log('[Koppen] Map initialized');
console.error('[Koppen] Failed to load climate data:', error);
console.warn('[Threshold] Modification indicator elements not found for:', key);
```

### Debug Logging Levels
```javascript
// Info - lifecycle events
console.log('[Koppen] Application initialized successfully');

// Warn - recoverable issues
console.warn('[Threshold] Element not found, skipping update');

// Error - failures
console.error('[Koppen] Failed to initialize:', error);
```

---

## 9. Accessibility Patterns

### ARIA Attributes
```javascript
// Buttons with aria-label
closeBtn.setAttribute('aria-label', 'Close builder');

// Input with aria-label and aria-valuetext
rangeInput.setAttribute('aria-label', 'Tropical minimum temperature');
rangeInput.setAttribute('aria-valuemin', -10);
rangeInput.setAttribute('aria-valuemax', 25);
rangeInput.setAttribute('aria-valuenow', 18);
rangeInput.setAttribute('aria-valuetext', '18°C');

// Status messages with aria-live
const status = document.createElement('div');
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
status.textContent = 'Loading...';

// Toggle states
button.setAttribute('aria-expanded', 'true');
button.setAttribute('aria-pressed', 'true');
```

### Keyboard Navigation
```javascript
// Escape closes panels
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isOpen) close();
});

// Enter/Space on buttons
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    const item = e.target.closest('.legend__item');
    if (item) {
      e.preventDefault();
      item.click();
    }
  }
});
```

### Focus Management
```javascript
// Focus trap within modal
function trapFocus() {
  const focusable = panel.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length > 0) {
    focusable[0].focus();
  }
}

// Return focus on close
function releaseFocus() {
  const createBtn = document.getElementById('create-btn');
  if (createBtn) createBtn.focus();
}
```

---

## 10. DOM Manipulation Patterns

### Safe DOM Clearing
```javascript
// Instead of innerHTML = '' (can leak)
while (container.firstChild) {
  container.removeChild(container.firstChild);
}

// Then append new elements
container.appendChild(newElement);
```

### Creating Elements with Classes
```javascript
// Instead of innerHTML (avoids XSS risks with user data)
const container = document.createElement('div');
container.className = 'threshold-slider';
container.dataset.thresholdKey = key;

const label = document.createElement('label');
label.className = 'threshold-slider__label';
label.htmlFor = `threshold-${key}`;
label.textContent = config.description; // Safe for user text

container.appendChild(label);
```

---

## 11. Performance & Debouncing

### Debounce Pattern
```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage
const debouncedUpdate = debounce((value) => {
  handleThresholdChange(key, value, category, config);
}, 50);

rangeInput.addEventListener('input', (e) => {
  debouncedUpdate(parseFloat(e.target.value));
});
```

### Debounced Events
```javascript
// Debounce event firing to avoid flooding
const updateModificationSummary = debounce(() => {
  const summary = getModificationSummary();
  document.dispatchEvent(
    new CustomEvent('koppen:modification-summary-changed', {
      detail: summary,
    })
  );
}, 100);
```

---

## 12. Error Handling Pattern

### Try-Catch with User Feedback
```javascript
async function startFromKoppen() {
  try {
    renderLoadingState('Loading Köppen preset...');
    const preset = await presetLoader.loadKoppenPreset();
    // ... setup
  } catch (error) {
    renderError({
      message: 'Failed to load Köppen preset',
      error: error.message,
      actions: [
        { label: 'Retry', handler: () => startFromKoppen() },
        { label: 'Start from Scratch', handler: () => startFromScratch() },
      ],
    });
  }
}

// Error rendering helper
function renderError({ message, error, actions }) {
  const container = document.createElement('div');
  container.className = 'builder-panel__error';

  const heading = document.createElement('h3');
  heading.textContent = message;
  container.appendChild(heading);

  // Add action buttons
  if (actions?.length > 0) {
    actions.forEach(({ label, handler }) => {
      const button = document.createElement('button');
      button.textContent = label;
      button.addEventListener('click', handler);
      container.appendChild(button);
    });
  }

  return container;
}
```

---

## 13. Module Initialization Order

### In main.js
```javascript
async function initializeApp() {
  try {
    // Initialize in dependency order
    app.modules.utils = UtilsModule;
    app.modules.utils.init();

    app.modules.map = MapModule;
    await app.modules.map.init('map-container'); // Async - waits for data

    app.modules.climate = ClimateModule;
    app.modules.climate.init();

    app.modules.ui = UIModule;
    app.modules.ui.init();

    app.modules.builder = BuilderModule;
    app.modules.builder.init();

    app.modules.export = ExportModule;
    app.modules.export.init();

    setupEventListeners(); // Global cross-module listeners
    await restoreFromURL();

    app.initialized = true;
    document.dispatchEvent(new CustomEvent('koppen:ready'));
  } catch (error) {
    console.error('[Koppen] Failed to initialize:', error);
    showError('Failed to initialize application');
  }
}
```

---

## 14. Data Cloning Pattern (Important!)

### Deep Clone for Presets
```javascript
// Always deep clone when storing originals for comparison
originalPreset = JSON.parse(JSON.stringify(preset));

// When resetting
function resetThreshold(key, category) {
  if (!originalPreset) return;

  const originalValue = originalPreset.thresholds?.[category]?.[key]?.value;
  if (originalValue !== undefined) {
    thresholds[category][key].value = originalValue;
  }
}
```

**Why:** Prevents accidental mutations affecting the original reference.

---

## 15. HTML Attribute Patterns

### Data Attributes for Configuration
```javascript
// Store configuration in HTML
const slider = document.createElement('div');
slider.className = 'threshold-slider';
slider.dataset.thresholdKey = key;        // data-threshold-key
slider.dataset.category = category;       // data-category

// Access in event handlers
const key = e.target.closest('.threshold-slider').dataset.thresholdKey;
const category = e.target.closest('.threshold-slider').dataset.category;

// Or as selectors
const selector = `.threshold-slider[data-threshold-key="${key}"]`;
const element = document.querySelector(selector);
```

### ID Conventions
```javascript
// IDs for header buttons and inputs
createBtn.id = 'create-btn';
aboutBtn.id = 'about-btn';
nameInput.id = 'classification-name';
rangeInput.id = `threshold-${key}`;

// Link labels to inputs
label.htmlFor = `threshold-${key}`;
```

---

## Summary Table: Epic 4 Patterns

| Aspect | Pattern | Example |
|--------|---------|---------|
| **Events** | `koppen:*` namespace, kebab-case | `koppen:threshold-changed` |
| **Module Export** | Default object with `init/destroy/render` | `export default { init, render, destroy }` |
| **CSS Classes** | BEM naming: block__element--modifier | `.threshold-slider__indicator--decreased` |
| **CSS Variables** | Design tokens in `:root` | `var(--color-primary)` |
| **DOM Clearing** | Loop removeChild instead of innerHTML | `while (el.firstChild) el.removeChild(...)` |
| **Event Listeners** | Track in array for cleanup | `eventListeners.push({ event, handler })` |
| **Logging** | `[Koppen]` prefix | `console.log('[Koppen] Initialized')` |
| **Debouncing** | Debounce high-frequency events | `debounce(fn, 50-100ms)` |
| **Testing** | Vitest + jsdom, beforeEach/afterEach | `describe/it` structure |
| **State** | Closure pattern, return copies | `getAllValues() { return {...state} }` |
| **Accessibility** | ARIA attributes + keyboard handling | `aria-label`, `aria-valuetext`, `keydown` handlers |
| **Error Handling** | Try-catch with user-friendly errors | `renderError({ message, error, actions })` |

---

## Quick Checklist for Epic 6 Stories

- [ ] Event names use `koppen:` prefix
- [ ] Module exports default object with `init()` and `destroy()`
- [ ] CSS classes follow BEM naming convention
- [ ] All values use CSS custom properties
- [ ] Event listeners tracked and cleaned up in `destroy()`
- [ ] DOM elements created with `createElement()` (not innerHTML)
- [ ] Logging uses `[Koppen]` prefix
- [ ] ARIA attributes added for accessibility
- [ ] Tests in `tests/unit/` with beforeEach/afterEach cleanup
- [ ] High-frequency events debounced (50-100ms)
- [ ] Deep cloning for preset/data storage
- [ ] Error states rendered with user-friendly messages
- [ ] Focus management for modal panels (trapFocus/releaseFocus)

