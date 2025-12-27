// Utility functions for merging config files into a single master config

import { getConfigSchemas } from '../schemas/configSchemas';

/**
 * Generate Table of Contents for the merged config file
 * @param {Object} configData - The complete config data object
 * @returns {string} - TOC as YAML comments
 */
export function generateTableOfContents(configData) {
  const toc = [];
  toc.push('#---------------------------------------------------#');
  toc.push('# Table of Contents');
  toc.push('#---------------------------------------------------#');
  
  // Define the sections and their nested subsections
  const sections = [
    { key: 'general', label: 'General configuration settings', subsections: [
      { key: 'athlete', label: 'Athlete configuration settings' }
    ]},
    { key: 'appearance', label: 'Appearance configuration settings', subsections: [
      { key: 'dateFormat', label: 'Date format configuration settings' },
      { key: 'dashboard', label: 'Dashboard configuration settings' },
      { key: 'heatmap', label: 'Heatmap configuration settings' },
      { key: 'photos', label: 'Photos configuration settings' }
    ]},
    { key: 'import', label: 'Import configuration settings' },
    { key: 'metrics', label: 'Metrics configuration settings', subsections: [
      { key: 'eddington', label: 'Eddington score configuration settings' }
    ]},
    { key: 'gear', label: 'Gear configuration settings', subsections: [
      { key: 'stravaGear', label: 'Strava gear configuration settings' },
      { key: 'customGear', label: 'Custom gear configuration settings' }
    ]},
    { key: 'zwift', label: 'Zwift configuration settings' },
    { key: 'integrations', label: 'Integrations configuration settings', subsections: [
      { key: 'notifications', label: 'Notifications configuration settings' },
      { key: 'ai', label: 'AI integrations configuration settings' }
    ]},
    { key: 'daemon', label: 'Daemon configuration settings', subsections: [
      { key: 'cron', label: 'Cron job configuration settings' }
    ]}
  ];
  
  sections.forEach(section => {
    if (configData[section.key]) {
      toc.push(`# - ${section.label}`);
      if (section.subsections) {
        section.subsections.forEach(subsection => {
          if (configData[section.key] && configData[section.key][subsection.key]) {
            toc.push(`#   - ${subsection.label}`);
          }
        });
      }
    }
  });
  
  toc.push('#');
  return toc.join('\n');
}

/**
 * Generate a section header for the merged config
 * @param {string} sectionKey - The section key
 * @param {string} label - The section label
 * @param {boolean} isNested - Whether this is a nested section
 * @returns {string} - Section header as YAML comment
 */
export function generateSectionHeader(sectionKey, label, isNested = false) {
  const divider = isNested ? '#---------------------------------#' : '#===================================#';
  return `${divider}\n# ${label}\n${divider}`;
}

/**
 * Merge multiple config files into a single master config
 * @param {Array} configFiles - Array of {path, content} objects
 * @returns {Object} - { success, mergedYaml, errors }
 */
