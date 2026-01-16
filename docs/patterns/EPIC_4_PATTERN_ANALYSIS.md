# Epic 4 Implementation Patterns - Reference Guide for Epic 5 Story 5-1

## Overview
This document extracts concrete patterns from Epic 4 (Builder/Threshold Sliders implementation) that should be followed for implementing Story 5-1 (Comparison Mode Toggle). It covers file structure, event architecture, CSS patterns, state management, and testing approaches.

---

## 1. FILE STRUCTURE PATTERNS

### Module Organization
Each major feature gets its own directory with an `index.js` entry point:

```
src/
├── builder/
│   ├── index.js          # Main module interface & public API
│   └── threshold-sliders.js  # Internal component/logic
├── climate/
│   ├── index.js          # Main module interface
│   └── koppen-rules.js   # Internal logic
├── ui/
│   ├── index.js          # Main module interface
│   ├── legend.js         # Sub-component
│   ├── tooltip.js        # Sub-component
│   └── climate-info.js   # Sub-component
├── map/
│   ├── index.js          # Main module interface
│   └── climate-layer.js  # Internal logic
└── main.js               # Application entry point
```

### Key File Characteristics

**Primary Module (index.js):**
- Exports a default object with public methods
- Contains module initialization, cleanup, and state management
- Acts as facade/controller for sub-components
- Handles module-level event listeners
- Example: `src/builder/index.js` lines 9-631

**Sub-components:**
- Purpose-specific logic and DOM manipulation
- Can export named functions (not default)
- No module initialization - called by index.js
- Example: `src/builder/threshold-sliders.js` lines 1-287

### For Comparison Mode Toggle
**Create:** `src/ui/comparison-mode.js`
- Named exports: `initComparisonMode()`, `toggleComparison()`, `render()`, `destroy()`
- Self-contained comparison logic and DOM structure

**Update:** `src/ui/index.js`
- Import comparison module at top
- Initialize in `init()` method
- Wire up display methods

---

## 2. EVENT NAMING CONVENTIONS

### Namespace Pattern: `koppen:*`
All custom events use the `koppen:` namespace to avoid conflicts.

### Event Types in Epic 4

**Control Events** (user action → effect)
```javascript
// src/builder/index.js
document.dispatchEvent(new CustomEvent('koppen:toggle-builder'));
document.dispatchEvent(new CustomEvent('koppen:toggle-legend'));

// src/main.js (keyboard shortcut handlers)
document.dispatchEvent(new CustomEvent('koppen:toggle-builder'));  // 'b' key
```

**State Change Events** (component state changes → app awareness)
```javascript
// src/builder/index.js
document.dispatchEvent(new CustomEvent('koppen:builder-opened'));
document.dispatchEvent(new CustomEvent('koppen:builder-closed'));
document.dispatchEvent(new CustomEvent('koppen:classification-named', {
  detail: { name }
}));

// src/builder/threshold-sliders.js
document.dispatchEvent(new CustomEvent('koppen:threshold-changed', {
  detail: {
    key,
    category,
    value,
    unit: config.unit,
    thresholds: allValues,
  },
}));

// src/builder/index.js (async operations)
document.dispatchEvent(new CustomEvent('koppen:scratch-mode-started'));
```

**Coordination Events** (cross-module communication)
```javascript
// src/builder/index.js
document.dispatchEvent(new CustomEvent('koppen:close-panels', {
  detail: { except: 'builder' },  // Exclude from closing
}));

// Listener in same module:
const closePanelsHandler = (e) => {
  if (e.detail?.except !== 'builder') close();
};
document.addEventListener('koppen:close-panels', closePanelsHandler);
```

### Naming Convention Rules
1. **Action verbs** (toggle, show, hide, open, close, start): `koppen:verb-noun`
2. **State changes** (past tense, -ed, -changed): `koppen:noun-changed`, `koppen:noun-opened`
3. **Domain-specific**: Include category if needed: `koppen:threshold-changed`, `koppen:classification-named`
4. **Always lowercase with hyphens** (not camelCase)

