/* eslint-env node */

/**
 * Centralized default configuration for the application
 * This file contains all default paths and settings used across API routes
 */

export const DEFAULT_CONFIG_PATH = '/data/statistics-for-strava/config/';

/**
 * Get the default configuration path from environment or fallback to default
 * @returns {string} The configuration directory path
 */
export function getDefaultConfigPath() {
  return process.env.DEFAULT_STATS_CONFIG_PATH || DEFAULT_CONFIG_PATH;
}
