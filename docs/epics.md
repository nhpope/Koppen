---
stepsCompleted: [0, 1, 2, 3]
inputDocuments:
  - 'docs/prd.md'
  - 'docs/architecture.md'
workflowType: 'epics-and-stories'
status: 'complete'
completedAt: '2025-12-05'
project_name: 'Koppen'
user_name: 'NPope97'
date: '2025-12-05'
---

# Koppen - Epic Breakdown

**Author:** NPope97
**Date:** 2025-12-05
**Project Level:** MVP
**Target Scale:** Open-source educational tool

---

## Overview

This document provides the complete epic and story breakdown for Koppen, decomposing the requirements from the [PRD](./prd.md) into implementable stories with full technical context from [Architecture](./architecture.md).

---

## Context Validation

### Documents Loaded

| Document | Status | Key Content |
|----------|--------|-------------|
| **PRD** | ✅ Loaded | 42 FRs, 26 NFRs, 4 user journeys |
| **Architecture** | ✅ Loaded | Vite + Vanilla JS, Leaflet, TopoJSON, 6 modules |
| **UX Design** | ⚪ Not found | Not required - PRD contains sufficient UI guidance |

### Technical Context Summary

**Stack:** Vite 7.2.6 + Vanilla JavaScript + Leaflet.js 1.9.4 + TopoJSON 3.0.2

**Module Structure:**
- `src/map/` - Leaflet integration, layers, controls
- `src/climate/` - Köppen classification engine
- `src/builder/` - Classification builder UI
- `src/export/` - PNG/URL/JSON export
- `src/ui/` - Legend, tooltips, climate info
- `src/utils/` - Data loading, URL state, colors

**Key Patterns:**
- BEM CSS naming
- `koppen:` event namespace
- Feature-based ES6 modules with init/destroy pattern
- URL-as-save-file for state persistence

---

## Functional Requirements Inventory

### Map Exploration (FR1-5)
- **FR1:** Interactive 2D map displaying Köppen-Geiger classifications globally
- **FR2:** Zoom in/out functionality
- **FR3:** Pan/scroll navigation
- **FR4:** Click on location to view classification
- **FR5:** Color-coded climate regions

### Climate Legend & Selection (FR6-9)
- **FR6:** Legend showing all 30 Köppen types with codes/names
- **FR7:** Click legend item to select climate type
- **FR8:** Filter map to show only selected climate type
- **FR9:** Visual indication of selected climate type

### Climate Profiles (FR10-14)
- **FR10:** Profile panel for selected climate type
- **FR11:** Short description of climate meaning
- **FR12:** Classification rules/thresholds display
- **FR13:** Example locations with same classification
- **FR14:** Expandable terminology explanations

### Classification Builder (FR15-21)
- **FR15:** Access builder via "Create" button
- **FR16:** Start from Köppen preset
- **FR17:** Start from scratch with blank rules
- **FR18:** Temperature threshold sliders/inputs
- **FR19:** Precipitation threshold sliders/inputs
- **FR20:** Real-time map updates on adjustment
- **FR21:** Name custom classification system

### Comparison Mode (FR22-25)
- **FR22:** Switch between custom and Köppen views
- **FR23:** Tabbed interface for comparison
- **FR24:** Show changed regions between systems
- **FR25:** Display threshold differences

### Export & Sharing (FR26-32)
- **FR26:** PNG export of current map view
- **FR27:** Filtered map export (selected types only)
- **FR28:** Watermark on exported images
- **FR29:** Generate shareable URL with encoded rules
- **FR30:** Open shared URL to view custom classification
- **FR31:** JSON export of ruleset
- **FR32:** JSON import of ruleset

### URL State Management (FR33-35)
- **FR33:** URL reflects application state
- **FR34:** Bookmarkable/shareable URLs
- **FR35:** Shared URLs open in comparison mode

### Forking & Iteration (FR36-37)
- **FR36:** Fork shared classification to create variant
- **FR37:** Iterate on imported rulesets

### Monetization & Attribution (FR38-39)
- **FR38:** Ko-fi donation link in header
- **FR39:** Project information accessible

### Accessibility & Usability (FR40-42)
- **FR40:** Keyboard navigation for legend/controls
- **FR41:** Accessible color contrast
- **FR42:** ARIA labels for screen readers

---

## Epic Structure Plan

### Epic Overview

| Epic | Title | User Value | FRs Covered |
|------|-------|------------|-------------|
| **1** | Foundation & Data Pipeline | Enable development and load climate data | Infrastructure |
| **2** | Interactive Map Exploration | Users can explore the Köppen map | FR1-5, FR6-9 |
| **3** | Climate Information & Profiles | Users understand climate classifications | FR10-14, FR40-42 |
| **4** | Classification Builder | Users create custom classification systems | FR15-21 |
| **5** | Comparison & Analysis | Users compare custom vs Köppen systems | FR22-25 |
| **6** | Export, Share & Monetization | Users export maps and share discoveries | FR26-39 |

