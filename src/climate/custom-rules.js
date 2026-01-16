/**
 * Custom Rules Classification Engine
 * Allows users to create custom categories and define rules for climate classification
 * @module climate/custom-rules
 */

/* eslint-disable security/detect-object-injection --
 * This file accesses rule configurations using keys from internal category objects.
 * Keys are not user-controlled; they come from Object.keys() iteration of internal structures.
 * See docs/orchestration/checkpoints/security-review.md for full analysis.
 */

import logger from '../utils/logger.js';

/**
 * Generate a unique ID for categories and rules
 * @returns {string} UUID-like identifier
 */
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * Supported comparison operators
 */
export const OPERATORS = {
  '<': { label: '<', fn: (a, b) => a < b },
  '<=': { label: '<=', fn: (a, b) => a <= b },
  '>': { label: '>', fn: (a, b) => a > b },
  '>=': { label: '>=', fn: (a, b) => a >= b },
  '==': { label: '=', fn: (a, b) => Math.abs(a - b) < 0.001 },
  '!=': { label: '!=', fn: (a, b) => Math.abs(a - b) >= 0.001 },
  'in_range': { label: 'between', fn: (a, [min, max]) => a >= min && a <= max },
  'not_in_range': { label: 'not between', fn: (a, [min, max]) => a < min || a > max },
};

/**
 * Get monthly temperature array from properties
 * @param {Object} props - Feature properties
 * @returns {number[]} Array of 12 monthly temperatures
 */
function getMonthlyTemp(props) {
  const temps = [];
  for (let i = 1; i <= 12; i++) {
    temps.push(props[`t${i}`] ?? 0);
  }
  return temps;
}

/**
 * Get monthly precipitation array from properties
 * @param {Object} props - Feature properties
 * @returns {number[]} Array of 12 monthly precipitations
 */
function getMonthlyPrecip(props) {
  const precips = [];
  for (let i = 1; i <= 12; i++) {
    precips.push(props[`p${i}`] ?? 0);
  }
  return precips;
}

/**
 * Compute summer precipitation total
 * @param {Object} props - Feature properties
 * @returns {number} Summer precipitation in mm
 */
function computeSummerPrecip(props) {
  const precips = getMonthlyPrecip(props);
  const isNorthern = (props.lat ?? 0) >= 0;
  const summerMonths = isNorthern ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 0, 1, 2];
  return summerMonths.reduce((sum, i) => sum + precips[i], 0);
}

/**
 * Compute winter precipitation total
 * @param {Object} props - Feature properties
 * @returns {number} Winter precipitation in mm
 */
function computeWinterPrecip(props) {
  const precips = getMonthlyPrecip(props);
  const isNorthern = (props.lat ?? 0) >= 0;
  const winterMonths = isNorthern ? [9, 10, 11, 0, 1, 2] : [3, 4, 5, 6, 7, 8];
  return winterMonths.reduce((sum, i) => sum + precips[i], 0);
}

/**
 * Compute number of warm months (>= 10C)
 * @param {Object} props - Feature properties
 * @returns {number} Number of months with temp >= 10C
 */
function computeWarmMonths(props) {
  const temps = getMonthlyTemp(props);
  return temps.filter(t => t >= 10).length;
}

/**
 * Compute aridity index (MAP / (MAT + 10))
 * @param {Object} props - Feature properties
 * @returns {number} Aridity index
 */
function computeAridityIndex(props) {
  const mat = props.mat ?? 0;
  const map = props.map ?? 0;
  return map / (mat + 10);
}

/**
 * Compute wettest month precipitation
 * @param {Object} props - Feature properties
 * @returns {number} Wettest month precipitation in mm
 */
function computeWettestMonth(props) {
  const precips = getMonthlyPrecip(props);
  return Math.max(...precips);
}

/**
 * Compute driest summer month precipitation
 * @param {Object} props - Feature properties
 * @returns {number} Driest summer month precipitation in mm
 */
function computeDriestSummerMonth(props) {
  const precips = getMonthlyPrecip(props);
  const isNorthern = (props.lat ?? 0) >= 0;
  const summerMonths = isNorthern ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 0, 1, 2];
  return Math.min(...summerMonths.map(i => precips[i]));
}

/**
 * Compute driest winter month precipitation
 * @param {Object} props - Feature properties
 * @returns {number} Driest winter month precipitation in mm
 */
