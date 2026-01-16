# Epic 4 Patterns - Start Here

## What's This?
Complete pattern analysis of Epic 4 (Builder/Threshold Sliders) extracted to guide Story 5-1 (Comparison Mode Toggle) implementation.

## Quick Start
1. **First time?** Read: `PATTERN_ANALYSIS_SUMMARY.txt` (5 min)
2. **Before coding?** Read: `PATTERN_QUICK_REFERENCE.md` (10 min)
3. **While coding?** Reference: `PATTERN_CODE_EXAMPLES.md` (copy-paste)
4. **Need details?** Read: `EPIC_4_PATTERN_ANALYSIS.md` (deep dive)
5. **Lost?** Check: `PATTERN_ANALYSIS_INDEX.md` (navigation guide)

## The 8 Rules You Must Follow

### 1. Event Listener Cleanup
```javascript
// Register with tracking
document.addEventListener('koppen:event', handler);
eventListeners.push({ event: 'koppen:event', handler });

// Cleanup in destroy()
eventListeners.forEach(({ event, handler }) => {
  document.removeEventListener(event, handler);
});
```

### 2. ARIA Sync with State
```javascript
// When toggling
element.setAttribute('aria-hidden', isOpen.toString());
button.setAttribute('aria-pressed', isEnabled.toString());
```

### 3. Use Design Tokens Only
```css
/* GOOD */
color: var(--color-primary);
padding: var(--space-4);

/* BAD */
color: #2563eb;
padding: 16px;
```

### 4. State → DOM → Event (always this order)
```javascript
function toggle() {
  // 1. State
  isEnabled = !isEnabled;

  // 2. DOM
  panel.classList.toggle('panel--active');

  // 3. Event
  dispatch('koppen:toggled', { isEnabled });
}
```

### 5. Check the "except" Property
```javascript
document.addEventListener('koppen:close-panels', (e) => {
  if (e.detail?.except !== 'comparison') {
    disable();
  }
});
```

### 6. BEM Class Naming
```css
.comparison-toggle { }           /* Block */
.comparison-toggle--active { }   /* Modifier */
.comparison-panel__header { }    /* Element */
.comparison-item__label { }      /* Sub-element */
```

### 7. ARIA on Interactive Elements
```javascript
button.setAttribute('aria-label', 'Toggle comparison');
button.setAttribute('aria-pressed', 'false');
panel.setAttribute('aria-hidden', 'true');
```

### 8. Destroy Cleans Everything
```javascript
destroy() {
  eventListeners.forEach(({ event, handler }) => {
    document.removeEventListener(event, handler);
  });
  eventListeners = [];
  panel = null;
  isEnabled = false;
}
```

## Files to Create/Modify

| File | Action | Lines | Pattern |
|------|--------|-------|---------|
| `src/ui/comparison-mode.js` | CREATE | 500-600 | Module pattern |
| `src/ui/index.js` | MODIFY | 4 | Import + init |
| `src/style.css` | MODIFY | 80-100 | CSS tokens + BEM |
| `src/main.js` | MODIFY | 2-5 | Optional: keyboard |

## Event Pattern

```
koppen:toggle-comparison              // Control event
koppen:comparison-enabled             // State event
  detail: { isComparing, activeClassifications }
koppen:comparison-disabled            // State event
  detail: { activeClassifications: [] }
koppen:close-panels (listen)
  detail: { except: 'comparison' }   // Others closing
```

## Module Structure

```javascript
export default {
  init() { /* setup */ },
  toggle() { /* toggle state */ },
  enable() { /* enable */ },
  disable() { /* disable */ },
  isEnabled() { /* return state */ },
  setClassifications(arr) { /* update data */ },
  destroy() { /* cleanup */ }
}
```

## CSS Structure

```
.comparison-toggle          (button)
├── hover: background-color
├── focus-visible: outline
├── --active: color + background

.comparison-panel           (container)
├── --active: transform (slide in)
├── __header, __content, __close
└── responsive: mobile transforms
```

