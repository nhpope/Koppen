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

  // Toggle button
  legendElement.addEventListener('click', (e) => {
    const toggle = e.target.closest('.legend__toggle');
    if (toggle) {
      toggleCollapse();
      return;
    }

    const item = e.target.closest('.legend__item');
    if (item) {
      handleItemClick(item.dataset.type);
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
}

/**
 * Handle legend item click
 * @param {string} type - Climate type code
 */
function handleItemClick(type) {
  if (selectedType === type) {
    deselectType();
  } else {
    selectType(type);
  }
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
 * Select a climate type
 * @param {string} type - Climate type code
 * @param {boolean} fromExternal - Whether selection came from outside legend
 */
export function selectType(type, fromExternal = false) {
  // Deselect previous
  if (selectedType) {
    const prevItem = legendElement.querySelector(`[data-type="${selectedType}"]`);
    if (prevItem) {
      prevItem.classList.remove('legend__item--active');
      prevItem.setAttribute('aria-selected', 'false');
    }
  }

  // Select new
  selectedType = type;
  const item = legendElement.querySelector(`[data-type="${type}"]`);
  if (item) {
    item.classList.add('legend__item--active');
    item.setAttribute('aria-selected', 'true');
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Update filter indicator
  updateFilterIndicator(type);

  // Dispatch event (only if selection initiated from legend)
  if (!fromExternal) {
    document.dispatchEvent(new CustomEvent('koppen:climate-selected', {
      detail: { type },
    }));
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

  const info = CLIMATE_TYPES[type] || { name: type };

  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'filter-indicator';

    const nav = document.querySelector('.header__nav');
    if (nav) {
      nav.parentNode.insertBefore(indicator, nav);
    }
  }

  // eslint-disable-next-line no-secrets/no-secrets
  indicator.innerHTML = `
    <span class="filter-indicator__label">Showing:</span>
    <span class="filter-indicator__type">
      <span class="filter-indicator__code">${type}</span>
      <span class="filter-indicator__name">${info.name}</span>
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
