/**
 * Legend Component
 * Interactive legend showing all 30 Köppen climate types
 */

/* eslint-disable security/detect-object-injection --
 * This file accesses CLIMATE_TYPES using hardcoded Köppen classification keys.
 * Keys are not user-controlled; they come from the standard Köppen system.
 * See docs/orchestration/checkpoints/security-review.md for full analysis.
 */

import { CLIMATE_TYPES } from '../climate/koppen-rules.js';
import { CLIMATE_COLORS } from '../utils/colors.js';
import logger from '../utils/logger.js';

let legendElement = null;
let selectedType = null;
let isCollapsed = false;
let stats = {};

// Custom mode state
let isCustomMode = false;
let customCategories = [];
let customStats = {};
let expandedParents = new Set();  // Track which parent categories are expanded

// Climate type groups
const CLIMATE_GROUPS = {
  A: { name: 'Tropical', types: ['Af', 'Am', 'Aw', 'As'] },
  B: { name: 'Arid', types: ['BWh', 'BWk', 'BSh', 'BSk'] },
  C: { name: 'Temperate', types: ['Csa', 'Csb', 'Csc', 'Cwa', 'Cwb', 'Cwc', 'Cfa', 'Cfb', 'Cfc'] },
  D: { name: 'Continental', types: ['Dsa', 'Dsb', 'Dsc', 'Dsd', 'Dwa', 'Dwb', 'Dwc', 'Dwd', 'Dfa', 'Dfb', 'Dfc', 'Dfd'] },
  E: { name: 'Polar', types: ['ET', 'EF'] },
};

/**
 * Create the legend
 * @param {HTMLElement} container - Container element
 */
export function createLegend(container) {
  if (!container) {
    container = document.getElementById('legend-container');
  }
  if (!container) return;

  legendElement = container;
  render();
  setupEventListeners();

  logger.log('[Koppen] Legend created');
}

/**
 * Render the legend HTML
 */
