# Code Examples - Epic 4 Patterns for Story 5-1

This document provides copy-paste-ready code snippets following Epic 4 patterns for implementing Comparison Mode Toggle.

---

## Example 1: Complete comparison-mode.js Module

```javascript
/**
 * Comparison Mode Module
 * @module ui/comparison-mode
 */

let isComparisonEnabled = false;
let selectedClassifications = [];
let comparisonPanel = null;
let comparisonToggle = null;
let eventListeners = [];

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Listen for close-panels event
  const closePanelsHandler = (e) => {
    if (e.detail?.except !== 'comparison' && isComparisonEnabled) {
      disable();
    }
  };
  document.addEventListener('koppen:close-panels', closePanelsHandler);
  eventListeners.push({ event: 'koppen:close-panels', handler: closePanelsHandler });

  // Listen for classification updates
  const classificationHandler = (e) => {
    if (isComparisonEnabled) {
      updateComparisonDisplay(e.detail);
    }
  };
  document.addEventListener('koppen:classification-updated', classificationHandler);
  eventListeners.push({ event: 'koppen:classification-updated', handler: classificationHandler });

  // Toggle button click
  if (comparisonToggle) {
    comparisonToggle.addEventListener('click', () => toggle());
  }
}

/**
 * Create the comparison toggle button
 */
function createToggleButton() {
  const btn = document.createElement('button');
  btn.id = 'comparison-toggle';
  btn.className = 'comparison-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Toggle comparison mode');
  btn.setAttribute('aria-pressed', 'false');
  btn.textContent = '⊕';

  return btn;
}

/**
 * Create the comparison panel
 */
function createComparisonPanel() {
  const panel = document.createElement('div');
  panel.id = 'comparison-panel';
  panel.className = 'comparison-panel';
  panel.setAttribute('aria-hidden', 'true');
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Classification comparison');

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
  closeBtn.addEventListener('click', () => disable());

  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Content area
  const content = document.createElement('div');
  content.className = 'comparison-panel__content';
  panel.appendChild(content);

  return panel;
}

/**
 * Render comparison content
 */
function renderContent() {
  if (!comparisonPanel) return;

  const content = comparisonPanel.querySelector('.comparison-panel__content');
  if (!content) return;

  // Clear existing
  while (content.firstChild) {
    content.removeChild(content.firstChild);
  }

  // Show message if no classifications
  if (selectedClassifications.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'comparison-panel__empty-message';
    msg.textContent = 'No classifications to compare. Apply a custom classification first.';
    content.appendChild(msg);
    return;
  }

  // Render each classification
  selectedClassifications.forEach((classCode) => {
    const item = document.createElement('div');
    item.className = 'comparison-item';
    item.dataset.classification = classCode;

    const colorBlock = document.createElement('div');
    colorBlock.className = 'comparison-item__color';
    // Color would come from climate module
    colorBlock.style.backgroundColor = '#2563eb'; // Placeholder

    const label = document.createElement('span');
    label.className = 'comparison-item__label';
    label.textContent = classCode;

    item.appendChild(colorBlock);
    item.appendChild(label);
    content.appendChild(item);
  });
}

/**
 * Update comparison display based on classification changes
 */
function updateComparisonDisplay(detail) {
  // Could update statistics, re-render legend, etc.
  renderContent();
}

/**
 * Enable comparison mode
 */
function enable() {
  try {
    if (isComparisonEnabled) return;

    // Close other panels
    document.dispatchEvent(
      new CustomEvent('koppen:close-panels', {
        detail: { except: 'comparison' },
      })
    );

    isComparisonEnabled = true;
    comparisonPanel.classList.add('comparison-panel--active');
    comparisonPanel.setAttribute('aria-hidden', 'false');

    if (comparisonToggle) {
      comparisonToggle.classList.add('comparison-toggle--active');
      comparisonToggle.setAttribute('aria-pressed', 'true');
    }

    renderContent();

    // Dispatch event
    document.dispatchEvent(
      new CustomEvent('koppen:comparison-enabled', {
        detail: {
          isComparing: true,
          activeClassifications: selectedClassifications,
        },
      })
    );

    console.log('[Koppen] Comparison mode enabled');
  } catch (error) {
    console.error('[Koppen] Failed to enable comparison:', error);
  }
}

/**
 * Disable comparison mode
 */
function disable() {
  if (!isComparisonEnabled) return;

  isComparisonEnabled = false;
  comparisonPanel.classList.remove('comparison-panel--active');
  comparisonPanel.setAttribute('aria-hidden', 'true');

  if (comparisonToggle) {
    comparisonToggle.classList.remove('comparison-toggle--active');
    comparisonToggle.setAttribute('aria-pressed', 'false');
  }

  // Dispatch event
  document.dispatchEvent(
    new CustomEvent('koppen:comparison-disabled', {
      detail: { activeClassifications: [] },
    })
  );

  console.log('[Koppen] Comparison mode disabled');
}

/**
 * Toggle comparison mode
 */
function toggle() {
  isComparisonEnabled ? disable() : enable();
}

/**
 * Set classifications to compare
 */
function setClassifications(classifications) {
  selectedClassifications = Array.isArray(classifications) ? classifications : [];
  if (isComparisonEnabled) {
    renderContent();
  }
}

/**
 * Check if comparison is enabled
 */
function isEnabled() {
  return isComparisonEnabled;
}

/**
 * Get current classifications
 */
function getClassifications() {
  return [...selectedClassifications];
}

export default {
  /**
   * Initialize comparison mode
   */
  init() {
    try {
      // Create toggle button
      comparisonToggle = createToggleButton();

      // Insert into header nav
      const headerNav = document.querySelector('.header__nav');
      if (headerNav) {
        headerNav.insertBefore(comparisonToggle, headerNav.firstChild);
      }

      // Create panel
      comparisonPanel = createComparisonPanel();
      const main = document.querySelector('.main');
      if (main) {
        main.appendChild(comparisonPanel);
      }

      // Setup events
      setupEventListeners();

      console.log('[Koppen] Comparison mode initialized');
    } catch (error) {
      console.error('[Koppen] Failed to init comparison mode:', error);
      throw error;
    }
  },

  enable,
  disable,
  toggle,
  isEnabled,
  setClassifications,
  getClassifications,

  /**
   * Destroy module
   */
  destroy() {
    eventListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    eventListeners = [];

    comparisonPanel = null;
    comparisonToggle = null;
    isComparisonEnabled = false;
    selectedClassifications = [];

    console.log('[Koppen] Comparison mode destroyed');
  },
};
```

