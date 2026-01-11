/**
 * Gear Service - Handles gear maintenance operations
 * Provides a centralized API layer for gear-related operations
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
 * Load gear maintenance config
 * @param {string} defaultPath - Default path for gear maintenance file
 * @returns {Promise<{success: boolean, config: Object, path: string}>}
 */
export async function loadGearMaintenance(defaultPath) {
  return fetchAPI(`/api/gear-maintenance?defaultPath=${encodeURIComponent(defaultPath)}`);
}

/**
 * Save gear maintenance config
 * @param {Object} params - Save parameters
 * @param {string} params.defaultPath - Default path for gear maintenance file
 * @param {Object} params.config - Gear maintenance config object
 * @returns {Promise<{success: boolean, path: string, message?: string}>}
 */
export async function saveGearMaintenance({ defaultPath, config }) {
  return fetchAPI('/api/gear-maintenance', {
    method: 'POST',
    body: JSON.stringify({ defaultPath, config })
  });
}

/**
 * Upload gear maintenance image
 * @param {File} file - Image file to upload
 * @param {string} [customPath] - Custom path for image storage (optional)
 * @returns {Promise<{success: boolean, filename: string, path: string, message?: string}>}
 */
export async function uploadGearImage(file, customPath) {
  const formData = new FormData();
  formData.append('file', file);  // Server expects 'file', not 'image'

  // Add path to FormData if provided
  if (customPath) {
    formData.append('path', customPath);
  }

  const response = await fetch('/api/gear-maintenance-images', {
    method: 'POST',
    body: formData
    // Note: Don't set Content-Type header for FormData
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Upload failed');
  }

  return data;
}

/**
 * List gear maintenance images
 * @param {string} [customPath] - Custom path for image storage (optional)
 * @returns {Promise<{success: boolean, images: Array, path: string}>}
 */
export async function listGearImages(customPath) {
  const url = customPath
    ? `/api/gear-maintenance-images?path=${encodeURIComponent(customPath)}`
    : '/api/gear-maintenance-images';
  return fetchAPI(url);
}

/**
 * Delete gear maintenance image
 * @param {string} filename - Image filename to delete
 * @param {string} [customPath] - Custom path for image storage (optional)
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function deleteGearImage(filename, customPath) {
  const url = customPath
    ? `/api/gear-maintenance-images?filename=${encodeURIComponent(filename)}&path=${encodeURIComponent(customPath)}`
    : `/api/gear-maintenance-images?filename=${encodeURIComponent(filename)}`;

  const response = await fetch(url, { method: 'DELETE' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Delete failed');
  }

  return data;
}