### Epic Dependencies

```
Epic 1 (Foundation)
    │
    ▼
Epic 2 (Map) ──────► Epic 3 (Profiles)
    │                    │
    ▼                    ▼
Epic 4 (Builder) ──► Epic 5 (Comparison)
    │                    │
    └────────┬───────────┘
             ▼
        Epic 6 (Export/Share)
```

---

## Epic 1: Foundation & Data Pipeline

**Goal:** Establish the project infrastructure, development environment, and climate data pipeline so all subsequent features have a solid foundation.

**User Value:** While not directly user-facing, this epic enables the entire application to exist and ensures climate data is accurate and performant.

**Technical Context:** Vite vanilla template, TopoJSON data format, GitHub Pages deployment

---

### Story 1.1: Project Scaffolding

As a **developer**,
I want **the project initialized with Vite vanilla template and core dependencies**,
So that **I have a working development environment with hot reload**.

**Acceptance Criteria:**

**Given** a fresh development environment
**When** I run the initialization commands
**Then** the project structure matches Architecture specification:
```
koppen/
├── src/
│   ├── main.js
│   └── style.css
├── public/
├── package.json
├── vite.config.js
└── index.html
```

**And** `npm run dev` starts development server on localhost:5173
**And** `npm run build` produces optimized production build in `dist/`
**And** Leaflet.js 1.9.4 and topojson-client 3.1.0 are installed

**Technical Notes:**
- Use `npm create vite@latest koppen -- --template vanilla`
- Install: `npm install leaflet topojson-client`
- Configure vite.config.js for production base path (GitHub Pages)

**Prerequisites:** None

---

### Story 1.2: Module Structure Setup

As a **developer**,
I want **the feature-based module structure created with placeholder files**,
So that **all team members (AI agents) know where code belongs**.

**Acceptance Criteria:**

**Given** the initialized project
**When** I create the module structure
**Then** the following directories and index files exist:
- `src/map/index.js` - Map module placeholder
- `src/climate/index.js` - Climate engine placeholder
- `src/builder/index.js` - Builder placeholder
- `src/export/index.js` - Export placeholder
- `src/ui/index.js` - UI components placeholder
- `src/utils/index.js` - Utilities placeholder

**And** each module exports a default object with `init()` and `destroy()` methods
**And** `src/main.js` imports and initializes core modules

**Technical Notes:**
- Follow Architecture module pattern exactly
- Use ES6 module syntax throughout
- Each index.js should have placeholder implementation

**Prerequisites:** Story 1.1

---

### Story 1.3: Base Styles & CSS Architecture

As a **developer**,
I want **global styles and CSS variables established**,
So that **all components have consistent styling foundation**.

**Acceptance Criteria:**

**Given** the project structure exists
**When** I set up the CSS architecture
**Then** `src/style.css` contains:
- CSS reset/normalize
- CSS variables for Köppen climate colors (all 30 types)
- BEM-structured base classes
- Responsive breakpoints (desktop 1024+, tablet 768-1023, mobile <768)
- Loading state classes (`.is-loading`, `.is-error`, `.is-active`)

**And** Leaflet CSS is properly imported
**And** the page renders a full-viewport container for the map

**Technical Notes:**
- Köppen colors should follow Beck et al. conventions
- Use CSS custom properties for all colors
- Mobile-first breakpoints with desktop enhancements

**Prerequisites:** Story 1.2

---

### Story 1.4: Climate Data Pipeline

As a **developer**,
I want **a Python script that converts ERA5 climate data to TopoJSON**,
So that **the application has accurate, compressed climate data**.

**Acceptance Criteria:**

**Given** ERA5 NetCDF climate data (1991-2020 monthly normals)
**When** I run the preprocessing script
**Then** `public/data/climate.topojson` is generated containing:
- All grid cells at 0.25° resolution
- Properties for each cell: `lat`, `lng`, `climate_type`, monthly T/P values
- Köppen classification computed per Beck et al. 2018 rules
- File size < 5MB gzipped

**And** a validation script confirms classification accuracy
**And** `scripts/requirements.txt` lists Python dependencies

**Technical Notes:**
- Use xarray for NetCDF processing
- Use topojson library for conversion
- Include sample/test data for development

**Prerequisites:** Story 1.1

---

### Story 1.5: Data Loading Utility

As a **developer**,
I want **a utility module that loads and parses the TopoJSON climate data**,
So that **other modules can access climate data consistently**.

**Acceptance Criteria:**

**Given** the climate.topojson file exists in public/data/
**When** the application initializes
**Then** `src/utils/data-loader.js`:
- Fetches climate.topojson asynchronously
- Parses TopoJSON to GeoJSON features
- Exposes `getClimateData()` returning Promise<GeoJSON>
- Dispatches `koppen:data-loaded` event on completion
- Shows loading state during fetch
- Handles errors gracefully with user message

