# Story 2.3: Climate Legend Display

## Story
**As a** user,
**I want** to see a legend showing all climate type codes and colors,
**So that** I can understand what each color represents.

## Status
- **Epic:** 2 - Interactive Map Exploration
- **Story ID:** 2.3
- **FRs Covered:** FR6 (Legend with 30 climate types)
- **Prerequisites:** Story 2.2 (Climate Layer Rendering)

---

## Acceptance Criteria

### AC1: Legend Panel Display
**Given** the map is displaying climate zones
**When** I view the legend panel
**Then** I see all 30 Köppen climate types listed
**And** the legend is visible on page load

### AC2: Legend Item Content
**Given** the legend is displayed
**When** I view a legend item
**Then** each entry shows:
- Color swatch (16x16px matching map color)
- Climate code (e.g., "Af")
- Climate name (e.g., "Tropical Rainforest")

### AC3: Category Grouping
**Given** the legend is displayed
**When** I view the categories
**Then** types are grouped by main category:
- A (Tropical) - 4 types
- B (Arid) - 4 types
- C (Temperate) - 9 types
- D (Continental) - 12 types
- E (Polar) - 2 types
**And** each group has a visible header

### AC4: Legend Position
**Given** the map is displayed
**When** I look for the legend
**Then** the legend is positioned in the bottom-left corner
**And** it doesn't overlap with zoom controls

### AC5: Scrollable Content
**Given** the legend contains all 30 types
**When** the legend exceeds viewport height
**Then** the legend content is scrollable
**And** the scroll area has max-height constraint

### AC6: Mobile Collapsibility
**Given** I am on a mobile device (< 768px)
**When** I view the legend
**Then** the legend can be collapsed/expanded
**And** it shows only a toggle button when collapsed

### AC7: Keyboard Navigation
**Given** I am using keyboard navigation
**When** I Tab to the legend
**Then** I can navigate through legend items with Tab
**And** focus indicators are visible

---

## Technical Implementation

### Files to Modify
- `src/ui/legend.js` - Legend component (already exists, enhance)

### Implementation Details