---

## Example 2: Update to src/ui/index.js

```javascript
/**
 * UI Module - User interface components
 * @module ui
 */

import { createLegend, updateStats } from './legend.js';
import { createTooltip, destroy as destroyTooltip } from './tooltip.js';
import { createClimateInfo, showClimateInfo } from './climate-info.js';
import comparisonMode from './comparison-mode.js';  // ADD THIS

let infoController = null;

export default {
  /**
   * Initialize all UI components
   */
  init() {
    // Create legend
    const legendContainer = document.getElementById('legend-container');
    if (legendContainer) {
      createLegend(legendContainer);
    }

    // Create tooltip
    createTooltip();

    // Create climate info panel
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
      infoController = createClimateInfo(infoPanel);
    }

    // Initialize comparison mode
    comparisonMode.init();  // ADD THIS

    console.log('[Koppen] UI module initialized');
  },

  /**
   * Update legend stats
   * @param {Object} stats - Stats by climate type
   */
  updateLegend(stats) {
    if (stats) {
      updateStats(stats);
    }
  },

  /**
   * Show tooltip
   * @param {Object} _data - Tooltip data
   */
  showTooltip(_data) {
    // Tooltip handles this via events
  },

  /**
   * Show climate info panel
   * @param {Object} data - Climate data
   */
  showClimateInfo(data) {
    showClimateInfo(data);
  },

  /**
   * Show a message to the user
   * @param {string} message - Message text
   * @param {string} type - Message type (info, error, success)
   */
  showMessage(message, type = 'info') {
    const msgEl = document.createElement('div');
    msgEl.className = `message message--${type}`;
    msgEl.textContent = message;
    document.body.appendChild(msgEl);

    setTimeout(() => {
      msgEl.classList.add('message--fade');
      setTimeout(() => msgEl.remove(), 300);
    }, 3000);
  },

  /**
   * Destroy all UI components
   */
  destroy() {
    destroyTooltip();
    if (infoController) {
      infoController.destroy();
      infoController = null;
    }
    comparisonMode.destroy();  // ADD THIS
    console.log('[Koppen] UI module destroyed');
  },
};

// Re-export components
export { createLegend, updateStats } from './legend.js';
export { createTooltip } from './tooltip.js';
export { createClimateInfo, showClimateInfo } from './climate-info.js';
```

