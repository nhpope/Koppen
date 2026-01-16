/**
 * Logger utility - conditional logging based on environment
 * @module utils/logger
 */

/* eslint-disable no-console --
 * This is the centralized logger module that wraps console methods.
 * Direct console usage here is intentional and necessary.
 */

const IS_DEVELOPMENT = import.meta.env.DEV;

/**
 * Log messages (only in development)
 * @param  {...any} args - Arguments to log
 */
export function log(...args) {
  if (IS_DEVELOPMENT) {
    console.log(...args);
  }
}

/**
 * Log warnings (always shown)
 * @param  {...any} args - Arguments to log
 */
export function warn(...args) {
  console.warn(...args);
}

/**
 * Log errors (always shown)
 * @param  {...any} args - Arguments to log
 */
export function error(...args) {
  console.error(...args);
}

export default {
  log,
  warn,
  error,
};
