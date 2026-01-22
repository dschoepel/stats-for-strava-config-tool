# **Enabling the SFS Console Strava Runner (Optional Feature)**

The **SFS Console Strava Runner** is an optional sidecar service that allows the Stats for Strava Config Tool to execute Symfony console commands inside the Statistics for Strava application.

This feature is disabled by default and can be enabled at any time.

---

## **1. Enable the Runner in `docker-compose.yml`**

The runner is included as a commented-out optional service.

To enable it, open your `docker-compose.yml` and **uncomment the entire block**:

```yaml
# ---------------------------------------------------------
# OPTIONAL: Strava Runner Sidecar
# ---------------------------------------------------------
# Uncomment this section if you want to enable the SFS Console

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
  volumes:
    # Mount Statistics for Strava application directory
    - ./config:/var/www/config/app
    - ./build:/var/www/build
    - ./storage/database:/var/www/storage/database
    - ./storage/files:/var/www/storage/files
    - ./storage/gear-maintenance:/var/www/storage/gear-maintenance
    # Mount commands configuration
    - ./commands.yaml:/var/www/commands.yaml:ro
    # Logs directory
    - ./runner-logs:/var/log/strava-runner
  networks:
    - statistics-for-strava-network
  ports:
    - "8093:8080"
```

Then restart your stack:

```bash
docker compose up -d
```

The runner will now be available at:

```
http://strava-runner:8080
```

---

## **2. Enable the SFS Console in the Config Tool**

Once the runner is running, open the **Stats for Strava Config Tool** and go to:

```
Settings (gear icon in header) → User Interface Settings
```

Toggle **Enable SFS Console** to **ON**.

When enabled:

- A new sidebar item **"SFS Console"** appears under Utilities
- The Config Tool will load available commands from `commands.yaml`
- The UI will stream output from the runner in real time

When disabled:

- The sidebar item is hidden
- The Console page shows a disabled message with instructions
- No runner interaction occurs

This allows you to keep the UI clean if you don't need console access.

---

## **3. Verify the Runner Is Reachable**

Inside the Config Tool, the Console page performs a health check:

```
GET http://strava-runner:8080/health
```

If the runner is online, you'll see:

- A green "Runner Connected" badge in the header
- The Run button enabled

If offline:

- An orange warning banner appears
- The Run button is disabled
- You'll see instructions to enable the runner in docker-compose

---

## **4. Test the Integration**

Once enabled, open the **SFS Console** from the sidebar (under Utilities).

Select a command (e.g., `webhooks-view`) and click **Run**.

You should see:

- Live streamed output in the terminal
- A final success/failure message
- Logs written to `runner-logs/runner.log`

If the runner is offline or misconfigured, the UI will show a clear error message.

---

## **5. Disable the Feature (Optional)**

You can disable the SFS Console at any time:

1. Go to **Settings** (gear icon)
2. Toggle **Enable SFS Console** to **OFF**
3. (Optional) Comment out the runner block in `docker-compose.yml`
4. Restart your stack

When disabled:

- The sidebar item disappears
- The Console page shows a disabled message
- The runner container is no longer required

---

## **6. Environment Variables**

The Config Tool uses the following environment variable to connect to the runner:

| Variable | Default | Description |
|----------|---------|-------------|
| `STRAVA_RUNNER_URL` | `http://strava-runner:8080` | URL to the Strava Runner sidecar service |

You can override this in your `docker-compose.yml` if needed:

```yaml
environment:
  - STRAVA_RUNNER_URL=http://custom-runner-host:8080
```

---

## **7. Troubleshooting**

### Runner shows "Offline" but container is running

1. Check that both containers are on the same Docker network (`statistics-for-strava-network`)
2. Verify the runner container is healthy: `docker compose logs strava-runner`
3. Test the health endpoint: `docker compose exec config-manager curl http://strava-runner:8080/health`

### Commands fail with "Command not in allowed list"

1. Check your `commands.yaml` file is properly mounted
2. Verify the command exists in the YAML file
3. The runner reloads commands every 5 seconds

### No output appears in terminal

1. Check the browser's Network tab for SSE connection
2. Verify the command is actually running: `docker compose logs strava-runner`
3. Check `runner-logs/runner.log` for errors

### Connection timeout

1. Increase the health check timeout if your network is slow
2. Ensure no firewall is blocking port 8080 between containers

---

## **8. Viewing Logs**

Runner logs are written to the `runner-logs/` directory:

- `runner.log` - JSON structured logs with timestamps, events, and command output

To view logs in real-time:

```bash
tail -f runner-logs/runner.log | jq
```

Or view the last 50 entries:

```bash
tail -50 runner-logs/runner.log | jq
```

---

## **Summary**

| Component           | Enabled                   | Disabled |
| ------------------- | ------------------------- | -------- |
| Runner container    | Required                  | Not used |
| SFS Console sidebar | Visible                   | Hidden   |
| Console page        | Functional                | Shows disabled message |
| Health check        | Active (every 30s)        | Not performed |
| Commands execution  | Allowed                   | Blocked  |
| Logs                | Written to `runner-logs/` | No logs  |

This gives you a clean, optional, fully controlled feature that integrates seamlessly with your existing stack.
