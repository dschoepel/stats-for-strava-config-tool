# **Enabling the SFS Console (Optional Feature)**

The **SFS Console** is an optional feature that allows the Stats for Strava Config Tool to execute Symfony console commands inside the Statistics for Strava application container with real-time streaming output.

This feature uses a two-container architecture for security:

- **strava-runner** - Validates commands and proxies requests (no Docker socket access)
- **strava-command-helper** - Executes validated commands inside the target container via `docker exec`

This feature is disabled by default and can be enabled at any time.

**Recent Updates (v1.1.0-rc4):**
- ✨ Command discovery: Automatically discover available `app:strava:*` commands from the container
- 📝 Individual log file capture: Each command execution is saved to a timestamped file
- ⏱️ Elapsed time tracking: Real-time timer shows command duration
- 🔄 Auto-scroll toggle: Control terminal scrolling behavior
- 🔴 Connection state badges: Visual indicators for Running, Streaming, Completed, Error states
- 📡 Keep-alive pings: Prevents timeout on long-running commands (20+ minutes supported)
- 🎯 Full command names: Commands now use proper `app:strava:*` format

---

## **Architecture**

```
Config Tool UI
     │
     │ POST /api/strava-console { command: "webhooks-view" }
     ▼
┌─────────────────────────┐
│  stats-for-strava-       │
│  config-tool             │
│  (Next.js, port 80)     │
└──────────┬──────────────┘
           │ POST /run { command: "webhooks-view" }
           ▼
┌─────────────────────────┐
│  strava-runner           │
│  (Node.js, port 8080)   │
│  - Validates commandId  │
│  - No Docker socket     │
│  - Pure proxy           │
└──────────┬──────────────┘
           │ POST /run { commandId: "webhooks-view" }
           ▼
┌─────────────────────────┐
│  strava-command-helper   │
│  (Node.js, port 8081)   │
│  - Docker socket mounted│
│  - Resolves command array│
│  - spawn('docker', [...])│
│  - shell: false          │
└──────────┬──────────────┘
           │ docker exec statistics-for-strava php bin/console webhooks-view
           ▼
┌─────────────────────────┐
│  statistics-for-strava   │
│  (Symfony app)           │
└─────────────────────────┘
```

---

## **1. Enable the Services in `docker-compose.yml`**

The runner and helper are included as commented-out optional services.

To enable them, open your `docker-compose.yml` and **uncomment both service blocks**:

```yaml
strava-runner:
  image: ghcr.io/dschoepel/strava-runner:latest
  container_name: strava-runner
  restart: unless-stopped
  working_dir: /var/www
  command: ["node", "server.js"]
  environment:
    - TZ=${TZ}
    - USERMAP_UID=${USERMAP_UID}
    - USERMAP_GID=${USERMAP_GID}
    - HELPER_URL=http://strava-command-helper:8081
  volumes:
    - ./statistics-for-strava/config/settings/console-commands.yaml:/var/www/console-commands.yaml:ro
    - ./statistics-for-strava/runner-logs:/var/log/strava-runner
  networks:
    - statistics-for-strava-network
  ports:
    - "8093:8080"

strava-command-helper:
  image: ghcr.io/dschoepel/strava-command-helper:latest
  container_name: strava-command-helper
  restart: unless-stopped
  working_dir: /var/www
  command: ["node", "server.js"]
  environment:
    - TZ=${TZ}
    - TARGET_CONTAINER=statistics-for-strava
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - ./statistics-for-strava/config/settings/console-commands.yaml:/var/www/console-commands.yaml:ro
    - ./strava-sh-logs:/var/log/strava-helper/command-logs  # Command execution logs
  networks:
    - statistics-for-strava-network
```

Then create the required directories and restart your stack:

```bash
mkdir -p ./statistics-for-strava/runner-logs
mkdir -p ./strava-sh-logs
docker compose up -d
```

---

## **2. Ensure `console-commands.yaml` Exists**

