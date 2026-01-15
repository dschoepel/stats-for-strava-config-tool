/**
 * Debug logging utility
 * 
 * Provides conditional logging based on the NEXT_PUBLIC_ENABLE_DEBUG_LOGS environment variable.
 * Set NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true in your .env file to enable verbose debug logging.
 */

/**
 * Check if debug logging is enabled
 * @returns {boolean} True if debug logging is enabled
 */
export const isDebugEnabled = () => {
  return process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === 'true';
};

/**
 * Conditionally log debug messages
 * Only logs if NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true
 * @param {...any} args - Arguments to pass to console.log
 */
export const debugLog = (...args) => {
  if (isDebugEnabled()) {
    console.log(...args);
  }
};

/**
 * Conditionally log debug warnings
 * Only logs if NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true
 * @param {...any} args - Arguments to pass to console.warn
 */
export const debugWarn = (...args) => {
  if (isDebugEnabled()) {
    console.warn(...args);
  }
};
