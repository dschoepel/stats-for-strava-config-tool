/**
 * Console Commands Manager
 * Manages console commands stored in a file for the SFS Console utility
 */

import { getSetting } from './settingsManager.js';
import * as YAML from 'yaml';
import { readFile, saveFile } from '../services';

const CONSOLE_COMMANDS_FILENAME = 'console-commands.yaml';

/**
 * Get the full path to the console commands file
 * @returns {string} Full path to console commands file
 */
function getConsoleCommandsPath() {
  const defaultPath = getSetting('files.defaultPath', '~/Documents/strava-config-tool/');
  // Remove trailing slashes and normalize to forward slashes for cross-platform compatibility
  const normalizedPath = defaultPath.replace(/[\\/]+$/, '').replace(/\\/g, '/');
  return normalizedPath + '/settings/' + CONSOLE_COMMANDS_FILENAME;
}

/**
 * Convert console commands array to YAML string
 * @param {Array} commands - Console commands array
 * @returns {string} YAML formatted string
 */
function toYAML(commands) {
  let yaml = '# Console Commands for Statistics for Strava\n';
  yaml += '# These commands are available in the Strava Console utility\n';
  yaml += `# Generated on ${new Date().toISOString()}\n\n`;

  yaml += 'commands:\n';

  commands.forEach(cmd => {
    yaml += `  - id: "${cmd.id}"\n`;
    yaml += `    name: "${cmd.name}"\n`;
    yaml += `    command: "${cmd.command}"\n`;
    yaml += `    description: "${cmd.description}"\n`;
    yaml += '\n';
  });

  return yaml;
}

/**
 * Parse YAML string to console commands array
 * @param {string} yamlContent - YAML content
 * @returns {Array} Console commands array
 */
function fromYAML(yamlContent) {
  try {
    const parsed = YAML.parse(yamlContent);
    if (parsed && Array.isArray(parsed.commands)) {
      return parsed.commands.map(cmd => ({
        id: cmd.id || '',
        name: cmd.name || '',
        command: cmd.command || '',
        description: cmd.description || ''
      }));
    }
    return initialConsoleCommands;
  } catch (error) {
    console.error('Error parsing console commands YAML:', error);
    return initialConsoleCommands;
  }
}

// Default console commands
export const initialConsoleCommands = [
  {
    id: 'build-files',
    name: 'Build Files',
    command: 'build-files',
    description: 'Build Strava files'
  },
  {
    id: 'import-data',
    name: 'Import Data',
    command: 'import-data',
    description: 'Import Strava data'
  },
  {
    id: 'webhooks-create',
    name: 'Webhooks Create',
    command: 'webhooks-create',
    description: 'Create a Strava webhook subscription'
  },
  {
    id: 'webhooks-unsubscribe',
    name: 'Webhooks Unsubscribe',
    command: 'webhooks-unsubscribe',
    description: 'Delete a Strava webhook subscription'
  },
  {
    id: 'webhooks-view',
    name: 'Webhooks View',
    command: 'webhooks-view',
    description: 'View Strava webhook subscription(s)'
  }
];

/**
 * Read console commands from file
 * Creates the file with defaults if it doesn't exist
 * @returns {Promise<Array>} Console commands array
 */
export async function readConsoleCommands() {
  try {
    const filePath = getConsoleCommandsPath();
    const result = await readFile(filePath);

    if (result.success && result.content) {
      const parsed = fromYAML(result.content);
      return parsed;
    }

    // File doesn't exist yet, create it with defaults
    console.log('Console commands file not found, creating with defaults:', filePath);
    await writeConsoleCommands(initialConsoleCommands);
    return initialConsoleCommands;
  } catch (error) {
    console.error('Error reading console commands:', error);
    // Try to create the file even on error (might be first run)
    try {
      await writeConsoleCommands(initialConsoleCommands);
      return initialConsoleCommands;
    } catch (writeError) {
      console.error('Error creating default console commands file:', writeError);
      return initialConsoleCommands;
    }
  }
}

/**
 * Write console commands to file
 * @param {Array} commands - Console commands array
 * @returns {Promise<boolean>} Success status
 */
export async function writeConsoleCommands(commands) {
  try {
    const filePath = getConsoleCommandsPath();
    const yamlContent = toYAML(commands);

    const result = await saveFile(filePath, yamlContent);

    if (!result.success) {
      throw new Error(result.error || 'Failed to write console commands');
    }

    return true;
  } catch (error) {
    console.error('Error writing console commands:', error);
    throw error;
  }
}

/**
 * Get a specific console command by id
 * @param {string} commandId - ID of the command
 * @returns {Object|null} Command object or null if not found
 */
export async function getConsoleCommand(commandId) {
  const commands = await readConsoleCommands();
  return commands.find(cmd => cmd.id === commandId) || null;
}

/**
 * Add or update a console command
 * @param {Object} command - Command object
 * @returns {boolean} Success status
 */
export async function saveConsoleCommand(command) {
  try {
    const commands = await readConsoleCommands();
    const existingIndex = commands.findIndex(cmd => cmd.id === command.id);

    if (existingIndex >= 0) {
      commands[existingIndex] = command;
    } else {
      commands.push(command);
    }

    await writeConsoleCommands(commands);
    return true;
  } catch (error) {
    console.error('Error saving console command:', error);
    return false;
  }
}

/**
 * Delete a console command
 * @param {string} commandId - ID of the command to delete
 * @returns {boolean} Success status
 */
export async function deleteConsoleCommand(commandId) {
  try {
    const commands = await readConsoleCommands();
    const filteredCommands = commands.filter(cmd => cmd.id !== commandId);
    await writeConsoleCommands(filteredCommands);
    return true;
  } catch (error) {
    console.error('Error deleting console command:', error);
    return false;
  }
}

/**
 * Reset console commands to initial defaults
 */
export async function resetConsoleCommands() {
  try {
    await writeConsoleCommands(initialConsoleCommands);
    return true;
  } catch (error) {
    console.error('Error resetting console commands:', error);
    return false;
  }
}

/**
 * Validate if a command is in the allowed list
 * @param {string} command - Command to validate
 * @returns {Promise<boolean>} Whether command is valid
 */
export async function isValidCommand(command) {
  const commands = await readConsoleCommands();
  return commands.some(cmd => cmd.command === command);
}
