# Story 3.2: Classification Rules Display

## Story

As a **user**,
I want **to see the exact rules that define a climate type**,
So that **I understand why a location gets that classification**.

## Status

- **Epic**: 3 - Climate Information & Profiles
- **Status**: done
- **FRs Covered**: FR12

## Acceptance Criteria

**Given** a climate profile panel is open
**When** I view the "Classification Rules" section
**Then** I see the threshold rules in human-readable format:
- For Cfa: "Coldest month > 0°C and < 18°C, Warmest month ≥ 22°C, No dry season"

**And** each threshold value is highlighted/formatted distinctly
**And** technical terms link to the glossary (expandable)
**And** the decision tree path is shown (e.g., "Not E → Not B → Not A → C → f → a")

## Technical Implementation

### Files to Modify/Create

1. **src/climate/koppen-rules.js** - Add detailed rule definitions for each climate type
2. **src/ui/climate-info.js** - Render classification rules section
3. **src/ui/rule-formatter.js** (new) - Format rules into human-readable strings
4. **src/style.css** - Styles for rule display (`.rule-section`, `.rule-value`, `.rule-path`)

### Implementation Details

```javascript
// src/climate/koppen-rules.js - Enhanced structure
export const CLIMATE_RULES = {
  Cfa: {
    conditions: [
      { param: 'Tcold', operator: '>', value: 0, unit: '°C' },
      { param: 'Tcold', operator: '<', value: 18, unit: '°C' },
      { param: 'Thot', operator: '>=', value: 22, unit: '°C' },
      { param: 'precip_pattern', value: 'no_dry_season' }
    ],
    path: ['Not E', 'Not B', 'Not A', 'C', 'f', 'a'],
    humanReadable: 'Coldest month between 0°C and 18°C, warmest month ≥ 22°C, no dry season'
  },
  // ... all 30 types
};

// src/ui/rule-formatter.js
export function formatRuleAsHTML(rule) {
  // Convert rule object to formatted HTML with highlighted values
  // <span class="rule-value">0°C</span>
}

export function formatDecisionPath(path) {
  // Return: "Not E → Not B → Not A → C → f → a"
}
```

### Key Logic

- Each climate type has structured rule data
- Rules are displayed in a dedicated section within the profile panel
- Threshold values are visually highlighted (bold, colored)
- Decision tree path shows classification flow
- Technical terms (Tcold, Thot, Pdry, etc.) are wrapped with expandable glossary links

### Decision Tree Paths

| Type | Path |
|------|------|
| Af | A → f |
| Am | A → m |
| Aw/As | A → w/s |
| BWh | B → W → h |
| BWk | B → W → k |
| BSh | B → S → h |
| BSk | B → S → k |
| Cfa | C → f → a |
| Cfb | C → f → b |
| Cfc | C → f → c |
| (etc.) | ... |

### Dependencies

- Story 3.1 (Climate Profile Panel)

## Testing Checklist

- [ ] Rules section appears in profile panel
- [ ] Rules display correctly for all 30 climate types
- [ ] Threshold values are visually distinct
- [ ] Decision tree path is accurate
- [ ] Technical terms are marked as expandable
- [ ] Rules use correct Beck et al. 2018 thresholds
- [ ] Human-readable format is clear for students
- [ ] Mobile layout works well
- [ ] Screen reader announces rules properly

## Notes

- Beck et al. 2018 paper defines exact thresholds to use
- Key thresholds:
  - Tropical: Tcold ≥ 18°C
  - Arid: P < Pthreshold (calculated)
  - Temperate: 0°C < Tcold < 18°C
  - Continental: Tcold ≤ 0°C
  - Polar: Thot < 10°C
  - Hot summer: Thot ≥ 22°C
  - Warm summer: Thot < 22°C and ≥4 months > 10°C

## Implementation Complete

**Completed: 2025-12-05**

### Changes Made

1. **src/climate/koppen-rules.js** - Added `rules` array to all 30 climate types:
   - Each rule has: `param`, `operator`, `value`, `unit`, `term`
   - Terms link to glossary for expandable definitions
   - Added `path` array showing decision tree traversal

2. **src/ui/climate-info.js** - Added rules display:
   - `formatRule()` function renders rules with expandable terms
   - `formatDecisionPath()` shows classification flow with arrows
   - Rules section rendered in profile panel

3. **src/style.css** - Added styles:
   - `.info-panel__rules` - Rule list container
   - `.info-panel__rule` - Individual rule styling
   - `.info-panel__path`, `.info-panel__path-step`, `.info-panel__path-arrow`
   - `.rule-param`, `.rule-value` - Value highlighting
