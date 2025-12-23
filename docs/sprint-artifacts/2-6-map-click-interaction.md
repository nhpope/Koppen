# Story 2.6: Map Click Interaction

## Story
**As a** user,
**I want** to click anywhere on the map to see that location's climate classification,
**So that** I can explore specific regions.

## Status
- **Epic:** 2 - Interactive Map Exploration
- **Story ID:** 2.6
- **FRs Covered:** FR4 (Click to view classification)
- **Prerequisites:** Story 2.2 (Climate Layer Rendering)

---

## Acceptance Criteria

### AC1: Cell Selection
**Given** the climate layer is displayed
**When** I click on a grid cell on the map
**Then** that grid cell is highlighted with a distinct border
**And** the cell stands out from surrounding cells

### AC2: Selection Event
**Given** I click on a climate cell
**When** the click is processed
**Then** `koppen:cell-selected` event fires with data:
```javascript
{
  lat: number,
  lng: number,
  type: 'Cfa',  // Köppen code
  name: 'Humid Subtropical',
  data: { /* full cell properties */ }
}
```

### AC3: Toggle Selection
**Given** a cell is currently selected
**When** I click the same cell again
**Then** the cell is deselected
**And** the highlight is removed
**And** `koppen:cell-deselected` event fires

### AC4: Single Selection
**Given** a cell is currently selected
**When** I click a different cell
**Then** the previous cell is deselected
**And** the new cell is selected
**And** only one cell has highlight at a time

### AC5: Base Map Click
**Given** I click on an area with no climate data (ocean, etc.)
**When** the click is processed
**Then** any previously selected cell is deselected
**And** no error occurs

### AC6: Coordinate Display
**Given** I click on a cell
**When** the selection occurs
**Then** the clicked coordinates are included in the event
**And** coordinates use standard lat/lng format

### AC7: Legend Sync
**Given** I click on a cell with type "Cfb"
**When** the selection occurs
**Then** the corresponding legend item is also selected
**And** the legend and map selection stay synchronized

---

## Technical Implementation

### Files to Modify
- `src/map/climate-layer.js` - Add selection highlight
- `src/map/index.js` - Handle base map clicks

### Implementation Details

#### 1. Cell Selection State
```javascript
// src/map/climate-layer.js - additions

let selectedLayer = null;

const SELECTED_STYLE = {
  color: '#1e293b',
  weight: 3,
  opacity: 1,
  dashArray: null
};

const DEFAULT_STYLE = {
  color: '#ffffff',
  weight: 0.5,
  opacity: 0.5
};

/**
 * Select a specific cell layer
 * @param {L.Layer} layer - The layer to select
 */
function selectCell(layer) {
  // Deselect previous
  if (selectedLayer) {
    selectedLayer.setStyle(DEFAULT_STYLE);
    selectedLayer.selected = false;
  }

  // If clicking same cell, just deselect
  if (selectedLayer === layer) {
    const props = selectedLayer.feature.properties;
    selectedLayer = null;

    document.dispatchEvent(new CustomEvent('koppen:cell-deselected', {
      detail: { type: props.climate_type }
    }));
    return;
  }

  // Select new cell
  selectedLayer = layer;
  layer.selected = true;
  layer.setStyle(SELECTED_STYLE);
  layer.bringToFront();

  const props = layer.feature.properties;

  document.dispatchEvent(new CustomEvent('koppen:cell-selected', {
    detail: {
      lat: props.lat,
      lon: props.lon,
      type: props.climate_type,
      name: props.climate_name,
      data: props
    }
  }));

  console.log(`[Koppen] Cell selected: ${props.climate_type} at [${props.lat}, ${props.lon}]`);
}

/**
 * Deselect current cell
 */
export function deselectCell() {
  if (selectedLayer) {
    const props = selectedLayer.feature.properties;
    selectedLayer.setStyle(DEFAULT_STYLE);
    selectedLayer.selected = false;
    selectedLayer = null;

    document.dispatchEvent(new CustomEvent('koppen:cell-deselected', {
      detail: { type: props.climate_type }
    }));
  }
}

/**
 * Get currently selected cell data
 */
export function getSelectedCell() {
  if (!selectedLayer) return null;
  return selectedLayer.feature.properties;
}
```

