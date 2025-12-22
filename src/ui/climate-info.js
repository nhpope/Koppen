/**
 * Climate Info Panel Component
 * Shows detailed information about a selected climate type
 * Includes classification rules, glossary terms, and example locations
 */

import { CLIMATE_TYPES } from '../climate/koppen-rules.js';
import { getClimateColor } from '../utils/colors.js';
import { EXAMPLE_LOCATIONS } from '../climate/presets.js';
import { GLOSSARY } from '../climate/glossary.js';
import { initExpandableTerms } from './expandable-term.js';

let panelElement = null;
let isOpen = false;
let currentType = null;
let focusTrapHandler = null;
let clickOutsideHandler = null;

/**
 * Create the climate info panel
 * @param {HTMLElement} container - Container element
 * @returns {Object} Panel controller
 */
export function createClimateInfo(container) {
  if (!container) {
    container = document.getElementById('info-panel');
  }
  if (!container) return null;

  panelElement = container;

  // Set ARIA attributes
  panelElement.setAttribute('role', 'dialog');
  panelElement.setAttribute('aria-labelledby', 'climate-info-title');
  panelElement.setAttribute('aria-modal', 'true');

  // Set up event listeners
  setupEventListeners();

  console.log('[Koppen] Climate info panel created');

  return {
    show: showClimateInfo,
    hide,
    isOpen: () => isOpen,
    getCurrentType: () => currentType,
    destroy,
  };
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Listen for cell selection
  document.addEventListener('koppen:cell-selected', (e) => {
    if (e.detail.type) {
      showClimateInfo(e.detail);
    }
  });

  // Listen for climate selection from legend
  document.addEventListener('koppen:climate-selected', (e) => {
    if (e.detail.type) {
      showClimateInfo(e.detail.type);
    }
  });

  // Close panel events
  document.addEventListener('koppen:close-panels', hide);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      hide();
    }
  });
}

/**
 * Show climate info for a type
 * @param {Object|string} data - Climate data object or type code
 */
export function showClimateInfo(data) {
  if (!panelElement) return;

  const type = typeof data === 'string' ? data : data.type;
  const info = CLIMATE_TYPES[type];

  if (!info) {
    console.warn(`[Koppen] Unknown climate type: ${type}`);
    return;
  }

  currentType = type;
  const color = getClimateColor(type);
  const examples = EXAMPLE_LOCATIONS[type] || [];

  panelElement.innerHTML = `
    <div class="info-panel__header">
      <div class="info-panel__title-row">
        <span class="info-panel__color" style="background-color: ${color}"></span>
        <div class="info-panel__title" id="climate-info-title">
          <span class="info-panel__code">${type}</span>
          <span class="info-panel__name">${info.name}</span>
        </div>
      </div>
      <button class="info-panel__close" aria-label="Close panel">&times;</button>
    </div>
    <div class="info-panel__content">
      <section class="info-panel__section">
        <p class="info-panel__description">${info.description}</p>
      </section>

      <section class="info-panel__section">
        <h4 class="info-panel__label">Classification Path</h4>
        <p class="info-panel__path">${formatDecisionPath(info.path || [])}</p>
      </section>

      ${info.rules && info.rules.length > 0 ? `
        <section class="info-panel__section">
          <h4 class="info-panel__label">Classification Rules</h4>
          <ul class="info-panel__rules">
            ${info.rules.map(rule => `
              <li class="info-panel__rule">
                ${formatRule(rule)}
              </li>
            `).join('')}
          </ul>
        </section>
      ` : ''}

      <section class="info-panel__section">
        <h4 class="info-panel__label">Climate Group</h4>
        <p class="info-panel__value">
          <strong>${info.group}</strong> - ${getGroupName(info.group)}
        </p>
        <p class="info-panel__hint">${getGroupDescription(info.group)}</p>
      </section>

      ${typeof data === 'object' && data.lat !== undefined ? `
        <section class="info-panel__section">
          <h4 class="info-panel__label">Selected Location</h4>
          <p class="info-panel__value">
            ${formatCoordinate(data.lat, 'lat')}, ${formatCoordinate(data.lon || data.lng, 'lon')}
          </p>
        </section>
      ` : ''}

      ${examples.length > 0 ? `
        <section class="info-panel__section">
          <h4 class="info-panel__label">Also Found In</h4>
          <ul class="info-panel__locations">
            ${examples.map(loc => `
              <li class="info-panel__location"
                  data-lat="${loc.lat}"
                  data-lng="${loc.lng}"
                  tabindex="0"
                  role="button"
                  aria-label="Navigate to ${loc.name}">
                <span class="info-panel__location-name">${loc.name}</span>
                <span class="info-panel__location-arrow">&rarr;</span>
              </li>
            `).join('')}
          </ul>
        </section>
      ` : ''}
    </div>
  `;

  // Show panel
  panelElement.classList.add('info-panel--open');
  isOpen = true;

  // Set up interactions
  setupPanelInteractions();

  // Initialize expandable terms
  initExpandableTerms(panelElement);

  // Set up focus trap and click outside
  setupFocusTrap();
  setupClickOutside();

  // Focus the close button for accessibility
  const closeBtn = panelElement.querySelector('.info-panel__close');
  if (closeBtn) {
    closeBtn.focus();
  }

  console.log(`[Koppen] Climate info shown: ${type}`);
}

