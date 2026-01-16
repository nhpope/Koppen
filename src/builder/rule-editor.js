/**
 * Rule Editor Component
 * UI for editing rules within a category
 * @module builder/rule-editor
 */

/* eslint-disable security/detect-object-injection --
 * This file accesses rule configurations using keys from internal structures.
 * Keys are not user-controlled; they come from PARAMETERS/OPERATORS objects.
 * See docs/orchestration/checkpoints/security-review.md for full analysis.
 */

/* eslint-disable sonarjs/no-duplicate-string --
 * CSS class names and UI element types are intentionally repeated for code clarity.
 */

import { PARAMETERS, OPERATORS } from '../climate/custom-rules.js';

/**
 * Rule Editor - Manages rules within a single category
 */
class RuleEditor {
  /**
   * Create a RuleEditor
   * @param {HTMLElement} container - Container element
   * @param {Object} category - Category being edited
   * @param {CustomRulesEngine} engine - Classification engine
   * @param {Function} onChange - Callback when rules change
   */
  constructor(container, category, engine, onChange) {
    this.container = container;
    this.category = category;
    this.engine = engine;
    this.onChange = onChange || (() => {});

    this.render();
  }

  /**
   * Render the rule editor
   */
  render() {
    this.container.innerHTML = '';
    this.container.className = 'rule-editor';

    // Help text
    const help = document.createElement('div');
    help.className = 'rule-editor__help';
    help.textContent = 'All rules must match (AND logic). Add rules to define which features belong to this category.';
    this.container.appendChild(help);

    // Rules list
    const rulesList = document.createElement('div');
    rulesList.className = 'rule-editor__rules';
    rulesList.setAttribute('role', 'list');

    if (this.category.rules.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'rule-editor__empty';
      empty.textContent = 'No rules defined. This category will not match any features.';
      rulesList.appendChild(empty);
    } else {
      this.category.rules.forEach((rule, index) => {
        const ruleRow = this.createRuleRow(rule, index);
        rulesList.appendChild(ruleRow);
      });
    }

    this.container.appendChild(rulesList);

    // Add rule button
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'rule-editor__add-btn';
    addBtn.textContent = '+ Add Rule';
    addBtn.addEventListener('click', () => this.handleAddRule());
    this.container.appendChild(addBtn);
  }

  /**
   * Create a single rule row
   * @param {Object} rule - Rule data
   * @param {number} index - Rule index
   * @returns {HTMLElement}
   */
  createRuleRow(rule, index) {
    const row = document.createElement('div');
    row.className = 'rule-row';
    row.dataset.ruleId = rule.id;
    row.setAttribute('role', 'listitem');

    // Rule number label
    const label = document.createElement('span');
    label.className = 'rule-row__label';
    label.textContent = `${index + 1}.`;

    // Parameter dropdown
    const paramSelect = this.createParameterDropdown(rule);

    // Operator dropdown
    const operatorSelect = this.createOperatorDropdown(rule);

    // Value input(s)
    const valueContainer = this.createValueInput(rule);

    // Unit label
    const unit = document.createElement('span');
    unit.className = 'rule-row__unit';
    unit.textContent = rule.unit || '';

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'rule-row__delete';
    deleteBtn.setAttribute('aria-label', 'Delete rule');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', () => this.handleDeleteRule(rule.id));

    row.appendChild(label);
    row.appendChild(paramSelect);
    row.appendChild(operatorSelect);
    row.appendChild(valueContainer);
    row.appendChild(unit);
    row.appendChild(deleteBtn);

    return row;
  }

  /**
   * Create parameter dropdown
   * @param {Object} rule - Current rule
   * @returns {HTMLElement}
   */
  createParameterDropdown(rule) {
    const select = document.createElement('select');
    select.className = 'rule-row__param';
    select.setAttribute('aria-label', 'Parameter');

    // Group parameters by category
    const groups = {
      temperature: { label: 'Temperature', params: [] },
      precipitation: { label: 'Precipitation', params: [] },
      derived: { label: 'Derived', params: [] },
    };

    Object.entries(PARAMETERS).forEach(([id, param]) => {
      const group = groups[param.category] || groups.derived;
      group.params.push({ id, ...param });
    });

    Object.entries(groups).forEach(([, group]) => {
      if (group.params.length === 0) return;

      const optgroup = document.createElement('optgroup');
      optgroup.label = group.label;

      group.params.forEach(param => {
        const option = document.createElement('option');
        option.value = param.id;
        option.textContent = param.shortLabel || param.label;
        if (param.id === rule.parameter) {
          option.selected = true;
        }
        optgroup.appendChild(option);
      });

      select.appendChild(optgroup);
    });

    select.addEventListener('change', (e) => {
      this.handleUpdateRule(rule.id, 'parameter', e.target.value);
    });

    return select;
  }