---

## Example 3: CSS for Comparison Mode

Add to end of `/src/style.css`:

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
  min-width: 44px;
  min-height: 44px;
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

.comparison-toggle--active:hover {
  background-color: var(--color-primary-hover);
}

/* Comparison Panel */
.comparison-panel {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  width: var(--info-panel-width);
  max-height: calc(100% - var(--space-8));
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: var(--z-dropdown);
  transform: translateX(calc(100% + var(--space-4)));
  transition: transform var(--transition-normal);
  pointer-events: auto;
}

.comparison-panel--active {
  transform: translateX(0);
}

.comparison-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.comparison-panel__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.comparison-panel__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.comparison-panel__close:hover {
  color: var(--color-text-primary);
  background-color: var(--color-surface-hover);
}

.comparison-panel__content {
  padding: var(--space-4);
  overflow-y: auto;
  max-height: calc(100% - 60px);
}

.comparison-panel__empty-message {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  margin: 0;
  text-align: center;
  padding: var(--space-4);
}

/* Comparison Item */
.comparison-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background-color: var(--color-surface-hover);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
}

.comparison-item:last-child {
  margin-bottom: 0;
}

.comparison-item__color {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
  border: 1px solid var(--color-border);
}

.comparison-item__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

/* Responsive */
@media (max-width: 768px) {
  .comparison-panel {
    top: auto;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    transform: translateY(100%);
  }

  .comparison-panel--active {
    transform: translateY(0);
  }
}
```

---

## Example 4: Integration in src/main.js

Add keyboard shortcut (optional, after line 173):

```javascript
// In handleKeyboard function, add:
case 'c':
  if (!e.ctrlKey && !e.metaKey) {
    document.dispatchEvent(new CustomEvent('koppen:toggle-comparison'));
  }
  break;
```

And handle the event in setupEventListeners:

```javascript
// Add to setupEventListeners in initializeApp
document.addEventListener('koppen:toggle-comparison', () => {
  app.modules.ui.comparison?.toggle();
});
```

---

## Example 5: Testing Comparison Mode

```javascript
/**
 * Test comparison mode toggle
 */
function testComparisonToggle() {
  // Initial state
  console.assert(!comparisonMode.isEnabled(), 'Should be disabled initially');

  // Toggle on
  comparisonMode.toggle();
  console.assert(comparisonMode.isEnabled(), 'Should be enabled after toggle');

  const panel = document.getElementById('comparison-panel');
  console.assert(
    panel.classList.contains('comparison-panel--active'),
    'Panel should have active class'
  );

  const toggle = document.getElementById('comparison-toggle');
  console.assert(
    toggle.classList.contains('comparison-toggle--active'),
    'Toggle should have active class'
  );

  // Toggle off
  comparisonMode.toggle();
  console.assert(!comparisonMode.isEnabled(), 'Should be disabled after second toggle');
}

/**
 * Test close-panels coordination
 */
function testCloseOtherPanels() {
  comparisonMode.toggle();
  console.assert(comparisonMode.isEnabled(), 'Comparison should be enabled');

  // Simulate builder opening (sends close-panels with except: builder)
  document.dispatchEvent(
    new CustomEvent('koppen:close-panels', {
      detail: { except: 'builder' },
    })
  );

  console.assert(!comparisonMode.isEnabled(), 'Comparison should be closed');
}

/**
 * Test event dispatch
 */