**And** data is cached after first load
**And** loading takes < 3 seconds on 4G connection

**Technical Notes:**
- Use topojson-client for conversion
- Implement error boundary with retry option
- Fire custom events per Architecture patterns

**Prerequisites:** Story 1.4

---

### Story 1.6: GitHub Actions Deployment

As a **developer**,
I want **automated deployment to GitHub Pages on push to main**,
So that **the application is always up-to-date**.

**Acceptance Criteria:**

**Given** code is pushed to the main branch
**When** GitHub Actions workflow runs
**Then** `.github/workflows/deploy.yml`:
- Runs `npm ci` and `npm run build`
- Deploys `dist/` to GitHub Pages
- Completes in < 2 minutes

**And** the deployed site is accessible at the configured domain
**And** the workflow shows clear pass/fail status

**Technical Notes:**
- Use `actions/deploy-pages@v4`
- Configure vite.config.js base path for repo name
- Enable GitHub Pages in repository settings

**Prerequisites:** Story 1.1

---

## Epic 2: Interactive Map Exploration

**Goal:** Users can view and navigate the interactive Köppen climate map, seeing climate zones displayed with proper colors and zoom/pan controls.

**User Value:** "I can explore the world's climate zones interactively" - enables all user journeys (Alex, Jordan, Sam, Taylor)

**FRs Covered:** FR1-5, FR6-9

**Technical Context:** Leaflet.js integration, TopoJSON layer rendering, legend component

---

### Story 2.1: Base Map Initialization

As a **user**,
I want **to see an interactive world map when I open the application**,
So that **I can begin exploring climate zones**.

**Acceptance Criteria:**

**Given** I open the Koppen application
**When** the page loads
**Then** a full-viewport Leaflet map is displayed
**And** the map shows a neutral base layer (CartoDB Positron or similar)
**And** the map is centered on [0, 0] with zoom level 2 (world view)
**And** zoom controls are visible and functional
**And** I can pan by clicking and dragging
**And** I can zoom with scroll wheel or pinch gesture
**And** the map is responsive to window resize

**Technical Notes:**
- Implement in `src/map/index.js`
- Use Leaflet's setView and scrollWheelZoom options
- Fire `koppen:map-ready` event on initialization
- Set min/max zoom (2-10) to prevent over-zooming

**Prerequisites:** Story 1.5

---

### Story 2.2: Climate Layer Rendering

As a **user**,
I want **to see color-coded climate zones overlaid on the map**,
So that **I can visually identify different Köppen climate types**.

**Acceptance Criteria:**

**Given** the map is initialized and climate data is loaded
**When** the climate layer renders
**Then** each grid cell displays with its Köppen classification color
**And** all 30 Köppen types have distinct, consistent colors
**And** cell boundaries are visible but subtle (0.5px stroke)
**And** the layer renders in < 1 second after data load
**And** zoom/pan remains smooth (< 50ms response)

**Technical Notes:**
- Implement in `src/map/layers.js`
- Use Leaflet's L.geoJSON with style function
- Colors defined in `src/utils/colors.js`
- Consider canvas renderer for performance at low zoom

**Prerequisites:** Story 2.1, Story 1.5

---

### Story 2.3: Climate Legend Display

As a **user**,
I want **to see a legend showing all climate type codes and colors**,
So that **I can understand what each color represents**.

**Acceptance Criteria:**

**Given** the map is displaying climate zones
**When** I look at the legend panel
**Then** I see all 30 Köppen climate types listed
**And** each entry shows: color swatch, code (e.g., "Af"), and name (e.g., "Tropical Rainforest")
**And** types are grouped by main category (A, B, C, D, E)
**And** the legend is positioned in the bottom-left corner
**And** the legend is scrollable if it exceeds viewport height
**And** the legend is visible on desktop, collapsible on mobile

**Technical Notes:**
- Implement in `src/ui/legend.js`
- Use BEM classes: `.legend`, `.legend__group`, `.legend__item`
- Make legend a Leaflet Control for proper positioning
- Support keyboard navigation (FR40)

**Prerequisites:** Story 2.2

---

### Story 2.4: Legend Item Selection

As a **user**,
I want **to click a climate type in the legend to select it**,
So that **I can focus on a specific climate type**.

**Acceptance Criteria:**

**Given** the legend is displayed
**When** I click on a legend item (e.g., "Cfa - Humid Subtropical")
**Then** that item is visually highlighted with `.legend__item--active` class
**And** the previously selected item (if any) is deselected
**And** `koppen:climate-selected` event fires with `{ type: 'Cfa' }`
**And** clicking the same item again deselects it

**And** keyboard navigation works:
- Tab moves focus through legend items
- Enter/Space selects focused item
- Focus indicator is visible

**Technical Notes:**
- Add click and keyboard handlers to legend items
- Use aria-selected for accessibility
- Fire custom event for other modules to respond

