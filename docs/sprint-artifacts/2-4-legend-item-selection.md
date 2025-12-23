# Story 2.4: Legend Item Selection

## Story
**As a** user,
**I want** to click a climate type in the legend to select it,
**So that** I can focus on a specific climate type.

## Status
- **Epic:** 2 - Interactive Map Exploration
- **Story ID:** 2.4
- **FRs Covered:** FR7 (Click legend to select), FR9 (Selected type indication)
- **Prerequisites:** Story 2.3 (Climate Legend Display)

---

## Acceptance Criteria

### AC1: Click Selection
**Given** the legend is displayed
**When** I click on a legend item (e.g., "Cfa - Humid Subtropical")
**Then** that item is visually highlighted with `.legend__item--active` class
**And** the selection is clearly visible

### AC2: Single Selection
**Given** a legend item is already selected
**When** I click on a different item
**Then** the previously selected item is deselected
**And** the new item becomes selected

### AC3: Toggle Selection
**Given** a legend item is selected
**When** I click the same item again
**Then** the item is deselected
**And** no items are selected

### AC4: Selection Event
**Given** I click on a legend item
**When** the selection changes
**Then** `koppen:climate-selected` event fires with `{ type: 'Cfa' }`
**And** on deselection, `koppen:climate-deselected` event fires

### AC5: Keyboard Selection
**Given** I am using keyboard navigation
**When** a legend item has focus
**Then** pressing Enter or Space selects the item
**And** the same toggle behavior applies as mouse click

### AC6: Focus Visibility
**Given** I am navigating with keyboard
**When** an item receives focus
**Then** a visible focus indicator appears
**And** the indicator meets WCAG 2.1 requirements

### AC7: ARIA Attributes
**Given** a legend item is selected
**When** I check the DOM
**Then** the item has `aria-selected="true"`
**And** non-selected items have `aria-selected="false"`

---

## Technical Implementation

### Files to Modify
- `src/ui/legend.js` - Add selection handling

### Implementation Details

#### 1. Selection State Management
```javascript
// src/ui/legend.js - additions

let selectedType = null;

/**
 * Handle legend item selection
 * @param {string} type - Climate type code
 */
export function selectType(type) {
  // Toggle if already selected
  if (selectedType === type) {
    deselectType();
    return;
  }

  // Deselect previous
  if (selectedType) {
    const prevItem = legendElement.querySelector(`[data-type="${selectedType}"]`);
    if (prevItem) {
      prevItem.classList.remove('legend__item--active');
      prevItem.setAttribute('aria-selected', 'false');
    }
  }

  // Select new
  selectedType = type;
  const item = legendElement.querySelector(`[data-type="${type}"]`);
  if (item) {
    item.classList.add('legend__item--active');
    item.setAttribute('aria-selected', 'true');
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Dispatch event
  document.dispatchEvent(new CustomEvent('koppen:climate-selected', {
    detail: { type }
  }));

  console.log(`[Koppen] Climate selected: ${type}`);
}

/**
 * Deselect current type
 */
export function deselectType() {
  if (!selectedType) return;

  const item = legendElement.querySelector(`[data-type="${selectedType}"]`);
  if (item) {
    item.classList.remove('legend__item--active');
    item.setAttribute('aria-selected', 'false');
  }

  const previousType = selectedType;
  selectedType = null;

  // Dispatch event
  document.dispatchEvent(new CustomEvent('koppen:climate-deselected', {
    detail: { type: previousType }
  }));

  console.log(`[Koppen] Climate deselected: ${previousType}`);
}

/**
 * Get currently selected type
 * @returns {string|null}
 */
export function getSelectedType() {
  return selectedType;
}
```

