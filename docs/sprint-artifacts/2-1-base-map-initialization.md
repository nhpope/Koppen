# Story 2.1: Base Map Initialization

## Story

**As a** user,
**I want** to see an interactive world map when I open the application,
**So that** I can begin exploring climate zones.

## Status

| Field | Value |
|-------|-------|
| **Epic** | 2 - Interactive Map Exploration |
| **Story ID** | 2.1 |
| **Status** | review |
| **Prerequisites** | Story 1.5 (Data Loading Utility) |
| **Story Points** | 3 |

## Requirements Traceability

**PRD References:** `/Users/NPope97/Koppen/docs/prd.md`
- Implements FR1 (Global map view with pan and zoom)
- Implements FR2 (Zoom levels 2-10, world to city)
- Implements FR3 (Touch gesture support)
- Supports NFR1 (Performance - smooth 60fps interactions)

**Architecture References:** `/Users/NPope97/Koppen/docs/architecture.md`
- **Map library:** Lines 122-127 (Leaflet 1.9.4)
- **Module structure:** Lines 402-405 (map module responsibilities)
- **Event pattern:** Lines 282-298 (koppen:map-ready event)
- **Init pattern:** Lines 255-263 (init/destroy lifecycle)

## Business Value

### User Impact
**User Type:** All end users
**Value Delivered:** Interactive map provides engaging entry point to explore climate data

### Success Metrics
- **Initialization time:** <1 second from page load
- **Interaction smoothness:** 60fps pan/zoom
- **Mobile compatibility:** Works on 95%+ of touch devices

## Acceptance Criteria

**Given** I open the Köppen application
**When** the page loads
**Then** a full-viewport Leaflet map is displayed centered at [20, 0] with zoom level 2

**And** zoom controls (+/-) are visible and functional
**And** I can pan by clicking and dragging
**And** I can zoom with mouse wheel (desktop) or pinch (mobile)
**And** zoom is constrained between levels 2 (min) and 10 (max)
**And** koppen:map-ready custom event is dispatched after initialization
**And** map resizes correctly when browser window changes

## Expected Outputs

**src/map/index.js:** Complete map module with Leaflet initialization, base layer, and event handling.

## Implementation Tasks

### Task 2.1.1: Implement map initialization
- Create src/map/index.js with Leaflet map setup
- Configure zoom levels (2-10), center [20, 0]
- Add CartoDB Positron base layer

### Task 2.1.2: Add map container to HTML
- Update index.html with map-container div
- Ensure full-viewport layout

### Task 2.1.3: Verify zoom and pan controls
- Test zoom buttons, scroll wheel, touch gestures
- Verify smooth 60fps performance

### Task 2.1.4: Verify events fire
- Check koppen:map-ready event dispatches
- Test koppen:view-changed on pan/zoom

## Test Requirements

### Unit Tests
- Map initializes successfully
- koppen:map-ready event fires
- Zoom levels constrained to 2-10

### E2E Tests
- Map displays on page load
- Zoom controls functional
- Pan navigation works

### Quality Gates
- ✅ Map initializes in <1 second
- ✅ 60fps pan/zoom performance
- ✅ No console errors
- ✅ All tests passing

## Definition of Done

- [ ] Map displays full-viewport
- [ ] Zoom/pan controls work
- [ ] Events dispatch correctly
- [ ] Tests passing
- [ ] Code reviewed

## Technical Notes

**Leaflet Config:** worldCopyJump, maxBounds, min/max zoom
**Base Layer:** CartoDB Positron (minimal, fast)

## References
- **PRD:** FR1, FR2, FR3, NFR1
- **Architecture:** Lines 122-127, 402-405, 282-298
- **Leaflet:** https://leafletjs.com
