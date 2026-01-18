/* eslint-env node */

/**
 * Centralized default configuration for the application
 * This file contains all default paths and settings used across API routes
 */

export const DEFAULT_CONFIG_PATH = '/data/config/';
export const DEFAULT_GEAR_MAINTENANCE_PATH = '/data/storage/gear-maintenance';

/**
 * Get the default configuration path from environment or fallback to default
 * @returns {string} The configuration directory path
 */
export function getDefaultConfigPath() {
  return process.env.DEFAULT_STATS_CONFIG_PATH || DEFAULT_CONFIG_PATH;
}

/**
 * Get the default gear maintenance path from environment or fallback to default
 * @returns {string} The gear maintenance directory path
 */
export function getDefaultGearMaintenancePath() {
  return process.env.DEFAULT_GEAR_MAINTENANCE_PATH || DEFAULT_GEAR_MAINTENANCE_PATH;
}

/**
 * Initial sports list structure (default if file doesn't exist)
 * Single source of truth for sports categories and types
 */
export const INITIAL_SPORTS_LIST = {
  Cycling: [
    'Ride', 'MountainBikeRide', 'GravelRide', 'EBikeRide', 'EMountainBikeRide', 'VirtualRide', 'Velomobile'
  ],
  Running: [
    'Run', 'TrailRun', 'VirtualRun'
  ],
  Walking: [
    'Walk', 'Hike'
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
