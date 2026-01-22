# strava-runner

A lightweight sidecar container for executing Symfony console commands with real-time streaming output. Designed to work alongside the Statistics for Strava application.

## Features

- HTTP API server on port 8080
- Command validation against YAML allowlist
- Real-time stdout/stderr streaming via Server-Sent Events (SSE)
- Structured JSON logging to file
- Automatic YAML config reload (every 5 seconds)
- Security: No shell execution, command allowlist only
- Docker health checks

## API Endpoints

### POST /run

Execute an allowed command with real-time output streaming.

**Request:**
```json
{
  "command": "build-files"
}
```

**Response:** Server-Sent Events stream
```
data: {"type":"start","data":{"command":"build-files","fullCommand":"php bin/console build-files"}}

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

### GET /commands

List all allowed commands.

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

### GET /health

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
  strava-runner:
    image: ghcr.io/your-username/strava-runner:latest
    container_name: strava-runner
    restart: unless-stopped
    environment:
      - TZ=${TZ}
      - USERMAP_UID=${USERMAP_UID}
      - USERMAP_GID=${USERMAP_GID}
    volumes:
      # Mount the same volumes as Statistics for Strava
      - ./config:/var/www/config/app
      - ./build:/var/www/build
      - ./storage/database:/var/www/storage/database
      - ./storage/files:/var/www/storage/files
      - ./storage/gear-maintenance:/var/www/storage/gear-maintenance
      # Mount the commands config (read-only)
      - ./commands.yaml:/var/www/commands.yaml:ro
      # Mount runner logs
      - ./runner-logs:/var/log/strava-runner
    ports:
      - "8080:8080"
    networks:
      - statistics-for-strava-network

networks:
  statistics-for-strava-network:
    external: true
```

## Volume Mounts

| Host Path | Container Path | Purpose |
|-----------|----------------|---------|
| `./config` | `/var/www/config/app` | Application configuration |
| `./build` | `/var/www/build` | Build output files |
| `./storage/database` | `/var/www/storage/database` | Database files |
| `./storage/files` | `/var/www/storage/files` | User files |
| `./storage/gear-maintenance` | `/var/www/storage/gear-maintenance` | Gear maintenance data |
| `./commands.yaml` | `/var/www/commands.yaml:ro` | Allowed commands (read-only) |
| `./runner-logs` | `/var/log/strava-runner` | Runner logs |

## Commands Configuration

Edit `commands.yaml` to add or remove allowed commands:

```yaml
commands:
  - id: "build-files"
    name: "Build Files (Updates Dashboard)"
    command: "build-files"
    description: "Build Strava files and update the dashboard"

  - id: "import-data"
    name: "Import Data"
    command: "import-data"
    description: "Import new activities from Strava API"

  - id: "my-custom-command"
    name: "My Custom Command"
    command: "app:my-custom-command"
    description: "Description of what it does"
```

The runner automatically reloads this file every 5 seconds, so changes take effect without restarting the container.

## Log Format

Logs are written to `/var/log/strava-runner/runner.log` in JSON format (one entry per line):

```json
{"timestamp":"2026-01-21T10:30:00.000Z","event":"server_start","port":8080,"workingDir":"/var/www","commandsFile":"/var/www/commands.yaml"}
{"timestamp":"2026-01-21T10:30:01.000Z","event":"config_reload","commandCount":5,"commands":["build-files","import-data","webhooks-create","webhooks-unsubscribe","webhooks-view"]}
{"timestamp":"2026-01-21T10:30:05.000Z","event":"start","command":"build-files","fullCommand":"php bin/console build-files"}
{"timestamp":"2026-01-21T10:30:05.100Z","event":"stdout","command":"build-files","chunk":"Building files..."}
{"timestamp":"2026-01-21T10:30:10.000Z","event":"exit","command":"build-files","fullCommand":"php bin/console build-files","exitCode":0,"durationMs":5000}
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
| `COMMANDS_FILE` | `/var/www/commands.yaml` | Path to commands YAML file |
| `LOG_FILE` | `/var/log/strava-runner/runner.log` | Path to log file |
| `WORKING_DIR` | `/var/www` | Working directory for command execution |
| `TZ` | (none) | Timezone (e.g., `America/New_York`) |
| `USERMAP_UID` | `1000` | UID to run as |
| `USERMAP_GID` | `1000` | GID to run as |

## Security

- **Command Allowlist**: Only commands explicitly listed in `commands.yaml` can be executed
- **No Shell Execution**: Commands are spawned directly without a shell (`shell: false`)
- **Input Validation**: Command names are validated against a strict regex pattern
- **Read-Only Config**: Mount `commands.yaml` as read-only (`:ro`)
- **No Docker Access**: Container has no access to Docker socket
- **Non-Root Execution**: Runs as configurable non-root user

## Building Locally

```bash
# Build the image
docker build -t strava-runner .

# Run locally for testing
docker run -p 8080:8080 \
  -v $(pwd)/commands.yaml:/var/www/commands.yaml:ro \
  -v $(pwd)/runner-logs:/var/log/strava-runner \
  strava-runner
```

## License

MIT