## What to Test

- [ ] Toggle button appears in header
- [ ] Toggle dispatches events
- [ ] Panel shows/hides with transition
- [ ] ARIA attributes update
- [ ] Close-panels event works
- [ ] Keyboard shortcut works
- [ ] No console errors
- [ ] CSS uses only tokens
- [ ] destroy() removes listeners
- [ ] BEM naming correct

## Common Mistakes (DON'T DO THESE)

```javascript
// ❌ DON'T: Forget to track listeners
document.addEventListener('koppen:event', handler);

// ❌ DON'T: Hardcode colors
backgroundColor: '#2563eb'

// ❌ DON'T: Forget aria-hidden
panel.style.display = 'none';

// ❌ DON'T: Ignore except property
if (e.detail) closeComparison();

// ❌ DON'T: Use camelCase CSS classes
.comparisonToggle { }

// ❌ DON'T: Forget destroy cleanup
destroy() { }  // Nothing!
```

## Copy-Paste Templates

### Template 1: Module Wrapper
```javascript
// src/ui/comparison-mode.js
let isComparisonEnabled = false;
let selectedClassifications = [];
let comparisonPanel = null;
let eventListeners = [];

function setupEventListeners() {
  const handler = (e) => { /* ... */ };
  document.addEventListener('koppen:close-panels', handler);
  eventListeners.push({ event: 'koppen:close-panels', handler });
}

function enable() {
  isComparisonEnabled = true;
  comparisonPanel.classList.add('comparison-panel--active');
  document.dispatchEvent(new CustomEvent('koppen:comparison-enabled', {
    detail: { activeClassifications: selectedClassifications }
  }));
}

export default { init, enable, disable, toggle, destroy };
```

### Template 2: Update UI Index
```javascript
// In src/ui/index.js
import comparisonMode from './comparison-mode.js';

export default {
  init() {
    // ... existing init code
    comparisonMode.init();
  },
  destroy() {
    // ... existing destroy code
    comparisonMode.destroy();
  }
}
```

### Template 3: CSS Classes
```css
.comparison-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  width: 36px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.comparison-toggle--active {
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
}

.comparison-panel {
  position: absolute;
  right: var(--space-4);
  transform: translateX(calc(100% + var(--space-4)));
  transition: transform var(--transition-normal);
}

.comparison-panel--active {
  transform: translateX(0);
}
```

## Verification Checklist

Before marking done:
- [ ] `npm run lint` - 0 errors
- [ ] `npm run build` - 0 errors
- [ ] `npm run dev` - app starts
- [ ] Toggle button visible
- [ ] Events dispatch (DevTools console)
- [ ] Panel slides in/out smoothly
- [ ] ARIA attributes present
- [ ] Close panels coordination works
- [ ] No memory leaks (destroy cleans up)
- [ ] CSS uses only tokens
- [ ] Console clean (no errors/warnings)

## Where to Find More Details

| Question | Answer |
|----------|--------|
| Where to put files? | `PATTERN_QUICK_REFERENCE.md` |
| How to name events? | `PATTERN_QUICK_REFERENCE.md` |
| Full code example? | `PATTERN_CODE_EXAMPLES.md` |
| Why this pattern? | `EPIC_4_PATTERN_ANALYSIS.md` |
| Confused? Lost? | `PATTERN_ANALYSIS_INDEX.md` |

## Summary

This folder contains 5 documents with 70+ pages of pattern documentation for Story 5-1.

**Start with:** `PATTERN_ANALYSIS_SUMMARY.txt` (this is your roadmap)
**Then read:** `PATTERN_QUICK_REFERENCE.md` (memorize these patterns)
**While coding:** Use `PATTERN_CODE_EXAMPLES.md` (templates to adapt)
**If stuck:** Check `EPIC_4_PATTERN_ANALYSIS.md` (detailed explanations)

Good luck! Follow the patterns exactly and you'll nail it.
