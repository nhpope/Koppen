---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - 'docs/prd.md'
  - 'docs/analysis/research/technical-koppen-research-2025-12-05.md'
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2025-12-05'
project_name: 'Koppen'
user_name: 'NPope97'
date: '2025-12-05'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

42 FRs organized into 10 capability areas covering the complete user experience from map exploration through classification creation to export/sharing. The requirements emphasize:

- Interactive map exploration with click/zoom/pan (FR1-5)
- Rich climate information display with rule transparency (FR6-14)
- Classification sandbox with live feedback (FR15-25)
- Export-first design with URL sharing (FR26-35)
- Accessibility and zero-friction experience (FR40-42)

**Non-Functional Requirements:**

26 NFRs with key architectural implications:

| Category | Key Requirements | Architectural Impact |
|----------|------------------|---------------------|
| **Performance** | < 3s load, < 100ms classification update | Client-side computation, lazy loading, compressed data |
| **Accessibility** | WCAG AA partial, keyboard nav | Semantic HTML, ARIA labels, focus management |
| **Browser** | Chrome/Firefox/Safari 90+ | ES6+, no transpilation needed |
| **Data Accuracy** | Beck et al. 2018, 0.25° resolution | Pre-computed classifications, scientific validation |
| **Privacy** | No PII, aggregate analytics only | Stateless architecture, no backend storage |
| **Maintainability** | Static hosting, no backend | Pure frontend, CDN deployment |

**Scale & Complexity:**

- Primary domain: Frontend web application (Single Page Application)
- Complexity level: Medium
- Estimated architectural components: 6-8 major modules

### Technical Constraints & Dependencies

**Hard Constraints (from PRD):**

1. **Static hosting only** - No server-side processing, no database
2. **Client-side classification** - All Köppen calculations in browser
3. **URL state encoding** - Complete ruleset must fit in shareable URL
4. **Performance budget** - < 200KB JS, < 5MB data (gzipped)
5. **Leaflet.js** - Map library already specified

**Data Dependencies:**

1. **ECMWF ERA5** - Source climate data (monthly temperature, precipitation)
2. **30-year normals** - 1991-2020 climate normal period
3. **0.25° resolution** - ~1.6 million grid cells globally

**External Dependencies:**

- Leaflet.js - Map rendering
- Ko-fi - Donation integration (external widget)
- Plausible/Umami - Privacy-respecting analytics (optional)

### Cross-Cutting Concerns Identified

| Concern | Description | Affected Components |
|---------|-------------|---------------------|
| **Performance optimization** | Large dataset loading, real-time recalculation | Data layer, map renderer, classification engine |
| **State management** | URL encoding, comparison mode, builder state | All interactive components |
| **Data pipeline** | ERA5 → Köppen pre-processing, GeoJSON generation | Build-time tooling, data format decisions |
| **Responsive design** | Desktop-first with mobile fallback | All UI components |
| **Accessibility** | Keyboard navigation, screen readers | Legend, controls, map interactions |

## Starter Template Evaluation

### Primary Technology Domain

**Frontend Web Application** - Single Page Application with interactive data visualization

### Starter Options Considered

| Option | Description | Fit Assessment |
|--------|-------------|----------------|
| **Vite vanilla** | Official Vite template, vanilla JS, minimal setup | ✅ Best fit - matches PRD "vanilla JS" requirement |
| **Vite vanilla-ts** | TypeScript variant | Overkill for MVP, adds complexity |
| **Create React App** | React-based | Framework overhead, not per PRD |
| **Plain HTML/CSS/JS** | No build tool | Misses HMR, optimization benefits |

### Selected Starter

**Vite vanilla template** (official)

**Rationale:**
- Matches PRD specification for vanilla JavaScript
- Vite 7.2.6 provides fast HMR and optimized production builds
- Zero framework overhead keeps bundle under 200KB budget
- Native ES modules work with modern browser targets (Chrome/Firefox/Safari 90+)
- Easy Leaflet.js integration via npm

### Initialization Command

```bash
npm create vite@latest koppen -- --template vanilla
cd koppen
npm install leaflet
```

