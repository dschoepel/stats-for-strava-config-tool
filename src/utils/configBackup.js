// Utility functions for backing up config files

/**
 * Generate a timestamped backup filename
 * @param {string} originalFileName - The original filename
 * @returns {string} - Backup filename with timestamp
 */
export function generateBackupFileName(originalFileName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const nameParts = originalFileName.split('.');
  const extension = nameParts.pop();
  const name = nameParts.join('.');
  
  return `${name}_backup_${timestamp}.${extension}`;
}

/**
 * Get the backup directory path
 * @param {string} configPath - The main config directory path
 * @returns {string} - Backup directory path
 */
export function getBackupDirPath(configPath) {
  // Remove trailing slash if present
  const cleanPath = configPath.replace(/[\\/]$/, '');
  return `${cleanPath}/config-backups`;
}
