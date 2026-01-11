/**
 * Config Service - Handles all configuration file operations
 * Provides a centralized API layer for config-related operations
 */

/**
 * Base fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    // If response has explicit success field, return it regardless of HTTP status
    // This allows APIs to return { success: false } for business logic failures
    if ('success' in data) {
      return data;
    }

    // If no success field and HTTP error, throw
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * List config files in directory
 * @param {string} defaultPath - Default path to search for config files
 * @returns {Promise<{success: boolean, files: Array, directory: string, count: number}>}
 */
export async function listConfigFiles(defaultPath) {
  return fetchAPI(`/api/config-files?defaultPath=${encodeURIComponent(defaultPath)}`);
}

/**
 * Scan directory for config files
 * @param {string} directory - Directory path to scan
 * @returns {Promise<{success: boolean, files: Array, directory: string, count: number}>}
 */
export async function scanConfigFiles(directory) {
  return fetchAPI('/api/config-files', {
    method: 'POST',
    body: JSON.stringify({ directory })
  });
}

/**
 * Parse sections from config files
 * @param {Array} files - Array of file paths to parse
 * @returns {Promise<{success: boolean, sectionMapping: Object, detailedMapping: Object, conflicts: Array}>}
 */
export async function parseSections(files) {
  return fetchAPI('/api/parse-sections', {
    method: 'POST',
    body: JSON.stringify({ files })
  });
}

/**
 * Validate sections completeness
 * @param {Object} sectionMapping - Map of section names to file paths
 * @returns {Promise<{success: boolean, isComplete: boolean, missingSections: Array}>}
 */
export async function validateSections(sectionMapping) {
  return fetchAPI('/api/validate-sections', {
    method: 'POST',
    body: JSON.stringify({ sectionMapping })
  });
}

/**
 * Update specific section in config file
 * @param {Object} params - Update parameters
 * @param {string} params.filePath - Path to config file
 * @param {string} params.sectionName - Section name to update
 * @param {Object} params.sectionData - Section data
 * @param {boolean} [params.isAthlete] - Whether this is athlete section
 * @param {boolean} [params.preserveNestedKeys] - Preserve nested keys
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function updateSection({ filePath, sectionName, sectionData, isAthlete, preserveNestedKeys }) {
  return fetchAPI('/api/update-section', {
    method: 'POST',
    body: JSON.stringify({ filePath, sectionName, sectionData, isAthlete, preserveNestedKeys })
  });
}

/**
 * Merge multiple config files into one
 * @param {Object} params - Merge parameters
 * @param {Array} params.files - Array of file paths to merge
 * @param {string} params.outputPath - Output file path
 * @param {boolean} [params.createBackup] - Create backup of existing file
 * @param {boolean} [params.fillMissing] - Fill missing sections with defaults
 * @returns {Promise<{success: boolean, outputPath: string, message?: string}>}
 */
export async function mergeConfig({ files, outputPath, createBackup, fillMissing }) {
  return fetchAPI('/api/merge-config', {
    method: 'POST',
    body: JSON.stringify({ files, outputPath, createBackup, fillMissing })
  });
}

/**
 * Split config file into multiple files
 * @param {Object} params - Split parameters
 * @param {string} params.configPath - Path to config file to split
 * @param {string} params.outputDirectory - Output directory for split files
 * @param {boolean} [params.createBackup] - Create backup of original file
 * @returns {Promise<{success: boolean, files: Array, message?: string}>}
 */
export async function splitConfig({ configPath, outputDirectory, createBackup }) {
  return fetchAPI('/api/split-config', {
    method: 'POST',
    body: JSON.stringify({ configPath, outputDirectory, createBackup })
  });
}

/**
 * Backup config file
 * @param {Object} params - Backup parameters
 * @param {string} params.filePath - Path to file to backup
 * @param {string} [params.backupDirectory] - Directory for backup (optional)
 * @returns {Promise<{success: boolean, backupPath: string, message?: string}>}
 */
export async function backupConfig({ filePath, backupDirectory }) {
  return fetchAPI('/api/backup-config', {
    method: 'POST',
    body: JSON.stringify({ filePath, backupDirectory })
  });
}