### For Comparison Mode Toggle
```javascript
// Control events
document.dispatchEvent(new CustomEvent('koppen:toggle-comparison'));
document.dispatchEvent(new CustomEvent('koppen:show-comparison'));
document.dispatchEvent(new CustomEvent('koppen:hide-comparison'));

// State events
document.dispatchEvent(new CustomEvent('koppen:comparison-enabled', {
  detail: {
    isComparing: true,
    activeClassifications: ['koppen', 'customA']
  }
}));

document.dispatchEvent(new CustomEvent('koppen:comparison-disabled', {
  detail: { activeClassifications: [] }
}));

// Coordination
document.dispatchEvent(new CustomEvent('koppen:close-panels', {
  detail: { except: 'comparison' }
}));
```

---

## 3. CSS/STYLING PATTERNS

### Design Token System
All styles use CSS custom properties defined at root level.

**Location:** `/src/style.css` lines 10-133

**Token Categories:**
```css
:root {
  /* Colors - Base */
  --color-primary: #2563eb;
  --color-secondary: #64748b;

  /* Typography */
  --font-family-base: system-ui, -apple-system...;
  --font-size-base: 1rem;
  --font-weight-medium: 500;

  /* Spacing */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-4: 1rem;      /* 16px */

  /* Shadows */
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;

  /* Z-Index */
  --z-dropdown: 100;
  --z-modal: 500;

  /* Component Dimensions */
  --header-height: 56px;
  --builder-panel-width: 360px;
}
```

### BEM Class Structure
Classes follow BEM (Block Element Modifier) convention.

**Block:** Component name
**Element:** Child part with `__`
**Modifier:** Variant with `--`

```css
/* Block */
.builder-panel { }

/* Elements */
.builder-panel__header { }
.builder-panel__content { }
.builder-panel__title { }
.builder-panel__close { }

/* Modifiers */
.builder-panel--active { }
.builder-panel__option--primary { }
.builder-panel__error-action--primary { }

/* Nested elements */
.builder-panel__title-row { }
.builder-panel__name-input { }
```

### Styling Patterns from Epic 4

**1. Panel Components (Fixed/Positioned)**
```css
/* src/style.css lines 762-844 */
.builder-panel {
  position: fixed;
  left: -400px;          /* Hidden off-screen */
  top: 0;
  width: 400px;
  height: 100vh;
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1);
  transition: left var(--transition-instant);
  z-index: 300;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.builder-panel--active {
  left: 0;               /* Slide in */
}
```

**2. Flex Layout for Layouts**
```css
.builder-panel {
  display: flex;
  flex-direction: column;
}

.builder-panel__header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
```

**3. Transitions & Interactions**
```css
.threshold-slider__range::-webkit-slider-thumb {
  width: 18px;
  height: 18px;
  background: var(--color-primary);
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.threshold-slider__range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}
```

**4. State Classes for Toggle Behavior**
```css
/* Hidden state */
.legend--collapsed {
  width: var(--legend-collapsed-width);
}

/* Show/hide content */
.legend__content--collapsed {
  display: none;
}

/* Visibility toggle */
.tooltip--visible {
  opacity: 1;
  transform: translateY(0);
}

.tooltip {
  opacity: 0;
  transform: translateY(4px);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}
```

**5. Button Variants**
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.btn--primary {
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
}

