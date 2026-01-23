import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

// Configuration
const PORT = process.env.PORT || 8080;
const COMMANDS_FILE = process.env.COMMANDS_FILE || '/var/www/console-commands.yaml';
const HELPER_URL = process.env.HELPER_URL || 'http://strava-command-helper:8081';
const LOG_FILE = process.env.LOG_FILE || '/var/log/strava-runner/runner.log';
const RELOAD_INTERVAL_MS = 5000;
const DISCOVER_TIMEOUT_MS = 35000;

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
 * Load commands from console-commands.yaml (map-based format)
 *
 * Expected format:
 *   commands:
 *     build-files:
 *       name: "Build Files"
 *       description: "Build Strava files"
 *       command: ["php", "bin/console", "build-files"]
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
            allowedCommands.set(id, {
              ...entry,
              acceptsArgs: entry.acceptsArgs || false,
              argsDescription: entry.argsDescription,
              argsPlaceholder: entry.argsPlaceholder
            });
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
 * Validate command format (alphanumeric, hyphens, underscores, colons)
 */
function isValidCommandFormat(command) {
  return /^[a-zA-Z0-9\-_:]+$/.test(command);
}

/**
 * Validate command against allowlist
 */
function isCommandAllowed(command) {
  return allowedCommands.has(command);
}

/**
 * Validate command arguments for safety
 * @param {string[]} args - Array of argument strings
 * @returns {{valid: boolean, error?: string}}
 */
function validateArgs(args) {
  if (!Array.isArray(args)) {
    return { valid: false, error: 'Arguments must be an array' };
  }
  
  // Limit number of args
  if (args.length > 10) {
    return { valid: false, error: 'Too many arguments (max 10)' };
  }
  
  // Validate each arg
  for (const arg of args) {
    // Must be string
    if (typeof arg !== 'string') {
      return { valid: false, error: 'All arguments must be strings' };
    }
    
    // Reasonable length
    if (arg.length > 100) {
      return { valid: false, error: 'Argument too long (max 100 characters)' };
    }
    
    // No dangerous characters
    const dangerousPattern = /[;&|`$(){}[\]<>\\'"]/ ;
    if (dangerousPattern.test(arg)) {
      return { valid: false, error: 'Arguments contain invalid characters' };
    }
    
    // No flags
    if (arg.startsWith('-')) {
      return { valid: false, error: 'Flags are not allowed in arguments' };
    }
    
    // No empty strings
    if (arg.trim().length === 0) {
      return { valid: false, error: 'Empty arguments are not allowed' };
    }
  }
  
  return { valid: true };
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
      } catch {
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
  try {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch {
    // Connection already closed
  }
}

/**
 * Handle POST /run - validate command and proxy to the helper container
 */
async function handleRun(req, res) {
  let body;
  try {
    body = await parseJsonBody(req);
  } catch (err) {
    sendJson(res, 400, { success: false, error: err.message });
    return;
  }

  const { command, args = [] } = body;

  if (!command) {
    sendJson(res, 400, { success: false, error: 'Missing command field' });
    return;
  }

  // Validate args is array
  if (!Array.isArray(args)) {
    sendJson(res, 400, { 
      success: false, 
      error: 'Arguments must be an array' 
    });
    return;
  }

  // Validate command format
  if (!isValidCommandFormat(command)) {
    sendJson(res, 400, { success: false, error: 'Invalid command format. Only alphanumeric characters, hyphens, underscores, and colons are allowed.' });
    return;
  }

  // Enforce app:strava:* restriction
  if (!command.startsWith('app:strava:')) {
    sendJson(res, 403, { 
      success: false, 
      error: 'Only app:strava:* commands are allowed' 
    });
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

  // Get command entry for args validation
  const entry = allowedCommands.get(command);

  // Validate args usage
  if (args.length > 0 && !entry.acceptsArgs) {
    sendJson(res, 400, { 
      success: false, 
      error: `Command "${command}" does not accept arguments` 
    });
    return;
  }

  if (entry.acceptsArgs && args.length === 0) {
    sendJson(res, 400, { 
      success: false, 
      error: `Command "${command}" requires arguments: ${entry.argsDescription || 'arguments required'}` 
    });
    return;
  }

  // Validate args safety
  if (args.length > 0) {
    const argsValidation = validateArgs(args);
    if (!argsValidation.valid) {
      sendJson(res, 400, { 
        success: false, 
        error: argsValidation.error 
      });
      return;
    }
  }

  const startTime = Date.now();

  // Log start
  log({
    event: 'start',
    command,
    args,
    helperUrl: HELPER_URL
  });

  // Set up SSE streaming
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });

  // Send event helper function
  const sendEvent = (type, data) => {
    try {
      const payload = JSON.stringify({ type, data });
      res.write(`data: ${payload}\n\n`);
    } catch {
      // Connection already closed
    }
  };

  // AbortController for propagating client disconnect to helper
  const controller = new AbortController();

  // Handle client disconnect - abort the upstream fetch
  req.on('close', () => {
    controller.abort();
    log({ event: 'client_disconnect', command });
  });

  try {
    // Forward to the command helper container
    const helperRes = await fetch(`${HELPER_URL}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        commandId: command,
        args: args 
      }),
      signal: controller.signal
    });

    if (!helperRes.ok) {
      let errorMsg = 'Helper request failed';
      try {
        const errData = await helperRes.json();
        errorMsg = errData.error || errorMsg;
      } catch {
        // Ignore parse errors
      }
      log({ event: 'error', command, error: errorMsg });
      sendEvent('error', { message: errorMsg });
      try { res.end(); } catch { /* already closed */ }
      return;
    }

    // Stream the helper's SSE response through to the client
    const reader = helperRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      try {
        res.write(chunk);
      } catch {
        // Client disconnected, abort will handle cleanup
        break;
      }

      // Log streamed events (parse to capture exit events for logging)
      const lines = chunk.split('\n\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(line.slice(6));
            if (eventData.type === 'exit') {
              const durationMs = Date.now() - startTime;
              log({
                event: 'exit',
                command,
                args,
                exitCode: eventData.data.code,
                logPath: eventData.data.logPath || null,
                durationMs
              });
            }
          } catch {
            // Ignore parse errors in streaming
          }
        }
      }
    }

    try { res.end(); } catch { /* already closed */ }
  } catch (err) {
    if (err.name === 'AbortError') {
      // Client disconnected, connection already closed
      return;
    }
    const durationMs = Date.now() - startTime;
    log({ event: 'error', command, args, error: err.message, durationMs });
    sendEvent('error', { message: `Helper unavailable: ${err.message}` });
    try { res.end(); } catch { /* already closed */ }
  }
}

