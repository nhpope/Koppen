/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import RuleEditor from '../../../src/builder/rule-editor.js';

// Mock the custom-rules module
vi.mock('../../../src/climate/custom-rules.js', () => ({
  PARAMETERS: {
    MAT: {
      id: 'MAT',
      label: 'Mean Annual Temperature',
      shortLabel: 'MAT',
      unit: '°C',
      category: 'temperature',
      compute: (props: Record<string, number>) => props.mat ?? 0,
      range: [-50, 50],
      step: 0.5,
    },
    Tmin: {
      id: 'Tmin',
      label: 'Coldest Month Temperature',
      shortLabel: 'Tmin',
      unit: '°C',
      category: 'temperature',
      compute: (props: Record<string, number>) => props.tmin ?? 0,
      range: [-60, 30],
      step: 0.5,
    },
    MAP: {
      id: 'MAP',
      label: 'Mean Annual Precipitation',
      shortLabel: 'MAP',
      unit: 'mm',
      category: 'precipitation',
      compute: (props: Record<string, number>) => props.map ?? 0,
      range: [0, 5000],
      step: 10,
    },
    WarmMonths: {
      id: 'WarmMonths',
      label: 'Months with Temp >= 10°C',
      shortLabel: 'Warm Months',
      unit: 'months',
      category: 'derived',
      compute: () => 6,
      range: [0, 12],
      step: 1,
    },
  },
  OPERATORS: {
    '<': { label: '<', fn: (a: number, b: number) => a < b },
    '<=': { label: '<=', fn: (a: number, b: number) => a <= b },
    '>': { label: '>', fn: (a: number, b: number) => a > b },
    '>=': { label: '>=', fn: (a: number, b: number) => a >= b },
    '==': { label: '=', fn: (a: number, b: number) => Math.abs(a - b) < 0.001 },
    '!=': { label: '!=', fn: (a: number, b: number) => Math.abs(a - b) >= 0.001 },
    'in_range': { label: 'between', fn: (a: number, [min, max]: number[]) => a >= min && a <= max },
    'not_in_range': { label: 'not between', fn: (a: number, [min, max]: number[]) => a < min || a > max },
  },
}));

// Mock engine factory
function createMockEngine() {
  const categories: Record<string, Category> = {};

  interface Rule {
    id: string;
    parameter: string;
    operator: string;
    value: number | number[];
    unit: string;
  }

  interface Category {
    id: string;
    name: string;
    color: string;
    rules: Rule[];
  }

  return {
    addCategory: vi.fn((name: string, color: string) => {
      const id = 'cat_' + Object.keys(categories).length;
      categories[id] = { id, name, color, rules: [] };
      return id;
    }),
    getCategory: vi.fn((id: string) => categories[id]),
    addRule: vi.fn((categoryId: string) => {
      const cat = categories[categoryId];
      if (cat) {
        const ruleId = 'rule_' + cat.rules.length;
        cat.rules.push({
          id: ruleId,
          parameter: 'MAT',
          operator: '>',
          value: 0,
          unit: '°C',
        });
        return ruleId;
      }
      return null;
    }),
    updateRule: vi.fn((categoryId: string, ruleId: string, updates: Partial<Rule>) => {
      const cat = categories[categoryId];
      if (cat) {
        const rule = cat.rules.find(r => r.id === ruleId);
        if (rule) {
          Object.assign(rule, updates);
          // Update unit based on parameter
          if (updates.parameter === 'MAP') {
            rule.unit = 'mm';
          } else if (updates.parameter === 'WarmMonths') {
            rule.unit = 'months';
          } else {
            rule.unit = '°C';
          }
        }
      }
    }),
    removeRule: vi.fn((categoryId: string, ruleId: string) => {
      const cat = categories[categoryId];
      if (cat) {
        cat.rules = cat.rules.filter(r => r.id !== ruleId);
      }
    }),
    _categories: categories,
    _addCategoryDirect: (cat: Category) => {
      categories[cat.id] = cat;
    },
  };
}

