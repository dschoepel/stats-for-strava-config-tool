/**
 * Custom event utility for config save notifications
 * Provides a decoupled way to broadcast config save events across the application
 */

export const CONFIG_SAVE_EVENT = 'config:saved';

/**
 * Emit a config save event
 * This event signals that a configuration has been successfully saved
 */
export const emitConfigSaveEvent = () => {
  if (typeof window === 'undefined') return;
  
  const event = new CustomEvent(CONFIG_SAVE_EVENT, {
    detail: { timestamp: Date.now() }
  });
  
  window.dispatchEvent(event);
};

/**
 * Listen for config save events
 * @param {Function} callback - Function to call when config is saved
 * @returns {Function} Cleanup function to remove listener
 */
export const onConfigSave = (callback) => {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (event) => {
    callback(event.detail);
  };
  
  window.addEventListener(CONFIG_SAVE_EVENT, handler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener(CONFIG_SAVE_EVENT, handler);
  };
};
