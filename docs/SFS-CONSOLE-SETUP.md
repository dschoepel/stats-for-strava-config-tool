# SFS Console Setup Guide

The **SFS Console** is an optional feature that allows you to execute Statistics for Strava Symfony console commands directly from the web interface.

---

## What is SFS Console?

The SFS Console provides a terminal-like UI for running administrative commands without needing SSH access to your server or Docker exec commands. It's useful for:

- Building Statistics for Strava data files
- Importing activity data from Strava
- Managing webhook subscriptions
- Running maintenance tasks

---

## Architecture Overview

The SFS Console uses a **two-container security model** to safely execute commands:

```
┌─────────────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│   Config Tool UI    │────>│  stats-cmd-runner │────>│   stats-cmd-helper   │
│  (web interface)    │     │  (validates cmds) │     │  (executes via exec) │
└─────────────────────┘     └──────────────────┘     └──────────────────────┘
```

### stats-cmd-runner

- **Purpose**: Validates commands and handles request/response flow
- **Security**: No Docker socket access
- Validates commands against YAML allowlist before forwarding
- Provides health check endpoint

### stats-cmd-helper

- **Purpose**: Executes validated commands via `docker exec`
- **Security**: Has Docker socket access but only accepts pre-validated commands
- Runs alongside the Statistics for Strava container
- Captures output to log files

### Security Benefits

- The runner validates commands from a YAML whitelist but has no execution privileges
- The helper has Docker socket access but only accepts pre-validated commands from the runner
- This separation prevents arbitrary command execution even if the web interface is compromised

---

## Prerequisites

Before enabling the SFS Console, ensure you have:

- Statistics for Strava running in Docker
- Config Tool already set up and working
- Access to your `docker-compose.yml` file
- Understanding of your Docker volume paths

---

## Setup Instructions

### Step 1: Create console-commands.yaml File

> **Important:** This MUST be done BEFORE starting containers. If the file doesn't exist when you start containers, Docker will create a directory instead, causing errors.

```bash
# Linux/Mac
cp console-commands.yaml.example ./config/settings/console-commands.yaml
sudo chown 1000:1000 ./config/settings/console-commands.yaml

# Windows (Docker Desktop)
copy console-commands.yaml.example ./config/settings/console-commands.yaml
```

The example file contains the default set of safe commands. See [console-commands.yaml.example](../console-commands.yaml.example) for the default configuration.

### Step 2: Add Services to docker-compose.yml

Add both services to your `docker-compose.yml`:

```yaml
services:
  # ... your existing services ...

  # SFS Console - Command Runner (validates and proxies commands)
  stats-cmd-runner:
    image: ghcr.io/dschoepel/stats-cmd-runner:latest
    container_name: stats-cmd-runner
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - HELPER_URL=http://stats-cmd-helper:${STATS_CMD_HELPER_PORT:-8081}
    volumes:
      - ./config/settings/console-commands.yaml:/app/commands.yaml:ro
    ports:
      - '8093:8080'
    networks:
      - statistics-for-strava-network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  # SFS Console - Command Helper (executes commands in SFS container)
  stats-cmd-helper:
    image: ghcr.io/dschoepel/stats-cmd-helper:latest
    container_name: stats-cmd-helper
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - CONTAINER_NAME=statistics-for-strava
      - LOG_DIR=/logs
      - PORT=${STATS_CMD_HELPER_PORT:-8081}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./stats-cmd-logs:/logs
    networks:
      - statistics-for-strava-network
```

### Step 3: Update Config Tool Service

Add the runner URL environment variable to your config-manager service:

```yaml
  config-manager:
    image: ghcr.io/dschoepel/stats-for-strava-config-tool:latest
    # ... existing configuration ...
    environment:
      - STATS_CMD_RUNNER_URL=${STATS_CMD_RUNNER_URL:-http://stats-cmd-runner:8080}
```

### Step 4: Ensure UID/GID Consistency

All containers must use the same `USERMAP_UID` and `USERMAP_GID` values from your `.env` file (default: 1000:1000). This ensures:

- Log directories are created with correct ownership
- Files can be read/written by all services
- No permission errors occur

### Step 5: Create Log Directory

```bash
# Linux/Mac
mkdir -p ./stats-cmd-logs
sudo chown 1000:1000 ./stats-cmd-logs

# Windows (Docker Desktop)
mkdir stats-cmd-logs
```

