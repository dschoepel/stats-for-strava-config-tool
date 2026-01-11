/**
 * Settings Service - Handles settings and runtime configuration operations
 * Provides a centralized API layer for settings-related operations
 */

import { readFile, saveFile } from './fileService.js';

/**
 * Base fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    // If response has explicit success field, return it regardless of HTTP status
    // This allows APIs to return { success: false } for business logic failures
    if ('success' in data) {
      return data;
    }

    // If no success field and HTTP error, throw
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Load runtime config from environment
 * @returns {Promise<{success: boolean, config: Object}>}
 */
export async function loadRuntimeConfig() {
  return fetchAPI('/api/runtime-config');
}

/**
 * Load settings from file
 * @param {string} filePath - Path to settings file
 * @returns {Promise<{success: boolean, content: string, path: string}>}
 */
export async function loadSettingsFromFile(filePath) {
  const result = await readFile(filePath);
  return result;
}

/**
 * Save settings to file (uses fileService internally)
 * @param {string} filePath - Path to settings file
 * @param {Object} settingsObj - Settings object to save
 * @returns {Promise<{success: boolean, path: string, message?: string}>}
 */
export async function saveSettingsToFile(filePath, settingsObj) {
  const yaml = await import('yaml');
  const yamlContent = yaml.stringify(settingsObj);
  return saveFile(filePath, yamlContent);
}

/**
 * Update environment variable
 * @param {string} key - Environment variable key
 * @param {string} value - Environment variable value
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function updateEnv(key, value) {
  return fetchAPI('/api/update-env', {
    method: 'POST',
    body: JSON.stringify({ key, value })
  });
}

/**
 * Load sports list
 * @param {string} defaultPath - Default path for sports list file
 * @returns {Promise<{success: boolean, sports: Array, path: string}>}
 */
export async function loadSportsList(defaultPath) {
  return fetchAPI(`/api/sports-list?defaultPath=${encodeURIComponent(defaultPath)}`);
}

/**
 * Save sports list
 * @param {string} filePath - Path to sports list file
 * @param {Array} sports - Array of sports objects
 * @returns {Promise<{success: boolean, path: string, message?: string}>}
 */
export async function saveSportsList(filePath, sports) {
  return fetchAPI('/api/sports-list', {
    method: 'POST',
    body: JSON.stringify({ filePath, sports })
  });
}

// ============================================================================
// localStorage Helper Functions (client-side only, no API calls)
// ============================================================================

/**
 * Get setting value from localStorage
 * @param {string} key - Dot-notation key (e.g., 'ui.theme')
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Setting value or default
 */
export function getSetting(key, defaultValue) {
  // This remains a local utility, doesn't need API call
  if (typeof window === 'undefined') return defaultValue;

  try {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    const keys = key.split('.');
    let value = settings;
    for (const k of keys) {
      value = value?.[k];
    }
    return value !== undefined ? value : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings object to save
 */
export function saveLocalSettings(settings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('settings', JSON.stringify(settings));
}

/**
 * Load settings from localStorage
 * @returns {Object} Settings object or empty object
 */
export function loadLocalSettings() {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(localStorage.getItem('settings') || '{}');
  } catch {
    return {};
  }
}
