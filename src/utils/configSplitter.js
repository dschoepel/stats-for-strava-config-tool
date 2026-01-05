// Utility functions for splitting a master config file into separate section files

/**
 * Detect if a value is a complex nested object
 */
const isComplex = (value) => {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
};

/**
 * Build mapping table rows for header
 */
function buildMappingRows(prefix, obj) {
  const rows = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = `${prefix}.${key}`;
    if (isComplex(value)) {
      rows.push(`${fullPath} | Nested configuration block`);
      rows.push(...buildMappingRows(fullPath, value));
    } else {
      rows.push(`${fullPath} | Simple value`);
    }
  }
  
  return rows;
}

/**
 * Generate header banner with mapping table
 */
function generateHeader(topKey, secondKey, obj) {
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  
  const title = secondKey
    ? `${capitalize(topKey)} ${capitalize(secondKey)} Configuration Settings`
    : `${capitalize(topKey)} Configuration Settings`;
  
  const rootPath = secondKey ? `${topKey}.${secondKey}` : topKey;
  const mappingRows = buildMappingRows(rootPath, obj);
  
  const mappingTable =
    "#-------------------------------------------------------------------------------#\n" +
    "# Mapping Table\n" +
    "#-------------------------------------------------------------------------------#\n" +
    "# Key Path | Description\n" +
    "#-------------------------------------------|-----------------------------------\n" +
    mappingRows.map(r => `# ${r}`).join('\n') + '\n' +
    "#===============================================================================#\n";
  
  return (
    "#===============================================================================#\n" +
    `# ${title}\n` +
    "#===============================================================================#\n" +
    mappingTable +
    "\n"
  );
}

/**
 * Split a master config file into separate section files with smart 2nd-level splitting
 * @param {string} masterConfigContent - The content of the master config file
 * @param {Object} splitConfiguration - Configuration for hierarchical splitting
 * @param {Object} splitConfiguration.sections - Object mapping top-level keys to their config
 * @param {Object} splitConfiguration.remainingConfig - Configuration for unselected sections
 * @returns {Object} - { success, files, errors }
 */
