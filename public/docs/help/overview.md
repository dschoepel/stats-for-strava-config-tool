# Help & Documentation

Configuration tool guide and important information

---

## Using the Configuration Editor

### Form-Based Configuration

This tool provides guided forms for editing your Strava configuration files. Each form includes:

- **Field descriptions** - Explanations of what each setting does
- **Input validation** - Prevents invalid values from being saved
- **Type-specific controls** - Dropdowns for enums, number inputs for numeric values
- **Required field indicators** - Red asterisks (*) mark mandatory fields
- **Automatic backups** - Timestamped backups are created before each save (configurable in Settings)

### Automatic Backups

For safety, the Config Tool can automatically create backups before saving changes:

- **Timestamped files** - Backups are named like `config-everythingelse_backup_2026-01-02T15-30-45.yaml`
- **Section-specific** - Each configuration file gets its own backup based on which section you edit
- **Smart location** - Backups are saved in a `backups` subfolder within your Backups Directory
- **Configurable location** - Change the Backups Directory in Settings → Files to save backups to a different location
- **Toggle control** - Enable/disable automatic backups in Settings → Files → Auto Backup

*Backups are created for both form-based edits and YAML Utility saves.*

### ⚠️ Important: Comment Preservation

When saving configuration changes through this editor:

- **Section headers are preserved** - Main comments like section titles remain intact
- **Embedded comments may be removed** - Detailed comments within YAML structures might be lost
- **This is by design** - The forms provide all necessary guidance, making embedded comments redundant

*If you need to preserve all comments, edit the YAML files manually instead of using this tool.*

---

## Configuration Sections

The configuration is organized into the following sections:

| Section           | Description                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| General           | Basic application settings like URLs and titles                               |
| Athlete           | Personal information including heart rate zones, weight history, and FTP data |
| Appearance        | Visual customization options for your statistics display                      |
| Import            | Data import settings and preferences                                          |
| Metrics           | Configuration for statistical calculations and metrics                        |
| Gear              | Equipment and bike configuration                                              |
| Zwift             | Zwift integration settings                                                    |
| Integrations      | Third-party service connections and API settings                              |
| Scheduling Daemon | Automated task scheduling configuration                                       |

---

## YAML Utility

The YAML Utility provides advanced configuration file management:

- **Direct file editing** - Edit YAML files with syntax highlighting and validation
- **Configuration splitting** - Break a single config file into separate section files

**Current Limitation:** The YAML Utility does not support direct editing. For manual configuration changes, edit the files using an external text editor.

---

## Widget Definitions Editor

The Widget Definitions Editor (accessible via Settings → Widgets tab) allows you to define which widgets from Stats-for-Strava are available in your dashboard configuration.

Widget definitions describe available widgets from the Stats-for-Strava app, their configuration options, and default values. When new widgets are released, you can add them here without waiting for a config tool update.

### Learn More

For detailed information about using the Widget Definitions Editor, including:

- Widget types and properties
- Configuration templates and default values
- Distinction between Settings/Widgets and Dashboard Layout
- Adding new widgets from Stats-for-Strava
- Default widget list

See the **Documentation → Widget Definitions** page in the sidebar.

> **Important:** Widget definitions must match actual widgets from the Stats-for-Strava application. Reference the [official documentation](https://statistics-for-strava-docs.robiningelbrecht.be/#/configuration/dashboard-widgets) for widget details.

---

## Getting Started

1. **Choose a configuration section** from the sidebar menu
2. **Fill in the form fields** - required fields are marked with *
3. **Use the descriptions** to understand what each setting does
4. **Save your changes** - the tool will validate your input
5. **Apply changes to Stats for Strava** - see the section below for rebuild steps

---

## Applying Configuration Changes

### ⚠️ Critical: Configuration changes are not automatic

After editing and saving configuration files, you must rebuild your Stats for Strava container to apply the changes.

### Rebuild Steps

1. **Stop the container** - Stop your Stats for Strava Docker container
2. **Apply changes** - Rebuild or restart the container to load new configuration
3. **Verify** - Check that your changes are reflected in the running application

*Exact rebuild commands depend on your Docker setup. Consult the Stats for Strava documentation for specific instructions.*

---

## Troubleshooting

### Changes not appearing after save

- Check that the file was actually saved (look for success message)
- Verify the file path in Settings → Files
- Ensure you have write permissions to the configuration directory
- Check for any error messages in the browser console

### Validation errors

- Required fields must be filled in before saving
- Check that values match the expected format (numbers, URLs, etc.)
- Some fields have specific validation rules - read the field descriptions

### Lost configuration

- Check the backups folder for timestamped backup files
- Backups are created automatically before each save
- You can restore from a backup by copying it to replace the current config file

---

## Need More Help?

- [Stats for Strava Documentation](https://statistics-for-strava-docs.robiningelbrecht.be/)
- [Config Tool GitHub Repository](https://github.com/dschoepel/stats-for-strava-config-tool)