Both the runner and helper read their allowed commands from `console-commands.yaml`. This file is automatically created by the Config Tool when you save commands from the Console Commands settings page.

If it doesn't exist yet, create it manually:

```bash
mkdir -p ./statistics-for-strava/config/settings

cat > ./statistics-for-strava/config/settings/console-commands.yaml << 'EOF'
commands:
  build-files:
    name: "Build Files (Updates Dashboard)"
    description: "Build Strava files and update the dashboard"
    command: ["php", "bin/console", "app:strava:build-files"]

  import-data:
    name: "Import Data"
    description: "Import new activities from Strava API"
    command: ["php", "bin/console", "app:strava:import-data"]

  webhooks-view:
    name: "Webhooks View"
    description: "View Strava webhook subscription(s)"
    command: ["php", "bin/console", "app:strava:webhooks-view"]
EOF
```

The file uses a map-based format where each key is the command ID and the `command` field is a string array passed directly to `docker exec`.

**Note:** Commands must use the full Symfony command name format `app:strava:command-name`, not the short ID.

---

## **3. Enable the SFS Console in the Config Tool**

Once the runner and helper are running, open the **Stats for Strava Config Tool** and go to:

```
Settings (gear icon in header) → User Interface Settings
```

Toggle **Enable SFS Console** to **ON**.

When enabled:

- A new sidebar item **"SFS Console"** appears under Utilities
- The Config Tool will load available commands from `console-commands.yaml`
- The UI will stream output from the runner in real time

When disabled:

- The sidebar item is hidden
- The Console page shows a disabled message with instructions
- No runner interaction occurs

---

## **4. Verify the Services Are Reachable**

The Console page performs a health check against the runner:

```
GET http://strava-runner:8080/health
```

If the runner is online, you'll see:

- A green "Runner Connected" badge in the header
- The Run button enabled

If offline:

- An orange warning banner appears
- The Run button is disabled
- Instructions to enable the services in docker-compose are shown

You can also verify manually:

```bash
# Check runner health
curl http://localhost:8093/health

# Check helper can reach Docker socket
docker compose exec strava-command-helper docker ps
```

---

## **5. Test the Integration**

Once enabled, open the **SFS Console** from the sidebar (under Utilities).

**Key Features:**

1. **Command Discovery** - Click the **Discover** button to automatically find all available `app:strava:*` commands from your Statistics for Strava container
   - Displays discovered commands with descriptions
   - Shows which commands are new (not in your current configuration)
   - **Merge** - Add only new commands to your existing list
   - **Replace All** - Replace your entire command list with discovered commands

2. **Command Execution** - Select a command and click **Run** to see:
   - Connection state badges (Running, Streaming, Completed, Error)
   - Real-time elapsed timer showing command duration
   - Live streamed output in the terminal (with proper `app:strava:*` command display)
   - Auto-scroll toggle to control terminal scrolling
   - Final success/failure message with exit code

3. **Command History** - View past executions with:
   - Timestamp and duration for each run
   - Status badges (Success/Failed/Cancelled)
   - **View Log** button to see full command output
   - **Rerun** button to execute again with one click

4. **Log Files** - Each command execution is automatically saved to:
   - Format: `YYYY-MM-DD_HH-MM-SS_command-id_exitcode.log`
   - Location: `./strava-sh-logs/` on host
   - Accessible via **View Log** or **Download Log** buttons
   - Includes full stdout/stderr, timestamps, and exit code

- Live streamed output in the terminal
- A final success/failure message with exit code
- Logs written to `runner-logs/runner.log`

---

## **6. Disable the Feature (Optional)**

You can disable the SFS Console at any time:

1. Go to **Settings** (gear icon)
2. Toggle **Enable SFS Console** to **OFF**
3. (Optional) Comment out the runner and helper blocks in `docker-compose.yml`
4. (Optional) Comment out the runner and helper blocks in `docker-compose.yml`
5. Restart your stack

---

## **7. Features**

### Command Discovery (New in v1.1.0-rc4)

