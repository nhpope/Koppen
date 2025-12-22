# Story 3.3: Example Locations

## Story

As a **user**,
I want **to see other locations that share this climate type**,
So that **I can understand the climate through familiar places**.

## Status

- **Epic**: 3 - Climate Information & Profiles
- **Status**: done
- **FRs Covered**: FR13

## Acceptance Criteria

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

## Technical Implementation

### Files to Modify/Create

1. **src/climate/presets.js** - Already contains EXAMPLE_LOCATIONS, enhance with more entries
2. **src/ui/climate-info.js** - Already renders locations, verify navigation works
3. **src/main.js** - Already has `koppen:navigate-to` handler

### Implementation Details

```javascript
// src/climate/presets.js - Comprehensive example locations
export const EXAMPLE_LOCATIONS = {
  // Tropical
  Af: [
    { name: 'Singapore', lat: 1.35, lng: 103.82 },
    { name: 'Kuala Lumpur, Malaysia', lat: 3.14, lng: 101.69 },
    { name: 'Manaus, Brazil', lat: -3.12, lng: -60.02 },
    { name: 'Libreville, Gabon', lat: 0.39, lng: 9.45 }
  ],
  Am: [
    { name: 'Miami, USA', lat: 25.76, lng: -80.19 },
    { name: 'Yangon, Myanmar', lat: 16.87, lng: 96.20 },
    { name: 'Lagos, Nigeria', lat: 6.52, lng: 3.38 },
    { name: 'Cairns, Australia', lat: -16.92, lng: 145.77 }
  ],
  // ... all 30 climate types with 3-5 diverse locations each
};
```

### Location Selection Criteria

1. **Geographic diversity** - Include locations from different continents
2. **Name recognition** - Prefer well-known cities/regions
3. **Educational value** - Help users understand climate distribution
4. **Accuracy** - Verify locations actually have that climate type

### Example Locations by Climate Type

| Type | Example Locations |
|------|-------------------|
| **Af** | Singapore, Manaus, Libreville, Jakarta |
| **Am** | Miami, Lagos, Yangon, Cairns |
| **Aw/As** | Havana, Darwin, Mumbai, Brasília |
| **BWh** | Riyadh, Phoenix, Alice Springs, Cairo |
| **BWk** | Ulaanbaatar, Turpan, Patagonia |
| **BSh** | Marrakech, Karachi, San Antonio |
| **BSk** | Denver, Madrid, Almaty, Tehran |
| **Cfa** | Buenos Aires, Shanghai, Atlanta, Sydney |
| **Cfb** | London, Seattle, Melbourne, Wellington |
| **Cfc** | Punta Arenas, Reykjavik (border) |
| **Csa** | Los Angeles, Rome, Cape Town, Athens |
| **Csb** | San Francisco, Porto, Santiago |
| **Cwa** | Hong Kong, Durban, São Paulo |
| **Cwb** | Mexico City, Nairobi, Kunming |
| **Dfa** | Chicago, Kiev, Harbin |
| **Dfb** | Moscow, Minneapolis, Sapporo |
| **Dfc** | Murmansk, Fairbanks, Yellowknife |
| **Dfd** | Yakutsk, Verkhoyansk |
| **ET** | Nuuk, Ushuaia, McMurdo (edges) |
| **EF** | Antarctica interior, Greenland interior |

### Dependencies

- Story 3.1 (Climate Profile Panel)
- Story 2.1 (Base Map - for flyTo navigation)

## Testing Checklist

- [ ] "Also Found In" section displays in profile panel
- [ ] Each climate type has 3-5 example locations
- [ ] Locations are geographically diverse
- [ ] Clicking location pans/flies map to coordinates
- [ ] Map zoom level is appropriate (zoom 6-8)
- [ ] Location names are accurate and spelled correctly
- [ ] Locations actually have the stated climate type
- [ ] Navigation works on mobile
- [ ] Keyboard accessible (Enter/Space to navigate)
- [ ] Screen reader announces location as clickable

## Notes

- The navigation functionality (`koppen:navigate-to` → `flyTo`) is already implemented
- Focus on curating high-quality, recognizable location examples
- Some climate types (EF, Dfd) have very few populated areas - use geographic features if needed
- Consider adding country flags or continent indicators for visual diversity

## Implementation Complete

**Completed: 2025-12-05**

### Changes Made

1. **src/climate/presets.js** - Expanded `EXAMPLE_LOCATIONS` to cover all 30 climate types:
   - Each type has 3-5 geographically diverse cities
   - Includes coordinates (lat, lng) for map navigation
   - Covers all continents where applicable
   - Notable cities: Singapore (Af), London (Cfb), Moscow (Dfb), Phoenix (BWh), etc.

2. **src/ui/climate-info.js** - Already renders "Also Found In" section:
   - Clickable locations dispatch `koppen:navigate-to` event
   - Keyboard accessible (Enter/Space to activate)
   - Styled with hover states and arrow indicators