  /**
   * Create operator dropdown
   * @param {Object} rule - Current rule
   * @returns {HTMLElement}
   */
  createOperatorDropdown(rule) {
    const select = document.createElement('select');
    select.className = 'rule-row__operator';
    select.setAttribute('aria-label', 'Operator');

    // Basic comparison operators
    const basicOps = ['<', '<=', '>', '>=', '==', '!='];
    const rangeOps = ['in_range', 'not_in_range'];

    basicOps.forEach(opKey => {
      const op = OPERATORS[opKey];
      const option = document.createElement('option');
      option.value = opKey;
      option.textContent = op.label;
      if (opKey === rule.operator) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    // Range operators in separate group
    const rangeGroup = document.createElement('optgroup');
    rangeGroup.label = 'Range';
    rangeOps.forEach(opKey => {
      const op = OPERATORS[opKey];
      const option = document.createElement('option');
      option.value = opKey;
      option.textContent = op.label;
      if (opKey === rule.operator) {
        option.selected = true;
      }
      rangeGroup.appendChild(option);
    });
    select.appendChild(rangeGroup);

    select.addEventListener('change', (e) => {
      const newOperator = e.target.value;

      // If switching to range operator, convert value to array
      if (newOperator === 'in_range' || newOperator === 'not_in_range') {
        if (!Array.isArray(rule.value)) {
          this.handleUpdateRule(rule.id, 'value', [rule.value, rule.value + 10]);
        }
      } else {
        // If switching from range to single value, take first value
        if (Array.isArray(rule.value)) {
          this.handleUpdateRule(rule.id, 'value', rule.value[0]);
        }
      }

      this.handleUpdateRule(rule.id, 'operator', newOperator);
    });

    return select;
  }

  /**
   * Create value input(s) based on operator type
   * @param {Object} rule - Current rule
   * @returns {HTMLElement}
   */
  createValueInput(rule) {
    const container = document.createElement('div');
    container.className = 'rule-row__value-container';

    const param = PARAMETERS[rule.parameter] || { range: [-100, 100], step: 1 };
    const isRange = rule.operator === 'in_range' || rule.operator === 'not_in_range';

    if (isRange) {
      // Two inputs for range
      const minValue = Array.isArray(rule.value) ? rule.value[0] : rule.value;
      const maxValue = Array.isArray(rule.value) ? rule.value[1] : rule.value + 10;

      const minInput = document.createElement('input');
      minInput.type = 'number';
      minInput.className = 'rule-row__value rule-row__value--min';
      minInput.value = minValue;
      minInput.min = param.range[0];
      minInput.max = param.range[1];
      minInput.step = param.step;
      minInput.setAttribute('aria-label', 'Minimum value');

      const separator = document.createElement('span');
      separator.className = 'rule-row__range-sep';
      separator.textContent = 'to';

      const maxInput = document.createElement('input');
      maxInput.type = 'number';
      maxInput.className = 'rule-row__value rule-row__value--max';
      maxInput.value = maxValue;
      maxInput.min = param.range[0];
      maxInput.max = param.range[1];
      maxInput.step = param.step;
      maxInput.setAttribute('aria-label', 'Maximum value');

      const updateRange = () => {
        const min = parseFloat(minInput.value) || 0;
        const max = parseFloat(maxInput.value) || 0;
        this.handleUpdateRule(rule.id, 'value', [min, max]);
      };

      minInput.addEventListener('change', updateRange);
      maxInput.addEventListener('change', updateRange);

      container.appendChild(minInput);
      container.appendChild(separator);
      container.appendChild(maxInput);
    } else {
      // Single input for comparison
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'rule-row__value';
      input.value = Array.isArray(rule.value) ? rule.value[0] : rule.value;
      input.min = param.range[0];
      input.max = param.range[1];
      input.step = param.step;
      input.setAttribute('aria-label', 'Value');

      input.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value) || 0;
        this.handleUpdateRule(rule.id, 'value', value);
      });

      container.appendChild(input);
    }

    return container;
  }

  // ============================================
  // Event Handlers
  // ============================================

  /**
   * Handle adding a new rule
   */
  handleAddRule() {
    this.engine.addRule(this.category.id);
    this.refreshCategory();
    this.render();
    this.onChange();
  }

  /**
   * Handle updating a rule field
   * @param {string} ruleId - Rule ID
   * @param {string} field - Field to update
   * @param {*} value - New value
   */
  handleUpdateRule(ruleId, field, value) {
    this.engine.updateRule(this.category.id, ruleId, { [field]: value });
    this.refreshCategory();

    // Re-render only if changing to/from range operator
    if (field === 'operator' || field === 'parameter') {
      this.render();
    } else {
      // Just update the unit display
      const row = this.container.querySelector(`[data-rule-id="${ruleId}"]`);
      if (row) {
        const rule = this.category.rules.find(r => r.id === ruleId);
        if (rule) {
          const unitEl = row.querySelector('.rule-row__unit');
          if (unitEl) {
            unitEl.textContent = rule.unit || '';
          }
        }
      }
    }

    this.onChange();
  }

  /**
   * Handle deleting a rule
   * @param {string} ruleId - Rule ID
   */
  handleDeleteRule(ruleId) {
    this.engine.removeRule(this.category.id, ruleId);
    this.refreshCategory();
    this.render();
    this.onChange();
  }

  /**
   * Refresh category reference from engine
   */
  refreshCategory() {
    const updated = this.engine.getCategory(this.category.id);
    if (updated) {
      this.category = updated;
    }
  }

  /**
   * Destroy the component
   */
  destroy() {
    this.container.innerHTML = '';
  }
}

export default RuleEditor;
