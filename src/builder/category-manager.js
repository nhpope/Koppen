/**
 * Category Manager Component
 * UI for managing custom climate categories
 * @module builder/category-manager
 */

/* eslint-disable sonarjs/no-duplicate-string --
 * CSS class names and UI labels are intentionally repeated for code clarity.
 */

import { DEFAULT_COLORS } from '../climate/custom-rules.js';
import RuleEditor from './rule-editor.js';
import logger from '../utils/logger.js';

/**
 * Category Manager - Manages the list of climate categories
 */
class CategoryManager {
  /**
   * Create a CategoryManager
   * @param {HTMLElement} container - Container element
   * @param {CustomRulesEngine} engine - Classification engine
   * @param {Function} onUpdate - Callback when categories change
   */
  constructor(container, engine, onUpdate) {
    this.container = container;
    this.engine = engine;
    this.onUpdate = onUpdate || (() => {});
    this.expandedCategoryId = null;
    this.ruleEditor = null;
    this.dragState = null;

    this.setupEventListeners();
    this.setupContainerDragHandlers();
    this.render();
  }

  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Listen for classification stats updates
    document.addEventListener('koppen:classification-stats', (e) => {
      this.updateStats(e.detail);
    });
  }

  /**
   * Render the category manager
   */
  render() {
    this.container.innerHTML = '';
    this.container.className = 'category-manager';

    // Header with add button
    const header = this.createHeader();
    this.container.appendChild(header);

    // Category list
    const list = this.createCategoryList();
    this.container.appendChild(list);

    // Stats summary
    const stats = this.createStatsSummary();
    this.container.appendChild(stats);
  }

  /**
   * Create the header with title and add button
   * @returns {HTMLElement}
   */
  createHeader() {
    const header = document.createElement('div');
    header.className = 'category-manager__header';

    const title = document.createElement('h3');
    title.className = 'category-manager__title';
    title.textContent = 'Categories';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'category-manager__add-btn';
    addBtn.setAttribute('aria-label', 'Add new category');
    addBtn.textContent = '+ Add';
    addBtn.addEventListener('click', () => this.handleAddCategory());

    header.appendChild(title);
    header.appendChild(addBtn);

    return header;
  }

  /**
   * Create the category list
   * @returns {HTMLElement}
   */
  createCategoryList() {
    const list = document.createElement('div');
    list.className = 'category-manager__list';
    list.setAttribute('role', 'list');

    const categories = this.engine.getSortedCategories();

    if (categories.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'category-manager__empty';
      empty.textContent = 'No categories yet. Click "+ Add" to create one.';
      list.appendChild(empty);
    } else {
      categories.forEach(category => {
        const item = this.createCategoryItem(category);
        list.appendChild(item);
      });
    }

    return list;
  }

  /**
   * Create a category list item
   * @param {Object} category - Category data
   * @returns {HTMLElement}
   */
  createCategoryItem(category) {
    const isExpanded = this.expandedCategoryId === category.id;

    const item = document.createElement('div');
    item.className = 'category-item';
    item.dataset.categoryId = category.id;
    item.setAttribute('role', 'listitem');
    if (isExpanded) {
      item.classList.add('category-item--expanded');
    }
    if (!category.enabled) {
      item.classList.add('category-item--disabled');
    }

    // Drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'category-item__drag-handle';
    dragHandle.setAttribute('aria-label', 'Drag to reorder');
    dragHandle.innerHTML = '<span></span><span></span><span></span>';
    dragHandle.draggable = true;
    this.setupDragHandlers(dragHandle, category.id);

    // Color swatch (clickable)
    const colorSwatch = document.createElement('button');
    colorSwatch.type = 'button';
    colorSwatch.className = 'category-item__color';
    colorSwatch.style.backgroundColor = category.color;
    colorSwatch.setAttribute('aria-label', `Change color for ${category.name}`);
    colorSwatch.addEventListener('click', () => this.showColorPicker(category.id));

    // Name (editable on click)
    const nameContainer = document.createElement('div');
    nameContainer.className = 'category-item__name-container';

    const name = document.createElement('span');
    name.className = 'category-item__name';
    name.textContent = category.name;
    name.addEventListener('dblclick', () => this.editCategoryName(category.id));

    const ruleCount = document.createElement('span');
    ruleCount.className = 'category-item__rule-count';
    ruleCount.textContent = `${category.rules.length} rule${category.rules.length !== 1 ? 's' : ''}`;

    nameContainer.appendChild(name);
    nameContainer.appendChild(ruleCount);

    // Match count (updated by stats)
    const matchCount = document.createElement('span');
    matchCount.className = 'category-item__match-count';
    matchCount.dataset.categoryId = category.id;
    matchCount.textContent = '0';

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'category-item__actions';

    // Toggle enabled
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'category-item__toggle-btn';
    toggleBtn.setAttribute('aria-label', category.enabled ? 'Disable category' : 'Enable category');
    toggleBtn.setAttribute('aria-pressed', category.enabled);
    toggleBtn.innerHTML = category.enabled ? '&#10003;' : '&#10007;';
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleToggleCategory(category.id);
    });

    // Expand/edit rules
    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.className = 'category-item__expand-btn';
    expandBtn.setAttribute('aria-label', isExpanded ? 'Collapse rules' : 'Edit rules');
    expandBtn.setAttribute('aria-expanded', isExpanded);
    expandBtn.innerHTML = isExpanded ? '&#9650;' : '&#9660;';
    expandBtn.addEventListener('click', () => this.toggleExpand(category.id));

    // Delete
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'category-item__delete-btn';
    deleteBtn.setAttribute('aria-label', `Delete ${category.name}`);
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleDeleteCategory(category.id);
    });

    actions.appendChild(toggleBtn);
    actions.appendChild(expandBtn);
    actions.appendChild(deleteBtn);

    // Header row
    const headerRow = document.createElement('div');
    headerRow.className = 'category-item__header';
    headerRow.appendChild(dragHandle);
    headerRow.appendChild(colorSwatch);
    headerRow.appendChild(nameContainer);
    headerRow.appendChild(matchCount);
    headerRow.appendChild(actions);

    item.appendChild(headerRow);

    // Expanded content (rule editor)
    if (isExpanded) {
      const editorContainer = document.createElement('div');
      editorContainer.className = 'category-item__editor';

      this.ruleEditor = new RuleEditor(
        editorContainer,
        category,
        this.engine,
        () => {
          this.onUpdate();
          this.refreshCategoryItem(category.id);
        },
      );

      item.appendChild(editorContainer);
    }

    return item;
  }

  /**
   * Set up drag and drop handlers for a drag handle
   * @param {HTMLElement} handle - Drag handle element
   * @param {string} categoryId - Category ID
   */
  setupDragHandlers(handle, categoryId) {
    // Only set up dragstart and dragend on the handle itself
    // Other events are handled via container delegation (see setupContainerDragHandlers)
    handle.addEventListener('dragstart', (e) => {
      this.dragState = { categoryId };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', categoryId);

      logger.log('[CategoryManager] Drag start:', categoryId);

      // Add dragging class after a brief delay
      setTimeout(() => {
        const item = this.container.querySelector(`[data-category-id="${categoryId}"]`);
        if (item) {
          item.classList.add('category-item--dragging');
          logger.log('[CategoryManager] Added dragging class to:', categoryId);
        }
      }, 0);
    });

    handle.addEventListener('dragend', () => {
      logger.log('[CategoryManager] Drag end');
      // Remove all drag-related classes
      this.container.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('category-item--dragging', 'category-item--drag-over');
      });
      this.dragState = null;
    });
  }

  /**
   * Set up container-level drag handlers (event delegation)
   * Called once during initialization
   */
  setupContainerDragHandlers() {
    // Dragover handler for all category items
    this.container.addEventListener('dragover', (e) => {
      const item = e.target.closest('.category-item');
      if (!item || !this.dragState) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      // Remove drag-over from all items, add to current
      this.container.querySelectorAll('.category-item').forEach(i => {
        i.classList.remove('category-item--drag-over');
      });
      item.classList.add('category-item--drag-over');
    });

    // Dragleave handler
    this.container.addEventListener('dragleave', (e) => {
      const item = e.target.closest('.category-item');
      if (!item) return;

      // Only remove if we're leaving the item entirely
      if (!item.contains(e.relatedTarget)) {
        item.classList.remove('category-item--drag-over');
      }
    });

    // Drop handler
    this.container.addEventListener('drop', (e) => {
      const item = e.target.closest('.category-item');
      if (!item || !this.dragState) return;

      e.preventDefault();
      item.classList.remove('category-item--drag-over');

      const targetId = item.dataset.categoryId;
      const sourceId = this.dragState.categoryId;

      logger.log('[CategoryManager] Drop:', sourceId, '->', targetId);

      if (sourceId !== targetId) {
        this.handleReorderCategory(sourceId, targetId);
      }
    });
  }

  /**
   * Create the stats summary section
   * @returns {HTMLElement}
   */
  createStatsSummary() {
    const stats = document.createElement('div');
    stats.className = 'category-manager__stats';

    const classified = document.createElement('div');
    classified.className = 'category-manager__stat';
    classified.innerHTML = `
      <span class="category-manager__stat-label">Classified:</span>
      <span class="category-manager__stat-value" data-stat="classified">0</span>
    `;

    const unclassified = document.createElement('div');
    unclassified.className = 'category-manager__stat category-manager__stat--unclassified';
    unclassified.innerHTML = `
      <span class="category-manager__stat-label">Unclassified:</span>
      <span class="category-manager__stat-value" data-stat="unclassified">0</span>
    `;

    stats.appendChild(classified);
    stats.appendChild(unclassified);

    return stats;
  }

  /**
   * Update statistics display
   * @param {Object} stats - Classification statistics
   */
  updateStats(stats) {
    // Update overall stats
    const classifiedEl = this.container.querySelector('[data-stat="classified"]');
    const unclassifiedEl = this.container.querySelector('[data-stat="unclassified"]');

    if (classifiedEl) {
      classifiedEl.textContent = stats.classified?.toLocaleString() || '0';
    }
    if (unclassifiedEl) {
      unclassifiedEl.textContent = stats.unclassified?.toLocaleString() || '0';
    }

    // Update per-category counts
    if (stats.byCategory) {
      Object.entries(stats.byCategory).forEach(([categoryId, data]) => {
        const countEl = this.container.querySelector(`.category-item__match-count[data-category-id="${categoryId}"]`);
        if (countEl) {
          countEl.textContent = data.count?.toLocaleString() || '0';
        }
      });
    }
  }

  /**
   * Refresh a single category item without full re-render
   * @param {string} categoryId - Category ID to refresh
   */
  refreshCategoryItem(categoryId) {
    const category = this.engine.getCategory(categoryId);
    if (!category) return;

    const item = this.container.querySelector(`[data-category-id="${categoryId}"]`);
    if (!item) return;

    // Update rule count
    const ruleCount = item.querySelector('.category-item__rule-count');
    if (ruleCount) {
      ruleCount.textContent = `${category.rules.length} rule${category.rules.length !== 1 ? 's' : ''}`;
    }
  }

  // ============================================
  // Event Handlers
  // ============================================

  /**
   * Handle adding a new category
   */
  handleAddCategory() {
    const newCategory = this.engine.addCategory();
    this.expandedCategoryId = newCategory.id;
    this.render();
    this.onUpdate();

    // Focus the new category name for immediate editing
    setTimeout(() => {
      this.editCategoryName(newCategory.id);
    }, 100);
  }

  /**
   * Handle deleting a category
   * @param {string} categoryId - Category ID
   */
  handleDeleteCategory(categoryId) {
    const category = this.engine.getCategory(categoryId);
    if (!category) return;

    const confirmed = confirm(`Delete "${category.name}"? This cannot be undone.`);
    if (!confirmed) return;

    this.engine.removeCategory(categoryId);

    if (this.expandedCategoryId === categoryId) {
      this.expandedCategoryId = null;
    }

    this.render();
    this.onUpdate();
  }

  /**
   * Handle toggling category enabled state
   * @param {string} categoryId - Category ID
   */
  handleToggleCategory(categoryId) {
    const category = this.engine.getCategory(categoryId);
    if (!category) return;

    this.engine.updateCategory(categoryId, { enabled: !category.enabled });
    this.render();
    this.onUpdate();
  }

  /**
   * Handle reordering categories via drag and drop
   * @param {string} sourceId - Source category ID
   * @param {string} targetId - Target category ID
   */
  handleReorderCategory(sourceId, targetId) {
    const categories = this.engine.getSortedCategories();
    const orderedIds = categories.map(c => c.id);

    logger.log('[CategoryManager] Before reorder:', orderedIds);

    const sourceIndex = orderedIds.indexOf(sourceId);
    const targetIndex = orderedIds.indexOf(targetId);

    logger.log('[CategoryManager] Indices - source:', sourceIndex, 'target:', targetIndex);

    if (sourceIndex === -1 || targetIndex === -1) {
      console.error('[CategoryManager] Invalid indices');
      return;
    }

    // Remove source from array
    orderedIds.splice(sourceIndex, 1);

    // Recalculate target index after removal (if source was before target, target shifted down)
    const newTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;

    // Insert at new position
    orderedIds.splice(newTargetIndex, 0, sourceId);

    logger.log('[CategoryManager] After reorder:', orderedIds);

    this.engine.reorderCategories(orderedIds);
    this.render();
    this.onUpdate();
  }

  /**
   * Toggle expanded state for a category
   * @param {string} categoryId - Category ID
   */
  toggleExpand(categoryId) {
    if (this.expandedCategoryId === categoryId) {
      this.expandedCategoryId = null;
    } else {
      this.expandedCategoryId = categoryId;
    }
    this.render();
  }

  /**
   * Show color picker for a category
   * @param {string} categoryId - Category ID
   */
  showColorPicker(categoryId) {
    const category = this.engine.getCategory(categoryId);
    if (!category) return;

    // Create color picker popup
    const existingPicker = this.container.querySelector('.color-picker-popup');
    if (existingPicker) {
      existingPicker.remove();
    }

    const picker = document.createElement('div');
    picker.className = 'color-picker-popup';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'color-picker-popup__close';
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', () => picker.remove());

    // Color grid
    const grid = document.createElement('div');
    grid.className = 'color-picker-popup__grid';

    // Extended color palette
    const colors = [
      ...DEFAULT_COLORS,
      '#800000', '#808000', '#008000', '#008080',
      '#000080', '#800080', '#808080', '#C0C0C0',
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    ];

    colors.forEach(color => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'color-picker-popup__swatch';
      swatch.style.backgroundColor = color;
      swatch.setAttribute('aria-label', `Select color ${color}`);
      if (color.toLowerCase() === category.color.toLowerCase()) {
        swatch.classList.add('color-picker-popup__swatch--selected');
      }
      swatch.addEventListener('click', () => {
        this.engine.updateCategory(categoryId, { color });
        picker.remove();
        this.render();
        this.onUpdate();
      });
      grid.appendChild(swatch);
    });

    // Custom color input
    const customRow = document.createElement('div');
    customRow.className = 'color-picker-popup__custom';

    const customInput = document.createElement('input');
    customInput.type = 'color';
    customInput.value = category.color;
    customInput.className = 'color-picker-popup__custom-input';

    const customLabel = document.createElement('span');
    customLabel.textContent = 'Custom';

    customInput.addEventListener('change', (e) => {
      this.engine.updateCategory(categoryId, { color: e.target.value });
      picker.remove();
      this.render();
      this.onUpdate();
    });

    customRow.appendChild(customInput);
    customRow.appendChild(customLabel);

    picker.appendChild(closeBtn);
    picker.appendChild(grid);
    picker.appendChild(customRow);

    // Position picker near the color swatch
    const item = this.container.querySelector(`[data-category-id="${categoryId}"]`);
    if (item) {
      item.appendChild(picker);
    }
  }

  /**
   * Enable editing of category name
   * @param {string} categoryId - Category ID
   */
  editCategoryName(categoryId) {
    const category = this.engine.getCategory(categoryId);
    if (!category) return;

    const item = this.container.querySelector(`[data-category-id="${categoryId}"]`);
    if (!item) return;

    const nameEl = item.querySelector('.category-item__name');
    if (!nameEl) return;

    // Replace with input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'category-item__name-input';
    input.value = category.name;
    input.maxLength = 50;

    const saveName = () => {
      const newName = input.value.trim() || 'Untitled';
      this.engine.updateCategory(categoryId, { name: newName });
      this.render();
      this.onUpdate();
    };

    input.addEventListener('blur', saveName);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveName();
      } else if (e.key === 'Escape') {
        this.render();
      }
    });

    nameEl.replaceWith(input);
    input.focus();
    input.select();
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    if (this.ruleEditor) {
      this.ruleEditor.destroy();
    }
    this.container.innerHTML = '';
  }
}

export default CategoryManager;