export async function mergeConfigFiles(configFiles) {
  try {
    const YAML = await import('yaml');
    const mergedData = {};
    const errors = [];
    
    // Parse all config files and merge their data
    for (const file of configFiles) {
      try {
        const parsedData = YAML.parse(file.content);
        if (parsedData && typeof parsedData === 'object') {
          // Merge top-level keys
          Object.keys(parsedData).forEach(key => {
            if (!mergedData[key]) {
              mergedData[key] = parsedData[key];
            } else {
              // If key already exists, the first file takes precedence
              errors.push(`Duplicate section '${key}' found in ${file.name} - using version from first file`);
            }
          });
        }
      } catch (error) {
        errors.push(`Failed to parse ${file.name}: ${error.message}`);
      }
    }
    
    // Fill in missing sections with defaults from schemas
    const schemas = getConfigSchemas();
    Object.keys(schemas).forEach(sectionKey => {
      if (!mergedData[sectionKey]) {
        mergedData[sectionKey] = getDefaultsFromSchema(schemas[sectionKey]);
      }
    });
    
    // Generate the merged YAML with TOC and headers
    let mergedYaml = generateTableOfContents(mergedData) + '\n\n';
    
    // Section definitions with their labels
    const sectionOrder = [
      { key: 'general', label: 'General Configuration Settings' },
      { key: 'appearance', label: 'Appearance Configuration Settings' },
      { key: 'import', label: 'Import Configuration Settings' },
      { key: 'metrics', label: 'Metrics Configuration Settings' },
      { key: 'gear', label: 'Gear Configuration Settings' },
      { key: 'zwift', label: 'Zwift Configuration Settings' },
      { key: 'integrations', label: 'Integrations Configuration Settings' },
      { key: 'daemon', label: 'Daemon Configuration Settings' }
    ];
    
    // Nested sections that should have headers
    const nestedSections = {
      general: [{ key: 'athlete', label: 'Athlete Configuration Settings' }],
      appearance: [
        { key: 'dateFormat', label: 'Date Format Configuration Settings' },
        { key: 'dashboard', label: 'Dashboard Configuration Settings' },
        { key: 'heatmap', label: 'Heatmap Configuration Settings' },
        { key: 'photos', label: 'Photos Configuration Settings' }
      ],
      metrics: [{ key: 'eddington', label: 'Eddington Score Configuration Settings' }],
      gear: [
        { key: 'stravaGear', label: 'Strava Gear Configuration Settings' },
        { key: 'customGear', label: 'Custom Gear Configuration Settings' }
      ],
      integrations: [
        { key: 'notifications', label: 'Notifications Configuration Settings' },
        { key: 'ai', label: 'AI Integration Configuration Settings' }
      ],
      daemon: [{ key: 'cron', label: 'Cron Job Configuration Settings' }]
    };
    
    // Build the YAML with headers
    sectionOrder.forEach(section => {
      if (mergedData[section.key]) {
        // Add top-level section header
        mergedYaml += generateSectionHeader(section.key, section.label) + '\n';
        
        const sectionData = mergedData[section.key];
        const hasNestedSections = nestedSections[section.key];
        
        if (hasNestedSections && typeof sectionData === 'object') {
          // Handle top-level properties first
          const topLevelData = {};
          const nestedKeys = hasNestedSections.map(s => s.key);
          
          Object.keys(sectionData).forEach(key => {
            if (!nestedKeys.includes(key)) {
              topLevelData[key] = sectionData[key];
            }
          });
          
          // Add top-level properties
          if (Object.keys(topLevelData).length > 0) {
            mergedYaml += `${section.key}:\n`;
            const topYaml = YAML.stringify(topLevelData, { indent: 2 });
            mergedYaml += topYaml.split('\n').map(line => line ? `  ${line}` : '').join('\n');
          } else {
            mergedYaml += `${section.key}:\n`;
          }
          
          // Add nested sections with headers
          hasNestedSections.forEach(nested => {
            if (sectionData[nested.key] !== undefined) {
              mergedYaml += '\n' + generateSectionHeader(nested.key, nested.label, true) + '\n';
              const nestedYaml = YAML.stringify({ [nested.key]: sectionData[nested.key] }, { indent: 2 });
              mergedYaml += nestedYaml.split('\n').map(line => line ? `  ${line}` : '').join('\n');
            }
          });
        } else {
          // Simple section without nested headers
          mergedYaml += YAML.stringify({ [section.key]: sectionData }, { indent: 2 });
        }
        
        mergedYaml += '\n';
      }
    });
    
    return {
      success: true,
      mergedYaml: mergedYaml.trim(),
      mergedData,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      errors: [error.message]
    };
  }
}

/**
 * Extract default values from a schema
 * @param {Object} schema - JSON schema object
 * @returns {Object} - Default values
 */
export function getDefaultsFromSchema(schema) {
  if (!schema || !schema.properties) return {};
  
  const defaults = {};
  Object.entries(schema.properties).forEach(([key, prop]) => {
    if (prop.default !== undefined) {
      defaults[key] = prop.default;
    } else if (prop.type === 'object' && prop.properties) {
      // Recursively get defaults for nested objects
      const nestedDefaults = getDefaultsFromSchema(prop);
      // Always include nested objects if they have any defaults
      if (Object.keys(nestedDefaults).length > 0) {
        defaults[key] = nestedDefaults;
      }
    } else if (prop.type === 'array') {
      defaults[key] = prop.default || [];
    }
  });
  
  return defaults;
}
