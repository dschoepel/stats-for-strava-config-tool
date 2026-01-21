import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import * as YAML from 'yaml';

export const runtime = 'nodejs';

// Directory for storing command logs
const LOG_DIR = './strava-sh-logs';

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
 * Read allowed commands from console-commands.yaml
 */
async function getAllowedCommands(defaultPath) {
  try {
    const filePath = getConsoleCommandsPath(defaultPath);
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = YAML.parse(content);

    if (parsed && Array.isArray(parsed.commands)) {
      return parsed.commands.map(cmd => cmd.command);
    }
  } catch (error) {
    // Return default commands if file doesn't exist
    console.log('Using default allowed commands');
  }

  // Default allowed commands
  return [
    'build-files',
    'import-data',
    'webhooks-create',
    'webhooks-unsubscribe',
    'webhooks-view'
  ];
}

/**
 * Validate command against allow-list
 */
async function isCommandAllowed(command, defaultPath) {
  const allowedCommands = await getAllowedCommands(defaultPath);
  return allowedCommands.includes(command);
}

/**
 * POST - Execute an SFS console command with SSE streaming
 */
export async function POST(request) {
  try {
    const { command, defaultPath } = await request.json();

    if (!command) {
      return NextResponse.json({
        success: false,
        error: 'Command is required'
      }, { status: 400 });
    }

    // Validate command against allow-list
    const configPath = defaultPath || '/data/config/';
    const isAllowed = await isCommandAllowed(command, configPath);

    if (!isAllowed) {
      return NextResponse.json({
        success: false,
        error: `Command "${command}" is not in the allowed list. Add it via Settings > Console Commands.`
      }, { status: 400 });
    }

    // Sanitize command - only allow alphanumeric, hyphens, underscores
    if (!/^[a-zA-Z0-9\-_]+$/.test(command)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid command format. Only alphanumeric characters, hyphens, and underscores are allowed.'
      }, { status: 400 });
    }

    // Create log file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFileName = `${command}-${timestamp}.log`;
    const logPath = path.join(LOG_DIR, logFileName);

    // Ensure log directory exists
    await fs.mkdir(LOG_DIR, { recursive: true });

    // Build the full docker command
    const dockerArgs = [
      'compose', 'exec', '-T', 'app',
      'bin/console', `app:strava:${command}`
    ];

    // Create SSE stream
    const encoder = new TextEncoder();
    let logLines = [];

    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;

        const sendEvent = (type, data) => {
          if (isClosed) return; // Don't send if controller is closed

          try {
            const message = `data: ${JSON.stringify({ type, data })}\n\n`;
            controller.enqueue(encoder.encode(message));

            // Also log to file
            const logLine = typeof data === 'object' ? JSON.stringify(data) : data;
            logLines.push(`[${new Date().toISOString()}] [${type}] ${logLine}`);
          } catch (e) {
            // Controller might be closed, ignore
            console.error('Error sending event:', e.message);
          }
        };

        const closeController = async () => {
          if (isClosed) return;
          isClosed = true;

          // Write log file before closing
          try {
            await fs.writeFile(logPath, logLines.join('\n'), 'utf8');
          } catch (logError) {
            console.error('Failed to write log file:', logError);
          }

          try {
            controller.close();
          } catch (e) {
            // Already closed, ignore
          }
        };

        try {
          // Send initial message
          sendEvent('info', `Executing: docker compose exec app bin/console app:strava:${command}`);
          sendEvent('info', '---');

          // Spawn docker compose exec command
          const child = spawn('docker', dockerArgs, {
            shell: false,
            stdio: ['pipe', 'pipe', 'pipe']
          });

          child.stdout.on('data', (data) => {
            const text = data.toString();
            // Split by lines and send each line
            text.split('\n').forEach(line => {
              if (line.trim()) {
                sendEvent('stdout', line);
              }
            });
          });

          child.stderr.on('data', (data) => {
            const text = data.toString();
            text.split('\n').forEach(line => {
              if (line.trim()) {
                sendEvent('stderr', line);
              }
            });
          });

          child.on('close', async (code) => {
            sendEvent('info', '---');
            sendEvent('info', `Command exited with code: ${code}`);
            sendEvent('complete', {
              code,
              logPath,
              success: code === 0
            });

            await closeController();
          });

          child.on('error', async (err) => {
            sendEvent('error', `Failed to execute command: ${err.message}`);

            // Check if it's a Docker-related error
            if (err.message.includes('ENOENT')) {
              sendEvent('error', 'Docker command not found. Make sure Docker is installed and in your PATH.');
              sendEvent('error', 'This command must be run from within a Docker environment.');
            }

            sendEvent('complete', {
              code: 1,
              logPath,
              success: false,
              error: err.message
            });

            await closeController();
          });

        } catch (error) {
          sendEvent('error', error.message);
          await closeController();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });

  } catch (error) {
    console.error('Run Strava command error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
