# Installation Guide

This guide covers all installation options for the Stats for Strava Configuration Tool.

## Prerequisites

Before installing, ensure you have:

- **Statistics for Strava** already installed and running
- Access to your Statistics for Strava config directory
- Docker (recommended) or Node.js 18+ (standalone)

---

## Option 1: Docker (Recommended)

The easiest way to use this tool is to add it to your existing Statistics for Strava `docker-compose.yml` file.

### Step 1: Add the Service

Add this service to your existing `docker-compose.yml`:

```yaml
services:  # <- Don't add this line if it already exists in your file
  # ... your existing Statistics for Strava services (app, daemon, etc.) ...

  config-manager:
    image: ghcr.io/dschoepel/stats-for-strava-config-tool:latest
    container_name: stats-for-strava-config-tool
    restart: unless-stopped

    environment:
      - TZ=${TZ}
      - USERMAP_UID=${USERMAP_UID}
      - USERMAP_GID=${USERMAP_GID}
      - DEFAULT_STATS_CONFIG_PATH=${DEFAULT_STATS_CONFIG_PATH}
      - DEFAULT_GEAR_MAINTENANCE_PATH=${DEFAULT_GEAR_MAINTENANCE_PATH}
      - STATS_CMD_RUNNER_URL=${STATS_CMD_RUNNER_URL:-http://stats-cmd-runner:8080}

    volumes:
      - ./.env.config-tool:/app/.env  # Authentication settings (must be writable)
      - ./config:/data/config  # Config files
      - ./storage:/data/storage  # Gear maintenance
      - ./logs:/data/logs  # Application logs
      - ./stats-cmd-logs:/var/log/stats-cmd/command-logs:rw  # Console command logs

    ports:
      - '8092:80'  # Access at http://localhost:8092

    networks:
      - statistics-for-strava-network
```

### Step 2: Create Environment Files

This tool uses **two separate .env files** to avoid Docker Compose variable expansion issues with bcrypt password hashes:

1. **`.env`** - Docker Compose variables (volume paths, UID/GID, timezone)
2. **`.env.config-tool`** - Authentication settings (mounted into container)

#### Create or Update `.env` file

If you're adding the Config Tool to an existing Statistics for Strava setup, you likely already have a `.env` file. In this case, **merge** the Config Tool variables into your existing file rather than overwriting it.

**If you DON'T have a `.env` file yet:**

```bash
# Copy the example file
cp .env.example .env

# Edit and customize:
nano .env
```

**If you ALREADY have a `.env` file (from Statistics for Strava):**

Add these variables from `.env.example` to your existing `.env` file:

```bash
# Config Tool specific variables to add:
DEFAULT_STATS_CONFIG_PATH=/data/config/
DEFAULT_GEAR_MAINTENANCE_PATH=/data/storage/gear-maintenance
STATS_CMD_RUNNER_URL=http://stats-cmd-runner:8080
STATS_CMD_HELPER_PORT=8081
```

Your existing Statistics for Strava variables (`TZ`, `USERMAP_UID`, `USERMAP_GID`, etc.) can be shared with the Config Tool.

#### Create `.env.config-tool` file

Copy from `.env.config-tool.example`:

```bash
# Copy the example file
cp .env.config-tool.example .env.config-tool

# Edit and customize (see SESSION_SECRET below):
nano .env.config-tool
```

> **Important:** The `.env.config-tool` file must be **writable** by the container (UID/GID 1000) so the app can update password hashes during registration and password resets.

#### Why Two Files?

Docker Compose expands `${VARIABLE}` syntax in .env files, which breaks bcrypt password hashes (they contain `$2b$` prefixes). By keeping authentication variables in a separate file that's mounted directly into the container, we avoid this expansion issue.

### Step 3: Generate SESSION_SECRET

**Before starting the container**, generate a secure session secret:

```powershell
# PowerShell (Windows)
-join ((1..64) | ForEach-Object { '{0:X}' -f (Get-Random -Maximum 16) })
```

```bash
# Linux/Mac
openssl rand -hex 32

# Node.js (any platform)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and replace `change-this-to-a-long-random-secret-string` in your `.env.config-tool` file.

### Step 4: Start the Container

```bash
docker compose up -d config-manager
```

### Step 5: First-Time Registration

1. Navigate to `http://localhost:8092`
2. You'll be redirected to the registration page (no password set yet)
3. Create your password (8+ characters)
4. Login with the username from `.env.config-tool` (default: `admin`) and your new password

Your password is automatically hashed with bcrypt and saved to `.env.config-tool` as `ADMIN_PASSWORD_HASH`.

---

## Environment Variables Reference

### `.env` file (Docker Compose)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEFAULT_STATS_CONFIG_PATH` | Recommended | `/data/config` | Path where Stats for Strava stores config.yaml |
| `DEFAULT_GEAR_MAINTENANCE_PATH` | Recommended | `/data/storage/gear-maintenance` | Path for gear maintenance files |
| `STATS_CMD_RUNNER_URL` | No | `http://stats-cmd-runner:8080` | URL of SFS Console runner service |
| `STATS_CMD_HELPER_PORT` | No | `8081` | Port for the SFS Console helper service |
| `USERMAP_UID` | No | `1000` | User ID for file permissions (Linux/Mac) |
| `USERMAP_GID` | No | `1000` | Group ID for file permissions (Linux/Mac) |
| `TZ` | No | `UTC` | Timezone for the container |