### Step 6: Restart Docker Stack

```bash
docker compose up -d
```

### Step 7: Enable in UI

1. Open the Config Tool web interface
2. Go to **Settings** (gear icon)
3. Navigate to **User Interface Settings**
4. Toggle **"Enable SFS Console"** ON
5. Save settings

---

## Using the SFS Console

### Running Commands

1. Navigate to **Utilities > SFS Console** in the sidebar
2. Select a command from the dropdown
3. Add parameters if needed (some commands accept arguments)
4. Click **Run**
5. Watch the real-time output in the terminal panel

### Command History

- View past command executions with status badges
- Success (green), Failed (red), Stopped (orange), Running (yellow)
- Click to view logs from previous executions
- Rerun previous commands with one click

### Log Management

- View, download, or delete command execution logs
- Logs are stored in `stats-cmd-logs/` directory
- Access via the "Manage Logs" button in the history panel

### Stopping Commands

- Click the **Stop** button during execution
- The running PHP process is terminated immediately
- Status shows "Stopped" in command history

---

## Available Commands

The default allowlist includes these commands:

| Command | Description |
|---------|-------------|
| `app:strava:build-files` | Build Statistics for Strava data files |
| `app:strava:import-data` | Import activity data from Strava |
| `app:strava:webhooks-create` | Create Strava webhook subscriptions |
| `app:strava:webhooks-unsubscribe` | Remove webhook subscriptions |
| `app:strava:webhooks-view` | View current webhook subscriptions |

### Adding Custom Commands

Edit your `console-commands.yaml` file to add or modify commands:

```yaml
commands:
  custom-command:
    name: "My Custom Command"
    command: ["php", "bin/console", "app:custom:command"]
    description: "Description of what this command does"
    acceptsArgs: true
    argsDescription: "Optional parameters description"
    argsPlaceholder: "--option value"
```

After editing, restart the runner container:

```bash
docker compose restart stats-cmd-runner
```

---

## Troubleshooting

### Console Shows "Disabled"

- Ensure SFS Console is enabled in Settings > User Interface Settings
- Check that runner service is running: `docker ps | grep stats-cmd-runner`

### "Runner Offline" Warning

- Verify runner container is healthy: `docker compose ps`
- Check runner logs: `docker logs stats-cmd-runner`
- Ensure `STATS_CMD_RUNNER_URL` is set correctly in config-tool service

### Command Fails Immediately

- Check helper container logs: `docker logs stats-cmd-helper`
- Verify the target container name is correct (`CONTAINER_NAME` env var)
- Ensure the Statistics for Strava container is running

### Permission Errors

- Verify UID/GID consistency across all containers
- Check log directory ownership: `ls -la ./stats-cmd-logs`
- Ensure `.env` file has correct `USERMAP_UID` and `USERMAP_GID`

### "Directory created instead of file" Error

- This happens if `console-commands.yaml` didn't exist when containers started
- Stop containers: `docker compose down`
- Remove the directory: `rm -rf ./config/settings/console-commands.yaml`
- Create the file properly (Step 1 above)
- Restart: `docker compose up -d`

### Commands Timeout

- Long-running commands may hit default timeouts
- Check command output for progress
- Consider running heavy operations during off-peak times

---

## Security Considerations

### Network Isolation

- Runner and helper communicate over the Docker network
- No external access to helper service
- Runner port (8093:8080) can be internal-only if not needed externally

### Command Allowlist

- Only commands in `console-commands.yaml` can be executed
- Review the allowlist periodically
- Don't add dangerous commands (e.g., `rm`, shell access)

### Docker Socket Access

- Only the helper container has Docker socket access
- This is necessary for `docker exec` functionality
- Helper only accepts validated commands from runner

---

## Disabling SFS Console

To completely disable the feature:

1. Toggle OFF in Settings > User Interface Settings
2. Optionally, remove or comment out the runner and helper services in `docker-compose.yml`
3. Restart if you modified docker-compose.yml

When disabled, the SFS Console sidebar item is hidden and the console page shows setup instructions if accessed directly.

---

## Next Steps

- [Features Guide](FEATURES.md) - Learn about other features
- [Troubleshooting](TROUBLESHOOTING.md) - More troubleshooting tips
- [Installation Guide](INSTALLATION.md) - General setup help