/**
 * Handle GET /discover - proxy discovery request to helper
 */
async function handleDiscover(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DISCOVER_TIMEOUT_MS);

    const helperRes = await fetch(`${HELPER_URL}/discover`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await helperRes.json();
    sendJson(res, helperRes.status, data);
  } catch (err) {
    if (err.name === 'AbortError') {
      sendJson(res, 504, { success: false, error: 'Discovery request timed out' });
      return;
    }
    log({ event: 'discover_error', error: err.message });
    sendJson(res, 503, {
      success: false,
      error: `Helper unavailable: ${err.message}`
    });
  }
}

/**
 * Handle GET /commands - list allowed commands
 */
function handleCommands(req, res) {
  const commands = {};
  for (const [id, entry] of allowedCommands) {
    commands[id] = {
      name: entry.name || id,
      description: entry.description || ''
    };
  }
  sendJson(res, 200, { success: true, commands });
}

/**
 * Handle GET /health - health check
 */
function handleHealth(req, res) {
  sendJson(res, 200, {
    status: 'ok',
    commandCount: allowedCommands.size,
    helperUrl: HELPER_URL,
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

  if (url.pathname === '/discover' && req.method === 'GET') {
    handleDiscover(req, res);
    return;
  }

  // 404 for everything else
  sendJson(res, 404, { error: 'Not found', availableEndpoints: ['GET /health', 'GET /commands', 'POST /run', 'GET /discover'] });
}

// Initialize
loadCommands();

// Set up periodic reload
setInterval(loadCommands, RELOAD_INTERVAL_MS);

// Start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  // Disable all Node.js HTTP server timeouts for long-running commands (20+ minutes)
  server.keepAliveTimeout = 0;
  server.headersTimeout = 0;
  server.requestTimeout = 0;
  server.timeout = 0;

  log({ event: 'server_start', port: PORT, helperUrl: HELPER_URL, commandsFile: COMMANDS_FILE });
  console.log(`strava-runner listening on port ${PORT}`);
  console.log(`Helper URL: ${HELPER_URL}`);
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

process.on('unhandledRejection', (reason) => {
  log({ event: 'unhandled_rejection', error: reason?.message || String(reason) });
});
