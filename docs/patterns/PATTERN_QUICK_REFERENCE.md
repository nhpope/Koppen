# Quick Pattern Reference - Story 5-1 Implementation

## File Structure
```
src/ui/
├── index.js              (update to init comparison)
├── comparison-mode.js    (NEW - toggle, state, render)
├── legend.js
├── tooltip.js
└── climate-info.js
```

## Event Naming Convention
All events use `koppen:` namespace with hyphens (lowercase).

**Control events:** `koppen:toggle-comparison`, `koppen:show-comparison`
**State events:** `koppen:comparison-enabled`, `koppen:comparison-disabled`
**Detail pattern:** Include full state `{ isComparing, activeClassifications }`

## CSS BEM Structure
```css
/* Block (component) */
.comparison-toggle { }
.comparison-panel { }

/* Elements (children) */
.comparison-panel__header { }
.comparison-panel__content { }
.comparison-item__label { }

/* Modifiers (variants) */
.comparison-toggle--active { }
.comparison-panel--visible { }
```

## State Management
```javascript
// Module-level private variables
let isComparisonEnabled = false;
let selectedClassifications = [];
let comparisonPanel = null;
let eventListeners = [];

// Pattern: State → DOM → Event
function toggle() {
  isComparisonEnabled = !isComparisonEnabled;
  comparisonPanel.classList.toggle('comparison-panel--active');
  document.dispatchEvent(new CustomEvent('koppen:comparison-toggled', {
    detail: { isComparisonEnabled, selectedClassifications }
  }));
}
```

## Event Listener Pattern
```javascript
// Track for cleanup
function setupEventListeners() {
  const handler = (e) => handleEvent(e);
  document.addEventListener('koppen:some-event', handler);
  eventListeners.push({ event: 'koppen:some-event', handler });
}

// Cleanup
function destroy() {
  eventListeners.forEach(({ event, handler }) => {
    document.removeEventListener(event, handler);
  });
  eventListeners = [];
}
```

## DOM Creation Pattern
```javascript
function createComparisonToggle() {
  const btn = document.createElement('button');
  btn.id = 'comparison-toggle';
  btn.className = 'comparison-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Toggle comparison');
  btn.setAttribute('aria-pressed', 'false');
  btn.textContent = '⊕';

  btn.addEventListener('click', () => toggleComparison());
  return btn;
}
```

## CSS Design Tokens (Use these)
```css
--color-primary: #2563eb
--color-text-primary: #1e293b
--color-text-secondary: #64748b
--color-surface: #ffffff
--color-surface-hover: #f1f5f9
--color-border: #e2e8f0

--space-2: 0.5rem    (8px)
--space-3: 0.75rem   (12px)
--space-4: 1rem      (16px)

--font-size-sm: 0.875rem
--font-size-base: 1rem

--transition-fast: 150ms ease
--radius-md: 0.375rem (6px)
--z-dropdown: 100
```

## Accessibility Essentials
```javascript
// Toggle button ARIA
btn.setAttribute('aria-pressed', isEnabled.toString());
btn.setAttribute('aria-label', 'Toggle comparison');

// Panel ARIA
panel.setAttribute('aria-hidden', !isEnabled);
panel.setAttribute('role', 'region');
panel.setAttribute('aria-label', 'Comparison panel');

// Live regions
region.setAttribute('aria-live', 'polite');
region.setAttribute('role', 'status');
```

## Module Public API
```javascript
// src/ui/comparison-mode.js exports
export function initComparisonMode() { }
export function toggle() { }
export function enable() { }
export function disable() { }
export function isEnabled() { }
export function setClassifications(classifications) { }
export function destroy() { }

// Called from src/ui/index.js
import * as comparisonMode from './comparison-mode.js';

init() {
  comparisonMode.initComparisonMode();
}

destroy() {
  comparisonMode.destroy();
}
```

## Error Handling Template
```javascript
try {
  if (!precondition) throw new Error('message');
  // do operation
  document.dispatchEvent(new CustomEvent('koppen:success'));
} catch (error) {
  console.error('[Koppen] Error:', error);
  showUserFeedback(error.message, 'error');
}
```

## Cross-Panel Coordination
```javascript
// When opening comparison, close other panels
function enableComparison() {
  document.dispatchEvent(new CustomEvent('koppen:close-panels', {
    detail: { except: 'comparison' }
  }));
  // ... then enable
}

// When another panel requests close
document.addEventListener('koppen:close-panels', (e) => {
  if (e.detail?.except !== 'comparison') {
    disableComparison();
  }
});
```

## Testing Template
```javascript
// 1. Dispatch control event
document.dispatchEvent(new CustomEvent('koppen:toggle-comparison'));

// 2. Check module state
assert(comparisonMode.isEnabled() === true);

// 3. Check DOM updates
assert(comparisonPanel.classList.contains('comparison-panel--active'));

// 4. Verify event cascade
let eventReceived = false;
document.addEventListener('koppen:comparison-enabled', () => {
  eventReceived = true;
});
// trigger action
assert(eventReceived === true);

// 5. Test coordination
document.dispatchEvent(new CustomEvent('koppen:close-panels', {
  detail: { except: 'builder' }
}));
// Should trigger comparison close
assert(comparisonMode.isEnabled() === false);
```

## Key Differences from Epic 4
- **Simpler toggle** (not a full panel with sliders)
- **Conditional rendering** (shows when enabled)
- **Legend integration** (may need to update legend with comparison data)
- **Coordinate with map updates** (when classifications change)

## Files to Modify
1. `/src/ui/index.js` - Import and init comparison-mode
2. `/src/ui/comparison-mode.js` - NEW file (main implementation)
3. `/src/style.css` - Add CSS for toggle + panel (end of file)
4. `/src/main.js` - Add keyboard shortcut? (optional)

## Verification Checklist
- [ ] ESLint passes: `npm run lint`
- [ ] TypeScript passes: `npx tsc --noEmit` (if used)
- [ ] Build succeeds: `npm run build`
- [ ] Dev server starts: `npm run dev`
- [ ] Toggle button appears in header
- [ ] Toggle dispatches events
- [ ] Panel shows/hides correctly
- [ ] Close panels event works
- [ ] Accessibility attributes present
- [ ] Console has no errors
