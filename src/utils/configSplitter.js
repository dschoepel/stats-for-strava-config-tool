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
      
      // Determine if we should split
      const shouldSplit = 
        complexKeys.length > 1 || 
        (complexKeys.length === 1 && simpleKeys.length > 0);
      
      //---------------------------------------------
      // Case 1: Do NOT split (metrics, daemon, or simple sections)
      //---------------------------------------------
      if (!shouldSplit) {
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
      // Case 2: Split — keep first complex key with parent
      //---------------------------------------------
      const [firstComplexKey, firstComplexValue] = complexKeys[0];
      
      // Parent file contains simple keys + first complex key
      const parentObj = {
        [topKey]: {
          ...Object.fromEntries(simpleKeys),
          [firstComplexKey]: firstComplexValue
        }
      };
      
      const parentHeader = generateHeader(topKey, null, parentObj[topKey]);
      const parentYaml = YAML.stringify(
        parentObj,
        { indent: 2, lineWidth: -1, noRefs: true }
      );
      
      files.push({
        fileName: topFileName,
        content: parentHeader + parentYaml,
        sections: [topKey, `${topKey}.${firstComplexKey}`]
      });
      
      //---------------------------------------------
      // Split remaining complex keys into separate files
      //---------------------------------------------
      for (const [secondKey, secondValue] of complexKeys.slice(1)) {
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
