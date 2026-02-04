# <img src="./public/logo.svg" alt="Logo showing orange gear on white" width="25" height="25"> Stats for Strava - Configuration Tool

An **optional companion tool** for [Statistics for Strava](https://github.com/robiningelbrecht/strava-statistics) that makes configuring your statistics dashboard easy and error-free.

## What is This?

This is a **web-based configuration editor** for Statistics for Strava. Instead of manually editing complex YAML configuration files, you get:

- **Guided forms** with descriptions for every setting
- **Validation** that prevents invalid configurations
- **Visual editors** for complex settings (heart rate zones, FTP history, cron schedules)
- **No YAML knowledge required** - just fill in the forms

> **Note:** This tool does NOT replace Statistics for Strava — it only helps configure it. You still need the main application to import and display your Strava data.

## Screenshot

<img src="./public/Dashboard Screenshot v1.0.0 - medium.jpg" alt="Dashboard screenshot">

**Screenshot:** The dashboard view showing multi-file configuration mode, section mapping, and YAML utilities.

## Additional Screenshots
[Interactive slider](https://dschoepel.github.io/stats-for-strava-config-tool/slider.html)

## Do I Need This?

**No, it's completely optional!** Statistics for Strava works fine with manual YAML editing. Use this tool if you:

- Want a visual interface instead of editing YAML files
- Need help understanding what each configuration option does
- Want validation to catch configuration errors before they cause issues
- Prefer form-based editing with dropdowns, date pickers, and toggles

---

## Quick Start (Docker)

**Prerequisites:** Statistics for Strava already installed and running.

### 1. Set up environment files

```bash
# If you DON'T have a .env file yet, copy the example:
cp .env.example .env

# If you ALREADY have a .env file (from Statistics for Strava),
# merge the config tool variables from .env.example into your existing .env

# Always copy the auth config file:
cp .env.config-tool.example .env.config-tool

# Edit .env.config-tool and set a strong SESSION_SECRET
```

> **Note:** If you're sharing a `.env` file with Statistics for Strava, add the config tool variables (`DEFAULT_STATS_CONFIG_PATH`, `DEFAULT_GEAR_MAINTENANCE_PATH`, `STATS_CMD_RUNNER_URL`, etc.) to your existing file rather than overwriting it.

### 2. Add to docker-compose.yml

```yaml
services:  # <- Don't add this line if it already exists in your file
  # ... your existing Statistics for Strava services ...

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
    volumes:
      - ./.env.config-tool:/app/.env  # Auth settings (must be writable)
      - ./config:/data/config          # Stats for Strava config directory
      - ./storage:/data/storage        # Gear maintenance and storage
      - ./logs:/data/logs              # Application logs
    ports:
      - "8092:80"
    networks:
      - statistics-for-strava-network
```

### 3. Start the container

```bash
docker compose up -d config-manager
```

### 4. Register and login

Navigate to `http://localhost:8092`, register your admin password, and start configuring!

**For detailed setup options**, see the [Installation Guide](docs/INSTALLATION.md).

---

## Features at a Glance

| Feature | Description | Details |
|---------|-------------|---------|
| **Form Editor** | Edit all config sections visually | [Features](docs/FEATURES.md#form-based-configuration-editor) |
| **Dashboard Editor** | Configure widget layouts | [Features](docs/FEATURES.md#dashboard--widget-management) |
| **SFS Console** | Run Symfony commands from UI | [Console Setup](docs/SFS-CONSOLE-SETUP.md) |
| **YAML Utility** | Validate and combine files | [Features](docs/FEATURES.md#yaml-utility) |
| **Gear Maintenance** | Track equipment usage | [Features](docs/FEATURES.md#gear-maintenance) |
| **Visual Cron Builder** | Build cron expressions visually | [Features](docs/FEATURES.md#visual-cron-expression-builder) |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Installation Guide](docs/INSTALLATION.md) | All setup options (Docker, Standalone, Nginx) |
| [Features Guide](docs/FEATURES.md) | Detailed feature documentation |
| [SFS Console Setup](docs/SFS-CONSOLE-SETUP.md) | Command console setup |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | FAQ and common issues |
| [Authentication](docs/AUTHENTICATION.md) | Auth and security details |
| [Developer Guide](docs/DEVELOPER.md) | Contributing and architecture |

---

## Configuration Sections

| Section | What It Configures |
|---------|-------------------|
| **General** | App URL, subtitle, profile picture |
| **Athlete** | Birthday, heart rate zones, weight history, FTP data |
| **Appearance** | Locale, units, date/time formats |
| **Import** | Activity import settings, webhooks |
| **Metrics** | Eddington score, metric groupings |
| **Gear** | Equipment tracking, maintenance |
| **Zwift** | Zwift level and racing score |
| **Integrations** | Notifications, AI providers |
| **Daemon** | Scheduled tasks |

---

## Important Notes

### Comment Preservation

When saving through the form editor, section headers are preserved but inline comments may be removed. If you need to preserve all comments, edit the YAML files manually.

### Configuration Path

**Docker users:** Use the **container path** in settings, not the host path.

- Container path: `/data/config/config.yaml` ✅
- Host path: `./config/app/config.yaml` ❌

### Applying Changes

After saving configuration changes, restart your Statistics for Strava containers for changes to take effect.

---

## For Developers

Contributing to this project? See the **[Developer Guide](docs/DEVELOPER.md)** for:

- Architecture overview and code organization
- Component patterns and best practices
- API documentation
- Build and deployment instructions

---

## Support

- **Config Tool Issues:** [GitHub Issues](https://github.com/dschoepel/stats-for-strava-config-tool/issues)
- **Statistics for Strava Docs:** [statistics-for-strava-docs.robiningelbrecht.be](https://statistics-for-strava-docs.robiningelbrecht.be/)
- **Statistics for Strava Issues:** [robiningelbrecht/strava-statistics](https://github.com/robiningelbrecht/strava-statistics/issues)

---

**Not affiliated with Strava, Inc.** This is a community tool for the Statistics for Strava project.
