import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

// Configuration
const PORT = process.env.PORT || 8080;
const COMMANDS_FILE = process.env.COMMANDS_FILE || '/var/www/commands.yaml';
const LOG_FILE = process.env.LOG_FILE || '/var/log/strava-runner/runner.log';
const WORKING_DIR = process.env.WORKING_DIR || '/var/www';
const RELOAD_INTERVAL_MS = 5000;

// In-memory command cache
let allowedCommands = new Map();
let lastYamlMtime = 0;

/**
 * Structured JSON logging - appends to log file and stdout
 */
function log(entry) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...entry
  };
  const line = JSON.stringify(logEntry) + '\n';

  // Ensure log directory exists
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (err) {
      console.error(`Failed to create log directory: ${err.message}`);
    }
  }

  // Append to log file
  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch (err) {
    console.error(`Failed to write to log file: ${err.message}`);
  }

  // Also log to stdout
  console.log(line.trim());
}

/**
 * Load commands from YAML file
 */
function loadCommands() {
  try {
    if (!fs.existsSync(COMMANDS_FILE)) {
      log({ event: 'config_warning', message: `Commands file not found: ${COMMANDS_FILE}` });
      return;
    }

    const stats = fs.statSync(COMMANDS_FILE);
    if (stats.mtimeMs === lastYamlMtime) {
      return; // No changes
    }
    lastYamlMtime = stats.mtimeMs;

    const content = fs.readFileSync(COMMANDS_FILE, 'utf8');
    const parsed = YAML.parse(content);

    allowedCommands.clear();
    if (parsed?.commands && Array.isArray(parsed.commands)) {
      for (const cmd of parsed.commands) {
        if (cmd.id && cmd.command) {
          allowedCommands.set(cmd.command, cmd);
        }
      }
    }
    log({ event: 'config_reload', commandCount: allowedCommands.size, commands: Array.from(allowedCommands.keys()) });
  } catch (err) {
    log({ event: 'config_error', error: err.message });
  }
}

/**
 * Validate command against allowlist
 */
function isCommandAllowed(command) {
  return allowedCommands.has(command);
}

/**
 * Validate command format (alphanumeric, hyphens, underscores, colons)
 */
function isValidCommandFormat(command) {
  return /^[a-zA-Z0-9\-_:]+$/.test(command);
}

/**
 * Parse JSON body from request
 */
async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Limit body size to 1MB
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Handle POST /run requests - execute command and stream output
 */
async function handleRun(req, res) {
  let body;
  try {
    body = await parseJsonBody(req);
  } catch (err) {
    sendJson(res, 400, { success: false, error: err.message });
    return;
  }

  const { command } = body;

  if (!command) {
    sendJson(res, 400, { success: false, error: 'Missing command field' });
    return;
  }

  // Validate command format
  if (!isValidCommandFormat(command)) {
    sendJson(res, 400, { success: false, error: 'Invalid command format. Only alphanumeric characters, hyphens, underscores, and colons are allowed.' });
    return;
  }

  // Validate against allowlist
  if (!isCommandAllowed(command)) {
    sendJson(res, 403, {
      success: false,
      error: `Command "${command}" is not in the allowed list`,
      allowedCommands: Array.from(allowedCommands.keys())
    });
    return;
  }

  const fullCommand = `php bin/console ${command}`;
  const startTime = Date.now();

  // Log start
  log({
    event: 'start',
    command,
    fullCommand
  });

  // Set up SSE streaming
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });

  // Send event helper
  const sendEvent = (type, data) => {
    const payload = JSON.stringify({ type, data });
    res.write(`data: ${payload}\n\n`);
  };

  // Send initial event
  sendEvent('start', { command, fullCommand });

  // Spawn the process - NO SHELL for security
  const child = spawn('php', ['bin/console', command], {
    cwd: WORKING_DIR,
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => {
    const text = data.toString();
    // Send each line as a separate event
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        sendEvent('stdout', line);
        log({ event: 'stdout', command, chunk: line });
      }
    }
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        sendEvent('stderr', line);
        log({ event: 'stderr', command, chunk: line });
      }
    }
  });

  child.on('close', (code) => {
    const durationMs = Date.now() - startTime;

    log({
      event: 'exit',
      command,
      fullCommand,
      exitCode: code,
      durationMs
    });

    sendEvent('exit', { code, durationMs });
    res.end();
  });

  child.on('error', (err) => {
    const durationMs = Date.now() - startTime;

    log({
      event: 'error',
      command,
      fullCommand,
      error: err.message,
      durationMs
    });

    sendEvent('error', { message: err.message, durationMs });
    res.end();
  });

  // Handle client disconnect
  req.on('close', () => {
    if (!child.killed) {
      child.kill('SIGTERM');
      log({ event: 'client_disconnect', command });
    }
  });
}

/**
 * Handle GET /commands - list allowed commands
 */
function handleCommands(req, res) {
  const commands = Array.from(allowedCommands.values());
  sendJson(res, 200, { success: true, commands });
}

/**
 * Handle GET /health - health check
 */
function handleHealth(req, res) {
  sendJson(res, 200, {
    status: 'ok',
    commandCount: allowedCommands.size,
    uptime: process.uptime()
  });
}

/**
 * Main HTTP request handler
 */
function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers for browser clients
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Route requests
  if (url.pathname === '/health' && req.method === 'GET') {
    handleHealth(req, res);
    return;
  }

  if (url.pathname === '/commands' && req.method === 'GET') {
    handleCommands(req, res);
    return;
  }

  if (url.pathname === '/run' && req.method === 'POST') {
    handleRun(req, res);
    return;
  }

  // 404 for everything else
  sendJson(res, 404, { error: 'Not found', availableEndpoints: ['GET /health', 'GET /commands', 'POST /run'] });
}

// Initialize
loadCommands();

// Set up periodic reload
setInterval(loadCommands, RELOAD_INTERVAL_MS);

// Start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  log({ event: 'server_start', port: PORT, workingDir: WORKING_DIR, commandsFile: COMMANDS_FILE });
  console.log(`strava-runner listening on port ${PORT}`);
  console.log(`Working directory: ${WORKING_DIR}`);
  console.log(`Commands file: ${COMMANDS_FILE}`);
  console.log(`Log file: ${LOG_FILE}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log({ event: 'server_stop', reason: 'SIGTERM' });
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log({ event: 'server_stop', reason: 'SIGINT' });
  server.close(() => {
    process.exit(0);
  });
});
