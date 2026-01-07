/**
 * Widget Definitions Manager
 * Manages widget definitions stored in a file
 */

import { getSetting } from './settingsManager.js';
import * as YAML from 'yaml';

const WIDGET_DEFINITIONS_FILENAME = 'widget-definitions.yaml';

/**
 * Get the full path to the widget definitions file
 * @returns {string} Full path to widget definitions file
 */
function getWidgetDefinitionsPath() {
  const defaultPath = getSetting('files.defaultPath', '~/Documents/strava-config-tool/');
  // Ensure path ends with a separator
  const normalizedPath = defaultPath.endsWith('/') || defaultPath.endsWith('\\') 
    ? defaultPath 
    : defaultPath + '/';
  return normalizedPath + 'settings/' + WIDGET_DEFINITIONS_FILENAME;
}

/**
 * Convert widget definitions object to YAML string
 * @param {Object} definitions - Widget definitions object
 * @returns {string} YAML formatted string
 */
function toYAML(definitions) {
  let yaml = '# Widget Definitions for Stats for Strava\n';
  yaml += `# Generated on ${new Date().toISOString()}\n\n`;
  
  // Helper to serialize config values recursively
  const serializeValue = (value, indent) => {
    const spaces = '  '.repeat(indent);
    let result = '';
    
    if (typeof value === 'string') {
      result = `"${value}"\n`;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      result = `${value}\n`;
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        result = '[]\n';
      } else {
        result = '\n';
        value.forEach(item => {
          if (typeof item === 'string') {
            result += `${spaces}  - "${item}"\n`;
          } else {
            result += `${spaces}  - ${item}\n`;
          }
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      result = '\n';
      for (const [subKey, subValue] of Object.entries(value)) {
        result += `${spaces}  ${subKey}: `;
        result += serializeValue(subValue, indent + 1);
      }
    } else {
      result = 'null\n';
    }
    
    return result;
  };
  
  for (const [key, widget] of Object.entries(definitions)) {
    yaml += `${key}:\n`;
    yaml += `  name: "${widget.name}"\n`;
    yaml += `  displayName: "${widget.displayName}"\n`;
    
    // Handle multi-line descriptions by escaping newlines
    const description = widget.description || '';
    const escapedDescription = description.replace(/\n/g, '\\n').replace(/\r/g, '');
    yaml += `  description: "${escapedDescription}"\n`;
    
    yaml += `  allowMultiple: ${widget.allowMultiple}\n`;
    yaml += `  hasConfig: ${widget.hasConfig}\n`;
    
    if (widget.configTemplate) {
      yaml += `  configTemplate: |\n`;
      const lines = widget.configTemplate.split('\n');
      lines.forEach(line => {
        yaml += `    ${line}\n`;
      });
    }
    
    if (widget.defaultConfig && Object.keys(widget.defaultConfig).length > 0) {
      yaml += `  defaultConfig:\n`;
      for (const [configKey, configValue] of Object.entries(widget.defaultConfig)) {
        yaml += `    ${configKey}: `;
        yaml += serializeValue(configValue, 2);
      }
    }
    
    yaml += '\n';
  }
  
  return yaml;
}

/**
 * Parse YAML string to widget definitions object
 * Uses a simple approach that handles our widget definition structure
 * @param {string} yamlContent - YAML content
 * @returns {Object} Widget definitions object
 */
function fromYAML(yamlContent) {
  const definitions = {};
  const lines = yamlContent.split('\n');
  let currentWidget = null;
  let currentKey = null;
  let inConfigTemplate = false;
  let configTemplateLines = [];
  let inDefaultConfig = false;
  let defaultConfigLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') {
      continue;
    }
    
    // Check for widget name (no leading spaces)
    if (line.match(/^[a-zA-Z]/)) {
      // Save previous widget if exists
      if (currentWidget && currentKey) {
        if (inConfigTemplate && configTemplateLines.length > 0) {
          currentWidget.configTemplate = configTemplateLines.join('\n');
          console.log(`Set configTemplate for ${currentKey}:`, currentWidget.configTemplate);
        }
        if (inDefaultConfig && defaultConfigLines.length > 0) {
          // Parse the defaultConfig YAML block
          try {
            const configYaml = defaultConfigLines.join('\n');
            currentWidget.defaultConfig = YAML.parse(configYaml);
            console.log(`Set defaultConfig for ${currentKey}:`, currentWidget.defaultConfig);
          } catch (e) {
            console.warn('Failed to parse defaultConfig for', currentKey, e);
            currentWidget.defaultConfig = {};
          }
        }
        definitions[currentKey] = currentWidget;
      }
      
      // Start new widget
      currentKey = line.replace(':', '').trim();
      currentWidget = {};
      inConfigTemplate = false;
      inDefaultConfig = false;
      configTemplateLines = [];
      defaultConfigLines = [];
      continue;
    }
    
    // Parse widget properties (2 spaces indent)
    if (currentWidget && line.startsWith('  ') && !line.startsWith('    ')) {
      const match = line.trim().match(/^([^:]+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        
        if (key === 'configTemplate') {
          inConfigTemplate = true;
          inDefaultConfig = false;
          // Skip the | or |- indicator if present
          continue;
        }
        
        if (key === 'defaultConfig') {
          // Save configTemplate before switching to defaultConfig
          if (inConfigTemplate && configTemplateLines.length > 0) {
            currentWidget.configTemplate = configTemplateLines.join('\n');
            console.log(`Set configTemplate for ${currentKey}:`, currentWidget.configTemplate);
          }
          inDefaultConfig = true;
          inConfigTemplate = false;
          continue;
        }
        
        // If we hit any other property, save configTemplate/defaultConfig if needed
        if (inConfigTemplate && configTemplateLines.length > 0) {
          currentWidget.configTemplate = configTemplateLines.join('\n');
          console.log(`Set configTemplate for ${currentKey}:`, currentWidget.configTemplate);
          configTemplateLines = [];
        }
        if (inDefaultConfig && defaultConfigLines.length > 0) {
          try {
            const configYaml = defaultConfigLines.join('\n');
            currentWidget.defaultConfig = YAML.parse(configYaml);
            console.log(`Set defaultConfig for ${currentKey}:`, currentWidget.defaultConfig);
          } catch (e) {
            console.warn('Failed to parse defaultConfig for', currentKey, e);
          }
          defaultConfigLines = [];
        }
        
        inConfigTemplate = false;
        inDefaultConfig = false;
        
        // Parse value (skip if it's just | or |-)
        if (value === '|' || value === '|-' || value === '|+') {
          // This is a block scalar indicator, content comes on next lines
          continue;
        }
        
        if (value === 'true') {
          currentWidget[key] = true;
        } else if (value === 'false') {
          currentWidget[key] = false;
        } else if (value.startsWith('"') && value.endsWith('"')) {
          // Unescape newlines when reading descriptions
          const unescaped = value.slice(1, -1).replace(/\\n/g, '\n');
          currentWidget[key] = unescaped;
        } else {
          currentWidget[key] = value;
        }
      }
      continue;
    }
    
    // Parse config template content (4+ spaces indent)
    if (inConfigTemplate && line.startsWith('    ')) {
      configTemplateLines.push(line.substring(4));
      continue;
    }
    
    // Parse defaultConfig content (4+ spaces indent)
    if (inDefaultConfig && line.startsWith('    ')) {
      defaultConfigLines.push(line.substring(4));
      continue;
    }
  }
  
  // Save last widget
  if (currentWidget && currentKey) {
    if (inConfigTemplate && configTemplateLines.length > 0) {
      currentWidget.configTemplate = configTemplateLines.join('\n');
      console.log(`Set configTemplate for ${currentKey}:`, currentWidget.configTemplate);
    }
    if (inDefaultConfig && defaultConfigLines.length > 0) {
      try {
        const configYaml = defaultConfigLines.join('\n');
        currentWidget.defaultConfig = YAML.parse(configYaml);
        console.log(`Set defaultConfig for ${currentKey}:`, currentWidget.defaultConfig);
      } catch (e) {
        console.warn('Failed to parse defaultConfig for', currentKey, e);
        currentWidget.defaultConfig = {};
      }
    }
    definitions[currentKey] = currentWidget;
  }
  
  console.log('Parsed widget definitions:', Object.keys(definitions).length, 'widgets');
  return definitions;
}

// Default widget definitions with metadata
export const initialWidgetDefinitions = {
  'mostRecentActivities': {
    name: 'mostRecentActivities',
    displayName: 'Most Recent Activities',
    description: 'Displays your most recent activities, providing a quick overview of your latest workouts.',
    allowMultiple: true,
    hasConfig: true,
    configTemplate: `numberOfActivitiesToDisplay: 5`,
    defaultConfig: { numberOfActivitiesToDisplay: 5 }
  },
  'introText': {
    name: 'introText',
    displayName: 'Introduction Text',
    description: 'Displays custom introduction text with a summary of your workout history.',
    allowMultiple: false,
    hasConfig: false
  },
  'trainingGoals': {
    name: 'trainingGoals',
    displayName: 'Training Goals',
    description: 'Define and track your weekly, monthly, yearly and lifetime goals. Note: Disabled by default.',
    allowMultiple: true,
    hasConfig: true,
    configTemplate: `goals:
  weekly: []
  monthly: []
  yearly: []
  lifetime: []`,
    defaultConfig: { goals: { weekly: [], monthly: [], yearly: [], lifetime: [] } }
  },
  'weeklyStats': {
    name: 'weeklyStats',
    displayName: 'Weekly Statistics',
    description: 'Summary of your weekly statistics per sport type, including total distance and moving time.',
    allowMultiple: true,
    hasConfig: true,
    configTemplate: `metricsDisplayOrder: ['distance', 'movingTime', 'elevation']`,
    defaultConfig: { metricsDisplayOrder: ['distance', 'movingTime', 'elevation'] }
  },
  'peakPowerOutputs': {
    name: 'peakPowerOutputs',
    displayName: 'Peak Power Outputs',
    description: 'Displays your peak power outputs, allowing you to track your performance over time.',
    allowMultiple: false,
    hasConfig: false
  },
  'heartRateZones': {
    name: 'heartRateZones',
    displayName: 'Heart Rate Zones',
    description: 'Shows your heart rate zones, helping you understand your training intensity.',
    allowMultiple: false,
    hasConfig: false
  },
  'activityGrid': {
    name: 'activityGrid',
    displayName: 'Activity Grid',
    description: 'Overview of your activities in a GitHub-style graph.',
    allowMultiple: false,
    hasConfig: false
  },
  'monthlyStats': {
    name: 'monthlyStats',
    displayName: 'Monthly Statistics',
    description: 'Displays your monthly statistics and lets you compare your performance with the same months in previous years.',
    allowMultiple: true,
    hasConfig: true,
    configTemplate: `enableLastXYearsByDefault: 10
metricsDisplayOrder: ['distance', 'movingTime', 'elevation']`,
    defaultConfig: { 
      enableLastXYearsByDefault: 10,
      metricsDisplayOrder: ['distance', 'movingTime', 'elevation']
    }
  },
  'trainingLoad': {
    name: 'trainingLoad',
    displayName: 'Training Load',
    description: 'Displays your training load, helping you monitor your training stress and recovery.',
    allowMultiple: false,
    hasConfig: false
  },
  'weekdayStats': {
    name: 'weekdayStats',
    displayName: 'Weekday Statistics',
    description: 'Breakdown of your activities by weekday to see training patterns throughout the week.',
    allowMultiple: false,
    hasConfig: false
  },
  'dayTimeStats': {
    name: 'dayTimeStats',
    displayName: 'Day Time Statistics',
    description: 'Shows breakdown of activities by time of day to understand when you are most active.',
    allowMultiple: false,
    hasConfig: false
  },
  'distanceBreakdown': {
    name: 'distanceBreakdown',
    displayName: 'Distance Breakdown',
    description: 'Breakdown of activities by distance and activity type to see how training distances vary.',
    allowMultiple: false,
    hasConfig: false
  },
  'yearlyStats': {
    name: 'yearlyStats',
    displayName: 'Yearly Statistics',
    description: 'Shows yearly stats per activity type to track long-term training progress.',
    allowMultiple: true,
    hasConfig: true,
    configTemplate: `enableLastXYearsByDefault: 10
metricsDisplayOrder: ['distance', 'movingTime', 'elevation']`,
    defaultConfig: { 
      enableLastXYearsByDefault: 10,
      metricsDisplayOrder: ['distance', 'movingTime', 'elevation']
    }
  },
  'zwiftStats': {
    name: 'zwiftStats',
    displayName: 'Zwift Statistics',
    description: 'Displays detailed stats for your Zwift activities.',
    allowMultiple: false,
    hasConfig: false
  },
  'gearStats': {
    name: 'gearStats',
    displayName: 'Gear Statistics',
    description: 'Displays hours spent per gear.',
    allowMultiple: true,
    hasConfig: true,
    configTemplate: `includeRetiredGear: true`,
    defaultConfig: { includeRetiredGear: true }
  },
  'eddington': {
    name: 'eddington',
    displayName: 'Eddington Number',
    description: 'Displays your Eddington number(s). Configure which numbers to display in Eddington settings under metrics configuration.',
    allowMultiple: false,
    hasConfig: false
  },
  'challengeConsistency': {
    name: 'challengeConsistency',
    displayName: 'Challenge Consistency',
    description: 'Displays your consistency in completing challenges. Uses sensible defaults if left unchanged.',
    allowMultiple: true,
    hasConfig: true,
    configTemplate: `challenges: []`,
    defaultConfig: { challenges: [] }
  },
  'mostRecentChallengesCompleted': {
    name: 'mostRecentChallengesCompleted',
    displayName: 'Most Recent Challenges Completed',
    description: 'Displays your most recent challenges completed.',
    allowMultiple: true,
    hasConfig: true,
    configTemplate: `numberOfChallengesToDisplay: 5`,
    defaultConfig: { numberOfChallengesToDisplay: 5 }
  },
  'ftpHistory': {
    name: 'ftpHistory',
    displayName: 'FTP History',
    description: 'Shows your Functional Threshold Power (FTP) history to track cycling performance over time.',
    allowMultiple: false,
    hasConfig: false
  },
  'athleteWeightHistory': {
    name: 'athleteWeightHistory',
    displayName: 'Athlete Weight History',
    description: 'Shows your weight history (summary of values entered in athlete config section).',
    allowMultiple: false,
    hasConfig: false
  },
  'streaks': {
    name: "streaks",
    displayName: "Current streaks",
    description: "This widget shows your current activity streaks, calculated in days, weeks, and months.\n\nHas a single key value - sportTypesToInclude: an array of sport types to include when calculating streaks. Leave this empty to include all sport types.",
    allowMultiple: true,
    hasConfig: true,
    configTemplate: `sportTypesToInclude: []`,
    defaultConfig: {sportTypesToInclude: []}
  }
};

/**
 * Read widget definitions from file
 * @returns {Promise<Object>} Widget definitions object
 */
export async function readWidgetDefinitions() {
  try {
    const filePath = getWidgetDefinitionsPath();
    
    const response = await fetch(`/api/file-content?path=${encodeURIComponent(filePath)}`);
    const result = await response.json();
    
    if (result.success && result.content) {
      const parsed = fromYAML(result.content);
      return parsed;
    }
    
    // File doesn't exist yet, return defaults
    return initialWidgetDefinitions;
  } catch (error) {
    console.error('Error reading widget definitions:', error);
    return initialWidgetDefinitions;
  }
}

/**
 * Write widget definitions to file
 * @param {Object} definitions - Widget definitions object
 * @returns {Promise<boolean>} Success status
 */
export async function writeWidgetDefinitions(definitions) {
  try {
    const filePath = getWidgetDefinitionsPath();
    const yamlContent = toYAML(definitions);
    
    const response = await fetch('/api/file-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: filePath,
        content: yamlContent
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to write widget definitions');
    }
    
    return true;
  } catch (error) {
    console.error('Error writing widget definitions:', error);
    throw error;
  }
}

/**
 * Get a specific widget definition by name
 * @param {string} widgetName - Name of the widget
 * @returns {Object|null} Widget definition or null if not found
 */
export async function getWidgetDefinition(widgetName) {
  const definitions = await readWidgetDefinitions();
  return definitions[widgetName] || null;
}

/**
 * Add or update a widget definition
 * @param {Object} widgetDef - Widget definition object
 * @returns {boolean} Success status
 */
export async function saveWidgetDefinition(widgetDef) {
  try {
    const definitions = await readWidgetDefinitions();
    definitions[widgetDef.name] = widgetDef;
    await writeWidgetDefinitions(definitions);
    return true;
  } catch (error) {
    console.error('Error saving widget definition:', error);
    return false;
  }
}

/**
 * Delete a widget definition
 * @param {string} widgetName - Name of the widget to delete
 * @returns {boolean} Success status
 */
export async function deleteWidgetDefinition(widgetName) {
  try {
    const definitions = await readWidgetDefinitions();
    delete definitions[widgetName];
    await writeWidgetDefinitions(definitions);
    return true;
  } catch (error) {
    console.error('Error deleting widget definition:', error);
    return false;
  }
}

/**
 * Reset widget definitions to initial defaults
 */
export async function resetWidgetDefinitions() {
  try {
    await writeWidgetDefinitions(initialWidgetDefinitions);
    return true;
  } catch (error) {
    console.error('Error resetting widget definitions:', error);
    return false;
  }
}

/**
 * Get all widget names grouped by whether they allow multiple instances
 * @returns {Object} Object with allowMultiple and allowOnce arrays
 */
export async function getWidgetsByType() {
  const definitions = await readWidgetDefinitions();
  const allowMultiple = [];
  const allowOnce = [];
  
  Object.values(definitions).forEach(widget => {
    if (widget.allowMultiple) {
      allowMultiple.push(widget);
    } else {
      allowOnce.push(widget);
    }
  });
  
  return { allowMultiple, allowOnce };
}
