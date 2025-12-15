// Settings utility for Stats for Strava Config Tool
// Uses localStorage to persist settings since we're in a browser environment

const SETTINGS_KEY = process.env.NEXT_PUBLIC_SETTINGS_STORAGE_KEY || 'stats-for-strava-settings';
const DEFAULT_SETTINGS_PATH = process.env.NEXT_PUBLIC_DEFAULT_STATS_CONFIG_PATH || '~/Documents/strava-config-tool/';

// Default settings structure
const DEFAULT_SETTINGS = {
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  ui: {
    theme: 'dark', // 'light' or 'dark'
    sidebarCollapsed: false,
    autoSave: true,
    showLineNumbers: true,
  },
  files: {
    defaultPath: DEFAULT_SETTINGS_PATH,
    autoBackup: true,
    maxRecentFiles: 10,
    validateOnLoad: true,
  },
  editor: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    highlightSearch: true,
  },
  performance: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    searchTimeout: 500, // ms
    autoSaveInterval: 30000, // 30 seconds
  }
};

/**
 * Load settings from localStorage
 * @returns {Object} Settings object
 */
export const loadSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all settings exist
      return mergeSettings(DEFAULT_SETTINGS, parsed);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  
  // Return defaults if loading fails or no settings exist
  return { ...DEFAULT_SETTINGS };
};

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings object to save
 */
export const saveSettings = (settings) => {
  try {
    // Validate settings structure
    const validatedSettings = mergeSettings(DEFAULT_SETTINGS, settings);
    
    // Add timestamp
    validatedSettings.lastUpdated = new Date().toISOString();
    
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(validatedSettings, null, 2));
    
    // Dispatch custom event for settings change
    window.dispatchEvent(new CustomEvent('settingsChanged', { 
      detail: validatedSettings 
    }));
    
    return true;
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
    
    return { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Get a specific setting by path (e.g., 'ui.theme' or 'files.maxRecentFiles')
 * @param {string} path - Dot-separated path to setting
 * @param {*} defaultValue - Default value if setting not found
 * @returns {*} Setting value
 */
export const getSetting = (path, defaultValue = null) => {
  const settings = loadSettings();
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
 * @returns {string} YAML formatted settings
 */
export const exportSettingsAsYaml = () => {
  const settings = loadSettings();
  
  // Simple YAML serialization (basic implementation)
  const yamlify = (obj, indent = 0) => {
    const spaces = '  '.repeat(indent);
    let yaml = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === 'boolean') {
        yaml += `${spaces}${key}: ${value}\n`;
      } else if (typeof value === 'number') {
        yaml += `${spaces}${key}: ${value}\n`;
      } else if (typeof value === 'string') {
        yaml += `${spaces}${key}: "${value}"\n`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          yaml += `${spaces}  - ${typeof item === 'string' ? `"${item}"` : item}\n`;
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

export { DEFAULT_SETTINGS, SETTINGS_KEY };