### Architectural Decisions Provided by Starter

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Language** | Vanilla JavaScript (ES6+) | Per PRD, no framework overhead |
| **Build Tooling** | Vite 7.2.6 | Fast dev server, optimized production builds |
| **Project Structure** | Vite default (src/, public/) | Clean separation, familiar layout |
| **Development Experience** | HMR, native ES modules | Modern DX without complexity |
| **Mapping Library** | Leaflet.js 1.9.4 | Per PRD specification, stable release |

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data format and loading strategy
- State management approach
- Module organization pattern

**Important Decisions (Shape Architecture):**
- CSS architecture
- Deployment target

**Deferred Decisions (Post-MVP):**
- Tiled/progressive data loading (if performance issues arise)
- Service worker for offline support
- Advanced caching strategies

### Data Architecture

| Decision | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| **Data Format** | TopoJSON | 3.0.2 | ~5x compression vs GeoJSON, stays under 5MB budget |
| **Loading Strategy** | Single file + lazy parsing | - | Simple for MVP, optimize later if needed |
| **Climate Data Source** | ECMWF ERA5 pre-processed | 1991-2020 normals | Per research doc, 0.25° resolution |
| **Classification Engine** | Client-side JavaScript | - | Per PRD constraint, all calculations in browser |

**Data Pipeline:**
```
ERA5 NetCDF → Python preprocessing → TopoJSON → Static hosting → Browser parsing
```

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State Management** | URL params + plain JS object | Matches PRD's URL-as-save-file pattern, stateless |
| **Temporary State** | SessionStorage | Work-in-progress before explicit save/share |
| **Module Organization** | Feature-based ES6 modules | Clear ownership: `src/map/`, `src/builder/`, `src/export/` |
| **CSS Architecture** | Plain CSS with BEM naming | No additional tooling, sufficient for scope |
| **Component Pattern** | Factory functions returning DOM elements | Vanilla JS, no framework overhead |

**Module Structure:**
```
src/
├── map/           # Leaflet integration, layer management
├── builder/       # Classification rule editor
├── climate/       # Köppen classification engine
├── export/        # PNG/URL generation
├── ui/            # Shared UI components (legend, tooltips)
└── utils/         # URL encoding, data parsing
```

**Module Initialization Order:**

Modules initialize in a specific order due to dependencies (see `src/main.js:42-58`):

1. **Utils** (first) - Provides logging, constants, shared utilities needed by all modules
2. **Map** (async) - Loads Leaflet library and initializes interactive map
3. **Climate** - Loads classification engine (depends on data-loader from utils)
4. **UI** - Initializes UI components (depends on DOM being ready)
5. **Builder** - Classification builder (depends on climate rules being loaded)
6. **Export** (last) - Export functionality (depends on map and climate state)

**Why This Order Matters:**
- Utils must be first because it provides the logger used by all other modules
- Map must initialize before climate because climate renders to the map
- Climate must load before builder because builder modifies climate rules
- Export must be last because it depends on both map (PNG capture) and climate (state encoding)

**Violation Consequences:**
- Initializing climate before map → Climate has no layer to render to
- Initializing builder before climate → No rules to modify
- Initializing export before map → Cannot capture map as PNG

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Hosting** | GitHub Pages | Free, integrated with repo, simple |
| **CI/CD** | GitHub Actions | Auto-deploy on push to main |
| **CDN** | GitHub Pages default | Sufficient for static assets |
| **Analytics** | Plausible (optional) | Privacy-respecting, per PRD |
| **Donations** | Ko-fi widget | 0% fee, per research doc |

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffolding (Vite vanilla template)
2. Data pipeline (Python preprocessing → TopoJSON)
3. Map module (Leaflet integration)
4. Climate classification engine
5. Builder UI
6. Export functionality
7. Deployment setup

**Cross-Component Dependencies:**
- Map module depends on TopoJSON data format decision
- Builder depends on state management (URL encoding) decision
- Export depends on both map and state management
- All UI components follow BEM CSS conventions

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 8 areas where AI agents could make different choices

Applicable to this project:
- File and directory naming
- Component/function/variable naming (JS)
- CSS class naming (BEM)
- Module organization patterns
- State object structure
- URL encoding format
- Error handling patterns
- Event/callback patterns

### Naming Patterns

**File & Directory Naming:**

| Element | Convention | Example |
|---------|------------|---------|
| **Files** | kebab-case | `classification-engine.js` |
| **Directories** | kebab-case | `src/climate/` |
| **CSS Files** | kebab-case | `climate-builder.css` |