/**
 * Set up panel interactions
 */
function setupPanelInteractions() {
  // Close button
  const closeBtn = panelElement.querySelector('.info-panel__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', hide);
  }

  // Location click handlers
  panelElement.querySelectorAll('.info-panel__location').forEach(loc => {
    const handleClick = () => {
      const lat = parseFloat(loc.dataset.lat);
      const lng = parseFloat(loc.dataset.lng);

      document.dispatchEvent(new CustomEvent('koppen:navigate-to', {
        detail: { lat, lng, zoom: 6 },
      }));
    };

    loc.addEventListener('click', handleClick);
    loc.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    });
  });
}

/**
 * Set up focus trap within the panel
 */
function setupFocusTrap() {
  if (focusTrapHandler) {
    document.removeEventListener('keydown', focusTrapHandler);
  }

  focusTrapHandler = (e) => {
    if (!isOpen || e.key !== 'Tab') return;

    const focusableElements = panelElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  document.addEventListener('keydown', focusTrapHandler);
}

/**
 * Set up click outside to close
 */
function setupClickOutside() {
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler);
  }

  // Delay to avoid immediate close
  setTimeout(() => {
    clickOutsideHandler = (e) => {
      if (!isOpen) return;
      if (!panelElement.contains(e.target)) {
        // Check if clicking on legend or map (don't close for those)
        const isLegendClick = e.target.closest('.legend');
        const isMapClick = e.target.closest('.leaflet-container');
        if (!isLegendClick && !isMapClick) {
          hide();
        }
      }
    };

    document.addEventListener('click', clickOutsideHandler);
  }, 100);
}

/**
 * Hide the info panel
 */
function hide() {
  if (!panelElement) return;

  panelElement.classList.remove('info-panel--open');
  isOpen = false;
  currentType = null;

  // Clean up handlers
  if (focusTrapHandler) {
    document.removeEventListener('keydown', focusTrapHandler);
    focusTrapHandler = null;
  }
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler);
    clickOutsideHandler = null;
  }

  // Announce to screen readers
  panelElement.setAttribute('aria-hidden', 'true');
}

/**
 * Format decision path for display
 * @param {string[]} path - Decision tree path array
 * @returns {string} Formatted path HTML
 */
function formatDecisionPath(path) {
  if (!path || path.length === 0) {
    return '<span class="info-panel__path-step">—</span>';
  }

  return path.map((step, index) => {
    const isLast = index === path.length - 1;
    return `<span class="info-panel__path-step${isLast ? ' info-panel__path-step--final' : ''}">${step}</span>`;
  }).join('<span class="info-panel__path-arrow">→</span>');
}

/**
 * Format a classification rule for display
 * @param {Object} rule - Rule object
 * @returns {string} Formatted rule HTML
 */
function formatRule(rule) {
  const termHTML = GLOSSARY[rule.term]
    ? `<button class="expandable-term" aria-expanded="false" data-term="${rule.term}" type="button">
         <span class="expandable-term__text">${rule.param}</span>
       </button>`
    : `<span class="rule-param">${rule.param}</span>`;

  const valueDisplay = typeof rule.value === 'number'
    ? `<span class="rule-value">${rule.value}${rule.unit}</span>`
    : `<span class="rule-value">${rule.value}</span>`;

  return `${termHTML} ${rule.operator} ${valueDisplay}`;
}

/**
 * Get group name
 */
function getGroupName(group) {
  const names = {
    A: 'Tropical',
    B: 'Arid',
    C: 'Temperate',
    D: 'Continental',
    E: 'Polar',
  };
  return names[group] || group;
}

/**
 * Get group description
 */
function getGroupDescription(group) {
  const descriptions = {
    A: 'Coldest month average ≥ 18°C',
    B: 'Annual precipitation below calculated threshold',
    C: 'Coldest month between 0°C and 18°C',
    D: 'Coldest month ≤ 0°C, warmest month ≥ 10°C',
    E: 'Warmest month < 10°C',
  };
  return descriptions[group] || '';
}

/**
 * Format coordinate for display
 */
function formatCoordinate(value, type) {
  if (value === undefined || value === null) return '';
  const absValue = Math.abs(value).toFixed(2);
  if (type === 'lat') {
    return `${absValue}°${value >= 0 ? 'N' : 'S'}`;
  } 
    return `${absValue}°${value >= 0 ? 'E' : 'W'}`;
  
}

/**
 * Destroy the panel
 */
function destroy() {
  if (focusTrapHandler) {
    document.removeEventListener('keydown', focusTrapHandler);
  }
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler);
  }
  if (panelElement) {
    panelElement.innerHTML = '';
  }
  panelElement = null;
  isOpen = false;
  currentType = null;
}

export default {
  createClimateInfo,
  showClimateInfo,
  hide,
  destroy,
};
