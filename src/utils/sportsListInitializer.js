/**
 * Sports List Initializer
 * Initializes sports list on app startup and ensures file exists
 */

import { getSetting } from './settingsManager.js';

// Initial sports list (default if file doesn't exist)
const initialSportsList = {
  Cycling: [
    'Ride', 'MountainBikeRide', 'GravelRide', 'EBikeRide', 'EMountainBikeRide', 'VirtualRide', 'Velomobile'
  ],
  Running: [
    'Run', 'TrailRun', 'VirtualRun', 'Walking', 'Walk', 'Hike'
  ],
  'Water sports': [
    'Canoeing', 'Kayaking', 'Kitesurf', 'Rowing', 'StandUpPaddling', 'Surfing', 'Swim', 'Windsurf'
  ],
  'Winter sports': [
    'BackcountrySki', 'AlpineSki', 'NordicSki', 'IceSkate', 'Snowboard', 'Snowshoe'
  ],
  Skating: [
    'InlineSkate', 'RollerSki', 'Skateboard'
  ],
  'Racquet & Paddle Sports': [
    'Badminton', 'Pickleball', 'Racquetball', 'Squash', 'TableTennis', 'Tennis'
  ],
  Fitness: [
    'Crossfit', 'WeightTraining', 'Workout', 'StairStepper', 'VirtualRow', 'Elliptical', 'HighIntensityIntervalTraining'
  ],
  'Mind & Body Sports': [
    'Pilates', 'Yoga'
  ],
  'Outdoor Sports': [
    'Golf', 'RockClimbing', 'Sail', 'Soccer'
  ],
  'Adaptive & Inclusive Sports': [
    'Handcycle', 'Wheelchair'
  ]
};

/**
 * Get the full path to the sports list file
 * @returns {string} Full path to sports list file
 */
function getSportsListPath() {
  const defaultPath = getSetting('files.defaultPath', '~/Documents/strava-config-tool/');
  const normalizedPath = defaultPath.endsWith('/') || defaultPath.endsWith('\\') 
    ? defaultPath 
    : defaultPath + '/';
  return normalizedPath + 'settings/strava-sports-by-category.yaml';
}

/**
 * Check if sports list file exists
 * @returns {Promise<boolean>} True if file exists
 */
async function sportsListFileExists() {
  try {
    const filePath = getSportsListPath();
    const response = await fetch('/api/check-file-exists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    });
    const result = await response.json();
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
    
    const response = await fetch('/api/sports-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        defaultPath: defaultPath || '~/Documents/strava-config-tool/',
        sportsList: initialSportsList 
      })
    });
    
    const result = await response.json();
    
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
