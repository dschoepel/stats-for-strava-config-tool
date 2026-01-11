/**
 * File Service - Handles all file system operations
 * Provides a centralized API layer for file-related operations
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
 * Read file content from server
 * @param {string} path - Absolute path to the file
 * @returns {Promise<{success: boolean, content: string, path: string}>}
 */
export async function readFile(path) {
  return fetchAPI(`/api/file-content?path=${encodeURIComponent(path)}`);
}

/**
 * Save file content to server
 * @param {string} filePath - Absolute path to the file
 * @param {string} content - File content to save
 * @returns {Promise<{success: boolean, path: string, message?: string}>}
 */
export async function saveFile(filePath, content) {
  return fetchAPI('/api/save-file', {
    method: 'POST',
    body: JSON.stringify({ path: filePath, content })
  });
}

/**
 * Check if file exists on server
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<{success: boolean, exists: boolean, path: string}>}
 */
export async function checkFileExists(filePath) {
  return fetchAPI('/api/check-file-exists', {
    method: 'POST',
    body: JSON.stringify({ filePath })
  });
}

/**
 * Expand tilde (~) paths to absolute paths
 * @param {string} path - Path with potential tilde
 * @returns {Promise<{success: boolean, expandedPath: string}>}
 */
export async function expandPath(path) {
  return fetchAPI('/api/expand-path', {
    method: 'POST',
    body: JSON.stringify({ path })
  });
}

/**
 * Browse files in directory
 * @param {string} [path] - Directory path to browse (optional)
 * @returns {Promise<{success: boolean, files: Array, currentPath: string}>}
 */
export async function browseFiles(path) {
  const url = path
    ? `/api/browse-files?path=${encodeURIComponent(path)}`
    : '/api/browse-files';
  return fetchAPI(url);
}

/**
 * Browse folders (alias for browseFiles)
 * @param {string} [path] - Directory path to browse (optional)
 * @returns {Promise<{success: boolean, files: Array, currentPath: string}>}
 */
export async function browseFolders(path) {
  return browseFiles(path);
}