function computeDriestWinterMonth(props) {
  const precips = getMonthlyPrecip(props);
  const isNorthern = (props.lat ?? 0) >= 0;
  const winterMonths = isNorthern ? [9, 10, 11, 0, 1, 2] : [3, 4, 5, 6, 7, 8];
  return Math.min(...winterMonths.map(i => precips[i]));
}

/**
 * Compute wettest summer month precipitation
 * @param {Object} props - Feature properties
 * @returns {number} Wettest summer month precipitation in mm
 */
function computeWettestSummerMonth(props) {
  const precips = getMonthlyPrecip(props);
  const isNorthern = (props.lat ?? 0) >= 0;
  const summerMonths = isNorthern ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 0, 1, 2];
  return Math.max(...summerMonths.map(i => precips[i]));
}

/**
 * Compute wettest winter month precipitation
 * @param {Object} props - Feature properties
 * @returns {number} Wettest winter month precipitation in mm
 */
function computeWettestWinterMonth(props) {
  const precips = getMonthlyPrecip(props);
  const isNorthern = (props.lat ?? 0) >= 0;
  const winterMonths = isNorthern ? [9, 10, 11, 0, 1, 2] : [3, 4, 5, 6, 7, 8];
  return Math.max(...winterMonths.map(i => precips[i]));
}

/**
 * Supported climate parameters with their computation functions
 */
export const PARAMETERS = {
  // Temperature parameters
  MAT: {
    id: 'MAT',
    label: 'Mean Annual Temperature',
    shortLabel: 'MAT',
    unit: '\u00B0C',
    category: 'temperature',
    compute: (props) => props.mat ?? (getMonthlyTemp(props).reduce((a, b) => a + b, 0) / 12),
    range: [-50, 50],
    step: 0.5,
  },
  Tmin: {
    id: 'Tmin',
    label: 'Coldest Month Temperature',
    shortLabel: 'Tmin',
    unit: '\u00B0C',
    category: 'temperature',
    compute: (props) => props.tmin ?? Math.min(...getMonthlyTemp(props)),
    range: [-60, 30],
    step: 0.5,
  },
  Tmax: {
    id: 'Tmax',
    label: 'Warmest Month Temperature',
    shortLabel: 'Tmax',
    unit: '\u00B0C',
    category: 'temperature',
    compute: (props) => props.tmax ?? Math.max(...getMonthlyTemp(props)),
    range: [-20, 50],
    step: 0.5,
  },
  WarmMonths: {
    id: 'WarmMonths',
    label: 'Months with Temp >= 10\u00B0C',
    shortLabel: 'Warm Months',
    unit: 'months',
    category: 'temperature',
    compute: computeWarmMonths,
    range: [0, 12],
    step: 1,
  },

  // Precipitation parameters
  MAP: {
    id: 'MAP',
    label: 'Mean Annual Precipitation',
    shortLabel: 'MAP',
    unit: 'mm',
    category: 'precipitation',
    compute: (props) => props.map ?? getMonthlyPrecip(props).reduce((a, b) => a + b, 0),
    range: [0, 5000],
    step: 10,
  },
  Pdry: {
    id: 'Pdry',
    label: 'Driest Month Precipitation',
    shortLabel: 'Pdry',
    unit: 'mm',
    category: 'precipitation',
    compute: (props) => props.pdry ?? Math.min(...getMonthlyPrecip(props)),
    range: [0, 500],
    step: 5,
  },
  Pwet: {
    id: 'Pwet',
    label: 'Wettest Month Precipitation',
    shortLabel: 'Pwet',
    unit: 'mm',
    category: 'precipitation',
    compute: computeWettestMonth,
    range: [0, 1000],
    step: 10,
  },
  Psummer: {
    id: 'Psummer',
    label: 'Summer Precipitation Total',
    shortLabel: 'Psummer',
    unit: 'mm',
    category: 'precipitation',
    compute: computeSummerPrecip,
    range: [0, 3000],
    step: 10,
  },
  Pwinter: {
    id: 'Pwinter',
    label: 'Winter Precipitation Total',
    shortLabel: 'Pwinter',
    unit: 'mm',
    category: 'precipitation',
    compute: computeWinterPrecip,
    range: [0, 3000],
    step: 10,
  },
  Psdry: {
    id: 'Psdry',
    label: 'Driest Summer Month',
    shortLabel: 'Psdry',
    unit: 'mm',
    category: 'precipitation',
    compute: computeDriestSummerMonth,
    range: [0, 500],
    step: 5,
  },
  Pwdry: {
    id: 'Pwdry',
    label: 'Driest Winter Month',
    shortLabel: 'Pwdry',
    unit: 'mm',
    category: 'precipitation',
    compute: computeDriestWinterMonth,
    range: [0, 500],
    step: 5,
  },
  Pswet: {
    id: 'Pswet',
    label: 'Wettest Summer Month',
    shortLabel: 'Pswet',
    unit: 'mm',
    category: 'precipitation',
    compute: computeWettestSummerMonth,
    range: [0, 1000],
    step: 10,
  },
  Pwwet: {
    id: 'Pwwet',
    label: 'Wettest Winter Month',
    shortLabel: 'Pwwet',
    unit: 'mm',
    category: 'precipitation',
    compute: computeWettestWinterMonth,
    range: [0, 1000],
    step: 10,
  },

  // Derived parameters
  AridityIndex: {
    id: 'AridityIndex',
    label: 'Aridity Index (MAP / (MAT + 10))',
    shortLabel: 'Aridity',
    unit: '',
    category: 'derived',
    compute: computeAridityIndex,
    range: [0, 500],
    step: 1,
  },
};

