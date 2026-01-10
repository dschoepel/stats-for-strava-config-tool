// Settings utility for Stats for Strava Config Tool
// Uses file-based storage in {defaultPath}/settings/config-tool-settings.yaml

import { readFile, saveFile, expandPath, loadRuntimeConfig as loadRuntimeConfigService } from '../services';
import packageJson from '../../package.json';
import { DEFAULT_CONFIG_PATH } from '../../app/api/config/defaults.js';

/* eslint-disable no-undef */
const SETTINGS_KEY = process.env.NEXT_PUBLIC_SETTINGS_STORAGE_KEY || 'stats-for-strava-settings';
// Default fallback path (updated by runtime config)
let DEFAULT_SETTINGS_PATH = DEFAULT_CONFIG_PATH;
const SETTINGS_FILENAME = 'config-tool-settings.yaml';

// Runtime config loaded from API endpoint (allows Docker env vars to work)
let runtimeConfigLoaded = false;
let runtimeConfigPromise = null;
let cachedSettings = null;

/**
 * Load runtime configuration from API endpoint
 * This allows environment variables to be read at runtime, not build time
 */
async function loadRuntimeConfig() {
  if (runtimeConfigLoaded) return;
  
  // Return existing promise if already loading
  if (runtimeConfigPromise) return runtimeConfigPromise;
  
  runtimeConfigPromise = (async () => {
    try {
      const data = await loadRuntimeConfigService();

      if (data.success && data.config.defaultPath) {
        DEFAULT_SETTINGS_PATH = data.config.defaultPath;
        console.log('Runtime config loaded, defaultPath:', DEFAULT_SETTINGS_PATH);
      }
    } catch (error) {
      console.warn('Failed to load runtime config, using defaults:', error);
    } finally {
      runtimeConfigLoaded = true;
    }
  })();
  
  return runtimeConfigPromise;
}

// Load runtime config immediately when module loads
if (typeof window !== 'undefined') {
  loadRuntimeConfig().then(() => {
    // Pre-load settings after runtime config is ready
    loadSettings();
  });
}

// Default settings structure (function to ensure runtime config is used)
const getDefaultSettings = () => ({
  version: packageJson.version,
  ui: {
    theme: 'dark', // 'light' or 'dark'
    sidebarCollapsed: false,
    autoSave: true,
    showLineNumbers: true,
  },
  files: {
    defaultPath: DEFAULT_SETTINGS_PATH,
    autoBackup: true,
    backupsDir: DEFAULT_SETTINGS_PATH, // Directory where backups folder will be created
    validateOnLoad: true,
    gearMaintenancePath: '/data/statistics-for-strava/storage/gear-maintenance', // Path for gear maintenance images
  },
  editor: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    highlightSearch: true,
  },
  validation: {
    maxZwiftLevel: 100, // Maximum Zwift level (can increase in future)
  }
});

// Maintain backwards compatibility
const DEFAULT_SETTINGS = getDefaultSettings();

/**
 * Get the settings file path
 * @param {string} defaultPath - Optional custom default path
 * @returns {string} Full path to settings file
 */
export const getSettingsFilePath = (defaultPath = null) => {
  const basePath = defaultPath || DEFAULT_SETTINGS_PATH;
  // Remove trailing slash/backslash if present and normalize to forward slashes
  const cleanPath = basePath.replace(/[\\/]+$/, '').replace(/\\/g, '/');
  return `${cleanPath}/settings/${SETTINGS_FILENAME}`;
};

/**
 * Load settings from file or localStorage (fallback)
 * @returns {Object} Settings object
 */
export const loadSettings = async () => {
  // Return cached settings if already loaded
  if (cachedSettings) return cachedSettings;
  
  // Load runtime config first
  await loadRuntimeConfig();
  
  // Check if we're in a browser environment (client-side)
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    cachedSettings = getDefaultSettings();
    return cachedSettings;
  }
  
  try {
    // Try localStorage first (acts as cache)
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all settings exist
      const merged = mergeSettings(getDefaultSettings(), parsed);
      
      // Update cached defaultPath if runtime config has a different value
      if (merged.files?.defaultPath !== DEFAULT_SETTINGS_PATH) {
        merged.files.defaultPath = DEFAULT_SETTINGS_PATH;
        // Update localStorage with corrected path
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged, null, 2));
        console.log('Updated cached settings with runtime config path:', DEFAULT_SETTINGS_PATH);
      }
      
      cachedSettings = merged;
      return merged;
    }
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
  }
  
  // Return defaults if loading fails or no settings exist
  cachedSettings = getDefaultSettings();
  return cachedSettings;
};

/**
 * Load settings from file
 * @returns {Promise<Object>} Settings object
 */