function testEventDispatch() {
  let enabledEventFired = false;
  const handler = () => {
    enabledEventFired = true;
  };

  document.addEventListener('koppen:comparison-enabled', handler);
  comparisonMode.toggle();

  console.assert(enabledEventFired, 'koppen:comparison-enabled event should fire');
  document.removeEventListener('koppen:comparison-enabled', handler);
}

/**
 * Run all tests
 */
function runTests() {
  testComparisonToggle();
  testCloseOtherPanels();
  testEventDispatch();
  console.log('All comparison mode tests passed!');
}
```

---

## Example 6: Event Flow Diagram

```
User clicks toggle button
        ↓
.comparison-toggle click event
        ↓
comparisonMode.toggle()
        ↓
    toggle enabled? ─ yes → enable()
    │                         ↓
    │               Dispatch koppen:close-panels
    │                    (except: 'comparison')
    │                         ↓
    │               Add active class to panel/button
    │                         ↓
    │               Set aria-hidden, aria-pressed
    │                         ↓
    │               Dispatch koppen:comparison-enabled
    │                    (with detail)
    │
    └─ no → disable()
              ↓
           Remove active classes
              ↓
           Set aria-hidden, aria-pressed
              ↓
           Dispatch koppen:comparison-disabled
              ↓
   Main app listens for:
   - koppen:comparison-enabled
   - koppen:comparison-disabled
   - koppen:close-panels
```

---

## Example 7: BEM Class Hierarchy

```
.comparison-toggle                 /* Button in header */
  ├── .comparison-toggle--active   /* State: enabled */
  └── aria-pressed="true"

.comparison-panel                  /* Sidebar panel */
  ├── .comparison-panel--active    /* State: visible */
  ├── .comparison-panel__header
  │   ├── .comparison-panel__title
  │   └── .comparison-panel__close (button)
  ├── .comparison-panel__content
  │   ├── .comparison-item
  │   │   ├── .comparison-item__color
  │   │   └── .comparison-item__label
  │   ├── .comparison-item (... more items)
  │   └── .comparison-panel__empty-message
  └── aria-hidden="true"
```

---

## Example 8: State Diagram

```
┌─────────────────┐
│   DISABLED      │
│ (initial state) │
└────────┬────────┘
         │
         │ toggle() or enable()
         ↓
┌─────────────────┐
│    ENABLED      │
│ • Panel visible │
│ • Button active │
│ • aria updated  │
└────────┬────────┘
         │
         │ toggle() or disable()
         ↓ or koppen:close-panels
         │   (except != 'comparison')
         │
┌─────────────────┐
│    DISABLED     │
└─────────────────┘
```

---

## Common Mistakes to Avoid

### ❌ DON'T: Forget to track event listeners
```javascript
// WRONG - will cause memory leaks
document.addEventListener('koppen:close-panels', handler);
```

### ✅ DO: Track for cleanup
```javascript
// CORRECT
document.addEventListener('koppen:close-panels', handler);
eventListeners.push({ event: 'koppen:close-panels', handler });
```

---

### ❌ DON'T: Forget aria-hidden attribute
```javascript
// WRONG - not accessible
panel.style.display = 'none';
```

### ✅ DO: Use aria-hidden
```javascript
// CORRECT
panel.setAttribute('aria-hidden', 'true');
panel.classList.add('hidden-by-css');
```

---

### ❌ DON'T: Hardcode colors
```javascript
// WRONG
colorBlock.style.backgroundColor = '#2563eb';
```

### ✅ DO: Use CSS tokens or data attributes
```javascript
// CORRECT - use CSS class or let CSS handle it
colorBlock.className = 'comparison-item__color';
colorBlock.style.backgroundColor = getColorForCode(classCode);
```

---

### ❌ DON'T: Ignore other panels
```javascript
// WRONG - doesn't coordinate
comparisonMode.enable();
```

### ✅ DO: Close other panels first
```javascript
// CORRECT
function enable() {
  document.dispatchEvent(new CustomEvent('koppen:close-panels', {
    detail: { except: 'comparison' }
  }));
  // ... then enable
}
```