/**
 * Default colors for new categories
 */
export const DEFAULT_COLORS = [
  '#0000FF', // Blue
  '#FF0000', // Red
  '#00FF00', // Green
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FF8000', // Orange
  '#8000FF', // Purple
  '#00FF80', // Mint
  '#FF0080', // Pink
];

/**
 * Custom Rules Classification Engine
 */
export class CustomRulesEngine {
  /**
   * Create a new CustomRulesEngine
   * @param {Object[]} categories - Initial categories
   */
  constructor(categories = []) {
    this.categories = categories.map(cat => ({
      id: cat.id || generateId(),
      name: cat.name || 'Untitled Category',
      color: cat.color || DEFAULT_COLORS[0],
      description: cat.description || '',
      priority: cat.priority ?? 0,
      enabled: cat.enabled !== false,
      rules: (cat.rules || []).map(rule => ({
        id: rule.id || generateId(),
        parameter: rule.parameter || 'MAT',
        operator: rule.operator || '>=',
        value: rule.value ?? 0,
        unit: rule.unit || PARAMETERS[rule.parameter]?.unit || '',
      })),
    }));

    // Sort by priority first (for imported data), then ensure priorities are sequential
    this.categories.sort((a, b) => a.priority - b.priority);
    this.normalizePriorities();
  }

  /**
   * Normalize category priorities to be sequential based on current array order
   * NOTE: This does NOT sort - it assigns priorities based on current position
   */
  normalizePriorities() {
    this.categories.forEach((cat, index) => {
      cat.priority = index;
    });
  }

  /**
   * Legacy method name - kept for backward compatibility
   * @deprecated Use normalizePriorities() instead
   */
  normalizeProperties() {
    this.normalizePriorities();
  }