The **Discover** button automatically finds all available Symfony console commands:

1. Queries the Statistics for Strava container: `php bin/console list --format=json`
2. Filters for commands matching `app:strava:*` pattern
3. Displays results in a dialog with:
   - Command names and descriptions
   - Green "New" badges for commands not in your current configuration
   - Count of new vs existing commands

**Actions:**
- **Merge** - Adds only new commands to your existing configuration
- **Replace All** - Replaces your entire command list (shows confirmation warning)

### Live Terminal Output

Real-time streaming with:
- ANSI color support (stdout, stderr, info, success, error)
- Connection state badges (🔵 Running, 🟢 Streaming, ✅ Completed, ❌ Error)
- Elapsed time counter (updates every second)
- Auto-scroll toggle (blue when enabled)
- Keep-alive pings prevent timeout on long-running commands (20+ minutes supported)

### Command History

Persistent history tracking:
- Timestamp, duration, and status for each execution
- Color-coded status badges (green/red/gray)
- **View Log** - Opens log file in overlay with copy/close buttons
- **Rerun** - Execute the command again with one click
- **Clear History** - Remove all history entries

### Log File System

Each command execution creates a detailed log file:

**Filename format:**
```
2026-01-23_14-30-45_build-files_0.log
```

**Structure:**
- YYYY-MM-DD_HH-MM-SS timestamp
- Command ID (e.g., `build-files`)
- Exit code (0 = success, non-zero = error)

**Content includes:**
- Command executed
- Target container
- Start/end timestamps
- Full stdout and stderr output
- Exit code and duration

**Location:**
- Helper writes: `/var/log/strava-helper/command-logs/`
- Config-tool reads: Same directory (shared Docker volume)
- Host machine: `./strava-sh-logs/`

---

## **8. Environment Variables**

### Config Tool

| Variable | Default | Description |
|----------|---------|-------------|
| `STRAVA_RUNNER_URL` | `http://strava-runner:8080` | URL to the Strava Runner service |

### Runner

| Variable | Default | Description |
|----------|---------|-------------|
| `HELPER_URL` | `http://strava-command-helper:8081` | URL to the Command Helper service |
| `COMMANDS_FILE` | `/var/www/console-commands.yaml` | Path to the commands allowlist |
| `PORT` | `8080` | HTTP listen port |
| `LOG_FILE` | `/var/log/strava-runner/runner.log` | Structured log file path |

### Command Helper

| Variable | Default | Description |
|----------|---------|-------------|
| `TARGET_CONTAINER` | `statistics-for-strava` | Container to exec commands into |
| `COMMANDS_FILE` | `/var/www/console-commands.yaml` | Path to the commands allowlist |
| `PORT` | `8081` | HTTP listen port |
| `LOG_FILE` | `/var/log/strava-helper/helper.log` | Structured log file path |
| `COMMAND_LOGS_DIR` | `/var/log/strava-helper/command-logs` | Directory for command execution logs |

---

## **9. Security Model**

| Layer | Protection |
|-------|-----------|
| **Runner** | No Docker socket. Cannot execute anything locally. Pure validator + proxy. |
| **Helper** | Has Docker socket but only executes predefined commands from the allowlist. |
| **Command allowlist** | `console-commands.yaml` is the single source of truth. |
| **No arbitrary commands** | Helper resolves `commandId` to a fixed array. Unknown IDs rejected with 403. |
| **No arbitrary arguments** | Command arrays are fully defined in YAML. No user input is concatenated. |
| **No arbitrary containers** | `TARGET_CONTAINER` is set via env var. Cannot exec into other containers. |
| **No shell** | `spawn()` with `shell: false`. No interpolation, expansion, or injection. |
| **Network isolation** | Helper has no exposed ports. Only reachable by runner on internal network. |
| **Read-only commands** | Both services mount `console-commands.yaml` with `:ro`. |
| **Input validation** | Runner validates format: `/^[a-zA-Z0-9\-_:]+$/` before forwarding. |

---

## **10. Troubleshooting**