**Prerequisites:** Story 2.3

---

### Story 2.5: Climate Type Filtering

As a **user**,
I want **the map to show only my selected climate type when I choose one**,
So that **I can see where that climate exists globally**.

**Acceptance Criteria:**

**Given** I have selected a climate type from the legend (e.g., "Csb")
**When** filter mode is active
**Then** only regions matching that climate type are colored
**And** non-matching regions are grayed out or hidden
**And** the map title/header shows "Showing: Csb - Mediterranean (Cool Summer)"
**And** I can clear the filter by clicking the selected legend item again
**And** the map updates within 100ms of selection

**Technical Notes:**
- Implement filter in `src/map/layers.js`
- Use style function that checks against selected type
- Preserve filter state for export feature (Epic 6)

**Prerequisites:** Story 2.4

---

### Story 2.6: Map Click Interaction

As a **user**,
I want **to click anywhere on the map to see that location's climate classification**,
So that **I can explore specific regions**.

**Acceptance Criteria:**

**Given** the climate layer is displayed
**When** I click on a location on the map
**Then** that grid cell is highlighted with a distinct border
**And** `koppen:cell-selected` event fires with `{ lat, lng, type, data }`
**And** if I click the same cell again, it deselects
**And** clicking a new cell deselects the previous one
**And** the click works on both colored cells and base map

**Technical Notes:**
- Add click handler to climate layer
- Store selected cell reference for highlighting
- Include full cell data in event for profile panel

**Prerequisites:** Story 2.2

---

## Epic 3: Climate Information & Profiles

**Goal:** Users can view detailed information about any climate type, understanding what it means, how it's defined, and where else it occurs.

**User Value:** "I understand what Csb actually means" - enables Jordan's homework and Sam's curiosity

**FRs Covered:** FR10-14, FR40-42

**Technical Context:** Climate info panel, profile data, accessibility requirements

---

### Story 3.1: Climate Profile Panel

As a **user**,
I want **to see a detailed profile panel when I select a climate type**,
So that **I can learn about that climate's characteristics**.

**Acceptance Criteria:**

**Given** I have selected a climate type (via legend or map click)
**When** the profile panel opens
**Then** I see a slide-in panel from the right containing:
- Climate code and full name as header (e.g., "Cfa - Humid Subtropical")
- Short description (1-2 sentences explaining the climate)
- Color swatch matching the map
**And** the panel has a close button (×)
**And** clicking outside the panel closes it
**And** Escape key closes the panel
**And** the panel is accessible via keyboard and screen reader

**Technical Notes:**
- Implement in `src/ui/climate-info.js`
- Listen for `koppen:climate-selected` and `koppen:cell-selected` events
- Use `.climate-info` BEM block
- Support both legend selection and map click

**Prerequisites:** Story 2.4, Story 2.6

---

### Story 3.2: Classification Rules Display

As a **user**,
I want **to see the exact rules that define a climate type**,
So that **I understand why a location gets that classification**.

**Acceptance Criteria:**

**Given** a climate profile panel is open
**When** I view the "Classification Rules" section
**Then** I see the threshold rules in human-readable format:
- For Cfa: "Coldest month > 0°C and < 18°C, Warmest month ≥ 22°C, No dry season"
**And** each threshold value is highlighted/formatted distinctly
**And** technical terms link to the glossary (expandable)
**And** the decision tree path is shown (e.g., "Not E → Not B → Not A → C → f → a")

**Technical Notes:**
- Store rules in `src/climate/koppen-rules.js`
- Create human-readable rule formatter
- Use Beck et al. 2018 exact thresholds

**Prerequisites:** Story 3.1

---

### Story 3.3: Example Locations

As a **user**,
I want **to see other locations that share this climate type**,
So that **I can understand the climate through familiar places**.

**Acceptance Criteria:**

**Given** a climate profile panel is open for type "Cfa"
**When** I view the "Also Found In" section
**Then** I see a list of 3-5 notable locations:
- "Buenos Aires, Argentina"
- "Shanghai, China"
- "Sydney, Australia"
- "Atlanta, USA"
**And** each location is clickable
**And** clicking a location pans the map to that location
**And** the list prioritizes geographically diverse examples

**Technical Notes:**
- Pre-compute example locations in data pipeline
- Store in `src/climate/presets.js` or as data property
- Include lat/lng for map navigation

**Prerequisites:** Story 3.1

---

### Story 3.4: Terminology Glossary

As a **user**,
I want **to expand unfamiliar terms in the profile**,
So that **I can understand classification terminology**.

**Acceptance Criteria:**

**Given** a classification rule contains a technical term (e.g., "Pthreshold")
**When** I click/tap on the term
**Then** an inline expansion appears explaining:
- "Pthreshold: The precipitation threshold for aridity, calculated as 2×MAT + 28 if 70%+ of rain falls in summer..."
**And** the expansion can be collapsed by clicking again
**And** terms are visually distinct (dotted underline, help cursor)
**And** expansions are accessible (aria-expanded, role="button")