#### 2. Update Event Handlers
```javascript
// src/ui/legend.js - update setupLegendEvents

function setupLegendEvents() {
  // Toggle button
  const toggle = legendElement.querySelector('.legend__toggle');
  if (toggle) {
    toggle.addEventListener('click', toggleLegend);
  }

  // Item clicks
  legendElement.addEventListener('click', (e) => {
    const item = e.target.closest('.legend__item');
    if (item) {
      selectType(item.dataset.type);
    }
  });

  // Keyboard navigation
  legendElement.addEventListener('keydown', handleKeyboard);

  // Listen for external selection (e.g., from map click)
  document.addEventListener('koppen:cell-selected', (e) => {
    if (e.detail.type) {
      selectType(e.detail.type);
    }
  });
}

function handleKeyboard(e) {
  const item = e.target.closest('.legend__item');
  if (!item) return;

  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      selectType(item.dataset.type);
      break;
    case 'Escape':
      deselectType();
      break;
    case 'ArrowDown':
      e.preventDefault();
      focusNextItem(item);
      break;
    case 'ArrowUp':
      e.preventDefault();
      focusPrevItem(item);
      break;
  }
}

function focusNextItem(current) {
  const items = Array.from(legendElement.querySelectorAll('.legend__item'));
  const idx = items.indexOf(current);
  const next = items[idx + 1] || items[0];
  next.focus();
}

function focusPrevItem(current) {
  const items = Array.from(legendElement.querySelectorAll('.legend__item'));
  const idx = items.indexOf(current);
  const prev = items[idx - 1] || items[items.length - 1];
  prev.focus();
}
```

#### 3. CSS for Active State
```css
/* Already in style.css, verify/enhance: */

.legend__item--active {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.legend__item--active .legend__code {
  color: var(--color-text-inverse);
}

.legend__item--active .legend__name {
  color: rgba(255, 255, 255, 0.9);
}

.legend__item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* High contrast focus for accessibility */
@media (prefers-contrast: more) {
  .legend__item:focus-visible {
    outline: 3px solid #000;
    outline-offset: 2px;
  }
}
```

#### 4. Export Updated Module
```javascript
// src/ui/legend.js - update default export
export default {
  init() {
    document.addEventListener('koppen:layer-ready', createLegend);
  },
  destroy,
  updateStats,
  selectType,
  deselectType,
  getSelectedType
};
```

---

## Testing Checklist

### Mouse Interaction
- [ ] Click on legend item selects it
- [ ] Selected item has visual highlight
- [ ] Click on different item switches selection
- [ ] Click on selected item deselects it
- [ ] Only one item selected at a time

### Keyboard Interaction
- [ ] Tab focuses legend items
- [ ] Enter/Space selects focused item
- [ ] Arrow Down moves to next item
- [ ] Arrow Up moves to previous item
- [ ] Escape deselects current item

### Events
- [ ] `koppen:climate-selected` fires on selection
- [ ] Event includes `{ type: 'xxx' }`
- [ ] `koppen:climate-deselected` fires on deselection
- [ ] Events logged to console

### Accessibility
- [ ] Focus indicator visible
- [ ] `aria-selected` updates correctly
- [ ] Screen reader announces selection

### Visual Feedback
- [ ] Active item clearly distinguishable
- [ ] Hover state distinct from active state
- [ ] Focus state distinct from active state

---

## Definition of Done
- [x] Click selects legend item
- [x] Visual highlight on selected item
- [x] Single selection enforced
- [x] Click again to deselect
- [x] `koppen:climate-selected` event dispatched
- [x] `koppen:climate-deselected` event dispatched
- [x] Enter/Space keyboard selection works
- [x] Arrow key navigation works
- [x] Focus indicator visible
- [x] `aria-selected` correctly set
- [x] No console errors

## Code Review Results

**Review Date:** 2024-12-22
**Reviewer:** Claude Code (AI Code Review)
**Status:** APPROVED

### Issues Found: 0

### Code Quality Assessment
- **Selection Logic:**
  - selectType() handles new selection with deselect of previous
  - deselectType() properly clears state and dispatches event
  - Toggle behavior implemented (click same item deselects)
- **Accessibility:**
  - aria-selected updates on state change
  - Keyboard handlers for Enter/Space/Escape/ArrowUp/ArrowDown
  - Focus management with scrollIntoView on selection
- **Events:**
  - koppen:climate-selected dispatched with { type } detail
  - koppen:climate-deselected dispatched with { type } detail
  - fromMap flag prevents circular event loops
- **Visual:**
  - .legend__item--active class provides clear highlight
  - Active state has distinct color (primary color background)

### Files Reviewed
- `/Users/NPope97/Koppen/koppen-app/src/ui/legend.js` - PASSED