### `.env.config-tool` file (Authentication)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_USERNAME` | Yes | `admin` | Username for authentication |
| `ADMIN_PASSWORD_HASH` | No | (empty) | Bcrypt hash of password (auto-generated on first run) |
| `PASSWORD_RESET_TOKEN` | No | (empty) | Token for password reset (auto-generated when needed) |
| `SESSION_SECRET` | **Yes** | `change-this-to-a-long-random-secret-string` | Secret key for JWT tokens (**MUST CHANGE!**) |
| `SESSION_MAX_AGE` | No | `604800` | Session duration in seconds (default: 7 days) |
| `NEXT_PUBLIC_ENABLE_DEBUG_LOGS` | No | `false` | Enable verbose debug logging |

---

## Important Notes

### Volume Mounting

- The `.env.config-tool` file **must be writable** by the container
- Mount your Stats for Strava config directory to the container
- The tool needs read/write access to edit your configuration files
- 5 volumes are mounted: auth config, config files, storage, logs, and console command logs

### Backup Files

- Configuration backups are automatically created in `<config-path>/backups/`
- Backup naming format: `config-YYYYMMDD-HHMMSS.yaml`
- The backups folder is auto-created if it doesn't exist
- Backups are created before saving changes to protect against errors

### Settings Folder

A `settings` folder is auto-created in your config path: `<config-path>/settings/`

| File Name | Description |
|-----------|-------------|
| `config-tool-settings.yaml` | General application settings (file paths, preferences) |
| `strava-sports-by-category.yaml` | Sports list configuration and sport type classifications |
| `widget-definitions.yaml` | Widget template definitions and metadata |

These files are managed through the tool's UI (Settings dialog and Sports List Editor).

### Port Configuration

- The container runs nginx on port 80 internally
- Map to an available host port (example uses 8092)
- Change `8092:80` to another port if 8092 is already in use

### Network

- Use the same network as your Stats for Strava services
- Typically `statistics-for-strava-network`

---

## Option 2: Standalone (Node.js)

If you prefer running without Docker:

```bash
# Clone the repository
git clone https://github.com/dschoepel/stats-for-strava-config-tool.git
cd stats-for-strava-config-tool

# Install dependencies
npm install

# Build the application
npm run build

# Start the server
npm start
```

The app will be available at `http://localhost:3000`.

### Notes for Standalone

- On Linux/Mac, get your UID/GID with: `id -u` and `id -g`
- On Windows with Docker Desktop, typically use `1000:1000`
- Set `DEFAULT_STATS_CONFIG_PATH` to where your config files are located

---

## Option 3: Nginx Reverse Proxy

If you want to access the config tool via a domain name with SSL encryption, you can run it behind an Nginx reverse proxy with Let's Encrypt certificates.

### Prerequisites

- Nginx installed on your host system
- Certbot for Let's Encrypt certificates
- Container running and accessible at `http://localhost:8092` (or your custom port)
- Domain name pointing to your server

### Step 1: Obtain SSL Certificate

```bash
# Install certbot if not already installed
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate for your domain
sudo certbot certonly --nginx -d your-domain.com
```

### Step 2: Create Nginx Site Configuration

Create a new site configuration file:

```bash
sudo nano /etc/nginx/sites-available/strava-config-tool
```

Add the following configuration (replace `your-domain.com` with your actual domain):

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;

    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/strava-config-tool-access.log;
    error_log /var/log/nginx/strava-config-tool-error.log;

    # Proxy Configuration
    location / {
        proxy_pass http://localhost:8092;

        # Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # WebSocket Support (for SSE streaming)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering (disable for SSE)
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Increase upload size limit for config files
    client_max_body_size 10M;
}
```

**If your container is on a different host:**

Replace `proxy_pass http://localhost:8092;` with the actual IP address:

```nginx
proxy_pass http://192.168.1.100:8092;  # Replace with your host IP
```

### Step 3: Enable the Site

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/strava-config-tool /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx to apply changes
sudo systemctl reload nginx
```

### Step 4: Configure Automatic Certificate Renewal

Let's Encrypt certificates expire after 90 days. Set up automatic renewal:

```bash
# Test renewal process
sudo certbot renew --dry-run

# Certbot automatically installs a cron job or systemd timer
# Verify it's active:
sudo systemctl status certbot.timer
```

### Step 5: Access Your Config Tool

Navigate to `https://your-domain.com` in your browser. The connection will be:

- Encrypted with SSL/TLS
- Automatically redirected from HTTP to HTTPS
- Protected with modern security headers

---

## Next Steps

- [Features Guide](FEATURES.md) - Learn about all features
- [SFS Console Setup](SFS-CONSOLE-SETUP.md) - Enable the command console
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- [Authentication Guide](AUTHENTICATION.md) - Advanced auth topics
