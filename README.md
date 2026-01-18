# <img src="./public/logo.svg" alt="Logo showing orange gear on white" width="25" height="25"> Stats for Strava - Configuration Tool

An optional companion tool for [Stats for Strava](https://statistics-for-strava-docs.robiningelbrecht.be/) that makes configuring your statistics dashboard easy and error-free.

## What is This?

This is a **web-based configuration editor** for the [Stats for Strava](https://github.com/robiningelbrecht/strava-statistics) application. Instead of manually editing complex YAML configuration files, you get:

- ✅ **Guided forms** with descriptions for every setting
- ✅ **Validation** that prevents invalid configurations
- ✅ **Visual editors** for complex settings (heart rate zones, FTP history, cron schedules)
- ✅ **No YAML knowledge required** - just fill in the forms

## 🖼️ Screenshot 

<img src="./public/Dashboard Screenshot v1.0.0 - medium.jpg" alt="Dashboard screenshot">

**Screenshot:** The dashboard view showing multi-file configuration mode, section mapping, and YAML utilities.

## Do I Need This?

**No, it's completely optional!** Stats for Strava works fine with manual YAML editing. Use this tool if you:

- Want a visual interface instead of editing YAML files
- Need help understanding what each configuration option does
- Want validation to catch configuration errors before they cause issues
- Prefer form-based editing with dropdowns, date pickers, and toggles

## Key Features

### 📝 Form-Based Configuration Editor

- **Guided forms** for all configuration sections with clear field descriptions
- **Input validation** prevents invalid values from being saved
- **Type-specific controls** including dropdowns for enums, number inputs for numeric values
- **Required field indicators** mark mandatory fields with red asterisks (*)
- **Real-time validation** to catch errors before saving

### 🔧 Configuration Sections

Manage all aspects of your Strava statistics dashboard:

- **General** - Basic application settings like URLs and titles
- **Athlete** - Personal information including heart rate zones, weight history, and FTP data
- **Appearance** - Visual customization options for your statistics display
- **Import** - Data import settings and preferences
- **Metrics** - Configuration for statistical calculations and metrics
- **Gear** - Equipment and bike configuration
- **Zwift** - Zwift integration settings
- **Integrations** - Third-party service connections and API settings
- **Scheduling Daemon** - Automated task scheduling and background processes

### 📊 Dashboard & Widget Management

- **Dashboard Editor** - Configure dashboard layouts and widget placements
- **Sports List Editor** - Manage sport types and activity classifications
- **Widget Definitions Editor** - Manage widget templates (accessible via Settings → Widgets)
    - Define widget metadata, instance rules, and configuration options
    - 20+ built-in widget definitions including Most Recent Activities, Training Goals, Weekly Statistics, and more
    - Support for single-instance and multi-instance widgets
    - Custom configuration templates for each widget

### 🛠️ YAML Utility

Essential configuration file management tools:

- **Validate YAML files** - Check syntax and structure for errors
- **View file contents** - Browse and inspect configuration files with syntax highlighting
- **Combine configurations** - Merge multiple YAML files into a single unified configuration
- **Monaco Editor integration** - Professional code editing experience

### 🎨 User-Friendly Interface

- **Dark mode support** - Comfortable viewing in any lighting condition
- **Responsive design** - Works on desktop, tablet, and mobile
- **Monaco Editor** - VS Code's editor for advanced YAML viewing
- **Real-time validation** - Catch errors as you type

## Installation

### Option 1: Docker (Recommended)

The easiest way to use this tool is to add it to your existing Stats for Strava `docker-compose.yml` file.

#### Step 1: Add the Service

Add this service to your existing `docker-compose.yml`:

```yaml
services:
  # ... your existing services (app, daemon, etc.) ...

  config-tool:
    image: ghcr.io/dschoepel/stats-for-strava-config-tool:latest
    container_name: stats-for-strava-config-tool
    restart: unless-stopped

    env_file:
      - .env  # Load Docker Compose variables

    volumes: 
      - ./.env.config-tool:/app/.env  # Authentication settings (must be writable)
      - ./statistics-for-strava/config:/data/config  # Config files
      - ./statistics-for-strava/storage:/data/storage  # Gear maintenance
      - ./statistics-for-strava/logs:/data/logs  # Application logs
    ports:
      - '8092:80'  # Access at http://localhost:8092

    networks:
      - statistics-for-strava-network
```

**Two-File Environment Variable Strategy**

This tool uses **two separate .env files** to avoid Docker Compose variable expansion issues with bcrypt password hashes:

1. **`.env`** - Docker Compose variables (volume paths, UID/GID)
2. **`.env.config-tool`** - Authentication settings (mounted into container)

**Create `.env` file** in the same directory as your `docker-compose.yml`:

```bash
# Path where Stats for Strava stores config.yaml
DEFAULT_STATS_CONFIG_PATH=/data/config

# Path where gear maintenance files are stored
DEFAULT_GEAR_MAINTENANCE_PATH=/data/storage/gear-maintenance

# User/Group ID for file permissions (Linux/Mac)
USERMAP_UID=1000
USERMAP_GID=1000
```

**Create `.env.config-tool` file** (copy from `.env.config-tool.example`):

```bash
# Authentication Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=
PASSWORD_RESET_TOKEN=
SESSION_SECRET=change-this-to-a-long-random-secret-string
SESSION_MAX_AGE=604800

# Debug Logging
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=false
```

⚠️ **IMPORTANT**: The `.env.config-tool` file must be **writable** by the container (UID/GID 1000) so the app can update password hashes during registration and password resets.

**Why Two Files?**

Docker Compose expands `${VARIABLE}` syntax in .env files, which breaks bcrypt password hashes (they contain `$2b$` prefixes). By keeping authentication variables in a separate file that's mounted directly into the container, we avoid this expansion issue.

#### Environment Variables (.env file) (.env file)

| Variable                        | Required    | Default                                                | Description                                    |
| ------------------------------- | ----------- | ------------------------------------------------------ | ---------------------------------------------- |
| `DEFAULT_STATS_CONFIG_PATH`     | Recommended | `/data/config`                   | Path where Stats for Strava stores config.yaml |
| `DEFAULT_GEAR_MAINTENANCE_PATH` | Recommended | `/data/storage/gear-maintenance` | Path for gear maintenance files                |
| `USERMAP_UID`                   | No          | `1000`                                                 | User ID for file permissions (Linux/Mac)       |
| `USERMAP_GID`                   | No          | `1000`                                                 | Group ID for file permissions (Linux/Mac)      |

#### Environment Variables (.env.config-tool file)

| Variable                        | Required | Default                                      | Description                                           |
| ------------------------------- | -------- | -------------------------------------------- | ----------------------------------------------------- |
| `ADMIN_USERNAME`                | Yes      | `admin`                                      | Username for authentication                           |
| `ADMIN_PASSWORD_HASH`           | No       | (empty)                                      | Bcrypt hash of password (auto-generated on first run) |
| `PASSWORD_RESET_TOKEN`          | No       | (empty)                                      | Token for password reset (auto-generated when needed) |
| `SESSION_SECRET`                | **Yes**  | `change-this-to-a-long-random-secret-string` | Secret key for JWT tokens (**MUST CHANGE!**)          |
| `SESSION_MAX_AGE`               | No       | `604800`                                     | Session duration in seconds (default: 7 days)         |
| `NEXT_PUBLIC_ENABLE_DEBUG_LOGS` | No       | `false`                                      | Enable verbose debug logging (true/false)             |

⚠️ **CRITICAL**: Generate a strong random `SESSION_SECRET` before first use! See instructions below.

**How to Generate a Secure SESSION_SECRET:**

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

**Notes:**

- On Linux/Mac, get your UID/GID with: `id -u` and `id -g`
- On Windows with Docker Desktop, typically use `1000:1000`
- Set `DEFAULT_STATS_CONFIG_PATH` to where your config files are mounted in the container
- The `.env.config-tool` file must be writable by the container (UID/GID should match `USERMAP_UID`/`USERMAP_GID`)

#### Step 2: Generate SESSION_SECRET

**Before starting the container**, generate a secure session secret:

```powershell
# PowerShell (Windows)
-join ((1..64) | ForEach-Object { '{0:X}' -f (Get-Random -Maximum 16) })
```

Copy the output and replace `change-this-to-a-long-random-secret-string` in your `.env.config-tool` file.

#### Step 3: Start the Container

```bash
docker-compose up -d config-tool
```

#### Step 4: First-Time Registration

1. **Navigate to** `http://localhost:8092`
2. **You'll be redirected** to the registration page (no password set yet)
3. **Create your password** - Enter your desired password (8+ characters)
4. **Login** - Use the username from `.env.config-tool` (default: `admin`) and your new password

🔒 Your password is automatically hashed with bcrypt and saved to `.env.config-tool` as `ADMIN_PASSWORD_HASH`.

#### Important Notes

**Authentication Required**

- This tool now requires login for security
- First-time setup: register with a password (8+ characters)
- Sessions persist for 7 days by default (configurable via `SESSION_MAX_AGE`)
- See [AUTHENTICATION.md](AUTHENTICATION.md) for advanced auth topics

**Volume Mounting**

- The `.env.config-tool` file **must be writable** by the container
- Mount your Stats for Strava config directory to the container
- The tool needs read/write access to edit your configuration files
- 4 volumes are mounted: auth config, config files, storage, and logs

**Backup Files**

- Configuration backups are automatically created in `<config-path>/backups/`
- Backup naming format: `config-YYYYMMDD-HHMMSS.yaml` (e.g., `config-20260116-143025.yaml`)
- The backups folder is auto-created if it doesn't exist
- Backups are created before saving changes to protect against errors

**Settings Folder**

A `settings` folder is auto-created in your config path: `<config-path>/settings/`

Contains three YAML files that store tool-specific configuration:

| File Name                        | Description                                              |
| -------------------------------- | -------------------------------------------------------- |
| `config-tool-settings.yaml`      | General application settings (file paths, preferences)   |
| `strava-sports-by-category.yaml` | Sports list configuration and sport type classifications |
| `widget-definitions.yaml`        | Widget template definitions and metadata                 |

These files are managed through the tool's UI (Settings dialog and Sports List Editor). Do not manually edit these files unless you know what you're doing.

**Port Configuration**

- The container runs nginx on port 80 internally
- Map to an available host port (example uses 8092)
- Change `8092:80` to another port if 8092 is already in use
- Example: `8093:80` to access at `http://localhost:8093`

**Network**

- Use the same network as your Stats for Strava services
- Typically `statistics-for-strava-network`

### Option 2: Standalone (Node.js)

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

The app will be available at `http://localhost:3000`

### Option 3: Running Behind Nginx Reverse Proxy

If you want to access the config tool via a domain name with SSL encryption, you can run it behind an Nginx reverse proxy with Let's Encrypt certificates.

#### Prerequisites

- Nginx installed on your host system
- Certbot for Let's Encrypt certificates
- Container running and accessible at `http://localhost:8092` (or your custom port)
- Domain name pointing to your server

#### Step 1: Obtain SSL Certificate

```bash
# Install certbot if not already installed
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate for your domain
sudo certbot certonly --nginx -d your-domain.com
```

#### Step 2: Create Nginx Site Configuration

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
        # Replace localhost with the actual IP if container is on another host
        proxy_pass http://localhost:8092;
        
        # Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket Support (if needed in future)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
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

#### Step 3: Enable the Site

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/strava-config-tool /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx to apply changes
sudo systemctl reload nginx
```

#### Step 4: Configure Automatic Certificate Renewal

Let's Encrypt certificates expire after 90 days. Set up automatic renewal:

```bash
# Test renewal process
sudo certbot renew --dry-run

# Certbot automatically installs a cron job or systemd timer
# Verify it's active:
sudo systemctl status certbot.timer
```

#### Step 5: Access Your Config Tool

Navigate to `https://your-domain.com` in your browser. The connection will be:

- ✅ Encrypted with SSL/TLS
- ✅ Automatically redirected from HTTP to HTTPS
- ✅ Protected with modern security headers

#### Troubleshooting Proxy Issues

**502 Bad Gateway**

- Verify container is running: `docker ps | grep config-tool`
- Check container accessibility: `curl http://localhost:8092`
- Verify proxy_pass IP address is correct
- Check nginx error logs: `sudo tail -f /var/log/nginx/strava-config-tool-error.log`

**SSL Certificate Errors**

- Ensure domain points to your server IP
- Verify certificates exist: `sudo ls -la /etc/letsencrypt/live/your-domain.com/`
- Check certificate expiration: `sudo certbot certificates`

**Connection Timeout**

- Increase timeout values in nginx config
- Check firewall rules for ports 80, 443, and 8092
- Verify docker network allows external access

## How to Use

### First Time Setup

1. **Register and login** - Create your admin password on first launch
2. **Open Settings** (gear icon in top navigation)
3. **Go to Files tab** and set your default config path

   - Example: `/data/config` (Docker - use container path)
   - Example: `C:\strava\config` (Windows standalone)
4. **The tool will auto-create default files** if they don't exist

### Basic Workflow

1. **Choose a configuration section** from the sidebar menu
2. **Fill in the form fields** - required fields are marked with an asterisk (*)
3. **Read the field descriptions** to understand what each setting does
4. **Click Save** - the tool validates your input before saving
5. **Restart Stats for Strava** to apply your changes

### Widget Definitions Management

1. **Open Settings** - Click the gear icon in the top navigation
2. **Select Widgets tab** - Navigate to the Widget Definitions section
3. **View widgets** - Widgets are grouped by instance rules
4. **Expand details** - Click the toggle arrow to see properties and configuration templates
5. **Add/Edit/Delete** - Use the respective buttons to manage widget definitions
6. **Save changes** - Click the Save button to write all changes to file

### YAML File Management

1. **Access YAML Utility** - Navigate to the YAML Utility section
2. **Validate files** - Check your configuration files for syntax errors
3. **View contents** - Inspect configuration files with syntax highlighting
4. **Combine files** - Merge multiple configuration files into one

## Configuration Sections

The tool provides guided forms for all Stats for Strava configuration sections:

| Section          | What It Configures                                     |
| ---------------- | ------------------------------------------------------ |
| **General**      | App URL, subtitle, profile picture                     |
| **Athlete**      | Birthday, heart rate zones, weight history, FTP data   |
| **Appearance**   | Locale, units, date/time formats, dashboard layout     |
| **Import**       | Activity import settings, sport type filters, webhooks |
| **Metrics**      | Eddington score calculation, metric groupings          |
| **Gear**         | Equipment tracking, purchase prices, maintenance       |
| **Zwift**        | Zwift level and racing score integration               |
| **Integrations** | Notification services, AI provider configuration       |
| **Daemon**       | Scheduled tasks with visual cron builder               |

### Additional Tools

- **Dashboard Editor** - Drag-and-drop widget layout configuration
- **Sports List Editor** - Manage sport types and classifications
- **Widget Definitions** - Customize widget templates and settings
- **YAML Utility** - Validate, view, and combine configuration files

## Important Notes

### ⚠️ Comment Preservation

When saving through the form editor:

- **Section headers are preserved** (e.g., `# Athlete Configuration`)
- **Inline comments may be removed** - The forms provide all descriptions, making embedded comments redundant

If you need to preserve all comments, edit the YAML files manually.

### 💾 Configuration Path

**For Docker users**: Use the **container path** in settings - this is the path you entered in the environment variabale `DEFAULT_STATS_CONFIG_PATH` , not the host path.  Be sure to use the fully expanded path.

- Container path: `/data/config/config.yaml` ✅
- Host path: `./config/app/config.yaml` ❌

### 🔄 Applying Changes

After saving configuration changes:

1. Restart your Stats for Strava containers
2. Changes take effect on next import or rebuild

## Frequently Asked Questions

**Q: Will this tool work with my existing Stats for Strava setup?**  

A: Yes! Just mount your config directory and point the tool to your config files.

**Q: Can I run this without Docker?**  

A: Yes, but Docker is easier. See "Option 2: Standalone" in the Installation section.

**Q: Do I need to keep this running all the time?**  

A: No! Only run it when you want to edit configuration. Stop the container when done.

**Q: What happens if I make a mistake?**  

A: The tool validates all inputs before saving. You can also manually restore from backups if needed.

**Q: Why do I need two .env files?**  

A: Docker Compose expands `${VARIABLE}` syntax which breaks bcrypt password hashes (they contain `$2b$` prefixes). Keeping authentication variables in `.env.config-tool` and mounting it directly avoids this issue.

**Q: How do I reset my password if I forgot it?**  

A: Generate a reset token and add it to `.env.config-tool`, then use the reset password page. See [AUTHENTICATION.md](AUTHENTICATION.md) for detailed instructions.

**Q: Can I disable authentication?**  

A: No, authentication is required for security. This tool modifies your Stats for Strava configuration, so unauthorized access could break your setup.

**Q: How long do sessions last?**  

A: Default is 7 days (604800 seconds). Configure with `SESSION_MAX_AGE` in `.env.config-tool`.

**Q: Can multiple people use this at once?**  

A: Not recommended - the tool is designed for single-user access and doesn't have conflict resolution.

**Q: Where are my configuration files stored?**  

A: In your Stats for Strava config directory, mounted via Docker volumes at `/data/config`.

**Q: Where are backup files saved?**  

A: In `<config-path>/backups/` folder (auto-created). Example: `/data/config/backups/config-20260116-143025.yaml`

**Q: Does this replace the Stats for Strava app?**  

A: No! This is just a configuration editor. You still need Stats for Strava to import and display your data.

## Troubleshooting

### Common Issues

**"Cannot read configuration file"**

- Check your config path in Settings → Files
- For Docker: Use container path (e.g., `/data/config`)
- Verify the file exists and has proper permissions

**"Permission denied" when saving**

- Ensure the container has write access to mounted volumes
- Check file/directory permissions on the host
- For `.env.config-tool`: Verify UID/GID 1000 can write to the file

**"Redirected to registration page after logging in"**

- Check `.env.config-tool` file is writable by the container
- Verify `ADMIN_PASSWORD_HASH` was written to `.env.config-tool`
- Check container logs: `docker logs stats-for-strava-config-tool`
- On Windows: Ensure file isn't read-only

**"Invalid session" or "Session expired" errors**

- Verify `SESSION_SECRET` is set in `.env.config-tool` (not the default placeholder)
- Don't change `SESSION_SECRET` after users are logged in (invalidates existing sessions)
- Check `SESSION_MAX_AGE` value (default: 604800 seconds = 7 days)

**Password reset not working**

- Generate a reset token: See [AUTHENTICATION.md](AUTHENTICATION.md) for instructions
- Verify `.env.config-tool` is writable so `PASSWORD_RESET_TOKEN` can be saved
- Check container logs for permission errors

**Changes not appearing in Stats for Strava**

- Restart your Stats for Strava containers after saving
- Verify you're editing the correct config file
- Check Stats for Strava logs for configuration errors

**Container won't start**

- Check port 8092 isn't already in use (change to `8093:80` if needed)
- Verify volume paths exist on your host system
- Check Docker logs: `docker logs stats-for-strava-config-tool`
- Ensure `.env.config-tool` exists (copy from `.env.config-tool.example`)

**Widget definitions not saving**

- Click the main **Save** button (individual edits are held in memory)
- Check file path in Settings → Files

**Form validation errors**

- Required fields must be filled (marked with *)
- Check value formats (dates must be YYYY-MM-DD, etc.)
- Hover over field descriptions for format requirements

## Advanced Usage

### Combining Multiple Config Files

Use the **YAML Utility** to merge multiple configuration files:

1. Navigate to YAML Utility in the sidebar
2. Click "Combine Files"
3. Select source files to merge
4. Save the combined output

### Custom Widget Definitions

Access via Settings → Widgets to:

- Create new widget types
- Customize widget properties
- Define configuration templates
- Set instance rules (single vs multiple)

### Visual Cron Expression Builder

When configuring scheduled tasks (Daemon section):

- Click the **Builder** button next to cron expressions
- Use the visual interface to set schedules
- See human-readable descriptions of cron patterns

## For Developers

Contributing to this project? See the **[Developer Guide](DEVELOPER.md)** for:

- Architecture overview and code organization
- Component patterns and best practices
- Custom hooks and API client documentation
- Testing guidelines and debugging tips
- Build and deployment instructions

## Support

- **Config Tool Issues**: [GitHub Issues](https://github.com/dschoepel/stats-for-strava-config-tool/issues)
- **Stats for Strava Docs**: [statistics-for-strava-docs.robiningelbrecht.be](https://statistics-for-strava-docs.robiningelbrecht.be/)
- **Stats for Strava Issues**: [robiningelbrecht/strava-statistics](https://github.com/robiningelbrecht/strava-statistics/issues)

---

**Not affiliated with Strava, Inc.** This is a community tool for the Stats for Strava project.