**Code Naming:**

| Element | Convention | Example |
|---------|------------|---------|
| **Functions** | camelCase | `calculateKoppen()` |
| **Variables** | camelCase | `climateData` |
| **Constants** | SCREAMING_SNAKE | `MAX_ZOOM_LEVEL` |
| **DOM IDs** | kebab-case | `id="climate-builder"` |

**CSS Naming (BEM):**

| Element | Convention | Example |
|---------|------------|---------|
| **Block** | kebab-case | `.legend` |
| **Element** | block__element | `.legend__item` |
| **Modifier** | block__element--modifier | `.legend__item--active` |

### Structure Patterns

**Module Structure Pattern:**

```javascript
// Each module exports a single default object or init function
// src/map/index.js
export default {
  init(container, options) { /* setup */ },
  setData(data) { /* update */ },
  destroy() { /* cleanup */ }
};
```

**State Object Structure:**

```javascript
// URL-encodable state follows flat structure
const classificationState = {
  // Thresholds use snake_case (matches Köppen notation)
  tropical_min: 18,
  arid_threshold: 10,
  // UI state uses camelCase
  selectedClimate: 'Cfa',
  compareMode: false
};
```

### Communication Patterns

**Event/Callback Pattern:**

```javascript
// Custom events use 'koppen:' namespace
document.dispatchEvent(new CustomEvent('koppen:classification-changed', {
  detail: { climate: 'Cfa', cell: [lat, lng] }
}));

// Event listeners follow same pattern
document.addEventListener('koppen:map-ready', handler);
```

**Standard Event Names:**
- `koppen:map-ready` - Map initialization complete
- `koppen:data-loaded` - Climate data loaded
- `koppen:classification-changed` - User modified classification rules
- `koppen:cell-selected` - User clicked a map cell
- `koppen:export-started` - Export operation begun

### Process Patterns

**Error Handling Pattern:**

```javascript
// Errors logged to console with prefix, user gets friendly message
try {
  // operation
} catch (error) {
  console.error('[Koppen]', error);
  showUserMessage('Unable to load climate data. Please refresh.');
}
```

**Loading State Pattern:**

```javascript
// Loading states managed via CSS classes on container
container.classList.add('is-loading');
// ... async operation
container.classList.remove('is-loading');
```

**Standard State Classes:**
- `is-loading` - Async operation in progress
- `is-error` - Error state
- `is-empty` - No data to display
- `is-active` - Currently selected/active

### Enforcement Guidelines

**All AI Agents MUST:**

1. Use kebab-case for all file names
2. Follow BEM naming for all CSS classes
3. Prefix custom events with `koppen:`
4. Log errors with `[Koppen]` prefix
5. Use CSS classes (not inline styles) for state changes
6. Keep state objects flat and URL-encodable
7. Export modules as default objects with init/destroy pattern

### Pattern Examples

**Good Examples:**

```javascript
// ✅ Correct file naming
import climateEngine from './climate/classification-engine.js';

// ✅ Correct CSS selector (BEM)
document.querySelector('.legend__item--tropical');

// ✅ Correct event dispatch (namespaced)
dispatchEvent(new CustomEvent('koppen:map-ready'));

// ✅ Correct error logging (prefixed)
console.error('[Koppen]', 'Failed to parse climate data');
```

**Anti-Patterns:**

