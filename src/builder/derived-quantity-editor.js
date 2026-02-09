/**
 * Derived Quantity Editor
 * UI for creating and editing custom derived parameters (formulas)
 * @module builder/derived-quantity-editor
 */

import { PARAMETERS, FormulaEvaluator } from '../climate/custom-rules.js';

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * DerivedQuantityEditor class
 * Manages the UI for creating and editing custom derived parameters
 */
export class DerivedQuantityEditor {
  /**
   * Create a DerivedQuantityEditor
   * @param {HTMLElement} container - Container element
   * @param {CustomRulesEngine} engine - The custom rules engine
   * @param {Function} onUpdate - Callback when parameters change
   */
  constructor(container, engine, onUpdate) {
    this.container = container;
    this.engine = engine;
    this.onUpdate = onUpdate || (() => {});
    this.editingParamId = null;

    this.render();
  }

  /**
   * Render the editor UI
   */
  render() {
    // Clear container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    // Create main structure
    const wrapper = document.createElement('div');
    wrapper.className = 'derived-editor';

    // Header
    const header = this.createHeader();
    wrapper.appendChild(header);

    // Parameter list
    const paramList = this.createParameterList();
    wrapper.appendChild(paramList);

    // Add button
    const addBtn = this.createAddButton();
    wrapper.appendChild(addBtn);

    this.container.appendChild(wrapper);
  }

  /**
   * Create the header section
   * @returns {HTMLElement}
   */
  createHeader() {
    const header = document.createElement('div');
    header.className = 'derived-editor__header';

    const title = document.createElement('h4');
    title.className = 'derived-editor__title';
    title.textContent = 'Custom Parameters';

    const helpBtn = document.createElement('button');
    helpBtn.type = 'button';
    helpBtn.className = 'derived-editor__help-btn';
    helpBtn.setAttribute('aria-label', 'Help with formulas');
    helpBtn.textContent = '?';
    helpBtn.addEventListener('click', () => this.showHelp());

    header.appendChild(title);
    header.appendChild(helpBtn);

    return header;
  }

  /**
   * Create the parameter list
   * @returns {HTMLElement}
   */
  createParameterList() {
    const list = document.createElement('div');
    list.className = 'derived-editor__list';

    const params = this.engine.getAllCustomParameters();

    if (params.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'derived-editor__empty';
      empty.textContent = 'No custom parameters yet. Click "Add Parameter" to create one.';
      list.appendChild(empty);
    } else {
      params.forEach(param => {
        const item = this.createParameterItem(param);
        list.appendChild(item);
      });
    }

    return list;
  }

