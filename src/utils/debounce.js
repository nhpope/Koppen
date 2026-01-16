/**
 * Debounce and Throttle Utilities - Story 6.7
 * Performance optimization for high-frequency events
 * @module utils/debounce
 */

/**
 * Debounce function calls
 * Delays execution until after wait period has elapsed since last call
 * Perfect for: text input, window resize, map pan
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 *
 * @example
 * const debouncedUpdate = debounce(() => updateURL(), 500);
 * map.on('move', debouncedUpdate); // Only fires 500ms after movement stops
 */
export function debounce(func, wait = 300) {
  let timeout;

  return function debounced(...args) {
    const context = this;

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Throttle function calls
 * Ensures function executes at most once per time period
 * Perfect for: scroll events, mouse move, continuous monitoring
 *
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 *
 * @example
 * const throttledLog = throttle(() => logger.log('scroll'), 300);
 * window.addEventListener('scroll', throttledLog); // Fires max once per 300ms
 */
export function throttle(func, limit = 300) {
  let inThrottle;

  return function throttled(...args) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export default {
  debounce,
  throttle,
};
