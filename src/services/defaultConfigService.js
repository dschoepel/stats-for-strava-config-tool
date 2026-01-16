/**
 * Service for fetching and saving default configuration files from
 * Statistics for Strava documentation
 */

import { saveFile, checkFileExists } from './fileService';

/**
 * Fetch default configuration content from docs site
 * @param {string} fileType - 'config' or 'gear-maintenance'
 * @returns {Promise<{success: boolean, content?: string, error?: string, hasPlaceholders?: boolean}>}
 */
export async function fetchDefaultContent(fileType) {
  try {
    const response = await fetch('/api/fetch-default-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileType })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[defaultConfigService] Fetch error:', error);
    return {
      success: false,
      error: `Network error: ${error.message}`
    };
  }
}

/**
 * Pull default configuration file from docs and save to target directory
 * @param {string} fileType - 'config' or 'gear-maintenance'
 * @param {string} targetDirectory - Directory to save the file
 * @returns {Promise<{success: boolean, filePath?: string, error?: string, hasPlaceholders?: boolean}>}
 */
export async function pullDefaultConfig(fileType, targetDirectory) {
  try {
    // Step 1: Fetch YAML content from docs
    const fetchResult = await fetchDefaultContent(fileType);
    
    if (!fetchResult.success) {
      return {
        success: false,
        error: fetchResult.error,
        fallbackAvailable: fetchResult.fallbackAvailable
      };
    }
    
    // Step 2: Construct file path
    const fileName = fileType === 'config' ? 'config.yaml' : 'gear-maintenance.yaml';
    const filePath = `${targetDirectory}/${fileName}`;
    
    // Step 3: Save file
    const saveResult = await saveFile(filePath, fetchResult.content);
    
    if (!saveResult.success) {
      return {
        success: false,
        error: `Failed to save file: ${saveResult.error}`
      };
    }
    
    // Step 4: Return success
    return {
      success: true,
      filePath: saveResult.path,
      fileName,
      hasPlaceholders: fetchResult.hasPlaceholders,
      warning: fetchResult.warning
    };
    
  } catch (error) {
    console.error('[defaultConfigService] Pull error:', error);
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
}

/**
 * Check if a config file already exists before pulling
 * @param {string} fileType - 'config' or 'gear-maintenance'
 * @param {string} targetDirectory - Directory to check
 * @returns {Promise<boolean>}
 */
export async function checkDefaultConfigExists(fileType, targetDirectory) {
  try {
    const fileName = fileType === 'config' ? 'config.yaml' : 'gear-maintenance.yaml';
    const filePath = `${targetDirectory}/${fileName}`;
    
    const result = await checkFileExists(filePath);
    return result.exists;
  } catch (error) {
    console.error('[defaultConfigService] Check exists error:', error);
    return false;
  }
}

export const defaultConfigService = {
  fetchDefaultContent,
  pullDefaultConfig,
  checkDefaultConfigExists
};
