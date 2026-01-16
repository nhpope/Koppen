/**
 * Tooltip Component
 * Shows climate info on hover (desktop) or long-press (mobile)
 */

/* eslint-disable security/detect-object-injection --
 * This file accesses CLIMATE_TYPES using climate code keys from map data.
 * Keys are not user-controlled; they come from validated climate classification codes.
 * See docs/orchestration/checkpoints/security-review.md for full analysis.
 */

import { CLIMATE_TYPES } from '../climate/koppen-rules.js';
import { getClimateColor } from '../utils/colors.js';
import logger from '../utils/logger.js';

let tooltipElement = null;
let isVisible = false;
let isMobile = false;
let longPressTimer = null;
let currentData = null;

const LONG_PRESS_DURATION = 500; // ms

/**
 * Create the tooltip component
 */
export function createTooltip() {
  // Check if mobile/touch device
  isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Create tooltip element
  tooltipElement = document.createElement('div');
  tooltipElement.className = 'tooltip';
  tooltipElement.setAttribute('role', 'tooltip');
  tooltipElement.setAttribute('aria-hidden', 'true');
  tooltipElement.style.pointerEvents = 'none'; // Prevent blocking clicks
  document.body.appendChild(tooltipElement);

  // Set up event listeners
  setupEventListeners();

  logger.log('[Koppen] Tooltip created' + (isMobile ? ' (touch mode)' : ' (mouse mode)'));
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Listen for hover events from climate layer
  document.addEventListener('koppen:feature-hover', (e) => {
    if (isMobile) return; // Use long-press on mobile instead
    currentData = e.detail;
    show(e.detail);
  });

  document.addEventListener('koppen:feature-leave', () => {
    if (!isMobile) {
      hide();
      currentData = null;
    }
  });

  // Track mouse position while visible (desktop)
  document.addEventListener('mousemove', (e) => {
    if (isVisible && !isMobile) {
      updatePosition(e.clientX, e.clientY);
    }
  });

  // Hide on scroll
  document.addEventListener('scroll', () => {
    hide();
  }, true);

  // Long-press support for mobile
  if (isMobile) {
    setupLongPress();
  }
}

/**
 * Set up long-press detection for mobile
 */
function setupLongPress() {
  const mapContainer = document.getElementById('map-container');
  if (!mapContainer) {
    // Retry after map is ready
    document.addEventListener('koppen:map-ready', () => {
      setupLongPressOnMap();
    });
    return;
  }

  setupLongPressOnMap();
}

/**
 * Attach long-press handlers to the map
 */
function setupLongPressOnMap() {
  const mapContainer = document.getElementById('map-container');
  if (!mapContainer) return;

  let touchStartX = 0;
  let touchStartY = 0;

  mapContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    longPressTimer = setTimeout(() => {
      // Get feature data at this position if available
      if (currentData) {
        showAtPosition(currentData, touchStartX, touchStartY);
      }
    }, LONG_PRESS_DURATION);
  }, { passive: true });

  mapContainer.addEventListener('touchmove', (e) => {
    if (!longPressTimer) return;

    // Cancel if moved more than 10 pixels
    const touch = e.touches[0];
    const moveX = Math.abs(touch.clientX - touchStartX);
    const moveY = Math.abs(touch.clientY - touchStartY);

    if (moveX > 10 || moveY > 10) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }, { passive: true });

  mapContainer.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
    longPressTimer = null;

    // Hide tooltip after a delay on mobile
    if (isVisible) {
      setTimeout(() => {
        hide();
      }, 2000);
    }
  }, { passive: true });

  mapContainer.addEventListener('touchcancel', () => {
    clearTimeout(longPressTimer);
    longPressTimer = null;
    hide();
  }, { passive: true });

  // Store current feature data on hover (for long-press to use)
  document.addEventListener('koppen:feature-hover', (e) => {
    if (isMobile) {
      currentData = e.detail;
    }
  });

  document.addEventListener('koppen:feature-leave', () => {
    if (isMobile) {
      // Don't clear immediately on mobile - keep for long-press
      setTimeout(() => {
        if (!isVisible) {
          currentData = null;
        }
      }, 100);
    }
  });
}

/**
 * Show the tooltip
 * @param {Object} data - Tooltip data
 */
function show(data) {
  if (!tooltipElement || !data) return;

  const { type, name, lat, lon } = data;
  const info = CLIMATE_TYPES[type] || { name: name || 'Unknown' };
  const color = getClimateColor(type);

  // Build tooltip content
  tooltipElement.innerHTML = `
    <div class="tooltip__header">
      <span class="tooltip__color" style="background-color: ${color}"></span>
      <span class="tooltip__code">${type}</span>
      <span class="tooltip__name">${info.name}</span>
    </div>
    ${lat !== undefined && lon !== undefined ? `
      <div class="tooltip__coords">
        ${formatCoordinate(lat, 'lat')}, ${formatCoordinate(lon, 'lon')}
      </div>
    ` : ''}
  `;

  // Show tooltip
  tooltipElement.classList.add('tooltip--visible');
  tooltipElement.setAttribute('aria-hidden', 'false');
  isVisible = true;
}

/**
 * Show tooltip at a specific position (for mobile long-press)
 * @param {Object} data - Tooltip data
 * @param {number} x - X position
 * @param {number} y - Y position
 */
function showAtPosition(data, x, y) {
  show(data);
  updatePosition(x, y);
}

/**
 * Hide the tooltip
 */
function hide() {
  if (!tooltipElement) return;

  tooltipElement.classList.remove('tooltip--visible');
  tooltipElement.setAttribute('aria-hidden', 'true');
  isVisible = false;
}

/**
 * Update tooltip position
 * @param {number} x - X position
 * @param {number} y - Y position
 */
function updatePosition(x, y) {
  if (!tooltipElement) return;

  const padding = 12;
  const rect = tooltipElement.getBoundingClientRect();

  // Calculate position, keeping tooltip within viewport
  let left = x + padding;
  let top = y + padding;

  // Check right edge
  if (left + rect.width > window.innerWidth) {
    left = x - rect.width - padding;
  }

  // Check bottom edge
  if (top + rect.height > window.innerHeight) {
    top = y - rect.height - padding;
  }

  // Ensure not negative
  left = Math.max(padding, left);
  top = Math.max(padding, top);

  // Apply position
  tooltipElement.style.left = `${left}px`;
  tooltipElement.style.top = `${top}px`;
}

/**
 * Format a coordinate for display
 * @param {number} value - Coordinate value
 * @param {string} type - 'lat' or 'lon'
 * @returns {string} Formatted coordinate
 */
function formatCoordinate(value, type) {
  const absValue = Math.abs(value).toFixed(2);
  if (type === 'lat') {
    return `${absValue}°${value >= 0 ? 'N' : 'S'}`;
  } 
    return `${absValue}°${value >= 0 ? 'E' : 'W'}`;
  
}

/**
 * Check if tooltip is currently visible
 * @returns {boolean}
 */
export function isTooltipVisible() {
  return isVisible;
}

/**
 * Check if device is touch-enabled
 * @returns {boolean}
 */
export function isTouchDevice() {
  return isMobile;
}

/**
 * Destroy the tooltip
 */
export function destroy() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  if (tooltipElement) {
    tooltipElement.remove();
    tooltipElement = null;
  }
  isVisible = false;
  currentData = null;
}

export default {
  createTooltip,
  show,
  hide,
  isTooltipVisible,
  isTouchDevice,
  destroy,
};
