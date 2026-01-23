# **Enabling the SFS Console (Optional Feature)**

The **SFS Console** is an optional feature that allows the Stats for Strava Config Tool to execute Symfony console commands inside the Statistics for Strava application container.

This feature uses a two-container architecture for security:

- **strava-runner** - Validates commands and proxies requests (no Docker socket access)
- **strava-command-helper** - Executes validated commands inside the target container via `docker exec`

This feature is disabled by default and can be enabled at any time.

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
  networks:
    - statistics-for-strava-network
```

Then create the required directories and restart your stack:

```bash
mkdir -p ./statistics-for-strava/runner-logs
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
    command: ["php", "bin/console", "build-files"]

  import-data:
    name: "Import Data"
    description: "Import new activities from Strava API"
    command: ["php", "bin/console", "import-data"]

  webhooks-view:
    name: "Webhooks View"
    description: "View Strava webhook subscription(s)"
    command: ["php", "bin/console", "webhooks-view"]
EOF
```

The file uses a map-based format where each key is the command ID and the `command` field is a string array passed directly to `docker exec`.

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

Select a command (e.g., `webhooks-view`) and click **Run**.

You should see:

- Live streamed output in the terminal
- A final success/failure message with exit code
- Logs written to `runner-logs/runner.log`

---

## **6. Disable the Feature (Optional)**

You can disable the SFS Console at any time:

1. Go to **Settings** (gear icon)
2. Toggle **Enable SFS Console** to **OFF**
3. (Optional) Comment out the runner and helper blocks in `docker-compose.yml`
4. Restart your stack

---

## **7. Environment Variables**

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

---

## **8. Security Model**

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

## **9. Troubleshooting**

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

---

## **10. Viewing Logs**

Runner logs are written to `./statistics-for-strava/runner-logs/runner.log`:

```bash
# Real-time logs
tail -f ./statistics-for-strava/runner-logs/runner.log | jq

# Last 50 entries
tail -50 ./statistics-for-strava/runner-logs/runner.log | jq
```

You can also view container logs directly:

```bash
docker compose logs -f strava-runner
docker compose logs -f strava-command-helper
```

---

## **Summary**

| Component | Enabled | Disabled |
|-----------|---------|----------|
| Runner container | Required | Not used |
| Helper container | Required | Not used |
| SFS Console sidebar | Visible | Hidden |
| Console page | Functional | Shows disabled message |
| Health check | Active (every 30s) | Not performed |
| Command execution | Allowed | Blocked |
| Logs | Written to `runner-logs/` | No logs |