**Technical Notes:**
- Implement as expandable component in `src/ui/`
- Store definitions in constants file
- Use progressive disclosure pattern

**Prerequisites:** Story 3.2

---

### Story 3.5: Hover Tooltips

As a **user**,
I want **to see quick climate info when hovering over the map**,
So that **I can explore without clicking**.

**Acceptance Criteria:**

**Given** the map is displayed with climate layer
**When** I hover over a grid cell
**Then** a tooltip appears near the cursor showing:
- Climate code and name (e.g., "Csb - Mediterranean")
- Coordinates (optional)
**And** the tooltip follows the cursor
**And** the tooltip disappears when I move away
**And** tooltips work on touch devices (long-press)
**And** tooltips don't interfere with click interactions

**Technical Notes:**
- Implement in `src/ui/tooltip.js`
- Use Leaflet's mouseover/mouseout events
- Consider debouncing for performance
- Disable on mobile (use tap instead)

**Prerequisites:** Story 2.2

---

## Epic 4: Classification Builder

**Goal:** Users can create custom climate classification systems by adjusting thresholds, with the map updating in real-time.

**User Value:** "I can experiment with my own classification rules" - core value for Alex's journey

**FRs Covered:** FR15-21

**Technical Context:** Builder UI, threshold sliders, real-time recalculation

---

### Story 4.1: Builder Panel Access

As a **user**,
I want **to access a classification builder via a "Create" button**,
So that **I can start building my own system**.

**Acceptance Criteria:**

**Given** I am viewing the map
**When** I click the "Create" button in the header
**Then** the builder panel slides in from the left
**And** the panel shows two options: "Start from Köppen" and "Start from Scratch"
**And** the map remains visible (panel overlays or shrinks map)
**And** I can close the builder with × or Escape
**And** the button changes to "Editing..." while builder is open

**Technical Notes:**
- Implement in `src/builder/index.js`
- Panel should be 300-400px wide on desktop
- Full-screen modal on mobile
- Fire `koppen:builder-opened` event

**Prerequisites:** Story 2.2

---

### Story 4.2: Köppen Preset Loading

As a **user**,
I want **to start building from the standard Köppen-Geiger preset**,
So that **I can modify the existing system**.

**Acceptance Criteria:**

**Given** the builder panel is open
**When** I click "Start from Köppen"
**Then** all threshold values are populated with Beck et al. 2018 values:
- Tropical min temp: 18°C
- C/D boundary: 0°C
- Hot summer: 22°C
- (all other thresholds)
**And** the builder interface shows all adjustable thresholds
**And** the map continues showing standard Köppen colors
**And** a label shows "Based on: Köppen-Geiger (Beck et al. 2018)"

**Technical Notes:**
- Load presets from `src/climate/presets.js`
- Store current state in builder module
- Ensure preset values match classification engine

**Prerequisites:** Story 4.1

---

### Story 4.3: Threshold Sliders

As a **user**,
I want **to adjust temperature and precipitation thresholds using sliders**,
So that **I can experiment with different classification boundaries**.

**Acceptance Criteria:**

**Given** the builder is open with a preset loaded
**When** I view the threshold controls
**Then** I see organized sections:
- **Temperature Thresholds:**
  - Tropical minimum (default 18°C, range 10-25°C)
  - C/D boundary (default 0°C, range -10 to 10°C)
  - Hot summer (default 22°C, range 18-28°C)
  - Warm months count (default 4, range 1-6)
- **Precipitation Thresholds:**
  - Dry month threshold (default 60mm, range 20-100mm)
  - Arid calculation factors
**And** each slider shows current value
**And** sliders can also be typed into directly
**And** sliders have accessible labels (aria-label, aria-valuetext)

**Technical Notes:**
- Implement in `src/builder/threshold-sliders.js`
- Use native `<input type="range">` for accessibility
- Group logically by climate group affected

**Prerequisites:** Story 4.2

---

### Story 4.4: Real-Time Map Updates

As a **user**,
I want **the map to update instantly when I adjust a threshold**,
So that **I can see the effect of my changes immediately**.

**Acceptance Criteria:**

**Given** I am adjusting a threshold slider
**When** I change a value (e.g., tropical minimum from 18°C to 16°C)
**Then** the map re-classifies all cells within 100ms
**And** cells that changed classification show their new color
**And** the change is visually smooth (no flicker)
**And** a counter shows "X cells reclassified"
**And** performance remains smooth even with rapid slider movement

**Technical Notes:**
- Implement recalculation in `src/climate/calculator.js`
- Debounce slider input (50-100ms)
- Consider Web Workers for heavy calculation
- Fire `koppen:classification-changed` event

**Prerequisites:** Story 4.3, Story 1.5

---

### Story 4.5: Custom System Naming

As a **user**,
I want **to name my custom classification system**,
So that **I can identify it when sharing or comparing**.