```javascript
// ❌ Wrong file case
import ClimateEngine from './Climate/ClassificationEngine.js';

// ❌ Not BEM
document.querySelector('.legendItemTropical');

// ❌ Missing namespace
dispatchEvent(new CustomEvent('mapReady'));

// ❌ Missing prefix
console.error('Failed to parse');

// ❌ Inline styles for state
element.style.display = 'none';  // Use .is-hidden class instead
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
koppen/
├── README.md
├── package.json
├── vite.config.js
├── .gitignore
├── .env.example
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Pages deployment
│
├── public/
│   ├── favicon.ico
│   └── data/
│       └── climate.topojson        # Pre-computed Köppen classifications
│
├── src/
│   ├── main.js                     # Application entry point
│   ├── style.css                   # Global styles, CSS variables
│   │
│   ├── map/
│   │   ├── index.js                # Map module (Leaflet init, layers)
│   │   ├── layers.js               # Climate layer management
│   │   └── controls.js             # Zoom, pan, custom controls
│   │
│   ├── climate/
│   │   ├── index.js                # Classification engine
│   │   ├── koppen-rules.js         # Beck et al. 2018 thresholds
│   │   ├── calculator.js           # Climate metric calculations
│   │   └── presets.js              # Standard Köppen preset
│   │
│   ├── builder/
│   │   ├── index.js                # Classification builder module
│   │   ├── threshold-sliders.js    # Threshold adjustment UI
│   │   ├── preview.js              # Live preview updates
│   │   └── comparison.js           # Side-by-side comparison mode
│   │
│   ├── export/
│   │   ├── index.js                # Export module
│   │   ├── png-generator.js        # Map to PNG conversion
│   │   ├── url-encoder.js          # State → URL encoding
│   │   └── json-export.js          # Configuration export
│   │
│   ├── ui/
│   │   ├── legend.js               # Climate type legend
│   │   ├── tooltip.js              # Hover tooltips
│   │   ├── climate-info.js         # Click detail panel
│   │   ├── modal.js                # Modal component
│   │   └── message.js              # User notifications
│   │
│   └── utils/
│       ├── data-loader.js          # TopoJSON loading/parsing
│       ├── url-state.js            # URL param read/write
│       ├── colors.js               # Köppen color palette
│       └── constants.js            # Shared constants
│
├── scripts/
│   ├── preprocess-era5.py          # ERA5 → TopoJSON pipeline
│   ├── validate-data.py            # Data integrity checks
│   └── requirements.txt            # Python dependencies
│
├── tests/
│   ├── climate/
│   │   └── koppen-rules.test.js    # Classification algorithm tests
│   ├── export/
│   │   └── url-encoder.test.js     # URL encoding tests
│   └── fixtures/
│       └── sample-climate.json     # Test data fixtures
│
└── docs/
    └── CONTRIBUTING.md
```

### Requirements to Structure Mapping

| FR Category | Primary Location | Files |
|-------------|------------------|-------|
| **Map Exploration (FR1-5)** | `src/map/` | `index.js`, `layers.js`, `controls.js` |
| **Climate Information (FR6-14)** | `src/ui/`, `src/climate/` | `legend.js`, `climate-info.js`, `tooltip.js` |
| **Classification Builder (FR15-25)** | `src/builder/`, `src/climate/` | `threshold-sliders.js`, `koppen-rules.js` |
| **Export & Share (FR26-35)** | `src/export/` | `png-generator.js`, `url-encoder.js` |
| **URL State (FR36-39)** | `src/utils/` | `url-state.js` |
| **Accessibility (FR40-42)** | All `src/ui/` | Semantic HTML, ARIA in all components |

### Architectural Boundaries

**Component Boundaries:**

```
┌─────────────────────────────────────────────────────────────┐
│                        main.js                               │
│                    (orchestration)                           │
└─────────┬──────────┬──────────┬──────────┬─────────────────┘
          │          │          │          │
     ┌────▼────┐ ┌───▼───┐ ┌───▼────┐ ┌───▼───┐
     │   map   │ │builder│ │ export │ │  ui   │
     └────┬────┘ └───┬───┘ └───┬────┘ └───┬───┘
          │          │         │          │
          └──────────┴────┬────┴──────────┘
                          │
                    ┌─────▼─────┐
                    │  climate  │  (shared classification engine)
                    └─────┬─────┘
                          │
                    ┌─────▼─────┐
                    │   utils   │  (shared utilities)
                    └───────────┘
```

**Data Flow:**

```
URL params ──► url-state.js ──► classificationState
                                       │
climate.topojson ──► data-loader.js ───┤
                                       ▼
                              climate/calculator.js
                                       │
                                       ▼
                              map/layers.js (render)
```

**Event Boundaries:**

| Event | Producer | Consumers |
|-------|----------|-----------|
| `koppen:data-loaded` | `utils/data-loader.js` | `map/`, `builder/` |
| `koppen:classification-changed` | `builder/` | `map/`, `export/` |
| `koppen:cell-selected` | `map/` | `ui/climate-info.js` |

### Integration Points

**External Integrations:**

| Integration | Entry Point | Purpose |
|-------------|-------------|---------|
| **Leaflet.js** | `src/map/index.js` | Map rendering |
| **TopoJSON** | `src/utils/data-loader.js` | Data parsing |
| **Ko-fi** | `index.html` | Donation widget |
| **Plausible** | `index.html` | Analytics (optional) |

