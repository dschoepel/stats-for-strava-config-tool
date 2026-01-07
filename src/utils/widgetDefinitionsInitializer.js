/**
 * Widget Definitions Initializer
 * Initializes widget definitions on app startup and syncs with config file
 */

import { 
  readWidgetDefinitions, 
  writeWidgetDefinitions, 
  initialWidgetDefinitions 
} from './widgetDefinitionsManager.js';
import { getSetting } from './settingsManager.js';

/**
 * Get the full path to the widget definitions file
 * @returns {string} Full path to widget definitions file
 */
function getWidgetDefinitionsPath() {
  const defaultPath = getSetting('files.defaultPath', '~/Documents/strava-config-tool/');
  const normalizedPath = defaultPath.endsWith('/') || defaultPath.endsWith('\\') 
    ? defaultPath 
    : defaultPath + '/';
  return normalizedPath + 'settings/widget-definitions.yaml';
}

/**
 * Check if widget definitions file exists
 * @returns {Promise<boolean>} True if file exists
 */
async function widgetDefinitionsFileExists() {
  try {
    const filePath = getWidgetDefinitionsPath();
    const response = await fetch(`/api/file-content?path=${encodeURIComponent(filePath)}`);
    const result = await response.json();
    return result.success;
  } catch (error) {
    return false;
  }
}

/**
 * Create widget definitions file with defaults
 * @returns {Promise<boolean>} Success status
 */
async function createDefaultWidgetDefinitions() {
  try {
    console.log('Creating default widget definitions file...');
    await writeWidgetDefinitions(initialWidgetDefinitions);
    console.log('✅ Default widget definitions created');
    return true;
  } catch (error) {
    console.error('Error creating default widget definitions:', error);
    return false;
  }
}

/**
 * Read the config file to find dashboard widgets
 * @param {string} configFilePath - Path to the config file
 * @returns {Promise<Array>} Array of widget instances from dashboard.layout
 */
async function readDashboardWidgetsFromConfig(configFilePath) {
  try {
    const response = await fetch(`/api/file-content?path=${encodeURIComponent(configFilePath)}`);
    const result = await response.json();
    
    if (!result.success || !result.content) {
      return [];
    }
    
    // Parse YAML content to find dashboard.layout
    const content = result.content;
    const lines = content.split('\n');
    const widgets = [];
    
    let inDashboard = false;
    let inLayout = false;
    let currentWidget = null;
    let inConfig = false;
    let configIndent = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') {
        continue;
      }
      
      // Check for dashboard section
      if (line.match(/^dashboard:/)) {
        inDashboard = true;
        continue;
      }
      
      // Check for layout section under dashboard
      if (inDashboard && line.match(/^\s{2}layout:/)) {
        inLayout = true;
        continue;
      }
      
      // Exit dashboard section if we hit another top-level key
      if (line.match(/^[a-zA-Z]/) && !line.match(/^dashboard:/)) {
        inDashboard = false;
        inLayout = false;
      }
      
      if (!inLayout) continue;
      
      // Check for widget list item (- widget: widgetName)
      const widgetMatch = line.match(/^\s{4}- widget:\s*(\S+)/);
      if (widgetMatch) {
        // Save previous widget
        if (currentWidget) {
          widgets.push(currentWidget);
        }
        
        // Start new widget
        currentWidget = {
          widget: widgetMatch[1],
          config: {}
        };
        inConfig = false;
        continue;
      }
      
      if (!currentWidget) continue;
      
      // Check for config section
      if (line.match(/^\s{6}config:/)) {
        inConfig = true;
        configIndent = 8; // Config values should be at 8 spaces
        continue;
      }
      
      // Parse config values
      if (inConfig && line.startsWith(' '.repeat(configIndent))) {
        const configMatch = line.trim().match(/^([^:]+):\s*(.+)$/);
        if (configMatch) {
          const [, key, value] = configMatch;
          // Parse value
          let parsedValue;
          if (value === 'true') {
            parsedValue = true;
          } else if (value === 'false') {
            parsedValue = false;
          } else if (!isNaN(value)) {
            parsedValue = Number(value);
          } else {
            parsedValue = value;
          }
          currentWidget.config[key] = parsedValue;
        }
        continue;
      }
      
      // If we hit a line at widget level (6 spaces) that's not config, we're done with config
      if (line.startsWith('      ') && !line.startsWith('        ')) {
        inConfig = false;
      }
    }
    
    // Save last widget
    if (currentWidget) {
      widgets.push(currentWidget);
    }
    
    console.log(`Found ${widgets.length} widgets in config file dashboard.layout`);
    return widgets;
    
  } catch (error) {
    console.error('Error reading dashboard widgets from config:', error);
    return [];
  }
}

