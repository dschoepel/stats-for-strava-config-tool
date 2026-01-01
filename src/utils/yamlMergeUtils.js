/**
 * YAML Merge Utilities
 * Helper functions for parsing and merging YAML files
 */

/**
 * Parse YAML to extract second-level keys under a given top-level key
 * @param {string} content - YAML content
 * @param {string} topLevelKey - Top-level key to parse
 * @returns {Array<string>} Array of second-level keys
 */
export function parseSecondLevelKeys(content, topLevelKey) {
  const normalizedContent = content.replace(/\\n/g, '\n');
  const lines = normalizedContent.split('\n');
  const secondLevelKeys = [];
  let inTargetSection = false;
  let currentIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const topLevelMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
    if (topLevelMatch) {
      if (topLevelMatch[1] === topLevelKey) {
        inTargetSection = true;
        currentIndent = 0;
      } else {
        inTargetSection = false;
      }
      continue;
    }

    if (inTargetSection) {
      const indentMatch = line.match(/^(\s+)([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
      if (indentMatch) {
        const indent = indentMatch[1].length;
        const key = indentMatch[2];
        
        if (currentIndent === 0 || indent === currentIndent) {
          currentIndent = indent;
          secondLevelKeys.push(key);
        }
      }
    }
  }

  return secondLevelKeys;
}

/**
 * Check for duplicate keys across multiple files
 * @param {Array} files - Array of file objects with content
 * @returns {Object} Duplicate analysis results
 */
export function checkForDuplicateKeys(files) {
  const allKeys = new Set();
  const duplicates = new Set();
  const fileKeys = {};
  const duplicateDetails = {};

  files.forEach((file, fileIndex) => {
    const normalizedContent = file.content.replace(/\\n/g, '\n');
    const lines = normalizedContent.split('\n');
    const keys = [];
    
    lines.forEach(line => {
      const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
      if (match) {
        const key = match[1];
        keys.push(key);
        
        if (allKeys.has(key)) {
          duplicates.add(key);
        } else {
          allKeys.add(key);
        }
      }
    });
    
    fileKeys[fileIndex] = keys;
  });

  duplicates.forEach(dupKey => {
    const filesWithKey = files.map((file, idx) => ({
      fileIndex: idx,
      fileName: file.name,
      hasKey: fileKeys[idx].includes(dupKey)
    })).filter(f => f.hasKey);

    const secondLevelAnalysis = filesWithKey.map(fileInfo => {
      const file = files[fileInfo.fileIndex];
      const secondKeys = parseSecondLevelKeys(file.content, dupKey);
      return {
        ...fileInfo,
        secondLevelKeys: secondKeys
      };
    });

    const allSecondKeys = new Set();
    const conflictingSecondKeys = new Set();
    
    secondLevelAnalysis.forEach(analysis => {
      analysis.secondLevelKeys.forEach(key => {
        if (allSecondKeys.has(key)) {
          conflictingSecondKeys.add(key);
        } else {
          allSecondKeys.add(key);
        }
      });
    });

    duplicateDetails[dupKey] = {
      files: filesWithKey,
      secondLevelAnalysis,
      hasSecondLevelConflicts: conflictingSecondKeys.size > 0,
      conflictingSecondKeys: Array.from(conflictingSecondKeys),
      canSmartMerge: conflictingSecondKeys.size === 0
    };
  });

  return {
    hasDuplicates: duplicates.size > 0,
    duplicateKeys: Array.from(duplicates),
    fileKeys,
    duplicateDetails
  };
}

/**
 * Remove duplicate keys from files based on smart merge settings
 * @param {Array} files - Array of file objects
 * @param {Object} smartMergeSettings - Settings for smart merge per key
 * @param {Object} primaryFilePerKey - Primary file index per key
 * @returns {Array} Processed files
 */
export function removeDuplicateKeys(files, smartMergeSettings, primaryFilePerKey) {
  const duplicateCheck = checkForDuplicateKeys(files);
  
  if (!duplicateCheck.hasDuplicates) {
    return files;
  }

  const processedFiles = [];
  const contentToMerge = {};

  // First pass: Extract content from non-primary files
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex];
    const normalizedContent = file.content.replace(/\\n/g, '\n');
    const lines = normalizedContent.split('\n');
    
    duplicateCheck.duplicateKeys.forEach(key => {
      const details = duplicateCheck.duplicateDetails[key];
      
      if (smartMergeSettings[key]) {
        const primaryFileIdx = primaryFilePerKey[key];
        
        if (fileIndex !== primaryFileIdx && details.files.some(f => f.fileIndex === fileIndex)) {
          if (!contentToMerge[key]) {
            contentToMerge[key] = [];
          }
          
          let inTargetSection = false;
          let sectionContent = [];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const topLevelMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
            
            if (topLevelMatch) {
              if (topLevelMatch[1] === key) {
                inTargetSection = true;
                continue;
              } else if (inTargetSection) {
                break;
              }
            } else if (inTargetSection) {
              sectionContent.push(line);
            }
          }
          
          if (sectionContent.length > 0) {
            contentToMerge[key].push({
              fileIndex,
              fileName: file.name,
              content: sectionContent
            });
          }
        }
      }
    });
  }

  // Second pass: Process each file
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex];
    const normalizedContent = file.content.replace(/\\n/g, '\n');
    const lines = normalizedContent.split('\n');
    const filteredLines = [];
    let skipUntilNextTopLevel = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const topLevelMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
      
      if (topLevelMatch) {
        const key = topLevelMatch[1];
        skipUntilNextTopLevel = false;
        
        const details = duplicateCheck.duplicateDetails[key];
        if (details) {
          const primaryFileIdx = primaryFilePerKey[key];
          
          if (smartMergeSettings[key]) {
            if (fileIndex === primaryFileIdx) {
              filteredLines.push(line);
              
              let originalContent = [];
              let j = i + 1;
              
              while (j < lines.length) {
                const nextLine = lines[j];
                const nextTopLevel = nextLine.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
                
                if (nextTopLevel) {
                  break;
                }
                originalContent.push(nextLine);
                j++;
              }
              
              filteredLines.push(...originalContent);
              
              if (contentToMerge[key] && contentToMerge[key].length > 0) {
                contentToMerge[key].forEach(mergeInfo => {
                  filteredLines.push(...mergeInfo.content);
                });
              }
              
              i = j - 1;
            } else {
              skipUntilNextTopLevel = true;
            }
          } else {
            if (fileIndex === primaryFileIdx) {
              filteredLines.push(line);
            } else {
              skipUntilNextTopLevel = true;
            }
          }
        } else {
          filteredLines.push(line);
        }
      } else {
        if (!skipUntilNextTopLevel) {
          filteredLines.push(line);
        }
      }
    }

    processedFiles.push({
      ...file,
      content: filteredLines.join('\n'),
      size: new Blob([filteredLines.join('\n')]).size
    });
  }

  return processedFiles;
}
