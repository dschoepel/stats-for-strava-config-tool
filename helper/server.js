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
const COMMAND_LOGS_DIR = process.env.COMMAND_LOGS_DIR || '/var/log/strava-helper/command-logs';
const RELOAD_INTERVAL_MS = 5000;
const PING_INTERVAL_MS = 5000;
const DISCOVER_TIMEOUT_MS = 30000;

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

  // Create command log file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const logFileName = `${timestamp}_${commandId}.log`;
  const commandLogPath = path.join(COMMAND_LOGS_DIR, logFileName);
  
  // Ensure command logs directory exists
  if (!fs.existsSync(COMMAND_LOGS_DIR)) {
    try {
      fs.mkdirSync(COMMAND_LOGS_DIR, { recursive: true });
    } catch (err) {
      log({ event: 'log_dir_error', error: err.message });
    }
  }

  let logStream = null;
  try {
    logStream = fs.createWriteStream(commandLogPath, { flags: 'w' });
    logStream.write(`Command: ${cmdArray.join(' ')}\n`);
    logStream.write(`Container: ${TARGET_CONTAINER}\n`);
    logStream.write(`Started: ${new Date().toISOString()}\n`);
    logStream.write('='.repeat(80) + '\n\n');
  } catch (err) {
    log({ event: 'log_file_error', error: err.message, path: commandLogPath });
  }

  log({
    event: 'start',
    commandId,
    targetContainer: TARGET_CONTAINER,
    execArgs: ['docker', ...execArgs],
    logPath: commandLogPath
  });

  // Set up SSE streaming
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const sendEvent = (type, data) => {
    try {
      const payload = JSON.stringify({ type, data });
      res.write(`data: ${payload}\n\n`);
    } catch {
      // Connection already closed, ignore write errors
    }
  };

  sendEvent('start', { commandId, command: cmdArray, targetContainer: TARGET_CONTAINER });

  // Keep-alive ping interval - prevents proxy/browser timeouts on long-running commands
  const pingInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      // Connection already closed, interval will be cleared in cleanup
    }
  }, PING_INTERVAL_MS);

  // Cleanup function to ensure ping interval is always cleared
  let cleaned = false;
  const cleanup = () => {
    if (!cleaned) {
      cleaned = true;
      clearInterval(pingInterval);
    }
  };

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
        // Write to log file
        if (logStream) {
          try {
            logStream.write(line + '\n');
          } catch (err) {
            // Ignore write errors
          }
        }
      }
    }
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        sendEvent('stderr', line);
        // Write to log file
        if (logStream) {
          try {
            logStream.write('[STDERR] ' + line + '\n');
          } catch (err) {
            // Ignore write errors
          }
        }
      }
    }
  });

  child.on('close', (code) => {
    cleanup();
    const durationMs = Date.now() - startTime;

    // Finalize log file
    if (logStream) {
      try {
        logStream.write('\n' + '='.repeat(80) + '\n');
        logStream.write(`Completed: ${new Date().toISOString()}\n`);
        logStream.write(`Exit Code: ${code}\n`);
        logStream.write(`Duration: ${durationMs}ms\n`);
        logStream.end();
      } catch (err) {
        // Ignore write errors
      }
    }

    // Rename log file to include exit code
    const finalLogPath = commandLogPath.replace('.log', `_${code}.log`);
    try {
      fs.renameSync(commandLogPath, finalLogPath);
    } catch (err) {
      log({ event: 'log_rename_error', error: err.message });
    }

    log({
      event: 'exit',
      commandId,
      exitCode: code,
      durationMs,
      logPath: finalLogPath
    });

    sendEvent('exit', { code, durationMs, logPath: finalLogPath });
    try { res.end(); } catch { /* already closed */ }
  });

  child.on('error', (err) => {
    cleanup();
    const durationMs = Date.now() - startTime;

    // Finalize log file
    if (logStream) {
      try {
        logStream.write('\n' + '='.repeat(80) + '\n');
        logStream.write(`Error: ${err.message}\n`);
        logStream.write(`Duration: ${durationMs}ms\n`);
        logStream.end();
      } catch (writeErr) {
        // Ignore write errors
      }
    }

    log({
      event: 'error',
      commandId,
      error: err.message,
      durationMs
    });

    sendEvent('error', { message: err.message, durationMs });
    try { res.end(); } catch { /* already closed */ }
  });

  // Handle client disconnect
  req.on('close', () => {
    cleanup();
    if (!child.killed) {
      child.kill('SIGTERM');
      log({ event: 'client_disconnect', commandId });
    }
  });
}

/**
 * Handle GET /discover - discover available Symfony commands from target container
 */
function handleDiscover(req, res) {
  const execArgs = ['exec', TARGET_CONTAINER, 'php', 'bin/console', 'list', '--format=json'];

  log({ event: 'discover_start', targetContainer: TARGET_CONTAINER });

  const child = spawn('docker', execArgs, {
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  child.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  // Timeout for discovery
  const timeout = setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGTERM');
      log({ event: 'discover_timeout', targetContainer: TARGET_CONTAINER });
      sendJson(res, 504, {
        success: false,
        error: 'Discovery timed out after 30 seconds'
      });
    }
  }, DISCOVER_TIMEOUT_MS);

  child.on('close', (code) => {
    clearTimeout(timeout);

    if (code !== 0) {
      log({ event: 'discover_error', exitCode: code, stderr });
      sendJson(res, 500, {
        success: false,
        error: `Command list failed with exit code ${code}`,
        stderr
      });
      return;
    }

    try {
      const parsed = JSON.parse(stdout);
      const stravaCommands = {};

      // Symfony list --format=json returns { commands: [{ name, description, ... }] }
      if (parsed.commands && Array.isArray(parsed.commands)) {
        for (const cmd of parsed.commands) {
          if (cmd.name && cmd.name.startsWith('app:strava:')) {
            // Convert "app:strava:build-files" to id "build-files"
            const id = cmd.name.replace('app:strava:', '');
            stravaCommands[id] = {
              name: cmd.description || id,
              description: cmd.description || '',
              command: ['php', 'bin/console', cmd.name]
            };
          }
        }
      }

      log({ event: 'discover_complete', commandCount: Object.keys(stravaCommands).length });
      sendJson(res, 200, {
        success: true,
        commands: stravaCommands,
        discoveredCount: Object.keys(stravaCommands).length
      });
    } catch (parseErr) {
      log({ event: 'discover_parse_error', error: parseErr.message });
      sendJson(res, 500, {
        success: false,
        error: `Failed to parse command list: ${parseErr.message}`
      });
    }
  });

  child.on('error', (err) => {
    clearTimeout(timeout);
    log({ event: 'discover_error', error: err.message });
    sendJson(res, 500, {
      success: false,
      error: `Failed to run discovery: ${err.message}`
    });
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

  if (url.pathname === '/discover' && req.method === 'GET') {
    handleDiscover(req, res);
    return;
  }

  sendJson(res, 404, { error: 'Not found', availableEndpoints: ['GET /health', 'POST /run', 'GET /discover'] });
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

process.on('unhandledRejection', (reason) => {
  log({ event: 'unhandled_rejection', error: reason?.message || String(reason) });
});
