# <img src="./public/logo.svg" alt="Logo showing orange gear on white" width="25" height="25"> Stats for Strava - Configuration Tool

An optional companion tool for [Stats for Strava](https://statistics-for-strava-docs.robiningelbrecht.be/) that makes configuring your statistics dashboard easy and error-free.

## What is This?

This is a **web-based configuration editor** for the [Stats for Strava](https://github.com/robiningelbrecht/strava-statistics) application. Instead of manually editing complex YAML configuration files, you get:

- ✅ **Guided forms** with descriptions for every setting
- ✅ **Validation** that prevents invalid configurations
- ✅ **Visual editors** for complex settings (heart rate zones, FTP history, cron schedules)
- ✅ **No YAML knowledge required** - just fill in the forms

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
      - .env  # Load environment variables from .env file

    volumes: # Match these to your stats for strava config directory
      - ./statistics-for-strava/config:/data/statistics-for-strava/config  
      - ./statistics-for-strava/config/settings:/data/settings
      - ./statistics-for-strava/config/backups:/data/backups

    ports:
      - '8092:80'  # Access at http://localhost:8092

    networks:
      - statistics-for-strava-network
```

**Option: Using a .env file (Recommended)**

Create a `.env` file in the same directory as your `docker-compose.yml`:

```bash
# Container timezone - match with Stats for Strava
TZ=Europe/Brussels

# Path where Stats for Strava stores config.yaml
DEFAULT_STATS_CONFIG_PATH=/app/config/

# User/Group ID for file permissions (Linux/Mac)
USERMAP_UID=1000
USERMAP_GID=1000
```

**Note:** If you already have a `.env` file for Stats for Strava, simply add the `DEFAULT_STATS_CONFIG_PATH` variable to your existing file. The `TZ`, `USERMAP_UID`, and `USERMAP_GID` variables are likely already defined and can be shared between services.

**Option: Inline environment variables**

Alternatively, define environment variables directly in `docker-compose.yml`:

```yaml
config-tool:
  # ... other settings ...
  environment:
    - TZ=Europe/Brussels
    - DEFAULT_STATS_CONFIG_PATH=/app/config/
    - USERMAP_UID=1000
    - USERMAP_GID=1000
```

#### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TZ` | Recommended | `UTC` | Container timezone (match with Stats for Strava) |
| `DEFAULT_STATS_CONFIG_PATH` | Recommended | `/app/config/` | Path where Stats for Strava stores config.yaml |
| `USERMAP_UID` | No | `1000` | User ID for file permissions (Linux/Mac) |
| `USERMAP_GID` | No | `1000` | Group ID for file permissions (Linux/Mac) |

**Notes:**
- On Linux/Mac, get your UID/GID with: `id -u` and `id -g`
- On Windows with Docker Desktop, typically use `1000:1000`
- Set `DEFAULT_STATS_CONFIG_PATH` to where your config files are mounted in the container

#### Step 2: Start the Container

```bash
docker-compose up -d config-tool
```

#### Step 3: Access the Tool

Open your browser to `http://localhost:8092`

#### Important Notes

**Volume Mounting**
- Mount your Stats for Strava config directory to `/app/config` in the container
- The tool needs read/write access to edit your configuration files
- Example: `./config/app:/app/config` mounts the `config/app` directory from your host

**Port Configuration**
- The container runs nginx on port 80 internally
- Map to an available host port (example uses 8092)
- Change `8092:80` to another port if 8092 is already in use
- Example: `8093:80` to access at `http://localhost:8093`

**Time Zone**
- Set `TZ` environment variable to match your Stats for Strava services
- Ensures timestamps are consistent across all containers

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

## How to Use

### First Time Setup

1. **Open Settings** (gear icon in top navigation)
2. **Go to Files tab** and set your default config path
   - Example: `/var/www/config/app/config.yaml` (Docker)
   - Example: `C:\strava\config\app\config.yaml` (Windows)
3. **The tool will auto-create default files** if they don't exist

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

| Section | What It Configures |
|---------|-------------------|
| **General** | App URL, subtitle, profile picture |
| **Athlete** | Birthday, heart rate zones, weight history, FTP data |
| **Appearance** | Locale, units, date/time formats, dashboard layout |
| **Import** | Activity import settings, sport type filters, webhooks |
| **Metrics** | Eddington score calculation, metric groupings |
| **Gear** | Equipment tracking, purchase prices, maintenance |
| **Zwift** | Zwift level and racing score integration |
| **Integrations** | Notification services, AI provider configuration |
| **Daemon** | Scheduled tasks with visual cron builder |

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

**For Docker users**: Use the **container path** in settings, not the host path
- Container path: `/app/config/config.yaml` ✅
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

**Q: Can multiple people use this at once?**  
A: Not recommended - the tool doesn't have user management or conflict resolution.

**Q: Where are my configuration files stored?**  
A: In your Stats for Strava config directory, mounted via Docker volumes.

**Q: Does this replace the Stats for Strava app?**  
A: No! This is just a configuration editor. You still need Stats for Strava to import and display your data.

## Troubleshooting

### Common Issues

**"Cannot read configuration file"**
- Check your config path in Settings → Files
- For Docker: Use container path (e.g., `/app/config/config.yaml`)
- Verify the file exists and has proper permissions

**"Permission denied" when saving**
- Ensure the container has write access to mounted volumes
- Check file/directory permissions on the host

**Changes not appearing in Stats for Strava**
- Restart your Stats for Strava containers after saving
- Verify you're editing the correct config file
- Check Stats for Strava logs for configuration errors

**Container won't start**
- Check port 8092 isn't already in use (change to `8093:80` if needed)
- Verify volume paths exist on your host system
- Check Docker logs: `docker logs stats-for-strava-config-tool`

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