**Acceptance Criteria:**

**Given** I have made changes to the classification
**When** I look at the builder header
**Then** I see a text field with placeholder "My Classification"
**And** I can type a custom name (e.g., "Wine Region Climates")
**And** the name is included in exports and shared URLs
**And** the name appears in comparison mode header
**And** name is limited to 50 characters

**Technical Notes:**
- Store name in classification state object
- Include in URL encoding
- Validate/sanitize for display

**Prerequisites:** Story 4.3

---

### Story 4.6: Scratch Mode

As a **user**,
I want **to start with blank classification rules**,
So that **I can build a completely custom system**.

**Acceptance Criteria:**

**Given** the builder panel is open
**When** I click "Start from Scratch"
**Then** all thresholds are set to neutral defaults
**And** the map shows all cells as "Unclassified" (gray)
**And** as I define thresholds, cells begin getting classified
**And** a help tooltip explains "Define thresholds to classify regions"
**And** I can switch back to Köppen preset at any time

**Technical Notes:**
- Neutral defaults: all thresholds at extreme values (everything unclassified)
- Show progress indicator as more cells get classified
- Provide "Reset to Köppen" button

**Prerequisites:** Story 4.3

---

## Epic 5: Comparison & Analysis

**Goal:** Users can compare their custom classification system against the standard Köppen system, understanding the differences.

**User Value:** "I can see how my system differs from Köppen" - critical for Alex and Taylor's discoveries

**FRs Covered:** FR22-25

**Technical Context:** Tabbed interface, difference highlighting

---

### Story 5.1: Comparison Mode Toggle

As a **user**,
I want **to switch between viewing my custom system and the original Köppen**,
So that **I can compare the two**.

**Acceptance Criteria:**

**Given** I have created a custom classification
**When** I look at the builder panel
**Then** I see tabs: "Custom" and "Köppen"
**And** clicking a tab switches the map to that classification
**And** the active tab is visually highlighted
**And** switching is instant (< 100ms)
**And** the legend updates to match the active view

**Technical Notes:**
- Implement in `src/builder/comparison.js`
- Store both classifications in memory
- Tab switch should not require recalculation

**Prerequisites:** Story 4.4

---

### Story 5.2: Difference Highlighting

As a **user**,
I want **to see which regions changed between my system and Köppen**,
So that **I can understand the impact of my changes**.

**Acceptance Criteria:**

**Given** comparison mode is active
**When** I toggle "Show Differences"
**Then** cells that have different classifications are highlighted:
- Outline/border indicates changed cell
- Tooltip shows "Changed: Cfa → Cfb"
**And** a summary shows "X cells (Y%) reclassified"
**And** I can toggle differences off to see clean view
**And** difference highlighting works in both Custom and Köppen views

**Technical Notes:**
- Pre-compute differences when entering comparison mode
- Use distinct visual treatment (dashed border, glow)
- Store difference map for performance

**Prerequisites:** Story 5.1

---

### Story 5.3: Threshold Comparison Display

As a **user**,
I want **to see which thresholds I changed from the original**,
So that **I can understand my modifications**.

**Acceptance Criteria:**

**Given** the builder is open with custom changes
**When** I view the threshold panel
**Then** changed thresholds are visually marked (e.g., colored dot)
**And** hovering shows "Original: 18°C → Custom: 16°C"
**And** a summary shows "X thresholds modified"
**And** I can click "Reset to Original" on individual thresholds

**Technical Notes:**
- Compare current state to preset values
- Use color coding: green=decreased, red=increased
- Store original preset for comparison

**Prerequisites:** Story 5.1

---

### Story 5.4: Side-by-Side View (Optional)

As a **user**,
I want **to view both systems simultaneously on split screen**,
So that **I can compare them directly**.

**Acceptance Criteria:**

**Given** I am in comparison mode
**When** I click "Side by Side"
**Then** the viewport splits showing:
- Left: Custom classification map
- Right: Köppen classification map
**And** both maps sync zoom/pan position
**And** clicking a cell selects it in both views
**And** I can exit split view to return to tabbed mode
**And** split view is desktop-only (hidden on mobile)

**Technical Notes:**
- Use two synchronized Leaflet instances
- Share the same data, different style functions
- Consider performance with two map renders

**Prerequisites:** Story 5.1

---

## Epic 6: Export, Share & Monetization

**Goal:** Users can export maps as images, share custom classifications via URL, and support the project through donations.

**User Value:** "I can share my discovery with others" - enables organic growth and Reddit sharing

**FRs Covered:** FR26-39

**Technical Context:** PNG export, URL encoding, Ko-fi integration

---

### Story 6.1: PNG Export

As a **user**,
I want **to export the current map view as a PNG image**,
So that **I can share it on social media or use it in reports**.

**Acceptance Criteria:**