describe('RuleEditor Component', () => {
  let container: HTMLElement;
  let mockEngine: ReturnType<typeof createMockEngine>;
  let onChangeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    mockEngine = createMockEngine();
    onChangeMock = vi.fn();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    it('should render with rule-editor class', () => {
      const category = { id: 'cat_0', name: 'Test', color: '#ff0000', rules: [] };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      expect(container.className).toBe('rule-editor');
    });

    it('should render help text', () => {
      const category = { id: 'cat_0', name: 'Test', color: '#ff0000', rules: [] };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const help = container.querySelector('.rule-editor__help');
      expect(help).toBeTruthy();
      expect(help?.textContent).toContain('All rules must match');
    });

    it('should render empty state when no rules', () => {
      const category = { id: 'cat_0', name: 'Test', color: '#ff0000', rules: [] };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const empty = container.querySelector('.rule-editor__empty');
      expect(empty).toBeTruthy();
      expect(empty?.textContent).toContain('No rules defined');
    });

    it('should render add rule button', () => {
      const category = { id: 'cat_0', name: 'Test', color: '#ff0000', rules: [] };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const addBtn = container.querySelector('.rule-editor__add-btn');
      expect(addBtn).toBeTruthy();
      expect(addBtn?.textContent).toBe('+ Add Rule');
    });

    it('should work without onChange callback', () => {
      const category = { id: 'cat_0', name: 'Test', color: '#ff0000', rules: [] };
      mockEngine._addCategoryDirect(category);

      // Should not throw when no callback provided
      expect(() => new RuleEditor(container, category, mockEngine)).not.toThrow();
    });
  });

  describe('Rendering Rules', () => {
    it('should render rule rows for existing rules', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [
          { id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' },
          { id: 'rule_1', parameter: 'MAP', operator: '>=', value: 500, unit: 'mm' },
        ],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const ruleRows = container.querySelectorAll('.rule-row');
      expect(ruleRows.length).toBe(2);
    });

    it('should render rule rows with correct data attributes', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_xyz', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const ruleRow = container.querySelector('.rule-row');
      expect(ruleRow?.getAttribute('data-rule-id')).toBe('rule_xyz');
    });

    it('should render rule rows with role listitem', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const ruleRow = container.querySelector('.rule-row');
      expect(ruleRow?.getAttribute('role')).toBe('listitem');
    });

    it('should render rule number label', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [
          { id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' },
          { id: 'rule_1', parameter: 'MAP', operator: '>=', value: 500, unit: 'mm' },
        ],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const labels = container.querySelectorAll('.rule-row__label');
      expect(labels[0]?.textContent).toBe('1.');
      expect(labels[1]?.textContent).toBe('2.');
    });

    it('should render unit display', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const unit = container.querySelector('.rule-row__unit');
      expect(unit?.textContent).toBe('°C');
    });
  });

  describe('Parameter Dropdown', () => {
    it('should render parameter select with correct class', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const paramSelect = container.querySelector('.rule-row__param') as HTMLSelectElement;
      expect(paramSelect).toBeTruthy();
      expect(paramSelect.tagName).toBe('SELECT');
    });

    it('should have aria-label on parameter select', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const paramSelect = container.querySelector('.rule-row__param');
      expect(paramSelect?.getAttribute('aria-label')).toBe('Parameter');
    });

    it('should group parameters by category', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const paramSelect = container.querySelector('.rule-row__param') as HTMLSelectElement;
      const optgroups = paramSelect.querySelectorAll('optgroup');

      // Should have optgroups for temperature, precipitation, and derived
      expect(optgroups.length).toBeGreaterThanOrEqual(2);

      const labels = Array.from(optgroups).map(og => og.label);
      expect(labels).toContain('Temperature');
      expect(labels).toContain('Precipitation');
    });

    it('should select the current parameter', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'Tmin', operator: '>', value: 0, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const paramSelect = container.querySelector('.rule-row__param') as HTMLSelectElement;
      expect(paramSelect.value).toBe('Tmin');
    });

    it('should update rule when parameter changes', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const paramSelect = container.querySelector('.rule-row__param') as HTMLSelectElement;
      paramSelect.value = 'MAP';
      paramSelect.dispatchEvent(new Event('change'));

      expect(mockEngine.updateRule).toHaveBeenCalledWith('cat_0', 'rule_0', { parameter: 'MAP' });
      expect(onChangeMock).toHaveBeenCalled();
    });
  });

  describe('Operator Dropdown', () => {
    it('should render operator select', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const opSelect = container.querySelector('.rule-row__operator') as HTMLSelectElement;
      expect(opSelect).toBeTruthy();
    });

    it('should have aria-label on operator select', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const opSelect = container.querySelector('.rule-row__operator');
      expect(opSelect?.getAttribute('aria-label')).toBe('Operator');
    });

    it('should have all basic comparison operators', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const opSelect = container.querySelector('.rule-row__operator') as HTMLSelectElement;
      const options = Array.from(opSelect.options);
      const values = options.map(o => o.value);

      expect(values).toContain('<');
      expect(values).toContain('<=');
      expect(values).toContain('>');
      expect(values).toContain('>=');
      expect(values).toContain('==');
      expect(values).toContain('!=');
    });

    it('should have range operators in separate optgroup', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const opSelect = container.querySelector('.rule-row__operator') as HTMLSelectElement;
      const rangeGroup = opSelect.querySelector('optgroup[label="Range"]');
      expect(rangeGroup).toBeTruthy();

      const rangeOptions = rangeGroup?.querySelectorAll('option');
      const rangeValues = Array.from(rangeOptions || []).map(o => o.value);
      expect(rangeValues).toContain('in_range');
      expect(rangeValues).toContain('not_in_range');
    });

    it('should update rule when operator changes', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const opSelect = container.querySelector('.rule-row__operator') as HTMLSelectElement;
      opSelect.value = '>=';
      opSelect.dispatchEvent(new Event('change'));

      expect(mockEngine.updateRule).toHaveBeenCalledWith('cat_0', 'rule_0', { operator: '>=' });
      expect(onChangeMock).toHaveBeenCalled();
    });

    it('should convert single value to range when switching to range operator', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const opSelect = container.querySelector('.rule-row__operator') as HTMLSelectElement;
      opSelect.value = 'in_range';
      opSelect.dispatchEvent(new Event('change'));

      // Should first update value to array
      expect(mockEngine.updateRule).toHaveBeenCalledWith('cat_0', 'rule_0', { value: [18, 28] });
      // Then update operator
      expect(mockEngine.updateRule).toHaveBeenCalledWith('cat_0', 'rule_0', { operator: 'in_range' });
    });

    it('should convert range to single value when switching from range operator', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: 'in_range', value: [10, 20], unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const opSelect = container.querySelector('.rule-row__operator') as HTMLSelectElement;
      opSelect.value = '>';
      opSelect.dispatchEvent(new Event('change'));

      // Should convert array to first value
      expect(mockEngine.updateRule).toHaveBeenCalledWith('cat_0', 'rule_0', { value: 10 });
    });
  });

  describe('Value Input - Single Value', () => {
    it('should render single value input for basic operators', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const valueInput = container.querySelector('.rule-row__value') as HTMLInputElement;
      expect(valueInput).toBeTruthy();
      expect(valueInput.type).toBe('number');
      expect(valueInput.value).toBe('18');
    });

    it('should have aria-label on value input', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const valueInput = container.querySelector('.rule-row__value');
      expect(valueInput?.getAttribute('aria-label')).toBe('Value');
    });

    it('should set min/max/step from parameter', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const valueInput = container.querySelector('.rule-row__value') as HTMLInputElement;
      expect(valueInput.min).toBe('-50');
      expect(valueInput.max).toBe('50');
      expect(valueInput.step).toBe('0.5');
    });

    it('should update rule when value changes', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const valueInput = container.querySelector('.rule-row__value') as HTMLInputElement;
      valueInput.value = '25';
      valueInput.dispatchEvent(new Event('change'));

      expect(mockEngine.updateRule).toHaveBeenCalledWith('cat_0', 'rule_0', { value: 25 });
      expect(onChangeMock).toHaveBeenCalled();
    });

    it('should handle invalid value input as 0', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const valueInput = container.querySelector('.rule-row__value') as HTMLInputElement;
      valueInput.value = 'abc';
      valueInput.dispatchEvent(new Event('change'));

      expect(mockEngine.updateRule).toHaveBeenCalledWith('cat_0', 'rule_0', { value: 0 });
    });

    it('should extract first value from array if rule has array value', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: [10, 20], unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const valueInput = container.querySelector('.rule-row__value') as HTMLInputElement;
      expect(valueInput.value).toBe('10');
    });
  });

  describe('Value Input - Range', () => {
    it('should render two inputs for range operators', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: 'in_range', value: [10, 20], unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const minInput = container.querySelector('.rule-row__value--min') as HTMLInputElement;
      const maxInput = container.querySelector('.rule-row__value--max') as HTMLInputElement;
      expect(minInput).toBeTruthy();
      expect(maxInput).toBeTruthy();
    });

    it('should render separator between range inputs', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: 'in_range', value: [10, 20], unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const separator = container.querySelector('.rule-row__range-sep');
      expect(separator?.textContent).toBe('to');
    });

    it('should set correct values for range inputs', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: 'in_range', value: [10, 20], unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const minInput = container.querySelector('.rule-row__value--min') as HTMLInputElement;
      const maxInput = container.querySelector('.rule-row__value--max') as HTMLInputElement;
      expect(minInput.value).toBe('10');
      expect(maxInput.value).toBe('20');
    });

    it('should have aria-labels on range inputs', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: 'in_range', value: [10, 20], unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const minInput = container.querySelector('.rule-row__value--min');
      const maxInput = container.querySelector('.rule-row__value--max');
      expect(minInput?.getAttribute('aria-label')).toBe('Minimum value');
      expect(maxInput?.getAttribute('aria-label')).toBe('Maximum value');
    });

    it('should update rule when min value changes', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: 'in_range', value: [10, 20], unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const minInput = container.querySelector('.rule-row__value--min') as HTMLInputElement;
      minInput.value = '5';
      minInput.dispatchEvent(new Event('change'));

      expect(mockEngine.updateRule).toHaveBeenCalledWith('cat_0', 'rule_0', { value: [5, 20] });
      expect(onChangeMock).toHaveBeenCalled();
    });

    it('should update rule when max value changes', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: 'in_range', value: [10, 20], unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const maxInput = container.querySelector('.rule-row__value--max') as HTMLInputElement;
      maxInput.value = '30';
      maxInput.dispatchEvent(new Event('change'));

      expect(mockEngine.updateRule).toHaveBeenCalledWith('cat_0', 'rule_0', { value: [10, 30] });
    });

    it('should handle single value converted to range', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: 'in_range', value: 15, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const minInput = container.querySelector('.rule-row__value--min') as HTMLInputElement;
      const maxInput = container.querySelector('.rule-row__value--max') as HTMLInputElement;
      expect(minInput.value).toBe('15');
      expect(maxInput.value).toBe('25'); // 15 + 10 default
    });
  });

  describe('Delete Button', () => {
    it('should render delete button', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const deleteBtn = container.querySelector('.rule-row__delete');
      expect(deleteBtn).toBeTruthy();
    });

    it('should have aria-label on delete button', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const deleteBtn = container.querySelector('.rule-row__delete');
      expect(deleteBtn?.getAttribute('aria-label')).toBe('Delete rule');
    });

    it('should delete rule when clicked', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const deleteBtn = container.querySelector('.rule-row__delete') as HTMLButtonElement;
      deleteBtn.click();

      expect(mockEngine.removeRule).toHaveBeenCalledWith('cat_0', 'rule_0');
      expect(onChangeMock).toHaveBeenCalled();
    });
  });

  describe('Add Rule', () => {
    it('should add rule when add button clicked', () => {
      const category = { id: 'cat_0', name: 'Test', color: '#ff0000', rules: [] };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const addBtn = container.querySelector('.rule-editor__add-btn') as HTMLButtonElement;
      addBtn.click();

      expect(mockEngine.addRule).toHaveBeenCalledWith('cat_0');
      expect(onChangeMock).toHaveBeenCalled();
    });

    it('should re-render after adding rule', () => {
      const category = { id: 'cat_0', name: 'Test', color: '#ff0000', rules: [] };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      // Initially no rules
      expect(container.querySelector('.rule-row')).toBeNull();

      const addBtn = container.querySelector('.rule-editor__add-btn') as HTMLButtonElement;
      addBtn.click();

      // After adding, should have a rule row
      expect(container.querySelector('.rule-row')).toBeTruthy();
    });
  });

  describe('Destroy', () => {
    it('should clear container on destroy', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      const editor = new RuleEditor(container, category, mockEngine, onChangeMock);

      expect(container.innerHTML).not.toBe('');

      editor.destroy();

      expect(container.innerHTML).toBe('');
    });
  });

  describe('Rules List Accessibility', () => {
    it('should have role list on rules container', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'MAT', operator: '>', value: 18, unit: '°C' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const rulesList = container.querySelector('.rule-editor__rules');
      expect(rulesList?.getAttribute('role')).toBe('list');
    });
  });

  describe('Unknown Parameter Handling', () => {
    it('should use default range for unknown parameter', () => {
      const category = {
        id: 'cat_0',
        name: 'Test',
        color: '#ff0000',
        rules: [{ id: 'rule_0', parameter: 'UNKNOWN_PARAM', operator: '>', value: 50, unit: '' }],
      };
      mockEngine._addCategoryDirect(category);

      new RuleEditor(container, category, mockEngine, onChangeMock);

      const valueInput = container.querySelector('.rule-row__value') as HTMLInputElement;
      expect(valueInput.min).toBe('-100');
      expect(valueInput.max).toBe('100');
      expect(valueInput.step).toBe('1');
    });
  });
});