  /**
   * Get categories sorted by priority (lower priority = evaluated first)
   * @returns {Object[]} Sorted categories
   */
  getSortedCategories() {
    return [...this.categories].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get the computed value of a parameter for a feature
   * @param {string} parameterId - Parameter ID
   * @param {Object} props - Feature properties
   * @returns {number} Computed value
   */
  getParameterValue(parameterId, props) {
    const param = PARAMETERS[parameterId];
    if (!param) {
      console.warn(`[CustomRules] Unknown parameter: ${parameterId}`);
      return 0;
    }
    return param.compute(props);
  }

  /**
   * Evaluate a single rule against feature properties
   * @param {Object} rule - Rule to evaluate
   * @param {Object} props - Feature properties
   * @returns {boolean} Whether the rule passes
   */
  evaluateRule(rule, props) {
    const { parameter, operator, value } = rule;

    // Get the computed parameter value
    const actualValue = this.getParameterValue(parameter, props);

    // Get the operator function
    const op = OPERATORS[operator];
    if (!op) {
      console.warn(`[CustomRules] Unknown operator: ${operator}`);
      return false;
    }

    // Evaluate
    try {
      return op.fn(actualValue, value);
    } catch (error) {
      console.error('[CustomRules] Rule evaluation error:', error);
      return false;
    }
  }

  /**
   * Classify a single feature
   * @param {Object} feature - GeoJSON feature with climate properties
   * @returns {Object|null} Matched category info or null if unclassified
   */
  classify(feature) {
    const props = feature.properties;

    // Evaluate categories in priority order
    for (const category of this.getSortedCategories()) {
      if (!category.enabled) continue;

      // Category with no rules never matches
      if (category.rules.length === 0) continue;

      // All rules must pass (AND logic)
      const allRulesPass = category.rules.every(rule =>
        this.evaluateRule(rule, props),
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
   * Classify all features and return results with statistics
   * @param {Object[]} features - GeoJSON features
   * @returns {Object} Classification results
   */
  classifyAll(features) {
    const classified = [];
    const unclassified = [];
    const stats = {
      total: features.length,
      classified: 0,
      unclassified: 0,
      byCategory: {},
    };

    // Initialize stats for all categories
    for (const cat of this.categories) {
      stats.byCategory[cat.id] = {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        count: 0,
      };
    }

    // Classify each feature
    for (const feature of features) {
      const result = this.classify(feature);

      if (result) {
        // Feature matched a category
        classified.push({
          ...feature,
          properties: {
            ...feature.properties,
            climate_type: result.categoryId,
            climate_name: result.categoryName,
            climate_color: result.color,
            classified: true,
          },
        });
        stats.classified++;
        if (stats.byCategory[result.categoryId]) {
          stats.byCategory[result.categoryId].count++;
        }
      } else {
        // Feature didn't match any category
        unclassified.push({
          ...feature,
          properties: {
            ...feature.properties,
            climate_type: null,
            climate_name: 'Unclassified',
            climate_color: '#CCCCCC',
            classified: false,
          },
        });
        stats.unclassified++;
      }
    }

    return { classified, unclassified, stats };
  }

  // ============================================
  // Category Management
  // ============================================

  /**
   * Add a new category
   * @param {Object} category - Category data
   * @returns {Object} The created category
   */
  addCategory(category = {}) {
    const newCategory = {
      id: generateId(),
      name: category.name || `Category ${this.categories.length + 1}`,
      color: category.color || DEFAULT_COLORS[this.categories.length % DEFAULT_COLORS.length],
      description: category.description || '',
      priority: this.categories.length,
      enabled: true,
      rules: [],
    };

    this.categories.push(newCategory);

    // Dispatch event
    document.dispatchEvent(new CustomEvent('koppen:category-added', {
      detail: { category: newCategory },
    }));

    return newCategory;
  }

  /**
   * Update a category
   * @param {string} categoryId - Category ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated category or null if not found
   */
  updateCategory(categoryId, updates) {
    const category = this.categories.find(c => c.id === categoryId);
    if (!category) return null;

    // Apply updates (exclude id and rules)
    const allowedFields = ['name', 'color', 'description', 'enabled'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        category[field] = updates[field];
      }
    }

    // Dispatch event
    document.dispatchEvent(new CustomEvent('koppen:category-updated', {
      detail: { categoryId, updates },
    }));

    return category;
  }

  /**
   * Remove a category
   * @param {string} categoryId - Category ID
   * @returns {boolean} Whether the category was removed
   */
  removeCategory(categoryId) {
    const index = this.categories.findIndex(c => c.id === categoryId);
    if (index === -1) return false;

    this.categories.splice(index, 1);
    this.normalizeProperties();

    // Dispatch event
    document.dispatchEvent(new CustomEvent('koppen:category-removed', {
      detail: { categoryId },
    }));

    return true;
  }

  /**
   * Reorder categories by providing ordered IDs
   * @param {string[]} orderedIds - Array of category IDs in desired order
   */
  reorderCategories(orderedIds) {
    logger.log('[CustomRulesEngine] Reordering to:', orderedIds);
    logger.log('[CustomRulesEngine] Current categories:', this.categories.map(c => c.id));

    const categoryMap = new Map(this.categories.map(c => [c.id, c]));

    // Rebuild categories array in new order
    this.categories = orderedIds
      .map(id => categoryMap.get(id))
      .filter(c => c !== undefined);

    logger.log('[CustomRulesEngine] After reorder:', this.categories.map(c => c.id));

    // Update priorities
    this.normalizeProperties();

    logger.log('[CustomRulesEngine] After normalize:', this.categories.map(c => ({ id: c.id, priority: c.priority })));

    // Dispatch event
    document.dispatchEvent(new CustomEvent('koppen:categories-reordered', {
      detail: { orderedIds },
    }));
  }

  /**
   * Get a category by ID
   * @param {string} categoryId - Category ID
   * @returns {Object|null} Category or null
   */
  getCategory(categoryId) {
    return this.categories.find(c => c.id === categoryId) || null;
  }

  // ============================================
  // Rule Management
  // ============================================

  /**
   * Add a rule to a category
   * @param {string} categoryId - Category ID
   * @param {Object} rule - Rule data
   * @returns {Object|null} Created rule or null if category not found
   */
  addRule(categoryId, rule = {}) {
    const category = this.getCategory(categoryId);
    if (!category) return null;

    const param = PARAMETERS[rule.parameter || 'MAT'];
    const newRule = {
      id: generateId(),
      parameter: rule.parameter || 'MAT',
      operator: rule.operator || '>=',
      value: rule.value ?? (param ? param.range[0] : 0),
      unit: rule.unit || (param ? param.unit : ''),
    };

    category.rules.push(newRule);

    // Dispatch event
    document.dispatchEvent(new CustomEvent('koppen:rule-added', {
      detail: { categoryId, rule: newRule },
    }));

    return newRule;
  }

  /**
   * Update a rule within a category
   * @param {string} categoryId - Category ID
   * @param {string} ruleId - Rule ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated rule or null
   */
  updateRule(categoryId, ruleId, updates) {
    const category = this.getCategory(categoryId);
    if (!category) return null;

    const rule = category.rules.find(r => r.id === ruleId);
    if (!rule) return null;

    // Apply updates
    const allowedFields = ['parameter', 'operator', 'value'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        rule[field] = updates[field];
      }
    }

    // Update unit based on parameter
    if (updates.parameter) {
      const param = PARAMETERS[updates.parameter];
      rule.unit = param ? param.unit : '';
    }

    // Dispatch event
    document.dispatchEvent(new CustomEvent('koppen:rule-updated', {
      detail: { categoryId, ruleId, updates },
    }));

    return rule;
  }

  /**
   * Remove a rule from a category
   * @param {string} categoryId - Category ID
   * @param {string} ruleId - Rule ID
   * @returns {boolean} Whether the rule was removed
   */
  removeRule(categoryId, ruleId) {
    const category = this.getCategory(categoryId);
    if (!category) return false;

    const index = category.rules.findIndex(r => r.id === ruleId);
    if (index === -1) return false;

    category.rules.splice(index, 1);

    // Dispatch event
    document.dispatchEvent(new CustomEvent('koppen:rule-removed', {
      detail: { categoryId, ruleId },
    }));

    return true;
  }

  // ============================================
  // Serialization
  // ============================================

  /**
   * Convert engine state to JSON-serializable object
   * @returns {Object} Serializable state
   */
  toJSON() {
    return {
      version: '1.0.0',
      type: 'custom-rules',
      categories: this.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        description: cat.description,
        priority: cat.priority,
        enabled: cat.enabled,
        rules: cat.rules.map(rule => ({
          id: rule.id,
          parameter: rule.parameter,
          operator: rule.operator,
          value: rule.value,
        })),
      })),
    };
  }

  /**
   * Create engine from JSON object
   * @param {Object} json - Serialized state
   * @returns {CustomRulesEngine} New engine instance
   */
  static fromJSON(json) {
    if (!json || !json.categories) {
      throw new Error('Invalid custom rules JSON: missing categories');
    }

    return new CustomRulesEngine(json.categories);
  }

  /**
   * Export as JSON string for file download
   * @param {string} name - Classification system name
   * @returns {string} JSON string
   */
  exportJSON(name = 'Custom Classification') {
    const data = {
      name,
      ...this.toJSON(),
      metadata: {
        exportedAt: new Date().toISOString(),
        featureCount: null, // Set by caller if known
      },
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import from JSON string
   * @param {string} jsonString - JSON string
   * @returns {CustomRulesEngine} New engine instance
   */
  static importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return CustomRulesEngine.fromJSON(data);
    } catch (error) {
      throw new Error(`Failed to parse custom rules JSON: ${error.message}`);
    }
  }
}

/**
 * Create a simple default category
 * @param {string} name - Category name
 * @param {string} color - Hex color
 * @param {Object[]} rules - Initial rules
 * @returns {Object} Category object
 */
export function createCategory(name, color, rules = []) {
  return {
    id: generateId(),
    name,
    color,
    description: '',
    priority: 0,
    enabled: true,
    rules: rules.map(rule => ({
      id: generateId(),
      ...rule,
    })),
  };
}

/**
 * Create a rule object
 * @param {string} parameter - Parameter ID (e.g., 'MAT', 'Tmin')
 * @param {string} operator - Comparison operator (e.g., '>=', '<')
 * @param {number|number[]} value - Threshold value(s)
 * @returns {Object} Rule object
 */
export function createRule(parameter, operator, value) {
  const param = PARAMETERS[parameter];
  return {
    id: generateId(),
    parameter,
    operator,
    value,
    unit: param ? param.unit : '',
  };
}

export default CustomRulesEngine;