export const loadSettingsFromFile = async () => {
  // Load runtime config first to get correct default path
  await loadRuntimeConfig();
  
  try {
    // First get the default path from localStorage or defaults
    const currentSettings = await loadSettings();
    const defaultPath = currentSettings.files?.defaultPath || DEFAULT_SETTINGS_PATH;
    const filePath = getSettingsFilePath(defaultPath);
    
    const data = await readFile(filePath);

    if (!data.success) {
      console.log('Settings file not found, using defaults');
      return getDefaultSettings();
    }

    if (data.content) {
      // Parse YAML content
      const lines = data.content.split('\n');
      const settings = parseYamlSettings(lines);
      
      // Merge with defaults and save to localStorage cache
      const mergedSettings = mergeSettings(getDefaultSettings(), settings);
      
      // Check if version needs updating
      if (mergedSettings.version !== packageJson.version) {
        console.log(`Updating version from ${mergedSettings.version} to ${packageJson.version}`);
        mergedSettings.version = packageJson.version;
        mergedSettings.lastUpdated = new Date().toISOString();
        
        // Save updated version back to file
        await saveSettings(mergedSettings);
      } else {
        // Just cache in localStorage
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(mergedSettings, null, 2));
      }
      
      return mergedSettings;
    }
  } catch (error) {
    console.error('Error loading settings from file:', error);
  }
  
  return getDefaultSettings();
};

/**
 * Expand tilde in path via API
 * @param {string} inputPath - Path that may contain tilde
 * @returns {Promise<string>} Expanded path
 */
export const expandTildePath = async (inputPath) => {
  if (!inputPath || !inputPath.startsWith('~')) return inputPath;
  
  try {
    const data = await expandPath(inputPath);
    return data.success ? data.expandedPath : inputPath;
  } catch (error) {
    console.error('Failed to expand path:', error);
    return inputPath;
  }
};

/**
 * Save settings to file and localStorage
 * @param {Object} settings - Settings object to save
 * @returns {Promise<boolean>} Success status
 */
export const saveSettings = async (settings) => {
  try {
    // Validate settings structure
    const validatedSettings = mergeSettings(getDefaultSettings(), settings);
    
    // Always update version to current from package.json
    validatedSettings.version = packageJson.version;
    
    // Expand tilde in defaultPath if present
    if (validatedSettings.files?.defaultPath?.startsWith('~')) {
      validatedSettings.files.defaultPath = await expandTildePath(validatedSettings.files.defaultPath);
    }
    
    // Expand tilde in gearMaintenancePath if present
    if (validatedSettings.files?.gearMaintenancePath?.startsWith('~')) {
      validatedSettings.files.gearMaintenancePath = await expandTildePath(validatedSettings.files.gearMaintenancePath);
    }
    
    // Add timestamp
    validatedSettings.lastUpdated = new Date().toISOString();
    
    // Save to localStorage (cache)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(validatedSettings, null, 2));
    
    // Save to file
    const defaultPath = validatedSettings.files?.defaultPath || DEFAULT_SETTINGS_PATH;
    const filePath = getSettingsFilePath(defaultPath);
    const yamlContent = exportSettingsAsYaml(validatedSettings);

    const result = await saveFile(filePath, yamlContent);

    if (result.success) {
      // Dispatch custom event for settings change
      window.dispatchEvent(new CustomEvent('settingsChanged', { 
        detail: validatedSettings 
      }));
      
      return true;
    } else {
      console.error('Failed to save settings file:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

/**
 * Reset settings to defaults
 */
export const resetSettings = () => {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    
    // Dispatch reset event
    window.dispatchEvent(new CustomEvent('settingsReset'));
    
    return getDefaultSettings();
  } catch (error) {
    console.error('Error resetting settings:', error);
    return getDefaultSettings();
  }
};

/**
 * Get a specific setting by path (e.g., 'ui.theme' or 'files.maxRecentFiles')
 * @param {string} path - Dot-separated path to setting
 * @param {*} defaultValue - Default value if setting not found
 * @returns {*} Setting value
 */
/**
 * Get a specific setting by path (e.g., 'ui.theme' or 'files.maxRecentFiles')
 * @param {string} path - Dot-separated path to setting
 * @param {*} defaultValue - Default value if setting not found
 * @returns {*} Setting value
 */
export const getSetting = (path, defaultValue = null) => {
  // Use cached settings if available (loaded on module init)
  const settings = cachedSettings || getDefaultSettings();
  const keys = path.split('.');
  
  let current = settings;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }
  
  return current;
};

/**
 * Set a specific setting by path
 * @param {string} path - Dot-separated path to setting
 * @param {*} value - Value to set
 */
export const setSetting = (path, value) => {
  const settings = loadSettings();
  const keys = path.split('.');
  const lastKey = keys.pop();
  
  let current = settings;
  for (const key of keys) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
  return saveSettings(settings);
};

/**
 * Export settings as YAML string
 * @param {Object} settingsObj - Optional settings object, otherwise loads current settings
 * @returns {string} YAML formatted settings
 */
export const exportSettingsAsYaml = (settingsObj = null) => {
  const settings = settingsObj || loadSettings();
  
  // Simple YAML serialization (basic implementation)
  const yamlify = (obj, indent = 0) => {
    const spaces = '  '.repeat(indent);
    let yaml = '';
    
    // Helper to escape strings for YAML
    const escapeString = (str) => {
      return str
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/"/g, '\\"')     // Escape double quotes
        .replace(/\n/g, '\\n')    // Escape newlines
        .replace(/\r/g, '\\r')    // Escape carriage returns
        .replace(/\t/g, '\\t');   // Escape tabs
    };
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === 'boolean') {
        yaml += `${spaces}${key}: ${value}\n`;
      } else if (typeof value === 'number') {
        yaml += `${spaces}${key}: ${value}\n`;
      } else if (typeof value === 'string') {
        yaml += `${spaces}${key}: "${escapeString(value)}"\n`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          yaml += `${spaces}  - ${typeof item === 'string' ? `"${escapeString(item)}"` : item}\n`;
        });
      } else if (typeof value === 'object') {
        yaml += `${spaces}${key}:\n${yamlify(value, indent + 1)}`;
      }
    }
    
    return yaml;
  };
  
  return `# Stats for Strava Config Tool Settings\n# Generated on ${new Date().toISOString()}\n\n${yamlify(settings)}`;
};

