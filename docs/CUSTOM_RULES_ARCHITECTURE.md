# Custom Rules Classification System - Architecture Design

## Overview

This document defines the architecture for a rule-based climate classification system that replaces/augments the existing threshold-based Koppen system. The new system allows users to create custom categories and define rules that classify geographic features based on climate parameters.

## Current Architecture Analysis

### Existing System (Threshold-Based)

```
User Input (Sliders) --> Threshold Values --> KOPPEN_RULES.classify() --> climate_type
```

**Key Files:**
- `src/climate/koppen-rules.js` - Classification algorithm with hardcoded decision tree
- `src/climate/presets.js` - KOPPEN_PRESET and SCRATCH_PRESET with threshold definitions
- `src/builder/threshold-sliders.js` - UI for adjusting thresholds
- `src/builder/index.js` - Builder panel orchestration
- `src/map/climate-layer.js` - Map rendering with `classifyFeatures()`
- `src/utils/state-manager.js` - State persistence and forking

**Limitations:**
1. Fixed classification hierarchy (E -> B -> A -> C/D)
2. Cannot create arbitrary categories
3. Cannot define custom rule logic
4. All features must be classified (no "unclassified" state)

---

## Target Architecture (Rule-Based)

### Design Principles

1. **Unclassified by Default**: Features start with no classification
2. **User-Defined Categories**: Users create named categories with colors
3. **Rule Priority**: Rules evaluated in user-defined order (first match wins)
4. **Backward Compatible**: Koppen presets can be imported as rule sets
5. **Extensible**: Support for future rule types (compound, geographic, etc.)

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
├─────────────────────────────────────────────────────────────────┤
│  Category Manager          Rule Editor          Preview Stats    │
│  ┌──────────────┐         ┌──────────────┐     ┌─────────────┐  │
│  │ + Add        │         │ Parameter ▼  │     │ Classified: │  │
│  │ ├─ Tropical  │         │ Operator  ▼  │     │   45,234    │  │
│  │ ├─ Arid      │         │ Value [___]  │     │ Unclassified│  │
│  │ └─ Custom 1  │         │ [Add Rule]   │     │   12,456    │  │
│  └──────────────┘         └──────────────┘     └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLASSIFICATION ENGINE                         │
├─────────────────────────────────────────────────────────────────┤
│  CustomRulesEngine.classify(feature, categories)                 │
│    1. For each category (in priority order):                     │
│       2. For each rule in category:                              │
│          3. Evaluate rule against feature properties             │
│       4. If ALL rules pass → return category                     │
│    5. If no match → return null (unclassified)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MAP LAYER                                   │
├─────────────────────────────────────────────────────────────────┤
│  - Classified features: Use category color                       │
│  - Unclassified features: Gray (#CCCCCC) with reduced opacity   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### Category Definition

```javascript
/**
 * @typedef {Object} Category
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Display name (e.g., "Hot Tropical")
 * @property {string} color - Hex color for map display
 * @property {string} [description] - Optional description
 * @property {number} priority - Sort order (lower = higher priority)
 * @property {Rule[]} rules - Array of rules (AND logic within category)
 * @property {boolean} enabled - Whether category is active
 */

const exampleCategory = {
  id: "cat_abc123",
  name: "Hot Tropical",
  color: "#0000FF",
  description: "Hot and wet year-round",
  priority: 0,
  enabled: true,
  rules: [
    { id: "rule_1", parameter: "Tmin", operator: ">=", value: 18, unit: "°C" },
    { id: "rule_2", parameter: "Pdry", operator: ">=", value: 60, unit: "mm" }
  ]
};
```

### Rule Definition

```javascript
/**
 * @typedef {Object} Rule
 * @property {string} id - Unique identifier
 * @property {string} parameter - Climate parameter to evaluate
 * @property {string} operator - Comparison operator
 * @property {number|number[]} value - Threshold value(s)
 * @property {string} [unit] - Display unit
 */

// Supported operators
const OPERATORS = {
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  'in_range': (a, [min, max]) => a >= min && a <= max,
  'not_in_range': (a, [min, max]) => a < min || a > max,
};

// Supported parameters (derived from feature properties)
const PARAMETERS = {
  // Direct temperature metrics
  MAT: { label: 'Mean Annual Temp', unit: '°C', compute: (p) => p.mat },
  Tmin: { label: 'Coldest Month Temp', unit: '°C', compute: (p) => p.tmin },
  Tmax: { label: 'Warmest Month Temp', unit: '°C', compute: (p) => p.tmax },

  // Direct precipitation metrics
  MAP: { label: 'Mean Annual Precip', unit: 'mm', compute: (p) => p.map },
  Pdry: { label: 'Driest Month Precip', unit: 'mm', compute: (p) => p.pdry },
  Pwet: { label: 'Wettest Month Precip', unit: 'mm', compute: (p) => Math.max(...getMonthlyPrecip(p)) },

  // Seasonal metrics (computed)
  Psummer: { label: 'Summer Precip Total', unit: 'mm', compute: computeSummerPrecip },
  Pwinter: { label: 'Winter Precip Total', unit: 'mm', compute: computeWinterPrecip },
  WarmMonths: { label: 'Months >= 10°C', unit: 'months', compute: computeWarmMonths },

  // Ratios
  AridityIndex: { label: 'Aridity Index', unit: '', compute: computeAridityIndex },
};
```

### Classification System (Complete State)

```javascript
/**
 * @typedef {Object} CustomClassificationSystem
 * @property {string} id - Unique identifier
 * @property {string} name - System name
 * @property {string} version - Version string
 * @property {string} [description] - Optional description
 * @property {Category[]} categories - Ordered list of categories
 * @property {Object} metadata - Creation/modification info
 */

const exampleSystem = {
  id: "sys_xyz789",
  name: "My Custom Climate System",
  version: "1.0.0",
  description: "A simplified climate classification",
  categories: [
    { /* Hot Tropical */ },
    { /* Cold Desert */ },
    // ... more categories
  ],
  metadata: {
    createdAt: "2024-01-15T10:30:00Z",
    modifiedAt: "2024-01-15T14:22:00Z",
    author: "User",
    basedOn: "koppen-geiger", // or null for scratch
  }
};
```

---

## Module Design

### 1. CustomRulesEngine (`src/climate/custom-rules.js`)

```javascript
// Core classification engine
export class CustomRulesEngine {
  constructor(categories = []) {
    this.categories = categories;
  }

  /**
   * Classify a single feature
   * @param {Object} feature - GeoJSON feature with climate properties
   * @returns {Object|null} - Matched category or null
   */
  classify(feature) {
    const props = feature.properties;

    // Evaluate categories in priority order
    for (const category of this.getSortedCategories()) {
      if (!category.enabled) continue;

      const allRulesPass = category.rules.every(rule =>
        this.evaluateRule(rule, props)
      );

      if (allRulesPass) {
        return {
          categoryId: category.id,
          categoryName: category.name,
          color: category.color,
        };
      }
    }

    return null; // Unclassified
  }

  /**
   * Classify all features
   * @param {Array} features - GeoJSON features
   * @returns {Object} - { classified: Feature[], unclassified: Feature[], stats: {} }
   */
  classifyAll(features) { /* ... */ }

  /**
   * Evaluate a single rule against feature properties
   */
  evaluateRule(rule, props) { /* ... */ }

  /**
   * Get categories sorted by priority
   */
  getSortedCategories() { /* ... */ }

  // Category management
  addCategory(category) { /* ... */ }
  updateCategory(id, updates) { /* ... */ }
  removeCategory(id) { /* ... */ }
  reorderCategories(orderedIds) { /* ... */ }

  // Rule management within category
  addRule(categoryId, rule) { /* ... */ }
  updateRule(categoryId, ruleId, updates) { /* ... */ }
  removeRule(categoryId, ruleId) { /* ... */ }

  // Serialization
  toJSON() { /* ... */ }
  static fromJSON(json) { /* ... */ }

  // Koppen preset conversion
  static fromKoppenPreset(preset) { /* ... */ }
}
```

### 2. CategoryManager (`src/builder/category-manager.js`)

```javascript
// UI component for managing categories
export class CategoryManager {
  constructor(container, engine) {
    this.container = container;
    this.engine = engine;
  }

  render() { /* ... */ }

  // UI interactions
  onAddCategory() { /* ... */ }
  onEditCategory(id) { /* ... */ }
  onDeleteCategory(id) { /* ... */ }
  onReorderCategory(id, newIndex) { /* ... */ }
  onToggleCategory(id) { /* ... */ }

  // Color picker integration
  showColorPicker(categoryId) { /* ... */ }
}
```

### 3. RuleEditor (`src/builder/rule-editor.js`)

```javascript
// UI component for editing rules within a category
export class RuleEditor {
  constructor(container, category, onChange) {
    this.container = container;
    this.category = category;
    this.onChange = onChange;
  }

  render() { /* ... */ }

  // Rule creation UI
  createRuleRow(rule) { /* ... */ }
  createParameterDropdown() { /* ... */ }
  createOperatorDropdown(parameter) { /* ... */ }
  createValueInput(parameter, operator) { /* ... */ }

  // UI interactions
  onAddRule() { /* ... */ }
  onUpdateRule(ruleId, field, value) { /* ... */ }
  onDeleteRule(ruleId) { /* ... */ }
}
```

### 4. Integration Points

#### builder/index.js Updates

```javascript
// Add mode switch: 'koppen' | 'custom'
let classificationMode = 'koppen';

function startFromScratch() {
  // NEW: Initialize custom rules engine instead of scratch preset
  classificationMode = 'custom';
  customEngine = new CustomRulesEngine([]);

  // Render category manager + rule editor instead of threshold sliders
  renderCustomRulesUI();
}

function startFromKoppen() {
  // UNCHANGED: Use existing threshold-based system
  classificationMode = 'koppen';
  // ... existing code
}
```

#### climate-layer.js Updates

```javascript
// Support both classification modes
export function classifyFeatures(features, thresholdsOrEngine) {
  if (thresholdsOrEngine instanceof CustomRulesEngine) {
    // Custom rules mode
    const result = thresholdsOrEngine.classifyAll(features);
    return result.classified.concat(result.unclassified);
  } else {
    // Legacy Koppen mode
    return existingClassifyFeatures(features, thresholdsOrEngine);
  }
}

// Handle unclassified features in styling
function getFeatureStyle(feature) {
  const type = feature.properties.climate_type;

  if (!type) {
    // Unclassified style
    return {
      fillColor: '#CCCCCC',
      fillOpacity: 0.3,
      color: '#999999',
      weight: 0.25,
    };
  }

  // ... existing style logic
}
```

#### state-manager.js Updates

```javascript
// Add custom rules serialization
export function serializeClassification(mode, data) {
  if (mode === 'custom') {
    return {
      mode: 'custom',
      version: '2.0.0',
      categories: data.engine.toJSON(),
    };
  } else {
    return {
      mode: 'koppen',
      version: '1.0.0',
      thresholds: data.thresholds,
    };
  }
}

export function deserializeClassification(json) {
  if (json.mode === 'custom') {
    return {
      mode: 'custom',
      engine: CustomRulesEngine.fromJSON(json.categories),
    };
  } else {
    return {
      mode: 'koppen',
      thresholds: json.thresholds,
    };
  }
}
```

---

## Migration Path

### Phase 1: Add Custom Rules Engine (Non-Breaking)
1. Create `custom-rules.js` with `CustomRulesEngine` class
2. Add tests for rule evaluation
3. No UI changes yet

### Phase 2: Add UI Components (Non-Breaking)
1. Create `category-manager.js`
2. Create `rule-editor.js`
3. Style components in `style.css`
4. No integration yet

### Phase 3: Integrate with Builder
1. Update `builder/index.js` to support mode switching
2. "Start from Scratch" initializes custom rules mode
3. "Start from Koppen" uses existing threshold mode
4. Both modes coexist

### Phase 4: Update Map Layer
1. Update `climate-layer.js` to handle unclassified features
2. Support custom category colors
3. Update legend to show custom categories

### Phase 5: State Persistence
1. Update JSON export/import for custom rules
2. Update URL state encoding
3. Ensure backward compatibility with threshold-based shares

---

## File Structure

```
src/
├── builder/
│   ├── index.js                 # Updated: Mode switching
│   ├── threshold-sliders.js     # Unchanged: Koppen mode
│   ├── category-manager.js      # NEW: Category list UI
│   ├── rule-editor.js           # NEW: Rule editing UI
│   └── ...
├── climate/
│   ├── koppen-rules.js          # Unchanged: Koppen algorithm
│   ├── custom-rules.js          # NEW: Custom rules engine
│   ├── presets.js               # Updated: Add rule system presets
│   └── ...
├── map/
│   ├── climate-layer.js         # Updated: Unclassified handling
│   └── ...
├── utils/
│   ├── state-manager.js         # Updated: Custom rules serialization
│   └── ...
└── style.css                    # Updated: New component styles
```

---

## UI Design Specifications

### Category Manager Panel

```
┌─────────────────────────────────────────┐
│ Categories                    [+ Add]   │
├─────────────────────────────────────────┤
│ ☰ ■ Hot Tropical              [≡] [✕]  │
│     2 rules • 12,345 matches            │
├─────────────────────────────────────────┤
│ ☰ ■ Arid Desert               [≡] [✕]  │
│     3 rules • 8,901 matches             │
├─────────────────────────────────────────┤
│ ☰ ■ Temperate                 [≡] [✕]  │
│     4 rules • 23,456 matches            │
├─────────────────────────────────────────┤
│          [Unclassified: 5,678]          │
└─────────────────────────────────────────┘

Legend:
☰ = Drag handle for reordering
■ = Color swatch (clickable for color picker)
[≡] = Expand/edit rules
[✕] = Delete category
```

### Rule Editor (Expanded Category)

```
┌─────────────────────────────────────────┐
│ ▼ Hot Tropical                          │
├─────────────────────────────────────────┤
│ Rules (AND logic):                      │
│                                         │
│ [Coldest Month Temp ▼] [>= ▼] [18] °C  │
│                                   [✕]  │
│                                         │
│ [Driest Month Precip ▼] [>= ▼] [60] mm │
│                                   [✕]  │
│                                         │
│ [+ Add Rule]                            │
└─────────────────────────────────────────┘
```

### Statistics Panel

```
┌─────────────────────────────────────────┐
│ Classification Summary                  │
├─────────────────────────────────────────┤
│ Total Features:     50,380              │
│ Classified:         44,702 (88.7%)      │
│ Unclassified:        5,678 (11.3%)      │
├─────────────────────────────────────────┤
│ By Category:                            │
│ ■ Hot Tropical      12,345 (24.5%)      │
│ ■ Arid Desert        8,901 (17.7%)      │
│ ■ Temperate         23,456 (46.6%)      │
└─────────────────────────────────────────┘
```

---

## Events

### New Events

```javascript
// Category events
'koppen:category-added'      // { category }
'koppen:category-updated'    // { categoryId, updates }
'koppen:category-removed'    // { categoryId }
'koppen:categories-reordered' // { orderedIds }

// Rule events
'koppen:rule-added'          // { categoryId, rule }
'koppen:rule-updated'        // { categoryId, ruleId, updates }
'koppen:rule-removed'        // { categoryId, ruleId }

// Classification events
'koppen:custom-classify'     // Trigger reclassification
'koppen:classification-stats' // { classified, unclassified, byCategory }

// Mode events
'koppen:mode-changed'        // { mode: 'koppen' | 'custom' }
```

---

## Testing Strategy

### Unit Tests
- `custom-rules.test.js` - Rule evaluation, category management
- `category-manager.test.js` - UI component behavior
- `rule-editor.test.js` - UI component behavior

### Integration Tests
- Classification with custom rules applied to real data
- Mode switching between Koppen and custom
- State persistence roundtrip

### E2E Tests (Playwright)
- Create custom category
- Add rules to category
- Verify map updates
- Export/import custom classification

---

## Implementation Priority

1. **High**: CustomRulesEngine core (enables all other work)
2. **High**: Unclassified feature handling in map layer
3. **Medium**: Category manager UI
4. **Medium**: Rule editor UI
5. **Medium**: State persistence
6. **Low**: Koppen-to-rules conversion
7. **Low**: Advanced operators (formula-based rules)

---

## Open Questions

1. **Rule Logic**: Should we support OR logic between rules, or only AND?
   - Current design: AND only (all rules must pass)
   - Future: Could add rule groups with OR between groups

2. **Derived Parameters**: How many computed parameters to expose?
   - Start with: MAT, Tmin, Tmax, MAP, Pdry, WarmMonths
   - Later: Add seasonal ratios, aridity indices

3. **Category Limits**: Should we limit number of categories?
   - Recommendation: Soft limit of 30 with warning

4. **Backward Compatibility**: Can Koppen presets be auto-converted to rules?
   - Yes, but the decision tree is complex
   - Initial implementation: Manual conversion

---

## Appendix: Parameter Reference

| Parameter | Label | Unit | Source |
|-----------|-------|------|--------|
| MAT | Mean Annual Temperature | °C | props.mat |
| Tmin | Coldest Month Temperature | °C | props.tmin |
| Tmax | Warmest Month Temperature | °C | props.tmax |
| MAP | Mean Annual Precipitation | mm | props.map |
| Pdry | Driest Month Precipitation | mm | props.pdry |
| Pwet | Wettest Month Precipitation | mm | computed |
| Psummer | Summer Precipitation Total | mm | computed |
| Pwinter | Winter Precipitation Total | mm | computed |
| WarmMonths | Months with Temp >= 10°C | months | computed |
| AridityIndex | P / (T + 10) | ratio | computed |
