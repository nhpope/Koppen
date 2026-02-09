<!-- STATUS: CURRENT_ACTUAL -->
<!-- AUTO-GENERATED: 2026-02-08T20:28:00Z -->
<!-- SOURCE: Project Health Assessment - Phase 1 -->

# Koppen - Interactive Climate Classification Explorer

An open-source web application for exploring and creating custom climate classification systems. Built with vanilla JavaScript and Leaflet.

## Overview

Koppen transforms climate science education by making the Köppen-Geiger classification system interactive. Instead of passively viewing static maps, users can:

- 🗺️ **Explore** climate zones on an interactive global map
- 🔍 **Understand** the rules behind each classification
- 🎨 **Create** custom classification systems with adjustable thresholds
- 📊 **Compare** different classification systems side-by-side
- 📤 **Export** maps as PNG or shareable URLs

## Quick Start

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

Output is in `dist/` directory, ready for static hosting.

## Project Structure

```
koppen-app/
├── src/
│   ├── map/              # Leaflet map integration
│   │   ├── index.js      # Map initialization
│   │   └── climate-layer.js  # Climate data rendering
│   ├── climate/          # Classification logic
│   │   ├── koppen-rules.js   # Köppen-Geiger rules
│   │   ├── custom-rules.js   # Custom rule engine
│   │   └── presets.js        # Predefined classifications
│   ├── builder/          # Classification builder UI
│   │   ├── rule-editor.js    # Rule editing interface
│   │   ├── threshold-sliders.js  # Threshold controls
│   │   └── comparison.js     # Comparison mode
│   ├── export/           # Export functionality
│   │   ├── png-generator.js  # PNG export
│   │   ├── url-encoder.js    # URL state encoding
│   │   └── json-export.js    # JSON export
│   ├── ui/               # UI components
│   │   ├── header.js         # App header
│   │   ├── legend.js         # Climate legend
│   │   ├── tooltip.js        # Hover tooltips
│   │   └── climate-info.js   # Climate details panel
│   ├── utils/            # Utilities
│   │   ├── data-loader.js    # Climate data loading
│   │   ├── state-manager.js  # App state
│   │   ├── url-state.js      # URL synchronization
│   │   └── colors.js         # Color utilities
│   └── main.js           # Application entry point
├── tests/
│   ├── unit/             # Unit tests (Vitest)
│   ├── e2e/              # E2E tests (Playwright)
│   └── fixtures/         # Test data
├── public/
│   └── data/             # Climate data files
├── docs/                 # Documentation
│   ├── architecture.md   # System architecture
│   ├── prd.md            # Product requirements
│   └── patterns/         # Code patterns
└── index.html            # HTML entry point
```

## Architecture

**Stack:**
- **Build tool:** Vite 7.2.6
- **Language:** Vanilla JavaScript (ES6+)
- **Map library:** Leaflet 1.9.4
- **Data format:** TopoJSON (compressed GeoJSON)
- **Deployment:** Vercel (static hosting)

**Key Design Decisions:**
- No framework (React/Vue/Svelte) - keeps bundle small and simple
- No backend - fully static, privacy-first
- URL-as-save-file - no database needed for sharing
- Module-based architecture - clean separation of concerns

See [docs/architecture.md](docs/architecture.md) for details.

## Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# E2E tests only
npm run test:e2e

# Coverage report
npm run test:coverage

# Accessibility tests
npm run test:a11y
```

**Test Coverage Targets:**
- Default: 70% (lines, functions, branches, statements)
- Climate module: 80% (higher threshold for core logic)

## Development

### Code Style

This project uses ESLint with security and code quality rules:

```bash
npm run lint
```

See [docs/eslint-guide.md](docs/eslint-guide.md) for configuration details.

### Module Guidelines

1. **Each module is self-contained** - no circular dependencies
2. **Export public API only** - internals stay private
3. **Use event-driven communication** - CustomEvents for cross-module
4. **Document with JSDoc** - especially public functions

### Adding a New Climate Classification

1. Define rules in `src/climate/custom-rules.js`
2. Add preset to `src/climate/presets.js`
3. Write tests in `tests/unit/climate/`
4. Update documentation

## Data

Climate data is based on **Beck et al. (2018)** Köppen-Geiger classification:

> Beck, H.E., Zimmermann, N.E., McVicar, T.R. et al. Present and future Köppen-Geiger climate classification maps at 1-km resolution. Sci Data 5, 180214 (2018).

**Resolution:** 0.25° (approximately 25km at equator)
**Format:** TopoJSON (compressed from ~500MB to ~15MB)

## Deployment

Deployed automatically via Vercel on push to main branch.

**Build configuration:** `vercel.json`
**Security headers:** CSP, X-Frame-Options, X-Content-Type-Options

## Keyboard Shortcuts

The application supports keyboard navigation for improved accessibility and power-user efficiency:

| Key | Action | Context |
|-----|--------|---------|
| **Arrow Keys** | Pan map up/down/left/right | When not focused on input |
| **+** or **=** | Zoom in | Map view |
| **-** or **_** | Zoom out | Map view |
| **L** | Toggle legend visibility | Any view |
| **B** | Toggle classification builder | Any view |
| **Escape** | Close panels/modals | When panel is open |
| **Ctrl/Cmd + E** | Export map as PNG | Any view |

**Accessibility Note:** All interactive elements are keyboard accessible (Tab, Enter, Space). The map container is also accessible via arrow keys for users who cannot use a mouse.

## Privacy & Data Storage

Koppen respects user privacy and stores minimal data:

### What We Store

**LocalStorage (Browser-Only):**
- `onboarding-dismissed`: Boolean flag to remember if onboarding was shown
- `donation-button-dismissed`: Boolean flag for donation button visibility
- `shared-info-bar-state`: UI state for shared classification banner

**No Server Storage:**
- No user accounts or databases
- No tracking of personal information
- All classification data stays in your browser or URL

### URL State

Custom classifications are encoded in shareable URLs using:
- Gzip compression (pako library)
- Base64 encoding
- No personally identifiable information

Anyone with a shared URL can view and modify the classification, but no data is stored on our servers.

### Analytics

*[No analytics currently configured]*

If analytics are added in the future, only aggregate, anonymized usage data will be collected (page views, feature usage). No personal information will be tracked.

## Contributing

This project was built as an educational tool. Contributions welcome!

See [docs/prd.md](docs/prd.md) for product vision and requirements.

## License

[Add license information]

## Support

Support this project: [Ko-fi link](https://ko-fi.com/koppen)

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:a11y` | Run accessibility tests |
| `npm run lint` | Lint code with ESLint |

---

*This document was auto-generated. Review for accuracy and update as needed.*