**Given** I am viewing the map (default or custom classification)
**When** I click "Export PNG" button
**Then** a PNG image is generated showing:
- Current map view and zoom level
- Climate layer with current settings
- Legend overlay (optional toggle)
- Watermark: "Made with Koppen - koppen.app"
**And** the file downloads automatically
**And** filename includes classification name and date
**And** export completes in < 2 seconds

**Technical Notes:**
- Use html2canvas or Leaflet plugin for capture
- Implement in `src/export/png-generator.js`
- Support retina resolution export option
- Watermark should be subtle but visible

**Prerequisites:** Story 2.2

---

### Story 6.2: Filtered Export

As a **user**,
I want **to export a map showing only selected climate types**,
So that **I can create focused visualizations**.

**Acceptance Criteria:**

**Given** I have filtered the map to show only "Csb" zones
**When** I click "Export PNG"
**Then** the exported image shows only Csb regions colored
**And** other regions are grayed out (matching filter view)
**And** the legend shows only the filtered type
**And** the watermark indicates the filter applied

**Technical Notes:**
- Respect current filter state during export
- Include filter info in filename

**Prerequisites:** Story 6.1, Story 2.5

---

### Story 6.3: Shareable URL Generation

As a **user**,
I want **to generate a URL that encodes my custom classification**,
So that **I can share my work with others**.

**Acceptance Criteria:**

**Given** I have created a custom classification
**When** I click "Share" button
**Then** a modal appears with:
- A shareable URL containing encoded rules
- "Copy to Clipboard" button
- Preview of what recipients will see
**And** the URL is < 2000 characters (fits in most platforms)
**And** the URL is valid and decodable
**And** success message confirms "Link copied!"

**Technical Notes:**
- Implement in `src/export/url-encoder.js`
- Use base64-encoded JSON for compact representation
- Compress if needed (pako/gzip)
- Use URL parameters: `?rules=...&name=...&view=...`

**Prerequisites:** Story 4.5

---

### Story 6.4: Shared URL Loading

As a **user**,
I want **to open a shared URL and see the custom classification**,
So that **I can view what others have created**.

**Acceptance Criteria:**

**Given** I receive a Koppen URL with encoded rules
**When** I open the URL in my browser
**Then** the custom classification loads automatically
**And** the map displays with the shared settings
**And** comparison mode shows Custom vs Köppen tabs
**And** an info bar shows "Viewing: [Classification Name] by Anonymous"
**And** invalid/corrupted URLs show friendly error message

**Technical Notes:**
- Implement in `src/utils/url-state.js`
- Decode on page load, before map init
- Validate decoded data structure
- Fire `koppen:rules-loaded` event

**Prerequisites:** Story 6.3, Story 5.1

---

### Story 6.5: JSON Export/Import

As a **user**,
I want **to export and import my classification as a JSON file**,
So that **I can back up my work or share via file**.

**Acceptance Criteria:**

**Given** I have created a custom classification
**When** I click "Export JSON"
**Then** a .json file downloads containing:
```json
{
  "name": "My Classification",
  "version": "1.0",
  "thresholds": { ... },
  "created": "2024-01-15T..."
}
```

**When** I click "Import JSON" and select a file
**Then** the classification loads and applies to the map
**And** invalid JSON shows error message
**And** incompatible versions show warning

**Technical Notes:**
- Implement in `src/export/json-export.js`
- Include schema version for forward compatibility
- Validate on import

**Prerequisites:** Story 4.5

---

### Story 6.6: Fork Shared Classification

As a **user**,
I want **to create my own modified version of a shared classification**,
So that **I can build upon others' work**.

**Acceptance Criteria:**

**Given** I opened a shared URL with someone's classification
**When** I click "Create Your Own Version"
**Then** the builder opens with their thresholds loaded
**And** I can modify any values
**And** my changes don't affect the original shared URL
**And** the name field shows "[Original Name] (Modified)"
**And** I can generate my own share URL

**Technical Notes:**
- Deep copy shared state before editing
- Track "forked from" metadata (optional)

**Prerequisites:** Story 6.4, Story 4.3

---

### Story 6.7: URL State Persistence

As a **user**,
I want **the URL to always reflect the current application state**,
So that **I can bookmark or share my current view**.

**Acceptance Criteria:**

**Given** I am using the application
**When** I change any state (view, filter, classification)
**Then** the URL updates to reflect current state
**And** refreshing the page restores the exact state
**And** browser back/forward navigates through state history
**And** state includes: view center/zoom, selected climate, filter, custom rules

**Technical Notes:**
- Use History API (pushState/replaceState)
- Debounce URL updates to avoid history spam
- Only include non-default values in URL

**Prerequisites:** Story 6.3

---

### Story 6.8: Ko-fi Donation Button

As a **user**,
I want **to see a donation button that supports the project**,
So that **I can contribute if I find the tool valuable**.

**Acceptance Criteria:**