  /**
   * Create a parameter item
   * @param {Object} param - Parameter object
   * @returns {HTMLElement}
   */
  createParameterItem(param) {
    const item = document.createElement('div');
    item.className = 'derived-editor__item';
    item.dataset.paramId = param.id;

    // Is this being edited?
    if (this.editingParamId === param.id) {
      return this.createEditForm(param);
    }

    // Display mode
    const info = document.createElement('div');
    info.className = 'derived-editor__item-info';

    const name = document.createElement('span');
    name.className = 'derived-editor__item-name';
    name.textContent = escapeHtml(param.name);

    const formula = document.createElement('code');
    formula.className = 'derived-editor__item-formula';
    formula.textContent = escapeHtml(param.formula);

    const unit = document.createElement('span');
    unit.className = 'derived-editor__item-unit';
    unit.textContent = param.unit ? `(${escapeHtml(param.unit)})` : '';

    info.appendChild(name);
    info.appendChild(formula);
    if (param.unit) {
      info.appendChild(unit);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'derived-editor__item-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'derived-editor__edit-btn';
    editBtn.setAttribute('aria-label', `Edit ${param.name}`);
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => this.startEditing(param.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'derived-editor__delete-btn';
    deleteBtn.setAttribute('aria-label', `Delete ${param.name}`);
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => this.deleteParameter(param.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(info);
    item.appendChild(actions);

    return item;
  }

  /**
   * Create edit form for a parameter
   * @param {Object} param - Parameter to edit (or empty for new)
   * @returns {HTMLElement}
   */
  createEditForm(param = null) {
    const form = document.createElement('div');
    form.className = 'derived-editor__form';

    const isNew = !param;
    if (isNew) {
      param = { id: null, name: '', formula: '', unit: '', description: '' };
    }

    // Name input
    const nameGroup = document.createElement('div');
    nameGroup.className = 'derived-editor__form-group';

    const nameLabel = document.createElement('label');
    nameLabel.className = 'derived-editor__label';
    nameLabel.textContent = 'Name';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'derived-editor__input';
    nameInput.placeholder = 'e.g., TempRange';
    nameInput.value = param.name;
    nameInput.maxLength = 30;

    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);

    // Formula input
    const formulaGroup = document.createElement('div');
    formulaGroup.className = 'derived-editor__form-group';

    const formulaLabel = document.createElement('label');
    formulaLabel.className = 'derived-editor__label';
    formulaLabel.textContent = 'Formula';

    const formulaInput = document.createElement('input');
    formulaInput.type = 'text';
    formulaInput.className = 'derived-editor__input derived-editor__input--formula';
    formulaInput.placeholder = 'e.g., Tmax - Tmin';
    formulaInput.value = param.formula;

    const formulaError = document.createElement('span');
    formulaError.className = 'derived-editor__error';
    formulaError.style.display = 'none';

    // Unit preview (auto-inferred from formula)
    const unitPreview = document.createElement('span');
    unitPreview.className = 'derived-editor__unit-preview';
    const updateUnitPreview = () => {
      const inferredUnit = FormulaEvaluator.inferUnit(
        formulaInput.value,
        this.engine.customParameters,
      );
      unitPreview.textContent = inferredUnit ? `Unit: ${inferredUnit}` : '';
    };
    updateUnitPreview();

    // Real-time validation and unit preview update
    formulaInput.addEventListener('input', () => {
      const validation = FormulaEvaluator.validate(
        formulaInput.value,
        this.engine.customParameters,
      );
      if (validation.valid) {
        formulaInput.classList.remove('derived-editor__input--error');
        formulaError.style.display = 'none';
        updateUnitPreview();
      } else {
        formulaInput.classList.add('derived-editor__input--error');
        formulaError.textContent = validation.error;
        formulaError.style.display = 'block';
        unitPreview.textContent = '';
      }
    });

    formulaGroup.appendChild(formulaLabel);
    formulaGroup.appendChild(formulaInput);
    formulaGroup.appendChild(formulaError);
    formulaGroup.appendChild(unitPreview);

    // Parameter quick-insert buttons organized by category
    const insertGroup = document.createElement('div');
    insertGroup.className = 'derived-editor__insert-group';

    // All available parameters by category
    const parameterGroups = [
      {
        label: 'Temp:',
        params: [
          { id: 'MAT', unit: '°C', desc: 'Mean Annual Temperature' },
          { id: 'Tmin', unit: '°C', desc: 'Coldest Month' },
          { id: 'Tmax', unit: '°C', desc: 'Warmest Month' },
          { id: 'WarmMonths', unit: 'months', desc: 'Months ≥10°C' },
        ],
      },
      {
        label: 'Precip:',
        params: [
          { id: 'MAP', unit: 'mm', desc: 'Mean Annual Precipitation' },
          { id: 'Pdry', unit: 'mm', desc: 'Driest Month' },
          { id: 'Pwet', unit: 'mm', desc: 'Wettest Month' },
        ],
      },
      {
        label: 'Seasonal:',
        params: [
          { id: 'Psummer', unit: 'mm', desc: 'Summer Total' },
          { id: 'Pwinter', unit: 'mm', desc: 'Winter Total' },
          { id: 'Psdry', unit: 'mm', desc: 'Driest Summer Month' },
          { id: 'Pswet', unit: 'mm', desc: 'Wettest Summer Month' },
          { id: 'Pwdry', unit: 'mm', desc: 'Driest Winter Month' },
          { id: 'Pwwet', unit: 'mm', desc: 'Wettest Winter Month' },
        ],
      },
      {
        label: 'Derived:',
        params: [
          { id: 'AridityIndex', unit: '', desc: 'MAP/(MAT+10)' },
        ],
      },
    ];

    parameterGroups.forEach(group => {
      const groupContainer = document.createElement('div');
      groupContainer.className = 'derived-editor__insert-row';

      const groupLabel = document.createElement('span');
      groupLabel.className = 'derived-editor__insert-label';
      groupLabel.textContent = group.label;
      groupContainer.appendChild(groupLabel);

      group.params.forEach(({ id: paramId, unit, desc }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'derived-editor__insert-btn';
        btn.textContent = paramId;
        btn.title = `${desc}${unit ? ` (${unit})` : ''}`;
        btn.addEventListener('click', () => {
          const cursorPos = formulaInput.selectionStart;
          const before = formulaInput.value.substring(0, cursorPos);
          const after = formulaInput.value.substring(cursorPos);
          formulaInput.value = before + paramId + after;
          formulaInput.focus();
          formulaInput.setSelectionRange(cursorPos + paramId.length, cursorPos + paramId.length);
          formulaInput.dispatchEvent(new Event('input'));
        });
        groupContainer.appendChild(btn);
      });

      insertGroup.appendChild(groupContainer);
    });

    // Also add any existing custom parameters
    const customParams = this.engine.getAllCustomParameters();
    if (customParams.length > 0) {
      const customContainer = document.createElement('div');
      customContainer.className = 'derived-editor__insert-row';

      const customLabel = document.createElement('span');
      customLabel.className = 'derived-editor__insert-label';
      customLabel.textContent = 'Custom:';
      customContainer.appendChild(customLabel);

      customParams.forEach(cp => {
        // Don't show the parameter being edited
        if (param.id && cp.id === param.id) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'derived-editor__insert-btn derived-editor__insert-btn--custom';
        btn.textContent = cp.id;
        btn.title = `${cp.name}: ${cp.formula}${cp.unit ? ` (${cp.unit})` : ''}`;
        btn.addEventListener('click', () => {
          const cursorPos = formulaInput.selectionStart;
          const before = formulaInput.value.substring(0, cursorPos);
          const after = formulaInput.value.substring(cursorPos);
          formulaInput.value = before + cp.id + after;
          formulaInput.focus();
          formulaInput.setSelectionRange(cursorPos + cp.id.length, cursorPos + cp.id.length);
          formulaInput.dispatchEvent(new Event('input'));
        });
        customContainer.appendChild(btn);
      });

      if (customContainer.children.length > 1) {
        insertGroup.appendChild(customContainer);
      }
    }

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'derived-editor__form-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'derived-editor__save-btn';
    saveBtn.textContent = isNew ? 'Add' : 'Save';
    saveBtn.addEventListener('click', () => {
      this.saveParameter({
        id: param.id,
        name: nameInput.value.trim(),
        formula: formulaInput.value.trim(),
      });
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'derived-editor__cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.cancelEditing());

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    form.appendChild(nameGroup);
    form.appendChild(formulaGroup);
    form.appendChild(insertGroup);
    form.appendChild(actions);

    return form;
  }

  /**
   * Create the add button
   * @returns {HTMLElement}
   */
  createAddButton() {
    const wrapper = document.createElement('div');
    wrapper.className = 'derived-editor__add-wrapper';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'derived-editor__add-btn';
    btn.textContent = '+ Add Parameter';
    btn.addEventListener('click', () => this.startAddingNew());

    wrapper.appendChild(btn);

    return wrapper;
  }

  /**
   * Start editing a parameter
   * @param {string} paramId - Parameter ID to edit
   */
  startEditing(paramId) {
    this.editingParamId = paramId;
    this.render();
  }

  /**
   * Start adding a new parameter
   */
  startAddingNew() {
    this.editingParamId = '__new__';
    this.render();

    // Show the form at the end
    const list = this.container.querySelector('.derived-editor__list');
    if (list) {
      const form = this.createEditForm(null);
      list.appendChild(form);

      // Focus the name input
      const nameInput = form.querySelector('input');
      if (nameInput) nameInput.focus();
    }
  }

  /**
   * Cancel editing
   */
  cancelEditing() {
    this.editingParamId = null;
    this.render();
  }

  /**
   * Save a parameter
   * @param {Object} data - Parameter data (unit is auto-inferred)
   */
  saveParameter(data) {
    try {
      // Validate name
      if (!data.name) {
        this.showError('Name is required');
        return;
      }

      // Validate formula
      const validation = FormulaEvaluator.validate(
        data.formula,
        this.engine.customParameters,
      );
      if (!validation.valid) {
        this.showError(validation.error);
        return;
      }

      if (data.id && data.id !== '__new__') {
        // Update existing (unit is auto-inferred by engine)
        this.engine.updateCustomParameter(data.id, {
          name: data.name,
          formula: data.formula,
        });
      } else {
        // Create new - use name as ID (cleaned)
        // Unit is auto-inferred by addCustomParameter
        const cleanId = data.name.replace(/[^a-zA-Z0-9_]/g, '');
        this.engine.addCustomParameter({
          id: cleanId,
          name: data.name,
          formula: data.formula,
        });
      }

      this.editingParamId = null;
      this.render();
      this.onUpdate();

    } catch (error) {
      this.showError(error.message);
    }
  }

  /**
   * Delete a parameter
   * @param {string} paramId - Parameter ID
   */
  deleteParameter(paramId) {
    const param = this.engine.getCustomParameter(paramId);
    if (!param) return;

    if (confirm(`Delete parameter "${param.name}"?`)) {
      try {
        this.engine.removeCustomParameter(paramId);
        this.render();
        this.onUpdate();
      } catch (error) {
        this.showError(error.message);
      }
    }
  }

  /**
   * Show an error message
   * @param {string} message - Error message
   */
  showError(message) {
    // Find or create error element
    let errorEl = this.container.querySelector('.derived-editor__global-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'derived-editor__global-error';
      const editor = this.container.querySelector('.derived-editor');
      if (editor) {
        editor.insertBefore(errorEl, editor.firstChild);
      }
    }

    errorEl.textContent = message;
    errorEl.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }

  /**
   * Show help dialog
   */
  showHelp() {
    const helpContent = `
Custom Parameters allow you to create derived climate metrics using formulas.

Operators: + - * / ( )

Functions:
• abs(x) - absolute value
• min(a, b) - minimum of two values
• max(a, b) - maximum of two values

Built-in Parameters:
• Temperature (°C): MAT, Tmin, Tmax
• Temperature (months): WarmMonths
• Precipitation (mm): MAP, Pdry, Pwet, Psummer, Pwinter
• Seasonal (mm): Psdry, Pswet, Pwdry, Pwwet
• Derived: AridityIndex

Examples:
• Tmax - Tmin → temperature range
• abs(Psummer - Pwinter) → seasonal difference
• Psdry / Pwwet → summer dryness ratio

Units are automatically inferred from your formula.
    `.trim();

    alert(helpContent);
  }

  /**
   * Destroy the editor
   */
  destroy() {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.engine = null;
    this.onUpdate = null;
  }
}

export default DerivedQuantityEditor;