### Runner shows "Offline" but container is running

1. Check that all containers are on the same Docker network (`statistics-for-strava-network`)
2. Verify the runner container is healthy: `docker compose logs strava-runner`
3. Test the health endpoint: `docker compose exec config-manager wget -qO- http://strava-runner:8080/health`

### Commands fail with "Command not in allowed list"

1. Check `console-commands.yaml` is properly mounted and readable
2. Verify the command exists in the YAML file with the correct ID
3. Both services reload commands every 5 seconds automatically

### Helper reports "docker exec" errors

1. Check the helper can access the Docker socket: `docker compose exec strava-command-helper docker ps`
2. Verify the target container name matches `TARGET_CONTAINER` env var
3. Check helper logs: `docker compose logs strava-command-helper`

### No output appears in terminal

1. Check the browser's Network tab for SSE connection
2. Verify the runner can reach the helper: `docker compose exec strava-runner wget -qO- http://strava-command-helper:8081/health`
3. Check `runner-logs/runner.log` for errors

### "No log file available" message

1. Ensure the shared log volume is mounted: `./strava-sh-logs:/var/log/strava-helper/command-logs`
2. Check if the directory exists: `ls -la ./strava-sh-logs/`
3. Verify helper has write permissions: `docker compose exec strava-command-helper ls -la /var/log/strava-helper/command-logs`
4. Check helper logs for file creation errors: `docker compose logs strava-command-helper | grep log_file`

### Command execution times out

The system supports long-running commands (20+ minutes):
- Helper: Disables all Node.js HTTP timeouts
- Runner: Disables all HTTP timeouts and sends keep-alive pings every 5 seconds
- Next.js: `maxDuration = 1800` (30 minutes) on the API route

If commands still timeout:
1. Check for network connectivity issues
2. Verify the command completes within 30 minutes
3. Check browser console for client-side timeout errors

### Discovery fails with timeout

Discovery has a 30-second timeout (helper) + 5-second buffer (runner/frontend):
1. Ensure Statistics for Strava container is running and healthy
2. Test manually: `docker exec statistics-for-strava php bin/console list --format=json`
3. Check helper logs: `docker compose logs strava-command-helper | grep discover`

---

## **11. Viewing Logs**

### Structured Server Logs

Runner and helper write structured JSON logs:

```bash
# Real-time runner logs
tail -f ./statistics-for-strava/runner-logs/runner.log | jq

# Real-time helper logs (if mounted separately)
docker compose logs -f strava-command-helper | jq

# Last 50 entries
tail -50 ./statistics-for-strava/runner-logs/runner.log | jq
```

### Command Execution Logs

Individual command output is saved to timestamped files:

```bash
# List all command logs
ls -lh ./strava-sh-logs/

# View a specific log
cat ./strava-sh-logs/2026-01-23_14-30-45_build-files_0.log

# View most recent log
ls -t ./strava-sh-logs/*.log | head -1 | xargs cat

# Find failed commands (non-zero exit codes)
ls ./strava-sh-logs/*_[^0].log

# Search logs for errors
grep -i error ./strava-sh-logs/*.log
```

You can also view logs from the UI:
- Command History panel: Click **View Log** button
- Terminal output: Click **Download Log** after command completes

Container logs are available via:

```bash
docker compose logs -f strava-runner
docker compose logs -f strava-command-helper
```

---

## **12. Summary**

| Component | Enabled | Disabled |
|-----------|---------|----------|
| Runner container | Required | Not used |
| Helper container | Required | Not used |
| SFS Console sidebar | Visible | Hidden |
| Console page | Functional | Shows disabled message |
| Health check | Active (every 30s) | Not performed |
| Command execution | Allowed | Blocked |
| Server logs | Written to `runner-logs/` | No logs |
| Command logs | Written to `strava-sh-logs/` | No logs |
| Command discovery | Available | Not available |
| Real-time streaming | Active with keep-alive | Not available |
| Execution history | Tracked with log links | Not tracked |