**Given** I am using the application
**When** I look at the header
**Then** I see a "Support" or ☕ button
**And** clicking opens Ko-fi donation page (new tab)
**And** the button is visible but not intrusive
**And** the button works on mobile

**Technical Notes:**
- Use Ko-fi floating widget or simple link
- Position in header, right side
- Track clicks (aggregate, privacy-respecting)

**Prerequisites:** Story 1.3

---

### Story 6.9: About/Info Modal

As a **user**,
I want **to learn about the project and its data sources**,
So that **I can trust the information and cite it properly**.

**Acceptance Criteria:**

**Given** I click the "About" or "Info" link
**When** the modal opens
**Then** I see:
- Project description
- Data source: "ERA5 reanalysis, 1991-2020 normals"
- Classification reference: "Beck et al. 2018"
- Open source: link to GitHub repository
- License: MIT
- Credits and acknowledgments
**And** the modal can be closed with × or Escape

**Technical Notes:**
- Implement in `src/ui/modal.js`
- Reuse modal component from other features
- Include citation format for academic use

**Prerequisites:** Story 3.1

---

## FR Coverage Matrix

| FR | Description | Epic | Story |
|----|-------------|------|-------|
| FR1 | Interactive 2D map | Epic 2 | 2.1 |
| FR2 | Zoom in/out | Epic 2 | 2.1 |
| FR3 | Pan/scroll navigation | Epic 2 | 2.1 |
| FR4 | Click to view classification | Epic 2 | 2.6 |
| FR5 | Color-coded regions | Epic 2 | 2.2 |
| FR6 | Legend with 30 climate types | Epic 2 | 2.3 |
| FR7 | Click legend to select | Epic 2 | 2.4 |
| FR8 | Filter to single climate type | Epic 2 | 2.5 |
| FR9 | Selected type indication | Epic 2 | 2.4 |
| FR10 | Profile panel | Epic 3 | 3.1 |
| FR11 | Climate description | Epic 3 | 3.1 |
| FR12 | Classification rules display | Epic 3 | 3.2 |
| FR13 | Example locations | Epic 3 | 3.3 |
| FR14 | Expandable terminology | Epic 3 | 3.4 |
| FR15 | Builder access via Create | Epic 4 | 4.1 |
| FR16 | Start from Köppen preset | Epic 4 | 4.2 |
| FR17 | Start from scratch | Epic 4 | 4.6 |
| FR18 | Temperature threshold sliders | Epic 4 | 4.3 |
| FR19 | Precipitation threshold sliders | Epic 4 | 4.3 |
| FR20 | Real-time map updates | Epic 4 | 4.4 |
| FR21 | Name custom system | Epic 4 | 4.5 |
| FR22 | Switch custom/Köppen view | Epic 5 | 5.1 |
| FR23 | Tabbed comparison interface | Epic 5 | 5.1 |
| FR24 | Show changed regions | Epic 5 | 5.2 |
| FR25 | Display threshold differences | Epic 5 | 5.3 |
| FR26 | PNG export | Epic 6 | 6.1 |
| FR27 | Filtered map export | Epic 6 | 6.2 |
| FR28 | Watermark on exports | Epic 6 | 6.1 |
| FR29 | Generate shareable URL | Epic 6 | 6.3 |
| FR30 | Open shared URL | Epic 6 | 6.4 |
| FR31 | JSON export | Epic 6 | 6.5 |
| FR32 | JSON import | Epic 6 | 6.5 |
| FR33 | URL reflects state | Epic 6 | 6.7 |
| FR34 | Bookmarkable URLs | Epic 6 | 6.7 |
| FR35 | Shared URLs show comparison | Epic 6 | 6.4 |
| FR36 | Fork shared classification | Epic 6 | 6.6 |
| FR37 | Iterate on imported rulesets | Epic 6 | 6.6 |
| FR38 | Ko-fi donation link | Epic 6 | 6.8 |
| FR39 | Project information | Epic 6 | 6.9 |
| FR40 | Keyboard navigation | Epic 3 | 3.1, 2.4 |
| FR41 | Accessible color contrast | Epic 1 | 1.3 |
| FR42 | ARIA labels | Epic 3 | 3.1 |

---

## Summary

**Total Epics:** 6
**Total Stories:** 31

| Epic | Stories | FRs Covered |
|------|---------|-------------|
| Epic 1: Foundation | 6 | Infrastructure |
| Epic 2: Map Exploration | 6 | FR1-9 |
| Epic 3: Climate Profiles | 5 | FR10-14, FR40-42 |
| Epic 4: Classification Builder | 6 | FR15-21 |
| Epic 5: Comparison | 4 | FR22-25 |
| Epic 6: Export & Share | 9 | FR26-39 |

**All 42 functional requirements are mapped to specific implementation stories.**

**Architecture Integration:**
- All stories reference `src/` module structure from Architecture
- Event patterns use `koppen:` namespace
- BEM CSS naming applied throughout
- Module init/destroy pattern followed

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