#### 1. Legend Component Structure
```javascript
// src/ui/legend.js
import { CLIMATE_COLORS, getClimateColor } from '../utils/colors.js';
import { CLIMATE_TYPES } from '../climate/koppen-rules.js';

let legendElement = null;
let isCollapsed = false;

// Climate type groups
const CLIMATE_GROUPS = {
  A: { name: 'Tropical', types: ['Af', 'Am', 'Aw', 'As'] },
  B: { name: 'Arid', types: ['BWh', 'BWk', 'BSh', 'BSk'] },
  C: { name: 'Temperate', types: ['Csa', 'Csb', 'Csc', 'Cwa', 'Cwb', 'Cwc', 'Cfa', 'Cfb', 'Cfc'] },
  D: { name: 'Continental', types: ['Dsa', 'Dsb', 'Dsc', 'Dsd', 'Dwa', 'Dwb', 'Dwc', 'Dwd', 'Dfa', 'Dfb', 'Dfc', 'Dfd'] },
  E: { name: 'Polar', types: ['ET', 'EF'] }
};

export function createLegend() {
  const container = document.getElementById('legend-container');
  if (!container) return;

  legendElement = container;
  container.innerHTML = buildLegendHTML();

  setupLegendEvents();

  console.log('[Koppen] Legend created');
}

function buildLegendHTML() {
  return `
    <div class="legend__header">
      <h2 class="legend__title">Climate Types</h2>
      <button class="legend__toggle" aria-label="Toggle legend" aria-expanded="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 6l4 4 4-4"/>
        </svg>
      </button>
    </div>
    <div class="legend__content">
      ${Object.entries(CLIMATE_GROUPS).map(([key, group]) => `
        <div class="legend__group" data-group="${key}">
          <h3 class="legend__group-title">${group.name} (${key})</h3>
          ${group.types.map(type => buildLegendItem(type)).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

function buildLegendItem(type) {
  const info = CLIMATE_TYPES[type] || { name: type };
  const color = getClimateColor(type);

  return `
    <button class="legend__item"
            data-type="${type}"
            tabindex="0"
            role="option"
            aria-selected="false">
      <span class="legend__color" style="background-color: ${color}"></span>
      <span class="legend__label">
        <span class="legend__code">${type}</span>
        <span class="legend__name">${info.name}</span>
      </span>
    </button>
  `;
}

function setupLegendEvents() {
  // Toggle button
  const toggle = legendElement.querySelector('.legend__toggle');
  if (toggle) {
    toggle.addEventListener('click', toggleLegend);
  }

  // Item clicks (handled in Story 2.4)
  legendElement.addEventListener('click', (e) => {
    const item = e.target.closest('.legend__item');
    if (item) {
      const type = item.dataset.type;
      document.dispatchEvent(new CustomEvent('koppen:legend-item-click', {
        detail: { type }
      }));
    }
  });

  // Keyboard navigation
  legendElement.addEventListener('keydown', handleKeyboard);
}

function toggleLegend() {
  isCollapsed = !isCollapsed;
  legendElement.classList.toggle('legend--collapsed', isCollapsed);

  const toggle = legendElement.querySelector('.legend__toggle');
  if (toggle) {
    toggle.setAttribute('aria-expanded', !isCollapsed);
  }
}

function handleKeyboard(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    const item = e.target.closest('.legend__item');
    if (item) {
      e.preventDefault();
      item.click();
    }
  }
}

export function updateStats(stats) {
  // Update legend with classification stats (count per type)
  if (!stats) return;

  Object.entries(stats).forEach(([type, count]) => {
    const item = legendElement.querySelector(`[data-type="${type}"]`);
    if (item) {
      let countEl = item.querySelector('.legend__count');
      if (!countEl) {
        countEl = document.createElement('span');
        countEl.className = 'legend__count';
        item.appendChild(countEl);
      }
      countEl.textContent = count.toLocaleString();
    }
  });
}

export function destroy() {
  if (legendElement) {
    legendElement.innerHTML = '';
    legendElement = null;
  }
}

export default {
  init() {
    document.addEventListener('koppen:layer-ready', createLegend);
  },
  destroy,
  updateStats
};
```

#### 2. Climate Types Data
```javascript
// src/climate/koppen-rules.js - CLIMATE_TYPES addition
export const CLIMATE_TYPES = {
  // Tropical (A)
  Af: { name: 'Tropical Rainforest', group: 'A' },
  Am: { name: 'Tropical Monsoon', group: 'A' },
  Aw: { name: 'Tropical Savanna', group: 'A' },
  As: { name: 'Tropical Savanna (Dry Summer)', group: 'A' },

  // Arid (B)
  BWh: { name: 'Hot Desert', group: 'B' },
  BWk: { name: 'Cold Desert', group: 'B' },
  BSh: { name: 'Hot Steppe', group: 'B' },
  BSk: { name: 'Cold Steppe', group: 'B' },

  // Temperate (C)
  Csa: { name: 'Mediterranean Hot Summer', group: 'C' },
  Csb: { name: 'Mediterranean Warm Summer', group: 'C' },
  Csc: { name: 'Mediterranean Cold Summer', group: 'C' },
  Cwa: { name: 'Humid Subtropical Dry Winter', group: 'C' },
  Cwb: { name: 'Subtropical Highland Dry Winter', group: 'C' },
  Cwc: { name: 'Subpolar Oceanic Dry Winter', group: 'C' },
  Cfa: { name: 'Humid Subtropical', group: 'C' },
  Cfb: { name: 'Oceanic', group: 'C' },
  Cfc: { name: 'Subpolar Oceanic', group: 'C' },

  // Continental (D)
  Dsa: { name: 'Mediterranean Continental Hot', group: 'D' },
  Dsb: { name: 'Mediterranean Continental Warm', group: 'D' },
  Dsc: { name: 'Mediterranean Continental Cold', group: 'D' },
  Dsd: { name: 'Mediterranean Continental Very Cold', group: 'D' },
  Dwa: { name: 'Monsoon Continental Hot', group: 'D' },
  Dwb: { name: 'Monsoon Continental Warm', group: 'D' },
  Dwc: { name: 'Monsoon Continental Cold', group: 'D' },
  Dwd: { name: 'Monsoon Continental Very Cold', group: 'D' },
  Dfa: { name: 'Humid Continental Hot', group: 'D' },
  Dfb: { name: 'Humid Continental Warm', group: 'D' },
  Dfc: { name: 'Subarctic', group: 'D' },
  Dfd: { name: 'Subarctic Severe Winter', group: 'D' },

  // Polar (E)
  ET: { name: 'Tundra', group: 'E' },
  EF: { name: 'Ice Cap', group: 'E' }
};
```

#### 3. CSS Styles (in style.css - already exists)
The CSS for `.legend`, `.legend__header`, `.legend__item`, etc. is already defined in the base styles.

---

## Testing Checklist

### Manual Testing
- [ ] Legend appears on page load
- [ ] All 30 climate types are listed
- [ ] Each item shows color, code, and name
- [ ] Types are grouped by category (A, B, C, D, E)
- [ ] Group headers are visible
- [ ] Legend is in bottom-left corner
- [ ] Content is scrollable when full
- [ ] Toggle button collapses/expands legend
- [ ] Keyboard Tab navigates through items
- [ ] Focus indicators visible on items

### Responsive Testing
- [ ] Desktop: legend visible and readable
- [ ] Tablet: legend visible, may need scrolling
- [ ] Mobile (< 768px): legend starts collapsed or compact

### Accessibility
- [ ] All items are keyboard focusable
- [ ] Toggle has aria-expanded attribute
- [ ] Items have role="option"
- [ ] Color swatches are decorative (not sole information carrier)

---

## Definition of Done
- [x] Legend displays all 30 Köppen types
- [x] Color swatches match map colors
- [x] Types grouped by category with headers
- [x] Legend positioned bottom-left
- [x] Content scrollable when exceeds height
- [x] Collapse/expand toggle works
- [x] Keyboard navigation functional
- [x] Mobile responsive behavior
- [x] No console errors
- [x] Code follows module pattern

## Code Review Results

**Review Date:** 2024-12-22
**Reviewer:** Claude Code (AI Code Review)
**Status:** APPROVED (with 1 MEDIUM fix applied)

### Issues Found: 1 MEDIUM

#### MEDIUM: Missing CSS for .legend__name base style (FIXED)
**File:** `/Users/NPope97/Koppen/koppen-app/src/style.css`
**Issue:** `.legend__name` class used in HTML but only had active state style defined
**Impact:** Climate type names displayed without proper styling in non-active state
**Fix Applied:** Added base `.legend__name` style with secondary color and proper spacing

### Code Quality Assessment
- **Architecture:** Clean module pattern with render/setup/event separation
- **Accessibility:**
  - ARIA attributes (aria-selected, aria-expanded) correctly implemented
  - Keyboard navigation (ArrowUp/Down, Enter, Space, Escape) working
  - Focus indicators present
- **Grouping:** All 5 groups (A-Tropical, B-Arid, C-Temperate, D-Continental, E-Polar) properly defined
- **Events:** koppen:layer-ready triggers stats update

### Files Reviewed
- `/Users/NPope97/Koppen/koppen-app/src/ui/legend.js` - PASSED
- `/Users/NPope97/Koppen/koppen-app/src/style.css` (legend styles) - FIXED and PASSED
