# Settings Management Guide

Configure the Config Tool application preferences and behavior

## Accessing Settings

Click the **gear icon** in the top navigation bar to open the Settings dialog. Settings are organized into multiple tabs, each managing different aspects of the Config Tool.

Settings are stored locally in your browser and in a configuration file (settings.yaml) on disk, allowing them to persist across sessions and devices.

## Files Tab

Configure file paths and default locations for configuration files.

### Default Configuration Path

The primary location where your Stats for Strava config.yaml file is stored.

**Docker users:** Use the container path, not the host path

Example: `/data/statistics-for-strava/config/config.yaml`

### Settings Directory

Where the Config Tool stores its own settings (widget definitions, preferences, etc.)

Default: `/data/settings/`

### Backups Directory

Location where automatic backups of configuration files are saved before editing. If not set, defaults to a `backups` subfolder within your Default Path.

Example (Windows): `C:\Users\username\Documents\config\backups`

Example (Docker): `/data/statistics-for-strava/config/backups`

### Auto Backup

When enabled, automatically creates timestamped backups before saving configuration changes via form editors or YAML Utility

Default: `Enabled`

> **Note:** The Config Tool automatically creates default settings files (widget-definitions.yaml, settings.yaml) on first startup if they don't exist. Configuration files for Stats for Strava (config.yaml) are not auto-created.

## Widgets Tab

Manage widget definitions that control which widgets are available for your dashboard.

### Widget Definitions File

Location of the widget-definitions.yaml file that stores widget templates

Default: `/data/settings/widget-definitions.yaml`

### Widget List

View and edit all available widget definitions. Widgets are grouped by:

- Can be added multiple times (multi-instance)
- Can only be added once (single-instance)

### Managing Widgets

Add, edit, or delete widget definitions. Changes are held in memory until you click the main Save button.

> See the Widget Definitions Editor section in the main Help page for detailed instructions.

## Validation Tab

Configure validation limits that may change over time as external services update their constraints.

### Maximum Zwift Level

The maximum allowed Zwift level for schema validation

**Current default:** 100

Zwift may increase this limit in the future. Update this value when Zwift raises their level cap to allow higher level inputs without validation errors.

### Future Validation Limits

Additional validation limits may be added here as the Config Tool evolves to support new configuration options with changing constraints.

> **Why adjust these?** External services like Zwift occasionally increase limits (level caps, power limits, etc.). Updating these validation settings ensures the Config Tool accepts valid new values without requiring a software update.

## UI Tab

Customize the Config Tool's user interface appearance and behavior.

### Theme

Choose between light and dark color schemes:

- **Light Theme** - Bright, high-contrast display
- **Dark Theme** - Reduced eye strain in low light

### Sidebar Position

Choose whether the navigation sidebar appears on the left or right side of the screen

### Compact Mode

Reduce spacing and padding for a more condensed interface (useful for smaller screens)

### Show Field Descriptions

Display helpful tooltips and descriptions for form fields (recommended for new users)

### Confirm Before Saving

Show a confirmation dialog before writing changes to configuration files

## Import/Export Settings

Located in the Settings dialog, the Import/Export tab allows you to:

### Export Settings

Download your current Config Tool settings as a JSON file for backup or sharing

### Import Settings

Load settings from a previously exported JSON file to quickly configure a new installation

### Reset to Defaults

Restore all Config Tool settings to their original default values (does not affect Stats for Strava configuration)

## Settings Storage

Config Tool settings are stored in two locations:

### Browser Local Storage

Quick-access settings stored in your browser for immediate use. Cleared if you clear browser data.

### Settings YAML File

Persistent settings stored at `/data/settings/settings.yaml`

Settings are automatically synced between browser and disk on app startup and when changes are saved.

## Best Practices

**Set paths first**
Configure your file paths in the Files tab before using other features

**Enable automatic backups**
Protect against accidental changes by keeping backup copies of your configuration

**Export settings regularly**
Keep a backup of your Config Tool preferences, especially if you've customized widget definitions

**Use Docker paths correctly**
Always use container paths (/data/...) when running in Docker, not host paths (./...)

**Update validation limits as needed**
Check the Validation tab if you encounter errors about valid values (like new Zwift levels) being rejected
