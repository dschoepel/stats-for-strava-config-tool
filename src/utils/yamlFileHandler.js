/**
 * YAML File Handler Utility
 * Handles reading and processing config YAML files
 */

/**
 * Reads files from a directory and filters for config*.yaml files
 * @param {FileList} files - Files selected from input
 * @returns {Array} - Array of config YAML files
 */
export const filterConfigYamlFiles = (files) => {
  const configFiles = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = file.name.toLowerCase();
    
    // Check if file starts with 'config' and ends with '.yaml' or '.yml'
    if (fileName.startsWith('config') && (fileName.endsWith('.yaml') || fileName.endsWith('.yml'))) {
      configFiles.push(file);
    }
  }
  
  return configFiles;
};

/**
 * Reads the content of a file
 * @param {File} file - The file to read
 * @returns {Promise<string>} - File content as string
 */
export const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
};

/**
 * Processes multiple YAML files and returns their content
 * @param {FileList} files - Files selected from input
 * @returns {Promise<Array>} - Array of file objects with name and content
 */
export const processYamlFiles = async (files) => {
  const configFiles = filterConfigYamlFiles(files);
  const processedFiles = [];
  
  try {
    for (const file of configFiles) {
      const content = await readFileContent(file);
      processedFiles.push({
        name: file.name,
        size: file.size,
        lastModified: new Date(file.lastModified),
        content: content
      });
    }
    
    return processedFiles;
  } catch (error) {
    throw new Error(`Error processing YAML files: ${error.message}`);
  }
};

/**
 * Validates YAML content (basic validation)
 * @param {string} content - YAML content to validate
 * @returns {boolean} - True if content appears to be valid YAML
 */
export const validateYamlContent = (content) => {
  try {
    // Basic YAML validation - check for common YAML patterns
    const lines = content.split('\n');
    let hasValidYamlStructure = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        // Check for key-value pairs or list items
        if (trimmed.includes(':') || trimmed.startsWith('-')) {
          hasValidYamlStructure = true;
          break;
        }
      }
    }
    
    return hasValidYamlStructure;
  } catch {
    return false;
  }
};

/**
 * Formats file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};