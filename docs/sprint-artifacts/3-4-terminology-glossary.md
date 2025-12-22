# Story 3.4: Terminology Glossary

## Story

As a **user**,
I want **to expand unfamiliar terms in the profile**,
So that **I can understand classification terminology**.

## Status

- **Epic**: 3 - Climate Information & Profiles
- **Status**: done
- **FRs Covered**: FR14

## Acceptance Criteria

**Given** a classification rule contains a technical term (e.g., "Pthreshold")
**When** I click/tap on the term
**Then** an inline expansion appears explaining:
- "Pthreshold: The precipitation threshold for aridity, calculated as 2×MAT + 28 if 70%+ of rain falls in summer..."

**And** the expansion can be collapsed by clicking again
**And** terms are visually distinct (dotted underline, help cursor)
**And** expansions are accessible (aria-expanded, role="button")

## Technical Implementation

### Files to Modify/Create

1. **src/climate/glossary.js** (new) - Terminology definitions
2. **src/ui/expandable-term.js** (new) - Expandable term component
3. **src/ui/climate-info.js** - Integrate glossary terms into rules display
4. **src/style.css** - Styles for expandable terms

### Implementation Details

```javascript
// src/climate/glossary.js
export const GLOSSARY = {
  MAT: {
    term: 'MAT',
    fullName: 'Mean Annual Temperature',
    definition: 'The average temperature over a full year, calculated as the mean of all 12 monthly average temperatures.',
    formula: null
  },
  MAP: {
    term: 'MAP',
    fullName: 'Mean Annual Precipitation',
    definition: 'The total precipitation (rain + snow) accumulated over a full year, typically measured in millimeters.',
    formula: null
  },
  Tcold: {
    term: 'Tcold',
    fullName: 'Coldest Month Temperature',
    definition: 'The average temperature of the coldest month of the year. Used to distinguish tropical (≥18°C) from temperate and continental climates.',
    formula: null
  },
  Thot: {
    term: 'Thot',
    fullName: 'Warmest Month Temperature',
    definition: 'The average temperature of the warmest month. Used to determine summer intensity (hot ≥22°C, warm <22°C) and polar climates (<10°C).',
    formula: null
  },
  Pthreshold: {
    term: 'Pthreshold',
    fullName: 'Aridity Threshold',
    definition: 'The precipitation threshold that determines if a climate is arid (B). It accounts for temperature and seasonal precipitation distribution.',
    formula: 'If ≥70% rain in summer: Pth = 2×MAT + 28\nIf ≥70% rain in winter: Pth = 2×MAT\nOtherwise: Pth = 2×MAT + 14'
  },
  Pdry: {
    term: 'Pdry',
    fullName: 'Driest Month Precipitation',
    definition: 'The precipitation of the driest month. Used to determine seasonal precipitation patterns (dry summer, dry winter, or no dry season).',
    formula: null
  },
  Pwdry: {
    term: 'Pwdry',
    fullName: 'Driest Winter Month',
    definition: 'The precipitation of the driest month during winter (Oct-Mar in NH, Apr-Sep in SH). Used to identify dry winter (w) climates.',
    formula: null
  },
  Psdry: {
    term: 'Psdry',
    fullName: 'Driest Summer Month',
    definition: 'The precipitation of the driest month during summer (Apr-Sep in NH, Oct-Mar in SH). Used to identify dry summer (s) climates.',
    formula: null
  },
  Pswet: {
    term: 'Pswet',
    fullName: 'Wettest Summer Month',
    definition: 'The precipitation of the wettest month during summer. Used with Pwdry to determine monsoon (m) classification.',
    formula: null
  },
  Pwwet: {
    term: 'Pwwet',
    fullName: 'Wettest Winter Month',
    definition: 'The precipitation of the wettest month during winter. Used with Psdry to determine seasonal patterns.',
    formula: null
  },
  Tmon10: {
    term: 'Tmon10',
    fullName: 'Months Above 10°C',
    definition: 'The number of months with average temperature ≥10°C. Used to distinguish warm summer (b: ≥4 months) from cold summer (c: 1-3 months) climates.',
    formula: null
  }
};

// src/ui/expandable-term.js
export function createExpandableTerm(termKey) {
  const glossaryEntry = GLOSSARY[termKey];
  if (!glossaryEntry) return termKey;

  return `
    <button class="expandable-term"
            aria-expanded="false"
            data-term="${termKey}">
      <span class="expandable-term__text">${termKey}</span>
      <span class="expandable-term__definition" hidden>
        <strong>${glossaryEntry.fullName}</strong>: ${glossaryEntry.definition}
        ${glossaryEntry.formula ? `<code>${glossaryEntry.formula}</code>` : ''}
      </span>
    </button>
  `;
}

export function initExpandableTerms(container) {
  container.querySelectorAll('.expandable-term').forEach(term => {
    term.addEventListener('click', () => {
      const isExpanded = term.getAttribute('aria-expanded') === 'true';
      term.setAttribute('aria-expanded', !isExpanded);
      term.querySelector('.expandable-term__definition').hidden = isExpanded;
    });
  });
}
```