#### 2. Update Feature Click Handler
```javascript
// src/map/climate-layer.js - update onFeatureClick

function onFeatureClick(e) {
  L.DomEvent.stopPropagation(e);
  selectCell(e.target);
}
```

#### 3. Handle Base Map Clicks
```javascript
// src/map/index.js - additions

import { deselectCell } from './climate-layer.js';

// In init(), add map click handler:
map.on('click', (e) => {
  // Only deselect if clicking on base map (not a feature)
  // Features stop propagation, so this only fires for empty areas
  deselectCell();
});
```

#### 4. Sync with Legend Selection
```javascript
// src/map/climate-layer.js - update selectCell to sync legend

function selectCell(layer) {
  // ... existing selection logic ...

  // After dispatching koppen:cell-selected, the legend will hear it
  // and select the corresponding type (already implemented in legend.js)
}

// Also listen for legend selection to highlight cells
document.addEventListener('koppen:climate-selected', (e) => {
  // When legend selects a type, we could optionally
  // highlight all cells of that type, or just let
  // the filter handle it
});
```

#### 5. CSS for Selected Cell
```css
/* Add to style.css */

/* Selected cell highlight is handled via Leaflet setStyle,
   but add fallback and transitions */

.leaflet-interactive {
  transition: stroke-width 0.15s ease, stroke-opacity 0.15s ease;
}

/* Ensure selected cell is visually distinct */
.leaflet-interactive:focus {
  outline: none;
}
```

#### 6. Coordinate Utilities
```javascript
// src/utils/index.js - add coordinate formatter

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Formatted string
 */
export function formatCoordinates(lat, lng) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`;
}
```

---

## Testing Checklist

### Click Selection
- [ ] Click on cell selects it
- [ ] Selected cell has visible highlight (thick border)
- [ ] Click same cell deselects it
- [ ] Click different cell switches selection
- [ ] Only one cell selected at a time

### Events
- [ ] `koppen:cell-selected` fires on select
- [ ] Event includes lat, lon, type, name, data
- [ ] `koppen:cell-deselected` fires on deselect
- [ ] Events logged to console

### Base Map Click
- [ ] Click on ocean deselects cell
- [ ] Click on non-data area deselects cell
- [ ] No errors when clicking empty areas

### Legend Sync
- [ ] Cell selection updates legend selection
- [ ] Selected legend item matches cell type
- [ ] Deselecting cell deselects legend

### Visual Feedback
- [ ] Selected cell clearly stands out
- [ ] Highlight visible at all zoom levels
- [ ] Highlight doesn't obscure cell color

### Edge Cases
- [ ] Click on cell boundary handled
- [ ] Rapid clicks don't cause issues
- [ ] Selection persists through pan
- [ ] Selection persists through zoom

---

## Definition of Done
- [x] Click on cell selects it with visible highlight
- [x] Click again deselects it
- [x] Only one cell selected at a time
- [x] Click different cell switches selection
- [x] `koppen:cell-selected` event with full data
- [x] `koppen:cell-deselected` event on deselect
- [x] Click on empty area deselects
- [x] Legend syncs with cell selection
- [x] Highlight visible at all zoom levels
- [x] No console errors

## Code Review Results

**Review Date:** 2024-12-22
**Reviewer:** Claude Code (AI Code Review)
**Status:** APPROVED

### Issues Found: 0

### Code Quality Assessment
- **Selection Logic:**
  - selectCell() handles toggle (same cell), switch (different cell), and new selection
  - selectedLayer state properly tracked and reset
  - SELECTED_STYLE applied with 3px weight, 100% opacity for clear visibility
- **Event Data:**
  - koppen:cell-selected includes: lat, lon, type, name, group, data (full properties)
  - koppen:cell-deselected includes: type
  - L.DomEvent.stopPropagation prevents base map click handler
- **Legend Sync:**
  - Cell selection dispatches koppen:climate-selected with { type, fromMap: true }
  - fromMap flag prevents filter application (just legend highlight)
- **Base Map Click:**
  - Map 'click' listener calls deselectCell() and clearFilter()
  - Only fires when clicking non-feature area (features stop propagation)

### Files Reviewed
- `/Users/NPope97/Koppen/koppen-app/src/map/climate-layer.js` (selectCell, deselectCell) - PASSED
- `/Users/NPope97/Koppen/koppen-app/src/map/index.js` (base map click handler) - PASSED