.btn--secondary {
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### For Comparison Mode Toggle CSS

**Location:** Add to end of `/src/style.css`

```css
/* ============================================
   Comparison Mode Toggle (Story 5-1)
   ============================================ */

.comparison-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background-color: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.comparison-toggle:hover {
  color: var(--color-text-primary);
  background-color: var(--color-surface-hover);
}

.comparison-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.comparison-toggle--active {
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
}

/* Comparison indicator in header */
.comparison-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  background-color: rgba(37, 99, 235, 0.1);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-primary);
}

.comparison-indicator__count {
  font-weight: var(--font-weight-semibold);
}
```

---

## 4. STATE MANAGEMENT APPROACHES

### Module-Level State Pattern

**File-scoped variables** (private to module):
```javascript
// src/builder/index.js lines 9-12
let builderPanel = null;
let isOpen = false;
let dataLoaded = false;
let eventListeners = []; // Track for cleanup
```

**Characteristics:**
- Variables declared at module top level (private to closure)
- No global state leaks
- Single source of truth per module
- Enables cleanup in destroy() method

### State Update Pattern

**1. Update internal state first:**
```javascript
// src/builder/index.js line 522
isOpen = true;
```

**2. Update DOM to reflect state:**
```javascript
// src/builder/index.js lines 523-524
builderPanel.classList.add('builder-panel--active');
builderPanel.setAttribute('aria-hidden', 'false');
```

**3. Dispatch event for other modules:**
```javascript
// src/builder/index.js line 537
document.dispatchEvent(new CustomEvent('koppen:builder-opened'));
```

**4. Update related UI:**
```javascript
// src/builder/index.js lines 527-531
const createBtn = document.getElementById('create-btn');
if (createBtn) {
  createBtn.textContent = 'Editing...';
  createBtn.setAttribute('aria-pressed', 'true');
}
```

### Threshold Sliders State Management

**Storing complex state:**
```javascript
// src/builder/threshold-sliders.js lines 6-7
let thresholds = {};
let updateCallbacks = [];

// Init pattern
init(preset, onChange) {
  thresholds = preset.thresholds;  // Copy in
  if (onChange) updateCallbacks.push(onChange);
}
```

**Reading state:**
```javascript
// src/builder/threshold-sliders.js lines 64-72
function getAllValues() {
  const values = {};
  Object.keys(thresholds).forEach((category) => {
    Object.keys(thresholds[category]).forEach((key) => {
      values[key] = thresholds[category][key].value;
    });
  });
  return values;
}
```

**State changes with side effects:**
```javascript
// src/builder/threshold-sliders.js lines 34-58
function handleThresholdChange(key, value, category, config) {
  // 1. Update state
  thresholds[category][key].value = value;

  // 2. Read full state
  const allValues = getAllValues();

  // 3. Dispatch event with detail
  document.dispatchEvent(
    new CustomEvent('koppen:threshold-changed', {
      detail: {
        key, category, value,
        unit: config.unit,
        thresholds: allValues,
      },
    })
  );

  // 4. Call callbacks
  updateCallbacks.forEach((cb) => cb(key, value));
}
```

### For Comparison Mode State

```javascript
// src/ui/comparison-mode.js
let isComparisonEnabled = false;
let selectedClassifications = [];  // ['koppen', 'customA']
let comparisonPanel = null;

function toggleComparison() {
  // 1. Update state
  isComparisonEnabled = !isComparisonEnabled;

  // 2. Update DOM
  if (isComparisonEnabled) {
    comparisonPanel.classList.add('comparison-panel--active');
    document.dispatchEvent(new CustomEvent('koppen:comparison-enabled', {
      detail: { activeClassifications: selectedClassifications }
    }));
  } else {
    comparisonPanel.classList.remove('comparison-panel--active');
    document.dispatchEvent(new CustomEvent('koppen:comparison-disabled', {
      detail: { activeClassifications: [] }
    }));
  }

  // 3. Coordinate with other panels
  document.dispatchEvent(new CustomEvent('koppen:close-panels', {
    detail: { except: 'comparison' }
  }));
}
```

---

## 5. EVENT LISTENER MANAGEMENT

### Listener Registration Pattern

**Track listeners for cleanup:**
```javascript
// src/builder/index.js lines 12-20
let eventListeners = [];

function setupEventListeners() {
  const toggleHandler = () => toggle();
  document.addEventListener('koppen:toggle-builder', toggleHandler);
  eventListeners.push({ event: 'koppen:toggle-builder', handler: toggleHandler });

  const closePanelsHandler = (e) => {
    if (e.detail?.except !== 'builder') close();
  };
  document.addEventListener('koppen:close-panels', closePanelsHandler);
  eventListeners.push({ event: 'koppen:close-panels', handler: closePanelsHandler });
}
```

**Cleanup in destroy:**
```javascript
// src/builder/index.js lines 621-626
destroy() {
  eventListeners.forEach(({ event, handler }) => {
    document.removeEventListener(event, handler);
  });
  eventListeners = [];
  builderPanel = null;
}
```

### Local Event Handlers (inline)

**On DOM elements (self-managing):**
```javascript
// src/builder/index.js lines 94-95
closeBtn.addEventListener('click', () => close());

// src/builder/index.js lines 109-114
nameInput.addEventListener('input', (e) => {
  const name = e.target.value;
  document.dispatchEvent(new CustomEvent('koppen:classification-named', {
    detail: { name },
  }));
});
```

**Key insight:** Don't track inline element listeners - they're garbage collected with the element

### For Comparison Mode Listeners

```javascript
function setupEventListeners() {
  // Listen for map classification changes
  const mapChangeHandler = (e) => {
    updateComparisonDisplay(e.detail.features);
  };
  document.addEventListener('koppen:classification-updated', mapChangeHandler);
  eventListeners.push({ event: 'koppen:classification-updated', handler: mapChangeHandler });

  // Listen for panel close requests
  const closeHandler = (e) => {
    if (e.detail?.except !== 'comparison') {
      disableComparison();
    }
  };
  document.addEventListener('koppen:close-panels', closeHandler);
  eventListeners.push({ event: 'koppen:close-panels', handler: closeHandler });
}
```

---

## 6. COMPONENT CREATION PATTERNS

### Element Creation Helper Pattern

**Builder pattern for complex elements:**
```javascript
// src/builder/index.js lines 167-194
function createOption({ id, icon, title, description, primary }) {
  const button = document.createElement('button');
  button.id = id;
  button.type = 'button';
  button.className = 'builder-panel__option';
  if (primary) {
    button.classList.add('builder-panel__option--primary');
  }

  const iconSpan = document.createElement('span');
  iconSpan.className = 'builder-panel__option-icon';
  iconSpan.setAttribute('aria-hidden', 'true');
  iconSpan.textContent = icon;

  const titleSpan = document.createElement('span');
  titleSpan.className = 'builder-panel__option-title';
  titleSpan.textContent = title;

  // ... more elements

  button.appendChild(iconSpan);
  button.appendChild(titleSpan);
  button.appendChild(descSpan);

  return button;
}
```

**Key patterns:**
1. Accept configuration object
2. Create root element with essential attributes
3. Add conditional classes based on props
4. Set ARIA attributes for accessibility
5. Create and append child elements
6. Return complete element tree

### Threshold Slider Component

```javascript
// src/builder/threshold-sliders.js lines 81-167
function createSlider(key, config, category) {
  const container = document.createElement('div');
  container.className = 'threshold-slider';
  container.dataset.thresholdKey = key;  // Store metadata
  container.dataset.category = category;

  // Label
  const label = document.createElement('label');
  label.className = 'threshold-slider__label';
  label.htmlFor = `threshold-${key}`;
  label.textContent = config.description;
  container.appendChild(label);

  // ... other elements

  // Event handlers
  const debouncedUpdate = debounce((value) => {
    handleThresholdChange(key, value, category, config);
  }, 50);

  rangeInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    textInput.value = value;
    rangeInput.setAttribute('aria-valuenow', value);
    rangeInput.setAttribute('aria-valuetext', `${value} ${config.unit}`);
    debouncedUpdate(value);
  });

  return container;
}
```

**Key patterns:**
1. Use data attributes for metadata retrieval
2. Debounce rapid updates
3. Keep DOM and aria attributes in sync
4. Sync between multiple input types
5. Use small, focused creation functions

### For Comparison Mode Components

```javascript
function createComparisonPanel() {
  const panel = document.createElement('div');
  panel.id = 'comparison-panel';
  panel.className = 'comparison-panel';
  panel.setAttribute('aria-hidden', 'true');

  // Header
  const header = document.createElement('div');
  header.className = 'comparison-panel__header';

  const title = document.createElement('h2');
  title.className = 'comparison-panel__title';
  title.textContent = 'Compare Classifications';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'comparison-panel__close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close comparison');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => disableComparison());

  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Content area
  const content = document.createElement('div');
  content.className = 'comparison-panel__content';
  panel.appendChild(content);

  return panel;
}
```

---

## 7. RENDER/UPDATE PATTERNS

### Full Re-render on State Change

```javascript
// src/builder/index.js lines 49-72
function render() {
  if (!builderPanel) return;

  // Clear existing content
  while (builderPanel.firstChild) {
    builderPanel.removeChild(builderPanel.firstChild);
  }

  // Create header
  const header = createHeader();
  builderPanel.appendChild(header);

  // Create content area
  const content = document.createElement('div');
  content.className = 'builder-panel__content';

  if (dataLoaded) {
    content.appendChild(createStartOptions());
  } else {
    content.appendChild(createLoadingState());
  }

  builderPanel.appendChild(content);
}
```

**Pattern: Declarative rendering**
1. Check preconditions
2. Clear previous content
3. Create fresh element tree based on state
4. Append new content

### Partial State Updates

```javascript
// src/builder/threshold-sliders.js lines 243-264
reset(preset) {
  thresholds = preset.thresholds;

  // Update existing DOM elements instead of re-rendering
  document.querySelectorAll('.threshold-slider').forEach((slider) => {
    const key = slider.dataset.thresholdKey;
    const category = slider.dataset.category;
    const config = thresholds[category]?.[key];

    const rangeInput = slider.querySelector('.threshold-slider__range');
    const textInput = slider.querySelector('.threshold-slider__input');

    if (rangeInput && textInput && config) {
      rangeInput.value = config.value;
      textInput.value = config.value;
      rangeInput.setAttribute('aria-valuenow', config.value);
      rangeInput.setAttribute(
        'aria-valuetext',
        `${config.value} ${config.unit}`
      );
    }
  });

  // Fire event
  document.dispatchEvent(
    new CustomEvent('koppen:thresholds-reset', {
      detail: { thresholds: getAllValues() },
    })
  );
}
```

**Pattern: Surgical updates**
1. Query existing elements (using selectors with metadata)
2. Update only changed properties
3. Keep DOM nodes intact
4. Use data attributes to find elements reliably

### For Comparison Mode Rendering

```javascript
function renderComparisonContent(classifications) {
  const content = comparisonPanel.querySelector('.comparison-panel__content');

  // Clear existing
  while (content.firstChild) {
    content.removeChild(content.firstChild);
  }

  // Render each classification
  classifications.forEach((classCode) => {
    const item = document.createElement('div');
    item.className = 'comparison-item';
    item.dataset.classification = classCode;

    const color = getColorForClassification(classCode);
    const info = getClimateInfo(classCode);

    const colorBlock = document.createElement('div');
    colorBlock.className = 'comparison-item__color';
    colorBlock.style.backgroundColor = color;

    const label = document.createElement('span');
    label.className = 'comparison-item__label';
    label.textContent = `${classCode} - ${info.name}`;

    item.appendChild(colorBlock);
    item.appendChild(label);
    content.appendChild(item);
  });
}
```

---

## 8. DEBOUNCING & PERFORMANCE PATTERNS

### Debounce Implementation

```javascript
// src/builder/threshold-sliders.js lines 15-25
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
  const value = parseFloat(e.target.value);
  textInput.value = value;  // Update display immediately
  debouncedUpdate(value);   // Debounce the dispatch
});
```

**Pattern:** Debounce expensive operations (event dispatch) while keeping UI responsive (local state updates)

### For Comparison Mode

```javascript
function initComparisonMode() {
  // Debounce map updates during comparison
  const debouncedComparisonUpdate = debounce((features) => {
    updateComparisonLayers(features);
  }, 100);

  document.addEventListener('koppen:classification-updated', (e) => {
    if (isComparisonEnabled) {
      debouncedComparisonUpdate(e.detail.features);
    }
  });
}
```

---

## 9. ACCESSIBILITY PATTERNS

### ARIA Attributes

**Toggle/Modal patterns:**
```javascript
// src/builder/index.js line 586
builderPanel.setAttribute('aria-hidden', 'true');  // Initially hidden

// src/builder/index.js line 524
builderPanel.setAttribute('aria-hidden', 'false');  // When open
```

**Input labels:**
```javascript
// src/builder/threshold-sliders.js lines 100-107
const textInput = document.createElement('input');
textInput.type = 'number';
textInput.id = `threshold-${key}-value`;
textInput.setAttribute('aria-label', `${config.description} value`);

// src/builder/threshold-sliders.js lines 127-131
rangeInput.setAttribute('aria-label', config.description);
rangeInput.setAttribute('aria-valuemin', config.range[0]);
rangeInput.setAttribute('aria-valuemax', config.range[1]);
rangeInput.setAttribute('aria-valuenow', config.value);
rangeInput.setAttribute('aria-valuetext', `${config.value} ${config.unit}`);
```

**Live regions:**
```javascript
// src/builder/index.js lines 391-392
help.setAttribute('role', 'status');
help.setAttribute('aria-live', 'polite');
```

**Buttons:**
```javascript
// src/main.js lines 529-530
createBtn.setAttribute('aria-pressed', 'true');  // Toggle state
```

### Focus Management

**Focus trap:**
```javascript
// src/builder/index.js lines 489-499
function trapFocus() {
  if (!builderPanel) return;

  const focusable = builderPanel.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusable.length > 0) {
    focusable[0].focus();
  }
}
```

**Focus restoration:**
```javascript
// src/builder/index.js lines 504-507
function releaseFocus() {
  const createBtn = document.getElementById('create-btn');
  if (createBtn) createBtn.focus();
}
```

### For Comparison Mode

```javascript
// Create accessible toggle button
function createComparisonToggle() {
  const btn = document.createElement('button');
  btn.id = 'comparison-toggle';
  btn.className = 'comparison-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Toggle comparison mode');
  btn.setAttribute('aria-pressed', 'false');
  btn.textContent = '⊕';

  btn.addEventListener('click', () => {
    toggleComparison();
    btn.setAttribute('aria-pressed', isComparisonEnabled.toString());
  });

  return btn;
}

// Mark panel with proper ARIA
comparisonPanel.setAttribute('aria-hidden', 'true');
comparisonPanel.setAttribute('role', 'region');
comparisonPanel.setAttribute('aria-label', 'Classification comparison');
```

---

## 10. TESTING PATTERNS

### Event Dispatch Testing

From `src/main.js` lines 75-89, modules are tested by:
1. Dispatching control events
2. Checking state changes via module API
3. Verifying side effects (DOM updates, other events)

```javascript
// Test toggle-builder event
document.dispatchEvent(new CustomEvent('koppen:toggle-builder'));
// Check: BuilderModule.isOpen() returns true
// Check: builder-panel has 'builder-panel--active' class
// Check: koppen:builder-opened event was dispatched
```

### Mock Data for Testing

```javascript
// src/builder/index.js uses presets during testing
const SCRATCH_PRESET = { thresholds: { ... } };
const KOPPEN_PRESET = { name: '...', version: '...', thresholds: { ... } };
```

### Error Handling Tests

```javascript
// src/builder/index.js lines 326-336
try {
  const preset = await presetLoader.loadKoppenPreset();
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
```

**Test pattern:** Dispatch event → Verify module state → Check DOM → Verify cascading events

### For Comparison Mode Tests

```javascript
// Test: Toggle comparison mode
function testToggleComparison() {
  // Initial state
  assert(isComparisonEnabled === false);

  // Toggle on
  document.dispatchEvent(new CustomEvent('koppen:toggle-comparison'));
  assert(isComparisonEnabled === true);
  assert(comparisonPanel.classList.contains('comparison-panel--active'));

  // Verify event dispatched
  let eventFired = false;
  document.addEventListener('koppen:comparison-enabled', () => {
    eventFired = true;
  });
  // ... toggle again
  assert(eventFired === true);
}

// Test: Close panels coordination
function testCloseOtherPanels() {
  // Enable comparison
  toggleComparison();
  assert(isComparisonEnabled === true);

  // Dispatch close-panels event (from builder opening)
  document.dispatchEvent(new CustomEvent('koppen:close-panels', {
    detail: { except: 'builder' }  // Not 'comparison'
  }));

  // Comparison should close
  assert(isComparisonEnabled === false);
}
```

---

## 11. ERROR HANDLING PATTERNS

### Try-Catch with User Feedback

```javascript
// src/builder/index.js lines 300-337
async function startFromKoppen() {
  try {
    renderLoadingState('Loading Köppen preset...');
    const preset = await presetLoader.loadKoppenPreset();
    thresholdSliders.init(preset);
    // ... render sliders
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
```

**Pattern:**
1. Show loading state
2. Try operation
3. Catch error and show user-friendly message
4. Provide recovery actions

### Safe DOM Queries

```javascript
// Check element exists before operating
if (!builderPanel) return;

const content = builderPanel.querySelector('.builder-panel__content');
if (!content) return;

// Optional chaining for nested access
const config = thresholds[category]?.[key];
if (config) { /* ... */ }
```

### For Comparison Mode Error Handling

```javascript
function enableComparison() {
  try {
    if (!validClassifications()) {
      throw new Error('No classifications available to compare');
    }

    isComparisonEnabled = true;
    comparisonPanel.classList.add('comparison-panel--active');
    renderComparisonContent(selectedClassifications);

    document.dispatchEvent(new CustomEvent('koppen:comparison-enabled', {
      detail: { activeClassifications: selectedClassifications }
    }));
  } catch (error) {
    console.error('[Koppen] Comparison error:', error);
    showMessage(error.message, 'error');
  }
}
```

---

## 12. INITIALIZATION & CLEANUP PATTERN

### Module Lifecycle

**Initialization:**
```javascript
// src/builder/index.js lines 576-593
init(_options = {}) {
  builderPanel = document.getElementById('builder-panel');

  if (!builderPanel) {
    const error = new Error('[Koppen] Builder panel element #builder-panel not found in DOM');
    console.error(error.message);
    throw error;
  }

  builderPanel.setAttribute('aria-hidden', 'true');
  setupEventListeners();
  render();
}
```

**Cleanup:**
```javascript
// src/builder/index.js lines 621-631
destroy() {
  eventListeners.forEach(({ event, handler }) => {
    document.removeEventListener(event, handler);
  });
  eventListeners = [];

  builderPanel = null;
  isOpen = false;
  dataLoaded = false;
}
```

### Main App Initialization Pattern

```javascript
// src/main.js lines 25-69
async function initializeApp() {
  if (app.initialized) {
    console.warn('[Koppen] App already initialized');
    return;
  }

  try {
    // 1. Init utils first (base functionality)
    app.modules.utils = UtilsModule;
    app.modules.utils.init();

    // 2. Init map (async data loading)
    app.modules.map = MapModule;
    await app.modules.map.init('map-container');

    // 3. Init other modules
    app.modules.climate = ClimateModule;
    app.modules.climate.init();

    // Setup cross-module events
    setupEventListeners();

    // Check URL state
    await restoreFromURL();

    app.initialized = true;
    document.dispatchEvent(new CustomEvent('koppen:ready'));
  } catch (error) {
    console.error('[Koppen] Failed to initialize:', error);
    showError('Failed to initialize application. Please refresh the page.');
  }
}
```

**Pattern:**
1. Check guard (prevent double-init)
2. Initialize modules in dependency order
3. Setup cross-module event listeners
4. Restore state from persistence (URL)
5. Mark as initialized
6. Dispatch ready event
7. Catch and handle errors

### For Comparison Mode Initialization

```javascript
export function initComparisonMode() {
  try {
    comparisonPanel = document.getElementById('comparison-panel');
    if (!comparisonPanel) {
      throw new Error('[Koppen] Comparison panel element not found');
    }

    // Create toggle button in header
    const headerNav = document.querySelector('.header__nav');
    const toggle = createComparisonToggle();
    headerNav.insertBefore(toggle, headerNav.firstChild);

    // Setup event listeners
    setupEventListeners();

    isComparisonEnabled = false;
    selectedClassifications = [];

    console.log('[Koppen] Comparison mode initialized');
  } catch (error) {
    console.error('[Koppen] Failed to init comparison mode:', error);
  }
}

export function destroy() {
  eventListeners.forEach(({ event, handler }) => {
    document.removeEventListener(event, handler);
  });
  eventListeners = [];

  comparisonPanel = null;
  isComparisonEnabled = false;
  selectedClassifications = [];
}
```

---

## Summary: Pattern Checklist for Story 5-1

### File Structure
- [ ] Create `/src/ui/comparison-mode.js` for comparison logic
- [ ] Update `/src/ui/index.js` to import and initialize comparison module
- [ ] Add CSS to `/src/style.css` using established design tokens

### Events
- [ ] Define `koppen:toggle-comparison` (control)
- [ ] Define `koppen:comparison-enabled` with detail (state)
- [ ] Define `koppen:comparison-disabled` with detail (state)
- [ ] Listen to `koppen:close-panels` with except check
- [ ] Dispatch `koppen:close-panels` when opening comparison

### CSS/BEM Classes
- [ ] Use `--color-primary`, `--transition-fast`, `--space-*` tokens
- [ ] Follow BEM naming: `.comparison-toggle`, `.comparison-panel__content`, `.comparison-toggle--active`
- [ ] Use state classes for visibility (`.comparison-panel--active`)
- [ ] Support transitions with `transition: all var(--transition-fast)`

### State Management
- [ ] Module-level variables: `isComparisonEnabled`, `selectedClassifications`, `comparisonPanel`
- [ ] Track event listeners for cleanup
- [ ] Update state → DOM → dispatch event pattern

### Event Listeners
- [ ] Track all listeners in array: `eventListeners.push({ event, handler })`
- [ ] Implement proper cleanup in `destroy()`
- [ ] Use optional chaining for safe detail access: `e.detail?.except`

### Accessibility
- [ ] Add `aria-hidden`, `aria-label`, `aria-pressed` attributes
- [ ] Update ARIA attributes on state changes
- [ ] Use focus management (trap/release) if modal-like
- [ ] Support keyboard shortcuts (Escape to close)

### Error Handling
- [ ] Use try-catch for initialization
- [ ] Safe DOM queries with null checks
- [ ] User-friendly error messages
- [ ] Recovery actions in error states

### Testing Checklist
- [ ] Test toggle event dispatch
- [ ] Verify state changes
- [ ] Check DOM class updates
- [ ] Verify cascading events
- [ ] Test close-panels coordination
- [ ] Test error states
