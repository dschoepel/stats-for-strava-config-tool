# Settings Management Guide

Configure the Config Tool application preferences and behavior

## Accessing Settings

Click the **Settings** dropdown in the top navigation bar to open the settings menu. Settings are organized into multiple tabs, each managing different aspects of the Config Tool.

Settings are stored locally in your browser and in a configuration file (settings.yaml) on disk, allowing them to persist across sessions and devices.

### Available Settings Tabs

| Tab | Purpose |
|-----|---------|
| [User Interface](#ui-tab) | Theme, sidebar, display options |
| [Files](#files-tab) | File paths, backups, validation |
| [Editor](#editor-tab) | YAML editor appearance |
| [Validation](#validation-tab) | Schema validation limits |
| [Sports List](#sports-list-tab) | Manage sports categories |
| [Widgets](#widgets-tab) | Widget definitions for dashboards |
| [Console Commands](#console-commands-tab) | SFS Console command allowlist |
| [Import/Export](#importexport-tab) | Backup and restore settings |

---

## UI Tab

Customize the Config Tool's user interface appearance and behavior.

### Theme

Choose between light and dark color schemes:

- **Dark** (default) - Reduced eye strain in low light
- **Light** - Bright, high-contrast display

### Start with Sidebar Collapsed

When enabled, the navigation sidebar starts in collapsed mode (icons only) each time you open the app.

Default: `Disabled`

### Auto-save Changes

When enabled, configuration changes are automatically saved when you navigate away from a form or close it.

Default: `Enabled`

### Show Line Numbers in YAML Viewer

Display line numbers in the YAML file viewer for easier navigation and reference.

Default: `Enabled`

### Enable SFS Console

Toggle the SFS Console feature on or off. When enabled:

- The **SFS Console** appears in the sidebar under Utilities
- A status badge shows whether the Runner service is online or offline
- A **Test Connection** button lets you verify connectivity to the Runner

**Requires:** The stats-cmd-runner sidecar service must be running. See [SFS Console Setup](../../../docs/SFS-CONSOLE-SETUP.md) for configuration instructions.

Default: `Disabled`

---

## Files Tab

Configure file paths and default locations for configuration files.

### Default Configuration File Path

The primary location where your Stats for Strava config.yaml file is stored.

**Docker users:** Use the container path, not the host path

Example: `/data/config/config.yaml`

### Backup Directory Path

Location where automatic backups of configuration files are saved before editing. If not set, defaults to a `backups` subfolder within your Default Path.

Use the **Reset** button to quickly set this to match your default configuration path.

Example (Docker): `/data/config/backups`

### Gear Maintenance Directory Path

Where gear maintenance images and data are stored. This path is used by the Gear Maintenance utility.

Example: `/data/storage/gear-maintenance`

### Create Automatic Backups

When enabled, automatically creates timestamped backups before saving configuration changes via form editors or YAML Utility.

Default: `Enabled`

### Backup File Threshold

When automatic backups are enabled, this setting controls when you receive a notification about backup file accumulation. When the number of backup files exceeds this threshold, you'll be notified to clean up old backups.

Default: `10`

### Manage Backups

Click this button to open the Backup Manager dialog where you can:

- View all backup files with timestamps
- Delete individual backup files
- Bulk delete old backups

### Validate YAML Syntax on File Load

When enabled, automatically validates YAML syntax when loading configuration files, alerting you to any parsing errors.

Default: `Enabled`

> **Note:** The Config Tool automatically creates default settings files (widget-definitions.yaml, settings.yaml) on first startup if they don't exist. Configuration files for Stats for Strava (config.yaml) are not auto-created.

---

## Editor Tab

Configure the appearance and behavior of the Monaco YAML editor used in the YAML Utility.

### Font Size

Set the font size for the YAML editor (in pixels).

Range: 10-24
Default: `14`

### Tab Size

Set the number of spaces used for indentation.

Range: 2-8
Default: `2`

### Enable Word Wrap

When enabled, long lines wrap to fit within the editor width instead of requiring horizontal scrolling.

Default: `Enabled`

### Show Line Numbers

Display line numbers in the left margin of the editor.

Default: `Enabled`

### Highlight Search Matches

When enabled, all matches are highlighted when using the editor's search feature (Ctrl/Cmd+F).

Default: `Enabled`

---

## Validation Tab

Configure validation limits that may change over time as external services update their constraints.

### Maximum Zwift Level

The maximum allowed Zwift level for schema validation.

**Current default:** 100

Zwift may increase this limit in the future. Update this value when Zwift raises their level cap to allow higher level inputs without validation errors.

> **Why adjust these?** External services like Zwift occasionally increase limits (level caps, power limits, etc.). Updating these validation settings ensures the Config Tool accepts valid new values without requiring a software update.

---

## Sports List Tab

Manage the list of Strava sports used throughout the application for categorization and filtering.

### Sports by Category

View and edit the sports list organized by category (e.g., Cycling, Running, Water Sports).

### Managing Sports

- **Add Sport** - Add a new sport to an existing category
- **Remove Sport** - Delete a sport from the list
- **Reset to Defaults** - Restore the default sports list

The sports list is used in:
- Dashboard widget filtering
- Activity categorization
- Sports-specific configuration sections

---

## Widgets Tab

Manage widget definitions that control which widgets are available for your dashboard.

### Widget Definitions File

Location of the widget-definitions.yaml file that stores widget templates.

Default: `/data/settings/widget-definitions.yaml`

### Widget List

View and edit all available widget definitions. Widgets are grouped by:

- **Multi-instance** - Can be added to dashboards multiple times
- **Single-instance** - Can only be added once

### Managing Widgets

- **Add Widget** - Create a new widget definition
- **Edit Widget** - Modify an existing widget's settings
- **Delete Widget** - Remove a widget definition
- **Reset to Defaults** - Restore the built-in widget definitions

Changes are held in memory until you click the main **Save** button.

> See the Widget Definitions Editor section in the main Help page for detailed instructions.

---

## Console Commands Tab

Configure the allowlist of commands available in the SFS Console feature.

### Console Commands File

Location of the console-commands.yaml file that defines allowed commands.

Default: `/data/config/settings/console-commands.yaml`

### Command List

View and manage the list of commands that can be executed from the SFS Console:

| Field | Description |
|-------|-------------|
| **ID** | Unique identifier for the command |
| **Label** | Display name shown in the console dropdown |
| **Command** | The actual command array to execute |
| **Accepts Args** | Whether the command accepts additional arguments |
| **Args Description** | Help text explaining what arguments are expected |
| **Args Placeholder** | Placeholder text in the arguments input field |

### Managing Commands

- **Add Command** - Create a new allowed command
- **Edit Command** - Modify an existing command's configuration
- **Delete Command** - Remove a command from the allowlist
- **Discover Commands** - Auto-detect available commands from the Statistics for Strava container

> **Security Note:** Only commands in this allowlist can be executed through the SFS Console. This prevents arbitrary command execution.

---

## Import/Export Tab

Backup and restore your Config Tool settings.

### Export Settings

Click **Export** to view your current settings as YAML. Click **Download** to save the settings to a file named `config-tool-settings.yaml`.

Use this to:
- Back up your preferences before updates
- Share settings between installations
- Document your configuration

### Import Settings

Click **Import** to switch to import mode. Paste YAML settings into the text area and click **Import** to apply them.

Use this to:
- Restore settings from a backup
- Apply shared settings from another installation
- Quickly configure a new installation

> **Note:** Importing settings will overwrite your current preferences. Consider exporting first as a backup.

---

## Settings Storage

Config Tool settings are stored in two locations:

### Browser Local Storage

Quick-access settings stored in your browser for immediate use. Cleared if you clear browser data.

### Settings YAML File

Persistent settings stored at `/data/settings/config-tool-settings.yaml`

Settings are automatically synced between browser and disk on app startup and when changes are saved.

---

## Best Practices

**Set paths first**
Configure your file paths in the Files tab before using other features

**Enable automatic backups**
Protect against accidental changes by keeping backup copies of your configuration

**Export settings regularly**
Keep a backup of your Config Tool preferences, especially if you've customized widget definitions or console commands

**Use Docker paths correctly**
Always use container paths (/data/...) when running in Docker, not host paths (./...)

**Update validation limits as needed**
Check the Validation tab if you encounter errors about valid values (like new Zwift levels) being rejected

**Review console commands**
Periodically review the Console Commands allowlist to ensure only necessary commands are enabled
