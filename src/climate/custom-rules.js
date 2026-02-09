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
 * Safe formula evaluator for custom derived quantities
 * Supports: +, -, *, /, parentheses, and built-in parameters
 */
export class FormulaEvaluator {
  /**
   * Create a formula evaluator
   * @param {string} formula - Formula string (e.g., "Tmax - Tmin")
   * @param {Object} customParams - Map of custom parameter IDs to their formulas
   */
  constructor(formula, customParams = {}) {
    this.formula = formula;
    this.customParams = customParams;
    this.tokens = this.tokenize(formula);
  }

  /**
   * Supported functions
   */
  static FUNCTIONS = {
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
  };

  /**
   * Tokenize a formula string
   * @param {string} formula - Formula to tokenize
   * @returns {string[]} Array of tokens
   */
  tokenize(formula) {
    // Match: numbers, parameter/function names (alphanumeric + underscore), operators, parentheses, commas
    const tokenRegex = /(\d+\.?\d*|[A-Za-z_][A-Za-z0-9_]*|[+\-*/(),])/g;
    return formula.match(tokenRegex) || [];
  }

  /**
   * Evaluate the formula with given feature properties
   * @param {Object} props - Feature properties
   * @param {Set} visited - Set of parameter IDs being evaluated (for cycle detection)
   * @returns {number} Computed value
   */
  evaluate(props, visited = new Set()) {
    const values = {};

    // Get values for all parameters referenced in the formula
    for (const token of this.tokens) {
      if (/^[A-Za-z_]/.test(token) && !values.hasOwnProperty(token)) {
        // Check for circular reference
        if (visited.has(token)) {
          console.warn(`[FormulaEvaluator] Circular reference detected: ${token}`);
          return NaN;
        }

        // Check if it's a built-in parameter
        if (PARAMETERS[token]) {
          values[token] = PARAMETERS[token].compute(props);
        }
        // Check if it's a custom parameter
        else if (this.customParams[token]) {
          const customParam = this.customParams[token];
          const newVisited = new Set(visited);
          newVisited.add(token);
          const evaluator = new FormulaEvaluator(customParam.formula, this.customParams);
          values[token] = evaluator.evaluate(props, newVisited);
        }
        // Unknown parameter
        else {
          console.warn(`[FormulaEvaluator] Unknown parameter: ${token}`);
          values[token] = 0;
        }
      }
    }

    // Evaluate the expression
    return this.evaluateExpression(this.tokens, values);
  }

  /**
   * Evaluate a tokenized expression (simple recursive descent parser)
   * @param {string[]} tokens - Tokens to evaluate
   * @param {Object} values - Map of parameter names to values
   * @returns {number} Result
   */
  evaluateExpression(tokens, values) {
    let pos = 0;

    const parseNumber = () => {
      const token = tokens[pos];
      if (!token) return 0;

      // Check if it's a number
      if (/^\d/.test(token)) {
        pos++;
        return parseFloat(token);
      }
      // Check if it's a function call (identifier followed by '(')
      if (/^[A-Za-z_]/.test(token) && tokens[pos + 1] === '(') {
        const funcName = token.toLowerCase();
        const func = FormulaEvaluator.FUNCTIONS[funcName];
        if (func) {
          pos += 2; // skip function name and '('
          const args = [];
          // Parse arguments
          while (tokens[pos] && tokens[pos] !== ')') {
            args.push(parseAddSub());
            if (tokens[pos] === ',') pos++; // skip comma
          }
          if (tokens[pos] === ')') pos++; // skip ')'
          return func(...args);
        }
      }
      // Check if it's a parameter
      if (/^[A-Za-z_]/.test(token)) {
        pos++;
        return values[token] ?? 0;
      }
      // Check for parentheses
      if (token === '(') {
        pos++; // skip '('
        const result = parseAddSub();
        if (tokens[pos] === ')') pos++; // skip ')'
        return result;
      }
      // Check for unary minus
      if (token === '-') {
        pos++;
        return -parseNumber();
      }

      return 0;
    };

    const parseMulDiv = () => {
      let left = parseNumber();
      while (tokens[pos] === '*' || tokens[pos] === '/') {
        const op = tokens[pos++];
        const right = parseNumber();
        if (op === '*') {
          left *= right;
        } else {
          left = right !== 0 ? left / right : 0; // Avoid division by zero
        }
      }
      return left;
    };

    const parseAddSub = () => {
      let left = parseMulDiv();
      while (tokens[pos] === '+' || tokens[pos] === '-') {
        const op = tokens[pos++];
        const right = parseMulDiv();
        if (op === '+') {
          left += right;
        } else {
          left -= right;
        }
      }
      return left;
    };

    return parseAddSub();
  }

