/**
 * Sports List Initializer
 * Initializes sports list on app startup and ensures file exists
 */

import { getSetting } from './settingsManager.js';
import { INITIAL_SPORTS_LIST } from '../../app/api/config/defaults.js';
import { checkFileExists, saveSportsList } from '../services';

// Re-export for backwards compatibility
export const initialSportsList = INITIAL_SPORTS_LIST;

/**
 * Get the full path to the sports list file
 * @returns {string} Full path to sports list file
 */
function getSportsListPath() {
  const defaultPath = getSetting('files.defaultPath', '~/Documents/strava-config-tool/');
  // Remove trailing slashes and normalize to forward slashes for cross-platform compatibility
  const normalizedPath = defaultPath.replace(/[\\/]+$/, '').replace(/\\/g, '/');
  return normalizedPath + '/settings/strava-sports-by-category.yaml';
}

/**
 * Check if sports list file exists
 * @returns {Promise<boolean>} True if file exists
 */
async function sportsListFileExists() {
  try {
    const filePath = getSportsListPath();
    const result = await checkFileExists(filePath);
    return result.exists;
  } catch (error) {
    console.error('Error checking sports list file:', error);
    return false;
  }
}

/**
 * Create sports list file with defaults
 * @param {string} defaultPath - Base path for config files
 * @returns {Promise<boolean>} Success status
 */
async function createDefaultSportsList(defaultPath) {
  try {
    console.log('Creating default sports list file...');

    const filePath = getSportsListPath();
    const result = await saveSportsList(filePath, initialSportsList);

    if (result.success) {
      console.log('✅ Default sports list created');
      return true;
    } else {
      console.error('Failed to create sports list:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error creating default sports list:', error);
    return false;
  }
}

/**
 * Initialize sports list on app startup
 * Checks if the file exists and creates it with defaults if not
 * 
 * @returns {Promise<Object>} Result with status and message
 */
export async function initializeSportsList() {
  try {
    console.log('🔄 Initializing sports list...');
    
    // Check if sports list file exists
    const fileExists = await sportsListFileExists();
    
    if (!fileExists) {
      console.log('Sports list file not found, creating with defaults...');
      const defaultPath = getSetting('files.defaultPath', '~/Documents/strava-config-tool/');
      const created = await createDefaultSportsList(defaultPath);
      
      if (!created) {
        return {
          success: false,
          message: 'Failed to create sports list file'
        };
      }
    } else {
      console.log('Sports list file found');
    }
    
    return {
      success: true,
      message: 'Sports list initialized'
    };
    
  } catch (error) {
    console.error('Error initializing sports list:', error);
    return {
      success: false,
      message: error.message
    };
  }
}