function render() {
  if (!legendElement) return;

  if (isCustomMode) {
    renderCustomMode();
  } else {
    renderKoppenMode();
  }
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Render Köppen mode legend
 */
function renderKoppenMode() {
  // eslint-disable-next-line no-unsanitized/property -- Template uses hardcoded Köppen climate group data
  legendElement.innerHTML = `
    <div class="legend__header">
      <h2 class="legend__title">Climate Types</h2>
      <button class="legend__toggle" aria-label="Toggle legend" aria-expanded="${!isCollapsed}">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="${isCollapsed ? 'M6 4l4 4-4 4' : 'M4 6l4 4 4-4'}"/>
        </svg>
      </button>
    </div>
    <div class="legend__content ${isCollapsed ? 'legend__content--collapsed' : ''}">
      ${Object.entries(CLIMATE_GROUPS).map(([key, group]) => `
        <div class="legend__group" data-group="${key}">
          <h3 class="legend__group-title">${group.name} (${key})</h3>
          <div class="legend__items">
            ${group.types.map(type => renderItem(type)).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render custom mode legend with hierarchical categories
 */
function renderCustomMode() {
  // Get top-level categories (no parent)
  const topLevelCategories = customCategories.filter(cat => cat.parentId === null);

  // eslint-disable-next-line no-unsanitized/property -- Category names are escaped via escapeHtml()
  legendElement.innerHTML = `
    <div class="legend__header">
      <h2 class="legend__title">Custom Categories</h2>
      <button class="legend__toggle" aria-label="Toggle legend" aria-expanded="${!isCollapsed}">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="${isCollapsed ? 'M6 4l4 4-4 4' : 'M4 6l4 4 4-4'}"/>
        </svg>
      </button>
    </div>
    <div class="legend__content ${isCollapsed ? 'legend__content--collapsed' : ''}">
      <div class="legend__custom-items">
        ${topLevelCategories.map(cat => renderCustomCategory(cat)).join('')}
      </div>
      ${renderUnclassifiedItem()}
    </div>
  `;
}

/**
 * Render a custom category item (with children if any)
 * @param {Object} category - Category data
 * @returns {string} HTML string
 */
function renderCustomCategory(category) {
  const children = customCategories.filter(cat => cat.parentId === category.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedParents.has(category.id);
  const isActive = selectedType === category.id;

  // Get stats for this category
  const catStats = customStats[category.id] || { count: 0, totalCount: 0 };
  const displayCount = hasChildren ? catStats.totalCount : catStats.count;

  // Escape user-provided category name
  const safeName = escapeHtml(category.name);

  let html = `
    <div class="legend__custom-group ${hasChildren ? 'legend__custom-group--has-children' : ''}" data-category-id="${escapeHtml(category.id)}">
      <button class="legend__custom-item ${isActive ? 'legend__custom-item--active' : ''}"
              data-type="${escapeHtml(category.id)}"
              tabindex="0"
              role="option"
              aria-selected="${isActive}"
              title="${isActive ? 'Click to show all' : 'Click to filter map'}">
        ${hasChildren ? `
          <span class="legend__expand-toggle ${isExpanded ? 'legend__expand-toggle--expanded' : ''}"
                data-toggle-parent="${escapeHtml(category.id)}"
                aria-label="${isExpanded ? 'Collapse' : 'Expand'} ${safeName}">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="${isExpanded ? 'M3 4l3 3 3-3' : 'M4 3l3 3-3 3'}"/>
            </svg>
          </span>
        ` : '<span class="legend__expand-placeholder"></span>'}
        <span class="legend__color" style="background-color: ${escapeHtml(category.color)}"></span>
        <span class="legend__label">
          <span class="legend__name">${safeName}</span>
        </span>
        ${displayCount > 0 ? `<span class="legend__count">${displayCount.toLocaleString()}</span>` : ''}
      </button>
  `;

  // Render children if expanded
  if (hasChildren && isExpanded) {
    html += `<div class="legend__custom-children">`;
    children.forEach(child => {
      const childActive = selectedType === child.id;
      const childStats = customStats[child.id] || { count: 0 };
      const safeChildName = escapeHtml(child.name);
      html += `
        <button class="legend__custom-item legend__custom-item--child ${childActive ? 'legend__custom-item--active' : ''}"
                data-type="${escapeHtml(child.id)}"
                data-parent-id="${escapeHtml(category.id)}"
                tabindex="0"
                role="option"
                aria-selected="${childActive}"
                title="${childActive ? 'Click to show all' : 'Click to filter map'}">
          <span class="legend__color" style="background-color: ${escapeHtml(child.color)}"></span>
          <span class="legend__label">
            <span class="legend__name">${safeChildName}</span>
          </span>
          ${childStats.count > 0 ? `<span class="legend__count">${childStats.count.toLocaleString()}</span>` : ''}
        </button>
      `;
    });
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Render unclassified item for custom mode
 * @returns {string} HTML string
 */
function renderUnclassifiedItem() {
  const unclassifiedCount = customStats._unclassified || 0;
  const isActive = selectedType === '_unclassified';

  return `
    <div class="legend__custom-unclassified">
      <button class="legend__custom-item legend__custom-item--unclassified ${isActive ? 'legend__custom-item--active' : ''}"
              data-type="_unclassified"
              tabindex="0"
              role="option"
              aria-selected="${isActive}">
        <span class="legend__expand-placeholder"></span>
        <span class="legend__color" style="background-color: #CCCCCC"></span>
        <span class="legend__label">
          <span class="legend__name">Unclassified</span>
        </span>
        ${unclassifiedCount > 0 ? `<span class="legend__count">${unclassifiedCount.toLocaleString()}</span>` : ''}
      </button>
    </div>
  `;
}

/**
 * Render a single legend item
 * @param {string} type - Climate type code
 * @returns {string} HTML string
 */
function renderItem(type) {
  const info = CLIMATE_TYPES[type] || { name: type };
  const color = CLIMATE_COLORS[type] || '#cccccc';
  const isActive = type === selectedType;
  const count = stats[type] || 0;

  return `
    <button class="legend__item ${isActive ? 'legend__item--active' : ''}"
            data-type="${type}"
            tabindex="0"
            role="option"
            aria-selected="${isActive}"
            title="${isActive ? 'Click to show all' : 'Click to filter map'}">
      <span class="legend__color" style="background-color: ${color}"></span>
      <span class="legend__label">
        <span class="legend__code">${type}</span>
        <span class="legend__name">${info.name}</span>
      </span>
      ${count > 0 ? `<span class="legend__count">${count.toLocaleString()}</span>` : ''}
    </button>
  `;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  if (!legendElement) return;

  // Toggle button and item clicks
  legendElement.addEventListener('click', (e) => {
    const toggle = e.target.closest('.legend__toggle');
    if (toggle) {
      toggleCollapse();
      return;
    }

    // Handle expand/collapse toggle for custom mode parent categories
    const expandToggle = e.target.closest('[data-toggle-parent]');
    if (expandToggle) {
      e.stopPropagation();
      const parentId = expandToggle.dataset.toggleParent;
      toggleParentExpanded(parentId);
      return;
    }

    // Handle standard Köppen legend item click
    const item = e.target.closest('.legend__item');
    if (item) {
      handleItemClick(item.dataset.type);
      return;
    }

    // Handle custom mode legend item click
    const customItem = e.target.closest('.legend__custom-item');
    if (customItem) {
      handleItemClick(customItem.dataset.type);
    }
  });

  // Keyboard navigation
  legendElement.addEventListener('keydown', handleKeyboard);

  // Listen for layer ready to get stats
  document.addEventListener('koppen:layer-ready', (e) => {
    if (e.detail.stats) {
      updateStats(e.detail.stats);
    }
  });

  // Listen for external selection (from map click)
  document.addEventListener('koppen:cell-selected', (e) => {
    if (e.detail.type && e.detail.type !== selectedType) {
      selectType(e.detail.type, true);
    }
  });

  // Listen for filter indicator close
  document.addEventListener('koppen:clear-filter', () => {
    deselectType();
  });

  // Listen for mode changes (koppen vs custom)
  document.addEventListener('koppen:mode-changed', (e) => {
    const { mode } = e.detail || {};
    isCustomMode = (mode === 'custom');
    selectedType = null;  // Clear selection on mode change
    if (!isCustomMode) {
      customCategories = [];
      customStats = {};
      expandedParents.clear();
    }
    render();
    logger.log(`[Koppen] Legend mode changed to: ${mode}`);
  });

  // Listen for custom rules changes to update categories
  document.addEventListener('koppen:custom-rules-changed', (e) => {
    const { engine, categories } = e.detail || {};
    if (categories) {
      customCategories = categories;
      render();
    }
  });

  // Listen for classification stats in custom mode
  document.addEventListener('koppen:classification-stats', (e) => {
    const { stats: newStats } = e.detail || {};
    if (isCustomMode && newStats) {
      updateCustomStats(newStats);
    }
  });
}

/**
 * Toggle expanded state for a parent category
 * @param {string} parentId - Parent category ID
 */
function toggleParentExpanded(parentId) {
  if (expandedParents.has(parentId)) {
    expandedParents.delete(parentId);
  } else {
    expandedParents.add(parentId);
  }
  render();
}

/**
 * Update custom mode stats
 * @param {Object} newStats - Stats from classification
 */
function updateCustomStats(newStats) {
  customStats = {};

  // Convert byCategory to our format
  if (newStats.byCategory) {
    Object.entries(newStats.byCategory).forEach(([catId, data]) => {
      customStats[catId] = {
        count: data.count || 0,
        totalCount: data.totalCount || data.count || 0,
      };
    });
  }

  // Store unclassified count
  customStats._unclassified = newStats.unclassified || 0;

  // Re-render to update counts
  render();
}

/**
 * Handle legend item click
 * @param {string} type - Climate type code or category ID
 */
function handleItemClick(type) {
  if (selectedType === type) {
    deselectType();
  } else {
    selectType(type);
  }
}

/**
 * Get category info by ID for custom mode
 * @param {string} categoryId - Category ID
 * @returns {Object|null} Category data or null
 */
function getCustomCategory(categoryId) {
  return customCategories.find(cat => cat.id === categoryId) || null;
}

/**
 * Handle keyboard navigation
 * @param {KeyboardEvent} e
 */
function handleKeyboard(e) {
  const item = e.target.closest('.legend__item');
  if (!item) return;

  const items = Array.from(legendElement.querySelectorAll('.legend__item'));
  const currentIndex = items.indexOf(item);

  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      handleItemClick(item.dataset.type);
      break;

    case 'ArrowDown':
      e.preventDefault();
      if (currentIndex < items.length - 1) {
        items[currentIndex + 1].focus();
      }
      break;

    case 'ArrowUp':
      e.preventDefault();
      if (currentIndex > 0) {
        items[currentIndex - 1].focus();
      }
      break;

    case 'Escape':
      e.preventDefault();
      deselectType();
      break;

    case 'Home':
      e.preventDefault();
      items[0].focus();
      break;

    case 'End':
      e.preventDefault();
      items[items.length - 1].focus();
      break;
  }
}

/**
 * Toggle legend collapse state
 */
function toggleCollapse() {
  isCollapsed = !isCollapsed;

  const content = legendElement.querySelector('.legend__content');
  const toggle = legendElement.querySelector('.legend__toggle');

  if (content) {
    content.classList.toggle('legend__content--collapsed', isCollapsed);
  }

  if (toggle) {
    toggle.setAttribute('aria-expanded', !isCollapsed);
    toggle.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="${isCollapsed ? 'M6 4l4 4-4 4' : 'M4 6l4 4 4-4'}"/>
      </svg>
    `;
  }

  legendElement.classList.toggle('legend--collapsed', isCollapsed);
}

/**
 * Select a climate type or custom category
 * @param {string} type - Climate type code or category ID
 * @param {boolean} fromExternal - Whether selection came from outside legend
 */
export function selectType(type, fromExternal = false) {
  // Deselect previous
  if (selectedType) {
    const prevItem = legendElement.querySelector(`[data-type="${selectedType}"]`);
    if (prevItem) {
      prevItem.classList.remove('legend__item--active', 'legend__custom-item--active');
      prevItem.setAttribute('aria-selected', 'false');
    }
  }

  // Select new
  selectedType = type;
  const item = legendElement.querySelector(`[data-type="${type}"]`);
  if (item) {
    const activeClass = isCustomMode ? 'legend__custom-item--active' : 'legend__item--active';
    item.classList.add(activeClass);
    item.setAttribute('aria-selected', 'true');
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Update filter indicator
  updateFilterIndicator(type);

  // Dispatch event (only if selection initiated from legend)
  if (!fromExternal) {
    if (isCustomMode) {
      // For custom mode, include parent info for child categories
      const category = getCustomCategory(type);
      const parentCategory = category?.parentId ? getCustomCategory(category.parentId) : null;

      document.dispatchEvent(new CustomEvent('koppen:custom-category-selected', {
        detail: {
          categoryId: type,
          categoryName: category?.name || type,
          parentId: parentCategory?.id || null,
          parentName: parentCategory?.name || null,
        },
      }));
    } else {
      document.dispatchEvent(new CustomEvent('koppen:climate-selected', {
        detail: { type },
      }));
    }
  }

  logger.log(`[Koppen] Legend: ${type} selected`);
}

/**
 * Deselect current type
 */
export function deselectType() {
  if (!selectedType) return;

  const item = legendElement.querySelector(`[data-type="${selectedType}"]`);
  if (item) {
    item.classList.remove('legend__item--active');
    item.setAttribute('aria-selected', 'false');
  }

  const previousType = selectedType;
  selectedType = null;

  // Clear filter indicator
  updateFilterIndicator(null);

  // Dispatch event
  document.dispatchEvent(new CustomEvent('koppen:climate-deselected', {
    detail: { type: previousType },
  }));

  logger.log('[Koppen] Legend: deselected');
}

/**
 * Update filter indicator in header
 * @param {string|null} type - Selected type or null
 */
function updateFilterIndicator(type) {
  let indicator = document.querySelector('.filter-indicator');

  if (!type) {
    if (indicator) indicator.remove();
    return;
  }

  // Get display info based on mode
  let displayName;
  let displayCode;

  if (isCustomMode) {
    if (type === '_unclassified') {
      displayName = 'Unclassified';
      displayCode = '';
    } else {
      const category = getCustomCategory(type);
      displayName = category?.name || type;
      // For child categories, show "Parent > Child" format
      if (category?.parentId) {
        const parent = getCustomCategory(category.parentId);
        displayCode = parent ? `${parent.name} >` : '';
      } else {
        displayCode = '';
      }
    }
  } else {
    const info = CLIMATE_TYPES[type] || { name: type };
    displayName = info.name;
    displayCode = type;
  }

  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'filter-indicator';

    const nav = document.querySelector('.header__nav');
    if (nav) {
      nav.parentNode.insertBefore(indicator, nav);
    }
  }

  // Safely set content with escaped values
  const safeName = escapeHtml(displayName);
  const safeCode = escapeHtml(displayCode);

  // eslint-disable-next-line no-unsanitized/property -- Values are escaped via escapeHtml()
  indicator.innerHTML = `
    <span class="filter-indicator__label">Showing:</span>
    <span class="filter-indicator__type">
      ${safeCode ? `<span class="filter-indicator__code">${safeCode}</span>` : ''}
      <span class="filter-indicator__name">${safeName}</span>
    </span>
    <button class="filter-indicator__clear" aria-label="Clear filter">&times;</button>
  `;

  // Add close handler
  const closeBtn = indicator.querySelector('.filter-indicator__clear');
  closeBtn.addEventListener('click', () => {
    deselectType();
  });
}

/**
 * Update stats for legend items
 * @param {Object} newStats - Stats by climate type
 */
export function updateStats(newStats) {
  stats = newStats;

  // Update count displays
  Object.entries(stats).forEach(([type, count]) => {
    const item = legendElement?.querySelector(`[data-type="${type}"]`);
    if (item) {
      let countEl = item.querySelector('.legend__count');
      if (!countEl) {
        countEl = document.createElement('span');
        countEl.className = 'legend__count';
        item.appendChild(countEl);
      }
      countEl.textContent = count.toLocaleString();
    }
  });
}

/**
 * Get selected type
 * @returns {string|null}
 */
export function getSelectedType() {
  return selectedType;
}

/**
 * Clear selection
 */
export function clearSelection() {
  deselectType();
}

/**
 * Destroy the legend
 */
export function destroy() {
  if (legendElement) {
    legendElement.innerHTML = '';
    legendElement = null;
  }
  selectedType = null;
  isCollapsed = false;
  stats = {};

  // Clear custom mode state
  isCustomMode = false;
  customCategories = [];
  customStats = {};
  expandedParents.clear();

  // Remove filter indicator
  const indicator = document.querySelector('.filter-indicator');
  if (indicator) indicator.remove();
}

export default {
  createLegend,
  selectType,
  deselectType,
  getSelectedType,
  clearSelection,
  updateStats,
  destroy,
};