  /**
   * Validate a formula
   * @param {string} formula - Formula to validate
   * @param {Object} customParams - Existing custom parameters
   * @returns {Object} { valid: boolean, error?: string }
   */
  static validate(formula, customParams = {}) {
    if (!formula || typeof formula !== 'string') {
      return { valid: false, error: 'Formula is required' };
    }

    const trimmed = formula.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Formula cannot be empty' };
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of trimmed) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) {
        return { valid: false, error: 'Unbalanced parentheses' };
      }
    }
    if (parenCount !== 0) {
      return { valid: false, error: 'Unbalanced parentheses' };
    }

    // Tokenize and check for valid tokens
    const tokenRegex = /(\d+\.?\d*|[A-Za-z_][A-Za-z0-9_]*|[+\-*/()])/g;
    const tokens = trimmed.match(tokenRegex) || [];
    const reconstructed = tokens.join('');

    // Check that tokenization captures the whole formula (no invalid characters)
    const cleanFormula = trimmed.replace(/\s+/g, '');
    if (reconstructed !== cleanFormula) {
      return { valid: false, error: 'Formula contains invalid characters' };
    }

    // Check that all identifiers are valid parameters or functions
    for (const token of tokens) {
      if (/^[A-Za-z_]/.test(token)) {
        const isBuiltinParam = !!PARAMETERS[token];
        const isCustomParam = !!customParams[token];
        const isFunction = !!FormulaEvaluator.FUNCTIONS[token.toLowerCase()];
        if (!isBuiltinParam && !isCustomParam && !isFunction) {
          return { valid: false, error: `Unknown parameter: ${token}` };
        }
      }
    }

    // Try to evaluate with dummy values
    try {
      const evaluator = new FormulaEvaluator(formula, customParams);
      const dummyProps = { mat: 15, tmin: 5, tmax: 25, map: 1000 };
      const result = evaluator.evaluate(dummyProps);
      if (isNaN(result) || !isFinite(result)) {
        return { valid: false, error: 'Formula produces invalid result' };
      }
    } catch (e) {
      return { valid: false, error: `Evaluation error: ${e.message}` };
    }

    return { valid: true };
  }

  /**
   * Get list of parameters referenced in a formula
   * @param {string} formula - Formula to analyze
   * @returns {string[]} Array of parameter IDs
   */
  static getReferencedParameters(formula) {
    const tokenRegex = /[A-Za-z_][A-Za-z0-9_]*/g;
    const matches = formula.match(tokenRegex) || [];
    return [...new Set(matches)];
  }

  /**
   * Get the first parameter referenced in a formula (for unit inference)
   * @param {string} formula - Formula to analyze
   * @returns {string|null} First parameter ID or null
   */
  static getFirstParameter(formula) {
    const tokenRegex = /[A-Za-z_][A-Za-z0-9_]*/g;
    const match = formula.match(tokenRegex);
    return match ? match[0] : null;
  }

  /**
   * Infer unit from formula based on structure and parameters
   * @param {string} formula - Formula to analyze
   * @param {Object} customParams - Custom parameters map
   * @returns {string} Inferred unit
   */
  static inferUnit(formula, customParams = {}) {
    const refs = FormulaEvaluator.getReferencedParameters(formula);
    if (refs.length === 0) return '';

    // Get units of all referenced parameters
    const units = new Set();
    for (const ref of refs) {
      let unit = '';
      if (PARAMETERS[ref]) {
        unit = PARAMETERS[ref].unit || '';
      } else if (customParams[ref]) {
        unit = FormulaEvaluator.inferUnit(customParams[ref].formula, customParams);
      }
      if (unit) units.add(unit);
    }

    // If formula contains division and all parameters have the same unit,
    // the result is likely a ratio (unitless)
    if (formula.includes('/') && units.size === 1) {
      return ''; // Ratio - unitless
    }

    // Otherwise, use the first parameter's unit
    const firstParam = FormulaEvaluator.getFirstParameter(formula);
    if (!firstParam) return '';

    if (PARAMETERS[firstParam]) {
      return PARAMETERS[firstParam].unit || '';
    }
    if (customParams[firstParam]) {
      return FormulaEvaluator.inferUnit(customParams[firstParam].formula, customParams);
    }

    return '';
  }
}

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
   * @param {Object[]} customParameters - Initial custom parameters
   */
  constructor(categories = [], customParameters = []) {
    this.categories = categories.map(cat => ({
      id: cat.id || generateId(),
      name: cat.name || 'Untitled Category',
      color: cat.color || DEFAULT_COLORS[0],
      description: cat.description || '',
      priority: cat.priority ?? 0,
      enabled: cat.enabled !== false,
      parentId: cat.parentId ?? null,  // null for top-level categories
      children: cat.children ?? [],     // Array of child category IDs
      rules: (cat.rules || []).map(rule => ({
        id: rule.id || generateId(),
        parameter: rule.parameter || 'MAT',
        operator: rule.operator || '>=',
        value: rule.value ?? 0,
        unit: rule.unit || PARAMETERS[rule.parameter]?.unit || '',
      })),
    }));

    // Initialize custom parameters
    this.customParameters = {};
    (customParameters || []).forEach(param => {
      this.customParameters[param.id] = {
        id: param.id,
        name: param.name || param.id,
        formula: param.formula,
        unit: param.unit || '',
        description: param.description || '',
        range: param.range || [-1000, 1000],
        step: param.step || 1,
      };
    });

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
   * Get top-level categories (categories without a parent)
   * @returns {Object[]} Top-level categories sorted by priority
   */
  getTopLevelCategories() {
    return this.categories
      .filter(cat => cat.parentId === null)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get child categories of a specific parent
   * @param {string} parentId - Parent category ID
   * @returns {Object[]} Child categories sorted by priority
   */
  getChildCategories(parentId) {
    return this.categories
      .filter(cat => cat.parentId === parentId)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check if a category has children
   * @param {string} categoryId - Category ID
   * @returns {boolean} Whether the category has children
   */
  hasChildren(categoryId) {
    return this.categories.some(cat => cat.parentId === categoryId);
  }

  /**
   * Check if a category is a child (has a parent)
   * @param {string} categoryId - Category ID
   * @returns {boolean} Whether the category is a child
   */
  isChildCategory(categoryId) {
    const category = this.getCategory(categoryId);
    return category ? category.parentId !== null : false;
  }

  /**
   * Get the parent category of a child
   * @param {string} categoryId - Child category ID
   * @returns {Object|null} Parent category or null
   */
  getParentCategory(categoryId) {
    const category = this.getCategory(categoryId);
    if (!category || !category.parentId) return null;
    return this.getCategory(category.parentId);
  }

  /**
   * Get the computed value of a parameter for a feature
   * Checks built-in parameters first, then custom parameters
   * @param {string} parameterId - Parameter ID
   * @param {Object} props - Feature properties
   * @returns {number} Computed value
   */
  getParameterValue(parameterId, props) {
    // Check built-in parameters first
    const builtinParam = PARAMETERS[parameterId];
    if (builtinParam) {
      return builtinParam.compute(props);
    }

    // Check custom parameters
    const customParam = this.customParameters[parameterId];
    if (customParam) {
      const evaluator = new FormulaEvaluator(customParam.formula, this.customParameters);
      return evaluator.evaluate(props);
    }

    console.warn(`[CustomRules] Unknown parameter: ${parameterId}`);
    return 0;
  }

  // ============================================
  // Custom Parameter Management
  // ============================================

  /**
   * Add a custom derived parameter
   * @param {Object} param - Parameter data
   * @returns {Object} The created parameter
   */
  addCustomParameter(param = {}) {
    const id = param.id || generateId();
    const formula = param.formula || 'MAT';

    // Validate formula before adding
    const validation = FormulaEvaluator.validate(formula, this.customParameters);
    if (!validation.valid) {
      throw new Error(`Invalid formula: ${validation.error}`);
    }

    // Auto-infer unit from first parameter in formula
    const inferredUnit = FormulaEvaluator.inferUnit(formula, this.customParameters);

    const newParam = {
      id,
      name: param.name || `Custom Parameter ${Object.keys(this.customParameters).length + 1}`,
      formula,
      unit: inferredUnit,
      description: param.description || '',
      range: param.range || [-1000, 1000],
      step: param.step || 1,
    };

    this.customParameters[id] = newParam;

    // Dispatch event
    document.dispatchEvent(new CustomEvent('koppen:custom-parameter-added', {
      detail: { parameter: newParam },
    }));

    return newParam;
  }

  /**
   * Update a custom parameter
   * @param {string} paramId - Parameter ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated parameter or null if not found
   */
  updateCustomParameter(paramId, updates) {
    const param = this.customParameters[paramId];
    if (!param) return null;

    // If updating formula, validate it first
    if (updates.formula !== undefined) {
      // Create a temporary customParams without this param to avoid self-reference
      const tempParams = { ...this.customParameters };
      delete tempParams[paramId];

      const validation = FormulaEvaluator.validate(updates.formula, tempParams);
      if (!validation.valid) {
        throw new Error(`Invalid formula: ${validation.error}`);
      }
    }

    // Apply updates (unit is auto-inferred, not user-settable)
    const allowedFields = ['name', 'formula', 'description', 'range', 'step'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        param[field] = updates[field];
      }
    }

    // Auto-update unit if formula changed
    if (updates.formula !== undefined) {
      const tempParams = { ...this.customParameters };
      delete tempParams[paramId];
      param.unit = FormulaEvaluator.inferUnit(updates.formula, tempParams);
    }

    // Dispatch event
    document.dispatchEvent(new CustomEvent('koppen:custom-parameter-updated', {
      detail: { paramId, updates },
    }));

    return param;
  }

  /**
   * Remove a custom parameter
   * @param {string} paramId - Parameter ID
   * @returns {boolean} Whether the parameter was removed
   */
  removeCustomParameter(paramId) {
    if (!this.customParameters[paramId]) return false;

    // Check if any rules use this parameter
    for (const category of this.categories) {
      for (const rule of category.rules) {
        if (rule.parameter === paramId) {
          throw new Error(`Cannot remove parameter "${paramId}": it is used by rule in category "${category.name}"`);
        }
      }
    }

    // Check if any other custom parameters reference this one
    for (const [id, param] of Object.entries(this.customParameters)) {
      if (id !== paramId) {
        const refs = FormulaEvaluator.getReferencedParameters(param.formula);
        if (refs.includes(paramId)) {
          throw new Error(`Cannot remove parameter "${paramId}": it is referenced by custom parameter "${param.name}"`);
        }
      }
    }

    delete this.customParameters[paramId];

    // Dispatch event
    document.dispatchEvent(new CustomEvent('koppen:custom-parameter-removed', {
      detail: { paramId },
    }));

    return true;
  }

  /**
   * Get a custom parameter by ID
   * @param {string} paramId - Parameter ID
   * @returns {Object|null} Parameter or null
   */
  getCustomParameter(paramId) {
    return this.customParameters[paramId] || null;
  }

  /**
   * Get all custom parameters
   * @returns {Object[]} Array of custom parameters
   */
  getAllCustomParameters() {
    return Object.values(this.customParameters);
  }

  /**
   * Get all available parameters (built-in + custom)
   * @returns {Object} Map of all parameters
   */
  getAllParameters() {
    const allParams = { ...PARAMETERS };

    // Add custom parameters with compute function
    for (const [id, param] of Object.entries(this.customParameters)) {
      allParams[id] = {
        id,
        label: param.name,
        shortLabel: param.name,
        unit: param.unit,
        category: 'custom',
        compute: (props) => this.getParameterValue(id, props),
        range: param.range,
        step: param.step,
        isCustom: true,
        formula: param.formula,
        description: param.description,
      };
    }

    return allParams;
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
   * Classify a single feature (two-pass: parent first, then child refinement)
   * @param {Object} feature - GeoJSON feature with climate properties
   * @returns {Object|null} Matched category info or null if unclassified
   */
  classify(feature) {
    const props = feature.properties;

    // PASS 1: Evaluate top-level (parent) categories only
    let parentMatch = null;
    for (const category of this.getTopLevelCategories()) {
      if (!category.enabled) continue;

      // Category with no rules never matches
      if (category.rules.length === 0) continue;

      // All rules must pass (AND logic)
      const allRulesPass = category.rules.every(rule =>
        this.evaluateRule(rule, props),
      );

      if (allRulesPass) {
        parentMatch = category;
        break;  // First matching parent wins (priority order)
      }
    }

    // If no parent matches, unclassified
    if (!parentMatch) {
      return null;
    }

    // PASS 2: If parent has children, try to refine to a child category
    const children = this.getChildCategories(parentMatch.id);
    if (children.length > 0) {
      for (const child of children) {
        if (!child.enabled) continue;

        // Child with no rules matches all features within parent
        // (but we require at least one rule for meaningful sub-classification)
        if (child.rules.length === 0) continue;

        // All child rules must pass (AND logic)
        const allChildRulesPass = child.rules.every(rule =>
          this.evaluateRule(rule, props),
        );

        if (allChildRulesPass) {
          // Child matched - return child category with parent info
          return {
            categoryId: child.id,
            categoryName: child.name,
            color: child.color,
            parentId: parentMatch.id,
            parentName: parentMatch.name,
          };
        }
      }
    }

    // No child matched (or no children exist) - return parent match
    return {
      categoryId: parentMatch.id,
      categoryName: parentMatch.name,
      color: parentMatch.color,
      parentId: null,
      parentName: null,
    };
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
        count: 0,           // Direct matches only
        totalCount: 0,      // Direct + all children (for parents)
        parentId: cat.parentId,
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
            climate_parent_id: result.parentId || null,
            climate_parent_name: result.parentName || null,
            classified: true,
          },
        });
        stats.classified++;

        // Update direct count for the matched category
        if (stats.byCategory[result.categoryId]) {
          stats.byCategory[result.categoryId].count++;
          stats.byCategory[result.categoryId].totalCount++;
        }

        // If matched a child, also increment parent's totalCount
        if (result.parentId && stats.byCategory[result.parentId]) {
          stats.byCategory[result.parentId].totalCount++;
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
            climate_parent_id: null,
            climate_parent_name: null,
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
      parentId: null,
      children: [],
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
   * Add a child category under a parent
   * @param {string} parentId - Parent category ID
   * @param {Object} childData - Child category data
   * @returns {Object|null} The created child category or null if parent not found
   */
  addChildCategory(parentId, childData = {}) {
    const parent = this.getCategory(parentId);
    if (!parent) return null;

    // Generate a lighter/darker shade of the parent color for the child
    const childColor = childData.color || this.generateChildColor(parent.color, parent.children.length);

    const childCategory = {
      id: generateId(),
      name: childData.name || `${parent.name} Sub-type`,
      color: childColor,
      description: childData.description || '',
      priority: this.categories.length,
      enabled: true,
      parentId: parentId,
      children: [],  // Children cannot have their own children (one level only)
      rules: [],
    };

    this.categories.push(childCategory);

    // Update parent's children array
    parent.children.push(childCategory.id);

    // Dispatch event
    document.dispatchEvent(new CustomEvent('koppen:child-category-added', {
      detail: { parentId, category: childCategory },
    }));

    return childCategory;
  }

  /**
   * Generate a color variant for a child category
   * @param {string} parentColor - Parent's hex color
   * @param {number} childIndex - Index of the child
   * @returns {string} A variant hex color
   */
  generateChildColor(parentColor, childIndex) {
    // Parse the hex color
    const hex = parentColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Alternate between lighter and darker variants
    const factor = (childIndex % 2 === 0) ? 0.7 : 1.3;
    const clamp = (val) => Math.min(255, Math.max(0, Math.round(val)));

    const newR = clamp(r * factor);
    const newG = clamp(g * factor);
    const newB = clamp(b * factor);

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
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
    const category = this.getCategory(categoryId);
    if (!category) return false;

    // If this category has children, remove them first
    if (category.children && category.children.length > 0) {
      // Remove all children (make a copy since we're modifying the array)
      [...category.children].forEach(childId => {
        this.removeCategory(childId);
      });
    }

    // If this is a child, remove it from parent's children array
    if (category.parentId) {
      const parent = this.getCategory(category.parentId);
      if (parent) {
        const childIndex = parent.children.indexOf(categoryId);
        if (childIndex !== -1) {
          parent.children.splice(childIndex, 1);
        }
      }
    }

    // Remove the category itself
    const index = this.categories.findIndex(c => c.id === categoryId);
    if (index !== -1) {
      this.categories.splice(index, 1);
    }

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
    const json = {
      version: '1.0.0',  // Keep version for backward compatibility
      type: 'custom-rules',
      categories: this.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        description: cat.description,
        priority: cat.priority,
        enabled: cat.enabled,
        parentId: cat.parentId,    // Added for sub-classification
        children: cat.children,     // Added for sub-classification
        rules: cat.rules.map(rule => ({
          id: rule.id,
          parameter: rule.parameter,
          operator: rule.operator,
          value: rule.value,
        })),
      })),
    };

    // Include custom parameters if any exist
    const customParams = Object.values(this.customParameters);
    if (customParams.length > 0) {
      json.customParameters = customParams.map(param => ({
        id: param.id,
        name: param.name,
        formula: param.formula,
        unit: param.unit,
        description: param.description,
        range: param.range,
        step: param.step,
      }));
    }

    return json;
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

    return new CustomRulesEngine(json.categories, json.customParameters || []);
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