export async function splitConfigFile(masterConfigContent, splitConfiguration = null) {
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
    const remainingSections = {}; // Track sections not included in split
    
    // Extract split configuration
    const sections = splitConfiguration?.sections || null;
    const remainingConfig = splitConfiguration?.remainingConfig || null;
    const isHierarchical = sections !== null;
    
    // Process each top-level section
    for (const [topKey, topValue] of Object.entries(parsedData)) {
      if (!topValue || typeof topValue !== 'object') {
        continue;
      }
      
      const topFileName = topKey === 'general' ? 'config.yaml' : `config-${topKey}.yaml`;
      
      // Analyze second-level keys
      const secondEntries = Object.entries(topValue);
      const complexKeys = secondEntries.filter(([_, v]) => isComplex(v));
      const simpleKeys = secondEntries.filter(([_, v]) => !isComplex(v));
      
      //---------------------------------------------
      // Check if this section is selected (hierarchical mode)
      //---------------------------------------------
      const sectionConfig = isHierarchical ? sections[topKey] : null;
      const isTopKeyIncluded = !isHierarchical || sectionConfig?.include;
      
      if (!isTopKeyIncluded) {
        // Store entire section for remaining
        remainingSections[topKey] = topValue;
        continue;
      }
      
      //---------------------------------------------
      // Determine split strategy for this section
      //---------------------------------------------
      const hasComplexKeys = complexKeys.length > 0;
      
      if (!hasComplexKeys) {
        // Simple section - create one file with all content
        const header = generateHeader(topKey, null, topValue);
        const yamlBody = YAML.stringify(
          { [topKey]: topValue },
          { indent: 2, lineWidth: -1, noRefs: true }
        );
        
        files.push({
          fileName: topFileName,
          content: header + yamlBody,
          sections: [topKey]
        });
        continue;
      }
      
      //---------------------------------------------
      // Complex section - handle second-level splitting
      //---------------------------------------------
      const parentContent = { ...Object.fromEntries(simpleKeys) };
      const splitChildren = [];
      
      for (const [secondKey, secondValue] of complexKeys) {
        const shouldSplit = isHierarchical 
          ? sectionConfig?.secondLevel?.[secondKey]?.split 
          : complexKeys.indexOf([secondKey, secondValue]) > 0; // Default: first stays, rest split
        
        if (shouldSplit) {
          // Split this child into separate file
          splitChildren.push({ secondKey, secondValue });
        } else {
          // Keep with parent
          parentContent[secondKey] = secondValue;
        }
      }
      
      // Create parent file with simple keys + non-split children
      if (Object.keys(parentContent).length > 0) {
        const parentObj = { [topKey]: parentContent };
        const parentHeader = generateHeader(topKey, null, parentContent);
        const parentYaml = YAML.stringify(
          parentObj,
          { indent: 2, lineWidth: -1, noRefs: true }
        );
        
        const parentSections = [topKey];
        Object.keys(parentContent).forEach(key => {
          if (complexKeys.find(([k]) => k === key)) {
            parentSections.push(`${topKey}.${key}`);
          }
        });
        
        files.push({
          fileName: topFileName,
          content: parentHeader + parentYaml,
          sections: parentSections
        });
      }
      
      // Create separate files for split children
      for (const { secondKey, secondValue } of splitChildren) {
        const filename = `config-${topKey}-${secondKey}.yaml`;
        const obj = { [topKey]: { [secondKey]: secondValue } };
        const header = generateHeader(topKey, secondKey, secondValue);
        const yamlBody = YAML.stringify(
          obj,
          { indent: 2, lineWidth: -1, noRefs: true }
        );
        
        files.push({
          fileName: filename,
          content: header + yamlBody,
          sections: [`${topKey}.${secondKey}`]
        });
      }
    }
    
    //---------------------------------------------
    // Handle remaining sections based on configuration
    //---------------------------------------------
    if (isHierarchical && Object.keys(remainingSections).length > 0 && remainingConfig) {
      const { destination, customFileName, mergeIntoFile } = remainingConfig;
      
      if (destination === 'original') {
        // Keep remaining sections in original file structure
        const header = 
          "#===============================================================================#\n" +
          "# Configuration File (Unselected Sections)\n" +
          "#===============================================================================#\n" +
          "# This file contains sections that were not split out\n" +
          "#===============================================================================#\n\n";
        
        const yamlBody = YAML.stringify(
          remainingSections,
          { indent: 2, lineWidth: -1, noRefs: true }
        );
        
        files.push({
          fileName: 'config-original-remaining.yaml',
          content: header + yamlBody,
          sections: Object.keys(remainingSections)
        });
      } else if (destination === 'custom' && customFileName) {
        // Create custom file for remaining sections
        const header = 
          "#===============================================================================#\n" +
          "# Configuration File (Remaining Sections)\n" +
          "#===============================================================================#\n" +
          "# This file contains sections that were not split out\n" +
          "#===============================================================================#\n\n";
        
        const yamlBody = YAML.stringify(
          remainingSections,
          { indent: 2, lineWidth: -1, noRefs: true }
        );
        
        files.push({
          fileName: customFileName,
          content: header + yamlBody,
          sections: Object.keys(remainingSections)
        });
      } else if (destination === 'merge' && mergeIntoFile) {
        // Merge remaining sections into specified file
        const targetFile = files.find(f => f.fileName === mergeIntoFile);
        if (targetFile) {
          // Parse existing file and merge
          const existingData = YAML.parse(targetFile.content.split('\n').filter(l => !l.startsWith('#')).join('\n'));
          const mergedData = { ...existingData, ...remainingSections };
          
          const header = targetFile.content.split('\n').filter(l => l.startsWith('#')).join('\n') + '\n\n';
          const yamlBody = YAML.stringify(
            mergedData,
            { indent: 2, lineWidth: -1, noRefs: true }
          );
          
          targetFile.content = header + yamlBody;
          targetFile.sections.push(...Object.keys(remainingSections));
        }
      }
    }
    
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
