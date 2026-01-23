import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import * as YAML from 'yaml';

export const runtime = 'nodejs';

// Default console commands
const initialConsoleCommands = [
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
 * Expand tilde in path to home directory
 */
function expandPath(filePath) {
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Get the console commands file path
 */
function getConsoleCommandsPath(defaultPath) {
  const normalizedPath = defaultPath.replace(/[\\/]+$/, '').replace(/\\/g, '/');
  return expandPath(normalizedPath + '/settings/console-commands.yaml');
}

/**
 * Convert commands array to map-based YAML format
 *
 * Output format:
 *   commands:
 *     build-files:
 *       name: "Build Files"
 *       description: "Build Strava files"
 *       command: ["php", "bin/console", "build-files"]
 *       acceptsArgs: true  # optional
 *       argsDescription: "..."  # optional
 *       argsPlaceholder: "..."  # optional
 */
function toYAML(commands) {
  let yaml = '# Console Commands for Statistics for Strava\n';
  yaml += '# Managed by the Stats for Strava Config Tool\n';
  yaml += `# Updated: ${new Date().toISOString()}\n\n`;

  yaml += 'commands:\n';

  commands.forEach(cmd => {
    yaml += `  ${cmd.id}:\n`;
    yaml += `    name: "${cmd.name}"\n`;
    yaml += `    description: "${cmd.description}"\n`;
    yaml += `    command: ["php", "bin/console", "${cmd.command}"]\n`;
    
    // Add args fields if present
    if (cmd.acceptsArgs) {
      yaml += `    acceptsArgs: true\n`;
      if (cmd.argsDescription) {
        yaml += `    argsDescription: "${cmd.argsDescription}"\n`;
      }
      if (cmd.argsPlaceholder) {
        yaml += `    argsPlaceholder: "${cmd.argsPlaceholder}"\n`;
      }
    }
    
    yaml += '\n';
  });

  return yaml;
}

/**
 * GET - Read console commands from file
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const defaultPath = searchParams.get('defaultPath') || '/data/config/';

    const filePath = getConsoleCommandsPath(defaultPath);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = YAML.parse(content);

      if (parsed?.commands && typeof parsed.commands === 'object' && !Array.isArray(parsed.commands)) {
        // New map-based format
        const commands = Object.entries(parsed.commands).map(([id, entry]) => {
          // Extract the actual command name from the command array (last element)
          const commandName = Array.isArray(entry.command) && entry.command.length > 0
            ? entry.command[entry.command.length - 1]
            : id;
          
          return {
            id,
            name: entry.name || id,
            command: commandName,
            description: entry.description || '',
            acceptsArgs: entry.acceptsArgs || false,
            argsDescription: entry.argsDescription || '',
            argsPlaceholder: entry.argsPlaceholder || ''
          };
        });
        return NextResponse.json({
          success: true,
          commands,
          filePath
        });
      }

      if (parsed && Array.isArray(parsed.commands)) {
        // Legacy array-based format
        return NextResponse.json({
          success: true,
          commands: parsed.commands.map(cmd => ({
            id: cmd.id || '',
            name: cmd.name || '',
            command: cmd.command || '',
            description: cmd.description || ''
          })),
          filePath
        });
      }

      // Invalid format, return defaults
      return NextResponse.json({
        success: true,
        commands: initialConsoleCommands,
        filePath,
        isDefault: true
      });
    } catch (readError) {
      // File doesn't exist, return defaults
      if (readError.code === 'ENOENT') {
        return NextResponse.json({
          success: true,
          commands: initialConsoleCommands,
          filePath,
          isDefault: true
        });
      }
      throw readError;
    }
  } catch (error) {
    console.error('Console commands GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * POST - Save console commands to file
 */
export async function POST(request) {
  try {
    const { commands, defaultPath } = await request.json();

    if (!Array.isArray(commands)) {
      return NextResponse.json({
        success: false,
        error: 'Commands must be an array'
      }, { status: 400 });
    }

    const configPath = defaultPath || '/data/config/';
    const filePath = getConsoleCommandsPath(configPath);

    // Ensure settings directory exists
    const settingsDir = path.dirname(filePath);
    await fs.mkdir(settingsDir, { recursive: true });

    // Write the file
    const yamlContent = toYAML(commands);
    await fs.writeFile(filePath, yamlContent, 'utf8');

    return NextResponse.json({
      success: true,
      message: 'Console commands saved successfully',
      filePath,
      commandCount: commands.length
    });
  } catch (error) {
    console.error('Console commands POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
