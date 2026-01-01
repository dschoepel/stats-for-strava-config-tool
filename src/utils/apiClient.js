/**
 * Centralized API client for all server API calls
 * Provides consistent error handling, request/response patterns, and logging
 */

/**
 * Base fetch wrapper with error handling
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} The response data
 */
async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok && !data.success) {
      throw new Error(data.error || `API request failed: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API Error [${url}]:`, error);
    throw error;
  }
}

// ==================== File Operations ====================

/**
 * Get file content from the server
 * @param {string} path - File path or object with method and body
 * @returns {Promise<Object>} { success, content, error }
 */
export async function getFileContent(path) {
  if (typeof path === 'string') {
    return fetchAPI(`/api/file-content?path=${encodeURIComponent(path)}`);
  } else {
    // Handle POST request with body
    return fetchAPI('/api/file-content', {
      method: 'POST',
      body: JSON.stringify(path),
    });
  }
}

/**
 * Save file to the server
 * @param {string} filePath - The file path
 * @param {string} content - The file content
 * @returns {Promise<Object>} { success, error }
 */
export async function saveFile(filePath, content) {
  return fetchAPI('/api/save-file', {
    method: 'POST',
    body: JSON.stringify({ filePath, content }),
  });
}

/**
 * Check if a file exists
 * @param {string} filePath - The file path to check
 * @returns {Promise<Object>} { exists, error }
 */
export async function checkFileExists(filePath) {
  return fetchAPI('/api/check-file-exists', {
    method: 'POST',
    body: JSON.stringify({ filePath }),
  });
}

/**
 * Expand a file path (resolve ~ and environment variables)
 * @param {string} path - The path to expand
 * @returns {Promise<Object>} { success, expandedPath, error }
 */
export async function expandPath(path) {
  return fetchAPI('/api/expand-path', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
}

// ==================== Configuration Operations ====================

/**
 * Get list of config files
 * @param {string} defaultPath - Optional default path to search
 * @returns {Promise<Object>} { success, files, directory, error }
 */
export async function getConfigFiles(defaultPath = null) {
  if (defaultPath) {
    return fetchAPI(`/api/config-files?defaultPath=${encodeURIComponent(defaultPath)}`);
  }
  return fetchAPI('/api/config-files');
}

/**
 * Set the config directory
 * @param {string} directory - The directory path
 * @returns {Promise<Object>} { success, files, directory, error }
 */
export async function setConfigDirectory(directory) {
  return fetchAPI('/api/config-files', {
    method: 'POST',
    body: JSON.stringify({ directory }),
  });
}

/**
 * Parse sections from config files
 * @param {Array} files - Array of file objects with name and path
 * @returns {Promise<Object>} { success, sectionToFileMap, error }
 */
export async function parseSections(files) {
  return fetchAPI('/api/parse-sections', {
    method: 'POST',
    body: JSON.stringify({ files }),
  });
}

/**
 * Validate config sections
 * @param {Array} files - Array of file objects
 * @returns {Promise<Object>} { success, conflicts, error }
 */
export async function validateSections(files) {
  return fetchAPI('/api/validate-sections', {
    method: 'POST',
    body: JSON.stringify({ files }),
  });
}

/**
 * Update a configuration section
 * @param {Object} params - Update parameters
 * @param {string} params.filePath - The file path
 * @param {string} params.sectionName - The section name
 * @param {Object} params.sectionData - The section data
 * @param {boolean} params.isAthlete - Whether this is athlete section
 * @param {Array} params.preserveNestedKeys - Keys to preserve in nested sections
 * @returns {Promise<Object>} { success, error }
 */
export async function updateSection({ filePath, sectionName, sectionData, isAthlete = false, preserveNestedKeys = [] }) {
  return fetchAPI('/api/update-section', {
    method: 'POST',
    body: JSON.stringify({
      filePath,
      sectionName,
      sectionData,
      isAthlete,
      preserveNestedKeys,
    }),
  });
}

/**
 * Merge config files into a single file
 * @param {string} directory - The directory containing config files
 * @returns {Promise<Object>} { success, error }
 */
export async function mergeConfigFiles(directory) {
  return fetchAPI('/api/merge-config', {
    method: 'POST',
    body: JSON.stringify({ directory }),
  });
}

/**
 * Split config file into multiple files
 * @param {string} directory - The directory containing config file
 * @returns {Promise<Object>} { success, error }
 */
export async function splitConfigFile(directory) {
  return fetchAPI('/api/split-config', {
    method: 'POST',
    body: JSON.stringify({ directory }),
  });
}

/**
 * Backup config files
 * @param {string} directory - The directory to backup
 * @returns {Promise<Object>} { success, backupPath, error }
 */
export async function backupConfig(directory) {
  return fetchAPI('/api/backup-config', {
    method: 'POST',
    body: JSON.stringify({ directory }),
  });
}

// ==================== Sports List Operations ====================

/**
 * Get sports list
 * @param {string} defaultPath - Optional default path
 * @returns {Promise<Object>} { success, sports, filePath, error }
 */
export async function getSportsList(defaultPath = null) {
  if (defaultPath) {
    return fetchAPI(`/api/sports-list?defaultPath=${encodeURIComponent(defaultPath)}`);
  }
  return fetchAPI('/api/sports-list');
}

/**
 * Save sports list
 * @param {string} filePath - The file path
 * @param {Array} sports - The sports array
 * @returns {Promise<Object>} { success, error }
 */
export async function saveSportsList(filePath, sports) {
  return fetchAPI('/api/sports-list', {
    method: 'POST',
    body: JSON.stringify({ filePath, sports }),
  });
}

// ==================== Environment Operations ====================

/**
 * Update environment variable
 * @param {string} key - Environment variable key
 * @param {string} value - Environment variable value
 * @returns {Promise<Object>} { success, error }
 */
export async function updateEnvVariable(key, value) {
  return fetchAPI('/api/update-env', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
}

// ==================== File Browser Operations ====================

/**
 * Browse files on the server
 * @param {string} path - The path to browse
 * @returns {Promise<Object>} { success, files, currentPath, error }
 */
export async function browseFiles(path = null) {
  if (path) {
    return fetchAPI(`/api/browse-files?path=${encodeURIComponent(path)}`);
  }
  return fetchAPI('/api/browse-files');
}

// ==================== Helper Functions ====================

/**
 * Handle API response with toast notifications
 * @param {Promise} apiPromise - The API promise to handle
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback (receives error message)
 * @returns {Promise<Object>} The API response
 */
export async function handleAPIResponse(apiPromise, onSuccess = null, onError = null) {
  try {
    const result = await apiPromise;
    
    if (result.success && onSuccess) {
      onSuccess(result);
    } else if (!result.success && onError) {
      onError(result.error || 'Operation failed');
    }
    
    return result;
  } catch (error) {
    if (onError) {
      onError(error.message || 'An unexpected error occurred');
    }
    throw error;
  }
}

/**
 * Batch API calls with error handling
 * @param {Array<Promise>} promises - Array of API promises
 * @param {boolean} sequential - Whether to run sequentially (default: false)
 * @returns {Promise<Array>} Array of results
 */
export async function batchAPIRequests(promises, sequential = false) {
  if (sequential) {
    const results = [];
    for (const promise of promises) {
      try {
        const result = await promise;
        results.push(result);
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  } else {
    return Promise.allSettled(promises).then(results =>
      results.map(r => (r.status === 'fulfilled' ? r.value : { success: false, error: r.reason?.message }))
    );
  }
}
