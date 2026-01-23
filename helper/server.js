import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

// Configuration
const PORT = process.env.PORT || 8081;
const COMMANDS_FILE = process.env.COMMANDS_FILE || '/var/www/console-commands.yaml';
const TARGET_CONTAINER = process.env.TARGET_CONTAINER || 'statistics-for-strava';
const LOG_FILE = process.env.LOG_FILE || '/var/log/strava-helper/helper.log';
const RELOAD_INTERVAL_MS = 5000;

// In-memory command cache
let allowedCommands = new Map();
let lastYamlMtime = 0;

/**
 * Structured JSON logging
 */
function log(entry) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...entry
  };
  const line = JSON.stringify(logEntry) + '\n';

  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (err) {
      console.error(`Failed to create log directory: ${err.message}`);
    }
  }

  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch (err) {
    console.error(`Failed to write to log file: ${err.message}`);
  }

  console.log(line.trim());
}

/**
 * Load commands from console-commands.yaml (map-based format)
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
    if (parsed?.commands && typeof parsed.commands === 'object') {
      for (const [id, entry] of Object.entries(parsed.commands)) {
        if (Array.isArray(entry.command) && entry.command.length > 0) {
          // Validate all command array elements are strings
          if (entry.command.every(arg => typeof arg === 'string')) {
            allowedCommands.set(id, entry);
          }
        }
      }
    }
    log({ event: 'config_reload', commandCount: allowedCommands.size, commands: Array.from(allowedCommands.keys()) });
  } catch (err) {
    log({ event: 'config_error', error: err.message });
  }
}

/**
 * Parse JSON body from request
 */
async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
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
 * Handle POST /run - execute command inside target container via docker exec
 */
async function handleRun(req, res) {
  let body;
  try {
    body = await parseJsonBody(req);
  } catch (err) {
    sendJson(res, 400, { success: false, error: err.message });
    return;
  }

  const { commandId } = body;

  if (!commandId || typeof commandId !== 'string') {
    sendJson(res, 400, { success: false, error: 'Missing or invalid commandId field' });
    return;
  }

  // Validate commandId format
  if (!/^[a-zA-Z0-9\-_:]+$/.test(commandId)) {
    sendJson(res, 400, { success: false, error: 'Invalid commandId format' });
    return;
  }

  // Validate against allowlist
  const entry = allowedCommands.get(commandId);
  if (!entry) {
    sendJson(res, 403, {
      success: false,
      error: `Unknown command: "${commandId}"`,
      allowedCommands: Array.from(allowedCommands.keys())
    });
    return;
  }

  const cmdArray = entry.command; // e.g. ["php", "bin/console", "webhooks-view"]
  const execArgs = ['exec', TARGET_CONTAINER, ...cmdArray];
  const startTime = Date.now();

  log({
    event: 'start',
    commandId,
    targetContainer: TARGET_CONTAINER,
    execArgs: ['docker', ...execArgs]
  });

  // Set up SSE streaming
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const sendEvent = (type, data) => {
    const payload = JSON.stringify({ type, data });
    res.write(`data: ${payload}\n\n`);
  };

  sendEvent('start', { commandId, command: cmdArray, targetContainer: TARGET_CONTAINER });

  // Spawn docker exec with array args - NO SHELL for security
  const child = spawn('docker', execArgs, {
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => {
    const text = data.toString();
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        sendEvent('stdout', line);
      }
    }
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        sendEvent('stderr', line);
      }
    }
  });

  child.on('close', (code) => {
    const durationMs = Date.now() - startTime;

    log({
      event: 'exit',
      commandId,
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
      commandId,
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
      log({ event: 'client_disconnect', commandId });
    }
  });
}

/**
 * Handle GET /health
 */
function handleHealth(req, res) {
  sendJson(res, 200, {
    status: 'ok',
    commandCount: allowedCommands.size,
    targetContainer: TARGET_CONTAINER,
    uptime: process.uptime()
  });
}

/**
 * Main HTTP request handler
 */
function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/health' && req.method === 'GET') {
    handleHealth(req, res);
    return;
  }

  if (url.pathname === '/run' && req.method === 'POST') {
    handleRun(req, res);
    return;
  }

  sendJson(res, 404, { error: 'Not found', availableEndpoints: ['GET /health', 'POST /run'] });
}

// Initialize
loadCommands();

// Set up periodic reload
setInterval(loadCommands, RELOAD_INTERVAL_MS);

// Start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  log({ event: 'server_start', port: PORT, targetContainer: TARGET_CONTAINER, commandsFile: COMMANDS_FILE });
  console.log(`strava-command-helper listening on port ${PORT}`);
  console.log(`Target container: ${TARGET_CONTAINER}`);
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
