# Features Guide

This guide provides detailed documentation of all features in the Stats for Strava Configuration Tool.

---

## Form-Based Configuration Editor

The core feature of this tool is a visual form-based editor that replaces manual YAML editing.

### Benefits

- **Guided forms** for all configuration sections with clear field descriptions
- **Input validation** prevents invalid values from being saved
- **Type-specific controls** including dropdowns for enums, number inputs for numeric values
- **Required field indicators** mark mandatory fields with red asterisks (*)
- **Real-time validation** to catch errors before saving

### Configuration Sections

| Section | What It Configures |
|---------|-------------------|
| **General** | App URL, subtitle, profile picture |
| **Athlete** | Birthday, heart rate zones, weight history, FTP data, resting heart rate |
| **Appearance** | Locale, units, date/time formats, dashboard layout |
| **Import** | Activity import settings, sport type filters, webhooks |
| **Metrics** | Eddington score calculation, metric groupings |
| **Gear** | Equipment tracking, purchase prices, maintenance, currency |
| **Zwift** | Zwift level and racing score integration |
| **Integrations** | Notification services, AI provider configuration |
| **Daemon** | Scheduled tasks with visual cron builder |

### Basic Workflow

1. **Choose a configuration section** from the sidebar menu
2. **Fill in the form fields** - required fields are marked with an asterisk (*)
3. **Read the field descriptions** to understand what each setting does
4. **Click Save** - the tool validates your input before saving
5. **Restart Stats for Strava** to apply your changes

---

## Dashboard & Widget Management

### Dashboard Editor

The dashboard editor allows you to configure widget layouts and placements:

- Visual drag-and-drop interface for arranging widgets
- Preview of your dashboard configuration
- Save layouts directly to your configuration file

### Sports List Editor

Manage sport types and activity classifications:

- Add, edit, and remove sport types
- Group sports by category
- Configure display settings for each sport

### Widget Definitions Editor

Access via **Settings > Widgets** to manage widget templates:

- **View widgets** - Widgets are grouped by instance rules
- **Expand details** - Click the toggle arrow to see properties and configuration templates
- **Add/Edit/Delete** - Use the respective buttons to manage widget definitions
- **Save changes** - Click the Save button to write all changes to file

Features include:

- 20+ built-in widget definitions
- Support for single-instance and multi-instance widgets
- Custom configuration templates for each widget
- Define widget metadata and instance rules

---

## YAML Utility

Essential configuration file management tools accessible from the sidebar:

### Validate YAML Files

Check your configuration files for syntax errors before they cause issues:

- Validates YAML syntax
- Reports line numbers for errors
- Prevents saving invalid configurations

### View File Contents

Browse and inspect configuration files:

- Syntax highlighting for YAML
- Monaco Editor integration (VS Code's editor)
- Read-only viewing of any YAML file

### Combine Configurations

Merge multiple YAML files into a single unified configuration:

1. Navigate to YAML Utility in the sidebar
2. Click "Combine Files"
3. Select source files to merge
4. Save the combined output

---

## Visual Cron Expression Builder

When configuring scheduled tasks in the Daemon section:

- Click the **Builder** button next to cron expressions
- Use the visual interface to set schedules
- See human-readable descriptions of cron patterns
- No need to memorize cron syntax

---

## Gear Maintenance

Track equipment usage and service intervals:

- **Distance tracking** - Monitor mileage on bikes and shoes
- **Days used tracking** - Track usage by days (new in v1.0.1)
- **Service intervals** - Set reminders for maintenance
- **Currency support** - Track gear costs with proper currency formatting (new in v1.1.0)

---

## SFS Console (Optional)

Execute Statistics for Strava Symfony console commands directly from the web interface:

- Terminal-like UI panel with real-time streaming output
- Command dropdown with configurable allowlist of safe commands
- Command history with status badges
- Log management for viewing and downloading command output

See [SFS Console Setup Guide](SFS-CONSOLE-SETUP.md) for complete setup instructions.

---

## User Interface

### Dark Mode Support

- Comfortable viewing in any lighting condition
- Consistent styling throughout the application
- Toggle in user settings

### Responsive Design

- Works on desktop, tablet, and mobile
- Adaptive layouts for different screen sizes
- Mobile-friendly command console

### Monaco Editor

- Professional code editing experience for YAML viewing
- Syntax highlighting
- Line numbers
- Search functionality

---

## Special Editors

### Heart Rate Zones Editor

Visual editor for configuring heart rate zones:

- Set zone boundaries (bpm)
- Validates no gaps or overlaps between zones
- Preview of zone configuration

### Weight History Editor

Track weight over time:

- Add entries with date and weight
- View history timeline
- Used for normalized power calculations

### FTP History Editor

Track Functional Threshold Power over time:

- Add entries with date and FTP value
- View history timeline
- Used for training metrics

### Resting Heart Rate Editor (v1.0.1+)

Track resting heart rate history:

- Add entries with date and resting HR
- View history timeline
- Integrated with athlete configuration

---

## Notifications

- **Badge indicator** in navbar shows pending notifications
- Notification preferences configurable in settings
- Integration with third-party notification services via config

---

## Backup System

Automatic configuration backups protect your settings:

- Backups created before saving changes
- Stored in `<config-path>/backups/`
- Naming format: `config-YYYYMMDD-HHMMSS.yaml`
- Easily restore from backups if needed

---

## Important Notes

### Comment Preservation

When saving through the form editor:

- **Section headers are preserved** (e.g., `# Athlete Configuration`)
- **Inline comments may be removed** - The forms provide all descriptions, making embedded comments redundant

If you need to preserve all comments, edit the YAML files manually using the YAML Utility viewer.

### Configuration Path

**For Docker users**: Use the **container path** in settings, not the host path:

- Container path: `/data/config/config.yaml` ✅
- Host path: `./config/app/config.yaml` ❌

### Applying Changes

After saving configuration changes:

1. Restart your Stats for Strava containers
2. Changes take effect on next import or rebuild

---

## Next Steps

- [Installation Guide](INSTALLATION.md) - Setup instructions
- [SFS Console Setup](SFS-CONSOLE-SETUP.md) - Enable the command console
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
