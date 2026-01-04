# Widget Definitions Editor

Complete guide to managing dashboard widget definitions

---

## Overview

The Widget Definitions Editor (accessible via Settings → Widgets tab) allows you to define which widgets from Stats-for-Strava are available in your configuration tool.

### ⚠️ Important: Widget Definitions vs. Custom Widgets

Widget definitions must match actual widgets from the Stats-for-Strava application. You cannot create custom widgets that don't exist in the app and expect them to display on your dashboard.

Only widgets documented in the official Stats-for-Strava documentation will be recognized by the application.

📚 **Reference:** [Stats-for-Strava Dashboard Widgets Documentation](https://statistics-for-strava-docs.robiningelbrecht.be/#/configuration/dashboard-widgets)

### 🚀 Future-Proofing Your Configuration

When Stats-for-Strava developers add new dashboard widgets, you can define them here immediately without waiting for a config tool update.

Simply add the new widget definition (referencing the official documentation for configuration options) and it becomes available in the Dashboard Layout Editor.

---

## Widget Types

There are two types of widgets in Stats-for-Strava:

### 1. Widgets Without Configuration

These widgets display data without any customization options (e.g., Activity Grid, Heart Rate Zones). Simply uncheck "Has configuration options" when defining them.

### 2. Widgets With Configuration

These widgets support customization options (e.g., Weekly Stats, Monthly Stats, Training Goals). Check "Has configuration options" and provide the Config Template and Default Config. **Always reference the official documentation** to determine available configuration options.

---

## What are Widget Definitions?

Widget definitions are templates that describe:

- **Widget metadata** - Name, display name, and description
- **Instance rules** - Whether multiple instances of the widget can be added
- **Configuration schema** - What settings the widget supports (from Stats-for-Strava documentation)
- **Default values** - Initial configuration values for new widget instances

### File Storage

Widget definitions are stored in `settings/widget-definitions.yaml` within your default file path. This file is automatically created when you first open the tool and is synced with any widgets already in your dashboard configuration.

---

## Using the Widget Definitions Editor

1. **Open Settings** - Click the gear icon in the top navigation
2. **Select Widgets tab** - Navigate to the Widget Definitions section
3. **View widgets** - Widgets are grouped by "Can be added multiple times" and "Can only be added once"
4. **Expand details** - Click the toggle arrow to see widget properties and configuration templates
5. **Add/Edit/Delete** - Use the respective buttons to manage widget definitions
6. **Save changes** - Click the Save button to write all changes to the file

> **Important:** Individual widget changes are saved in memory only. You must click the main **Save Changes** button to write all changes to the file.

---

## Widget Properties

### Widget Name (camelCase)

Unique identifier in camelCase format (e.g., mostRecentActivities)

### Display Name

Human-readable name shown in the UI (e.g., "Most Recent Activities")

### Description

Brief explanation of what the widget displays or does. Multi-line descriptions are supported.

### Allow multiple instances

If checked, multiple copies of this widget can be added to the dashboard

### Has configuration options

If checked, the widget supports customizable settings

### Config Template (YAML)

Example configuration showing available options and syntax. This is displayed in the Dashboard Layout Editor as read-only documentation.

### Default Config (JSON)

Initial values when widget is added to dashboard. Use the "Generate" button to automatically convert your Config Template to JSON format.

---

## Settings/Widgets vs. Appearance/Dashboard Layout

### Understanding the Difference

#### Settings → Widgets

**Defines WHAT widgets exist**

- Widget names and metadata
- Configuration schema from Stats-for-Strava docs
- Default configuration values
- Instance rules (single vs. multiple)

*Add widgets here when Stats-for-Strava releases new ones*

#### Appearance → Dashboard → Edit Dashboard Layout

**Controls HOW widgets display**

- Which widgets show on dashboard
- Widget order (drag to reorder)
- Widget width (33%, 50%, 66%, 100%)
- Widget enabled/disabled state
- Widget-specific configuration values  (ℹ️use Settings -> Widgets to change complex configuration values e.g. arrays of values)

*Cannot edit configuration schema here - only values*

### ⚠️ Critical Distinction

- **Settings → Widgets**: Define widget configuration OPTIONS (schema/template from Stats-for-Strava documentation)
- **Appearance → Dashboard**: Set widget configuration VALUES, display order, and width (cannot modify schema)

---

## Adding New Widgets from Stats-for-Strava

When Stats-for-Strava releases a new widget, add it to your configuration tool:

1. **Check the official documentation** - Visit [Dashboard Widgets Documentation](https://statistics-for-strava-docs.robiningelbrecht.be/#/configuration/dashboard-widgets) to find the new widget's details
2. **Open Widget Definitions Editor** - Go to Settings → Widgets
3. **Click "Add Widget"** button
4. **Fill in widget details** - Use exact widget name from documentation (case-sensitive)
5. **Add configuration options** - If the widget has config options in the docs:

   - Check "Has configuration options"
   - Copy configuration structure from Stats-for-Strava docs into Config Template (YAML)
   - Click "Generate Default Config from Template" button
6. **Save** - Click "Add Widget" then "Save Changes"
7. **Use in dashboard** - Widget is now available in Appearance → Dashboard → Edit Dashboard Layout

### ⚠️ Remember: Only Real Widgets Work

You can only add widgets that actually exist in the Stats-for-Strava application. Creating custom widget definitions for widgets that don't exist in the app will not make them appear on your dashboard. Always reference the official documentation to ensure the widget exists before adding it.

### 💡 Quick Tip: Generate Button

The "Generate Default Config from Template" button automatically converts your YAML Config Template to the JSON format required for Default Config. This saves time and reduces syntax errors!

---

## Default Widgets

The system includes these built-in widget definitions:

ℹ️ Widgets with an asterisk * are configurable

| Widgets | More Widgets|
|------------------------------|----------------------------|
| • Most Recent Activities*     | • Yearly Statistics*        |
| • Introduction Text          | • Zwift Statistics         |
| • Training Goals*             | • Gear Statistics*          |
| • Weekly Statistics*          | • Eddington Number         |
| • Peak Power Outputs         | • Challenge Consistency*    |
| • Heart Rate Zones           | • Most Recent Challenges*   |
| • Activity Grid              | • FTP History              |
| • Monthly Statistics*         | • Athlete Weight History   |
| • Training Load              | • Weekday Statistics       |
| • Day Time Statistics        | • Distance Breakdown       |
| • Current Streaks             |                           |

ℹ️ Widgets with an asterisk * are configurable


### Automatic Initialization

When the app starts:

- **File creation** - If the widget definitions file doesn't exist, it's created with 20+ default widgets
- **Config sync** - Widget default values are updated based on widgets in your dashboard configuration
- **Validation** - All widget definitions are validated for correct structure