/**
 * Parse YAML settings from lines
 * @param {Array<string>} lines - YAML lines
 * @returns {Object} Parsed settings
 */
const parseYamlSettings = (lines) => {
  const settings = {};
  let currentSection = settings;
  let sectionStack = [settings];
  let lastIndent = 0;
  
  // Helper to unescape strings from YAML
  const unescapeString = (str) => {
    return str
      .replace(/\\n/g, '\n')    // Unescape newlines
      .replace(/\\r/g, '\r')    // Unescape carriage returns
      .replace(/\\t/g, '\t')    // Unescape tabs
      .replace(/\\"/g, '"')     // Unescape double quotes
      .replace(/\\\\/g, '\\');  // Unescape backslashes (must be last)
  };
  
  for (const line of lines) {
    // Skip comments and empty lines
    if (!line.trim() || line.trim().startsWith('#')) continue;
    
    // Calculate indentation
    const indent = line.search(/\S/);
    const trimmed = line.trim();
    
    // Handle indent changes
    if (indent < lastIndent) {
      // Pop sections until we're at the right level
      const levelsToGo = Math.floor((lastIndent - indent) / 2);
      for (let i = 0; i < levelsToGo; i++) {
        sectionStack.pop();
      }
      currentSection = sectionStack[sectionStack.length - 1];
    }
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = trimmed.substring(0, colonIndex).trim();
    const valueStr = trimmed.substring(colonIndex + 1).trim();
    
    if (!valueStr || valueStr === '') {
      // It's a section header
      currentSection[key] = {};
      sectionStack.push(currentSection[key]);
      currentSection = currentSection[key];
    } else {
      // It's a key-value pair
      let parsedValue;
      if (valueStr === 'null') {
        parsedValue = null;
      } else if (valueStr === 'true') {
        parsedValue = true;
      } else if (valueStr === 'false') {
        parsedValue = false;
      } else if (!isNaN(valueStr) && !isNaN(parseFloat(valueStr))) {
        parsedValue = parseFloat(valueStr);
      } else {
        // Remove quotes and unescape
        const unquoted = valueStr.replace(/^"(.*)"$/, '$1');
        parsedValue = unescapeString(unquoted);
      }
      
      currentSection[key] = parsedValue;
    }
    
    lastIndent = indent;
  }
  
  return settings;
};

/**
 * Import settings from YAML string
 * @param {string} yamlContent - YAML content to import
 * @returns {boolean} Success status
 */
export const importSettingsFromYaml = (yamlContent) => {
  try {
    // Simple YAML parsing (basic implementation)
    // For production, consider using a proper YAML parser
    const lines = yamlContent.split('\n');
    const settings = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      
      // Basic value parsing
      let parsedValue;
      if (value === 'null' || value === '') {
        parsedValue = null;
      } else if (value === 'true') {
        parsedValue = true;
      } else if (value === 'false') {
        parsedValue = false;
      } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
        parsedValue = parseFloat(value);
      } else {
        parsedValue = value.replace(/^"(.*)"$/, '$1'); // Remove quotes
      }
      
      // Set in settings object (simplified - doesn't handle nested objects well)
      settings[key] = parsedValue;
    }
    
    return saveSettings(settings);
  } catch (error) {
    console.error('Error importing settings from YAML:', error);
    return false;
  }
};

/**
 * Merge two settings objects, with override taking precedence
 * @param {Object} defaults - Default settings
 * @param {Object} override - Override settings
 * @returns {Object} Merged settings
 */
const mergeSettings = (defaults, override) => {
  // Handle null/undefined override
  if (!override || typeof override !== 'object') {
    return { ...defaults };
  }
  
  const result = { ...defaults };
  
  for (const [key, value] of Object.entries(override)) {
    if (key in result && typeof result[key] === 'object' && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeSettings(result[key], value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

export { DEFAULT_SETTINGS, getDefaultSettings, SETTINGS_KEY };