### CSS Styles

```css
/* src/style.css additions */
.expandable-term {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--color-primary);
  text-decoration: underline dotted;
  cursor: help;
  display: inline;
}

.expandable-term:hover {
  color: var(--color-primary-hover);
}

.expandable-term:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.expandable-term__definition {
  display: block;
  margin-top: var(--space-2);
  padding: var(--space-3);
  background-color: var(--color-surface-hover);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-align: left;
}

.expandable-term__definition code {
  display: block;
  margin-top: var(--space-2);
  padding: var(--space-2);
  background-color: var(--color-surface);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  white-space: pre-wrap;
}
```

### Dependencies

- Story 3.2 (Classification Rules Display)

## Testing Checklist

- [ ] Technical terms are visually distinct (dotted underline)
- [ ] Clicking term expands definition inline
- [ ] Clicking again collapses definition
- [ ] All key terms have definitions (MAT, MAP, Tcold, Thot, Pthreshold, etc.)
- [ ] Definitions are accurate per Beck et al. 2018
- [ ] Formula displays correctly for Pthreshold
- [ ] aria-expanded updates correctly
- [ ] Keyboard accessible (Enter/Space toggles)
- [ ] Screen reader announces expansion state
- [ ] Help cursor on hover
- [ ] Works on mobile (touch to expand)
- [ ] Multiple terms can be expanded simultaneously

## Notes

- Key terms from Beck et al. 2018 paper:
  - Temperature: MAT, Tcold, Thot, Tmon10
  - Precipitation: MAP, Pthreshold, Pdry, Psdry, Pwdry, Pswet, Pwwet
- Pthreshold formula is the most complex - ensure it's clearly explained
- Consider adding visual diagrams for seasonal patterns in future enhancement

## Implementation Complete

**Completed: 2025-12-05**

### Changes Made

1. **src/climate/glossary.js** (NEW) - Created with 13 terms:
   - MAT, MAP - Annual averages
   - Tcold, Thot - Temperature extremes
   - Pthreshold - Aridity formula (includes formula display)
   - Pdry, Pwdry, Psdry, Pswet, Pwwet - Precipitation patterns
   - Tmon10 - Months above 10°C
   - dry_season, monsoon - Pattern descriptions

2. **src/ui/expandable-term.js** (NEW) - Expandable term component:
   - `createExpandableTerm(termKey)` - Generates button HTML
   - `createTermDefinition(termKey)` - Generates definition HTML
   - `initExpandableTerms(container)` - Attaches click handlers
   - `toggleTerm()` - Handles expand/collapse with animation
   - `collapseAllTerms(container)` - Utility to close all

3. **src/ui/climate-info.js** - Integration:
   - Imports `initExpandableTerms`
   - Calls it after panel content is rendered
   - Terms in rules are clickable

4. **src/style.css** - Added styles:
   - `.expandable-term` - Button with blue highlight
   - `.expandable-term[aria-expanded="true"]` - Active state
   - `.expandable-term__definition` - Slide-in definition box
   - `.expandable-term__formula` - Monospace formula display