**Build & Deployment:**

| Command | Action | Output |
|---------|--------|--------|
| `npm run dev` | Vite dev server | localhost:5173 |
| `npm run build` | Production build | `dist/` |
| `npm run preview` | Preview build | localhost:4173 |
| GitHub Actions | Auto-deploy | GitHub Pages |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

| Decision Pair | Compatible? | Notes |
|--------------|-------------|-------|
| Vite + Vanilla JS | ✅ | Native support, official template |
| Leaflet + TopoJSON | ✅ | Standard pairing, well-documented |
| GitHub Pages + Static build | ✅ | Perfect fit, zero config |
| URL state + No backend | ✅ | Stateless by design |
| BEM CSS + Vanilla JS | ✅ | No conflicts |

**Pattern Consistency:**
- Naming conventions (kebab-case files, camelCase functions, BEM CSS) are internally consistent
- Event namespace pattern (`koppen:`) applies uniformly
- Module structure pattern (init/destroy) is consistent across all modules

**Structure Alignment:**
- Project structure directly maps to architectural decisions
- Feature-based organization matches module boundaries
- No orphaned or conflicting directories

### Requirements Coverage Validation ✅

**FR Coverage by Category:**

| FR Category | Covered By | Status |
|-------------|------------|--------|
| Map Exploration (FR1-5) | `src/map/`, Leaflet | ✅ |
| Climate Information (FR6-14) | `src/ui/`, `src/climate/` | ✅ |
| Classification Builder (FR15-25) | `src/builder/`, `src/climate/` | ✅ |
| Export & Share (FR26-35) | `src/export/` | ✅ |
| URL State (FR36-39) | `src/utils/url-state.js` | ✅ |
| Accessibility (FR40-42) | All UI modules (ARIA, semantic HTML) | ✅ |

**NFR Coverage:**

| NFR Category | Architectural Support | Status |
|--------------|----------------------|--------|
| Performance (<3s load, <100ms update) | TopoJSON compression, client-side compute | ✅ |
| Browser Compatibility (90+) | ES6+, no transpilation needed | ✅ |
| Accessibility (WCAG AA partial) | BEM + ARIA patterns in ui/ modules | ✅ |
| Privacy (no PII) | Stateless, no backend | ✅ |
| Maintainability (static hosting) | GitHub Pages, Vite build | ✅ |

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All technology versions specified (Vite 7.2.6, Leaflet 1.9.4, TopoJSON 3.0.2)
- Implementation patterns documented with code examples
- Consistency rules defined with good/bad examples

**Structure Completeness:**
- 30+ files/directories explicitly defined
- All modules have clear responsibilities
- Integration points mapped (events, data flow)

**Pattern Completeness:**
- Naming: ✅ Files, functions, CSS all covered
- Communication: ✅ Event namespace and standard events defined
- Process: ✅ Error handling, loading states documented

### Gap Analysis Results

**Critical Gaps:** None identified

**Important Gaps (address during implementation):**
1. Testing framework not specified - recommend Vitest (Vite-native)
2. Python preprocessing details - `scripts/` directory exists but steps not fully documented

**Nice-to-Have (post-MVP):**
1. Service worker for offline support
2. Progressive/tiled data loading
3. Automated accessibility testing

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Simple, focused architecture (static frontend, no backend complexity)
- Clear module boundaries with well-defined responsibilities
- Comprehensive implementation patterns prevent AI agent conflicts
- All requirements traceable to specific architectural components

**Areas for Future Enhancement:**
- Add Vitest for unit testing during implementation
- Document Python preprocessing pipeline in detail
- Consider progressive data loading if performance issues arise

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Step:**
```bash
npm create vite@latest koppen -- --template vanilla
cd koppen
npm install leaflet topojson-client
```

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2025-12-05
**Document Location:** docs/architecture.md

### Final Architecture Deliverables

**Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**Implementation Ready Foundation**
- 12 architectural decisions made
- 8 implementation patterns defined
- 6 architectural components specified
- 42 functional requirements + 26 NFRs fully supported

**AI Agent Implementation Guide**
- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**
- [x] All functional requirements are supported
- [x] All non-functional requirements are addressed
- [x] Cross-cutting concerns are handled
- [x] Integration points are defined

**✅ Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

