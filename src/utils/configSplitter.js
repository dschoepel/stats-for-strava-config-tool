// Utility functions for splitting a master config file into separate section files

import { generateSectionHeader } from './configMerger';

/**
 * Split a master config file into separate section files
 * @param {string} masterConfigContent - The content of the master config file
 * @returns {Object} - { success, files, errors }
 */
export async function splitConfigFile(masterConfigContent) {
  try {
    const YAML = await import('yaml');
    const parsedData = YAML.parse(masterConfigContent);
    
    if (!parsedData || typeof parsedData !== 'object') {
      return {
        success: false,
        error: 'Invalid config file format',
        errors: ['Invalid config file format']
      };
    }
    
    const files = [];
    const errors = [];
    
    // Define which sections go into which files
    const sectionToFileMapping = {
      general: { fileName: 'config.yaml', sections: ['general'] },
      appearance: { fileName: 'config-appearance.yaml', sections: ['appearance'] },
      import: { fileName: 'config-import.yaml', sections: ['import'] },
      metrics: { fileName: 'config-metrics.yaml', sections: ['metrics'] },
      gear: { fileName: 'config-gear.yaml', sections: ['gear'] },
      zwift: { fileName: 'config-zwift.yaml', sections: ['zwift'] },
      integrations: { fileName: 'config-integrations.yaml', sections: ['integrations'] },
      daemon: { fileName: 'config-daemon.yaml', sections: ['daemon'] }
    };
    
    // Section labels for headers
    const sectionLabels = {
      general: 'General Configuration Settings',
      appearance: 'Appearance Configuration Settings',
      import: 'Import Configuration Settings',
      metrics: 'Metrics Configuration Settings',
      gear: 'Gear Configuration Settings',
      zwift: 'Zwift Configuration Settings',
      integrations: 'Integrations Configuration Settings',
      daemon: 'Daemon Configuration Settings'
    };
    
    // Nested section labels
    const nestedLabels = {
      athlete: 'Athlete Configuration Settings',
      dateFormat: 'Date Format Configuration Settings',
      dashboard: 'Dashboard Configuration Settings',
      heatmap: 'Heatmap Configuration Settings',
      photos: 'Photos Configuration Settings',
      eddington: 'Eddington Score Configuration Settings',
      stravaGear: 'Strava Gear Configuration Settings',
      customGear: 'Custom Gear Configuration Settings',
      notifications: 'Notifications Configuration Settings',
      ai: 'AI Integration Configuration Settings',
      cron: 'Cron Job Configuration Settings'
    };
    
    // Define which nested sections should have headers
    const nestedSections = {
      general: ['athlete'],
      appearance: ['dateFormat', 'dashboard', 'heatmap', 'photos'],
      metrics: ['eddington'],
      gear: ['stravaGear', 'customGear'],
      integrations: ['notifications', 'ai'],
      daemon: ['cron']
    };
    
    // Create each config file
    Object.entries(sectionToFileMapping).forEach(([, { fileName, sections }]) => {
      const fileData = {};
      let hasData = false;
      
      sections.forEach(section => {
        if (parsedData[section]) {
          fileData[section] = parsedData[section];
          hasData = true;
        }
      });
      
      if (hasData) {
        // Generate file content with headers
        let fileContent = '';
        
        sections.forEach(section => {
          if (fileData[section]) {
            // Add top-level section header
            fileContent += generateSectionHeader(section, sectionLabels[section]) + '\n';
            
            const sectionData = fileData[section];
            const hasNestedSections = nestedSections[section];
            
            if (hasNestedSections && typeof sectionData === 'object') {
              // Handle top-level properties first
              const topLevelData = {};
              const nestedKeys = hasNestedSections;
              
              Object.keys(sectionData).forEach(key => {
                if (!nestedKeys.includes(key)) {
                  topLevelData[key] = sectionData[key];
                }
              });
              
              // Add top-level properties
              if (Object.keys(topLevelData).length > 0) {
                fileContent += `${section}:\n`;
                const topYaml = YAML.stringify(topLevelData, { indent: 2 });
                fileContent += topYaml.split('\n').map(line => line ? `  ${line}` : '').join('\n');
              } else {
                fileContent += `${section}:\n`;
              }
              
              // Add nested sections with headers
              hasNestedSections.forEach(nestedKey => {
                if (sectionData[nestedKey] !== undefined) {
                  fileContent += '\n' + generateSectionHeader(nestedKey, nestedLabels[nestedKey], true) + '\n';
                  const nestedYaml = YAML.stringify({ [nestedKey]: sectionData[nestedKey] }, { indent: 2 });
                  fileContent += nestedYaml.split('\n').map(line => line ? `  ${line}` : '').join('\n');
                }
              });
            } else {
              // Simple section without nested headers
              fileContent += YAML.stringify({ [section]: sectionData }, { indent: 2 });
            }
            
            fileContent += '\n';
          }
        });
        
        files.push({
          fileName,
          content: fileContent.trim(),
          sections
        });
      }
    });
    
    return {
      success: true,
      files,
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
 * Determine the optimal split strategy based on config content
 * @param {string} configContent - The config file content
 * @returns {Object} - { strategy, recommendations }
 */
export async function analyzeSplitStrategy(configContent) {
  try {
    const YAML = await import('yaml');
    const parsedData = YAML.parse(configContent);
    
    const sections = Object.keys(parsedData);
    const sectionCount = sections.length;
    
    // Calculate complexity scores
    const complexity = {};
    sections.forEach(section => {
      const sectionData = parsedData[section];
      complexity[section] = calculateComplexity(sectionData);
    });
    
    // Recommend split if:
    // - More than 3 sections
    // - Any section has complexity > 50
    // - Total file has more than 200 lines
    const lines = configContent.split('\n').length;
    const shouldSplit = sectionCount > 3 || 
                        Object.values(complexity).some(c => c > 50) ||
                        lines > 200;
    
    return {
      strategy: shouldSplit ? 'multi-file' : 'single-file',
      recommendations: {
        sectionCount,
        complexity,
        totalLines: lines,
        shouldSplit
      }
    };
    
  } catch (error) {
    return {
      strategy: 'unknown',
      error: error.message
    };
  }
}

/**
 * Calculate complexity score for a section
 * @param {any} data - The section data
 * @returns {number} - Complexity score
 */
function calculateComplexity(data) {
  if (!data) return 0;
  if (typeof data !== 'object') return 1;
  
  let score = 0;
  if (Array.isArray(data)) {
    score = data.length;
    data.forEach(item => {
      score += calculateComplexity(item);
    });
  } else {
    const keys = Object.keys(data);
    score = keys.length;
    keys.forEach(key => {
      score += calculateComplexity(data[key]);
    });
  }
  
  return score;
}
