# stats-cmd-runner

A lightweight sidecar container for validating and proxying Symfony console command execution requests. Designed to work alongside the Statistics for Strava application with the stats-cmd-helper service.

## Features

- HTTP API server on port 8080
- Command validation against YAML allowlist
- Proxies requests to stats-cmd-helper for execution
- Real-time stdout/stderr streaming via Server-Sent Events (SSE)
- Structured JSON logging to file
- Automatic YAML config reload (every 5 seconds)
- Security: No Docker socket access, validation-only role
- Health check endpoint

## Architecture

```
Config Tool → stats-cmd-runner → stats-cmd-helper → Docker exec
              (validates)         (executes)
```

The runner validates commands against the allowlist but has no execution privileges. It forwards validated requests to the helper service which has Docker socket access.

## API Endpoints

### POST /run

Validate and proxy command execution with real-time output streaming.

**Request:**
```json
{
  "command": "build-files"
}
```

**Response:** Server-Sent Events stream (proxied from helper)
```
data: {"type":"start","data":{"command":"build-files","fullCommand":"php bin/console app:strava:build-files"}}

data: {"type":"stdout","data":"Building files..."}

data: {"type":"stdout","data":"Processed 100 activities"}

data: {"type":"exit","data":{"code":0,"durationMs":1234}}
```

**Event Types:**
- `start` - Command execution started
- `stdout` - Standard output line
- `stderr` - Standard error line
- `exit` - Command completed with exit code and duration
- `error` - Execution error occurred

### POST /stop

Stop a running command by session ID.

**Request:**
```json
{
  "sessionId": "abc123"
}
```

### GET /discover

Discover available commands from the target container.

**Response:**
```json
{
  "success": true,
  "commands": {
    "build-files": {
      "name": "Build Files",
      "description": "Build Strava data files",
      "command": ["php", "bin/console", "app:strava:build-files"]
    }
  }
}
```

### GET /commands

List all allowed commands from the local configuration.

**Response:**
```json
{
  "success": true,
  "commands": [
    {
      "id": "build-files",
      "name": "Build Files (Updates Dashboard)",
      "command": "build-files",
      "description": "Build Strava files and update the dashboard"
    }
  ]
}
```

### GET / or GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "commandCount": 5,
  "uptime": 123.456
}
```

## Docker Compose Example

Add this service to your `docker-compose.yml`:

```yaml
services:
  stats-cmd-runner:
    image: ghcr.io/dschoepel/stats-cmd-runner:latest
    container_name: stats-cmd-runner
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - HELPER_URL=http://stats-cmd-helper:${STATS_CMD_HELPER_PORT:-8081}
    volumes:
      # Mount the commands config (read-only)
      - ./config/settings/console-commands.yaml:/app/commands.yaml:ro
    ports:
      - "8093:8080"
    networks:
      - statistics-for-strava-network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  statistics-for-strava-network:
    external: true
```

## Volume Mounts

| Host Path | Container Path | Purpose |
|-----------|----------------|---------|
| `./config/settings/console-commands.yaml` | `/app/commands.yaml:ro` | Allowed commands (read-only) |

## Commands Configuration

Edit `console-commands.yaml` to add or remove allowed commands:

```yaml
commands:
  build-files:
    name: "Build Files (Updates Dashboard)"
    description: "Build Strava files and update the dashboard"
    command: ["php", "bin/console", "app:strava:build-files"]

  import-data:
    name: "Import Data"
    description: "Import new activities from Strava API"
    command: ["php", "bin/console", "app:strava:import-data"]

  webhooks-unsubscribe:
    name: "Webhooks Unsubscribe"
    description: "Delete a Strava webhook subscription"
    command: ["php", "bin/console", "app:strava:webhooks-unsubscribe"]
    acceptsArgs: true
    argsDescription: "Subscription ID to unsubscribe"
    argsPlaceholder: "Enter subscription ID"
```

The runner automatically reloads this file every 5 seconds, so changes take effect without restarting the container.

## Logs

Logs are available via Docker container logs:

```bash
docker compose logs -f stats-cmd-runner
```

**Event Types:**
- `server_start` - Server started
- `server_stop` - Server stopping
- `config_reload` - Commands YAML reloaded
- `config_error` - Error loading commands YAML
- `start` - Command execution started
- `stdout` - Standard output chunk
- `stderr` - Standard error chunk
- `exit` - Command completed
- `error` - Execution error
- `client_disconnect` - Client disconnected during execution

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP server port |
| `HELPER_URL` | `http://stats-cmd-helper:8081` | URL to helper service |
| `COMMANDS_FILE` | `/app/commands.yaml` | Path to commands YAML file |
| `TZ` | (none) | Timezone (e.g., `America/New_York`) |
| `USERMAP_UID` | `1000` | UID to run as |
| `USERMAP_GID` | `1000` | GID to run as |

## Security

- **Command Allowlist**: Only commands explicitly listed in configuration can be executed
- **No Docker Access**: Container has no access to Docker socket
- **Validation Only**: Runner validates and proxies, helper executes
- **Input Validation**: Command names and arguments validated against strict patterns
- **Argument Safety**: No shell metacharacters, no flags, length limits enforced
- **Read-Only Config**: Mount `commands.yaml` as read-only (`:ro`)
- **Non-Root Execution**: Runs as configurable non-root user

## Building Locally

```bash
# Build the image
docker build -t stats-cmd-runner .

# Run locally for testing
docker run -p 8080:8080 \
  -v $(pwd)/commands.yaml:/app/commands.yaml:ro \
  -e HELPER_URL=http://host.docker.internal:8081 \
  stats-cmd-runner
```

## License

MIT