/**
 * Sync widget definitions with config file widgets
 * Updates defaultConfig in widget definitions based on widget instances in config
 * @param {Array} configWidgets - Widget instances from config file
 * @returns {Promise<boolean>} Success status
 */
async function syncWidgetDefinitionsWithConfig(configWidgets) {
  try {
    if (!configWidgets || configWidgets.length === 0) {
      console.log('No widgets found in config file to sync');
      return false;
    }
    
    // Read current widget definitions
    const definitions = await readWidgetDefinitions();
    let hasChanges = false;
    
    // Update definitions based on config widgets
    for (const configWidget of configWidgets) {
      const widgetDef = definitions[configWidget.widget];
      
      if (!widgetDef) {
        console.warn(`Widget ${configWidget.widget} found in config but not in definitions`);
        continue;
      }
      
      // Only update if widget has config and there are config values
      if (widgetDef.hasConfig && Object.keys(configWidget.config).length > 0) {
        // Update defaultConfig with values from config file
        widgetDef.defaultConfig = {
          ...widgetDef.defaultConfig,
          ...configWidget.config
        };
        hasChanges = true;
        console.log(`Updated defaultConfig for ${configWidget.widget}:`, widgetDef.defaultConfig);
      }
    }
    
    // Save updated definitions if there were changes
    if (hasChanges) {
      await writeWidgetDefinitions(definitions);
      console.log('✅ Widget definitions synced with config file');
      return true;
    } else {
      console.log('No changes needed to widget definitions');
      return false;
    }
    
  } catch (error) {
    console.error('Error syncing widget definitions:', error);
    return false;
  }
}

/**
 * Find the config file that contains appearance configuration
 * @param {Map} sectionToFileMap - Map of section names to file paths
 * @returns {string|null} Path to config file with appearance section, or null
 */
function findAppearanceConfigFile(sectionToFileMap) {
  // Look for appearance section in the map
  for (const [section, fileInfo] of sectionToFileMap.entries()) {
    if (section.toLowerCase() === 'appearance') {
      console.log('Found appearance section, fileInfo:', fileInfo);
      
      // The fileInfo should be an object with filePath property from parse-sections API
      if (typeof fileInfo === 'string') {
        return fileInfo;
      } else if (fileInfo && typeof fileInfo === 'object') {
        // Use filePath property from the detailed mapping
        const pathToUse = fileInfo.filePath || fileInfo.path || fileInfo.file || fileInfo.fileName;
        console.log('Extracted path:', pathToUse);
        return pathToUse;
      }
      console.warn('Could not extract path from fileInfo:', fileInfo);
    }
  }
  return null;
}

/**
 * Initialize widget definitions on app startup
 * 1. Create widget-definitions.yaml if it doesn't exist
 * 2. Read dashboard widgets from config file
 * 3. Sync widget definitions with config widgets
 * 
 * @param {Map} sectionToFileMap - Map of section names to file paths
 * @returns {Promise<Object>} Result with status and message
 */
export async function initializeWidgetDefinitions(sectionToFileMap) {
  try {
    console.log('🔄 Initializing widget definitions...');
    
    // Step 1: Check if widget definitions file exists
    const fileExists = await widgetDefinitionsFileExists();
    
    if (!fileExists) {
      console.log('Widget definitions file not found, creating with defaults...');
      const created = await createDefaultWidgetDefinitions();
      if (!created) {
        return {
          success: false,
          message: 'Failed to create widget definitions file'
        };
      }
    } else {
      console.log('Widget definitions file found');
    }
    
    // Step 2: Find the config file with appearance section
    if (!sectionToFileMap || sectionToFileMap.size === 0) {
      console.log('No config files loaded yet, skipping sync');
      return {
        success: true,
        message: 'Widget definitions initialized (no config to sync)'
      };
    }
    
    const configFilePath = findAppearanceConfigFile(sectionToFileMap);
    if (!configFilePath) {
      console.log('No appearance config file found, skipping sync');
      return {
        success: true,
        message: 'Widget definitions initialized (no appearance config found)'
      };
    }
    
    console.log(`Found appearance config in: ${configFilePath}`);
    
    // Step 3: Read dashboard widgets from config file
    const configWidgets = await readDashboardWidgetsFromConfig(configFilePath);
    
    // Step 4: Sync widget definitions with config
    if (configWidgets.length > 0) {
      await syncWidgetDefinitionsWithConfig(configWidgets);
    }
    
    return {
      success: true,
      message: 'Widget definitions initialized and synced'
    };
    
  } catch (error) {
    console.error('Error initializing widget definitions:', error);
    return {
      success: false,
      message: error.message
    };
  }
}
