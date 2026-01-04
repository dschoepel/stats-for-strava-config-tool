# Dashboard Editor Guide

Configure your Stats for Strava dashboard layout and widget placement

---

## What is the Dashboard Editor?

The Dashboard Editor allows you to configure which widgets appear on your Stats for Strava dashboard and how they're arranged. You can add, remove, reorder, and configure individual widgets to create a personalized statistics display.

Navigate to **Dashboard** in the sidebar to access the editor.

---

## Working with Widgets

### Adding Widgets

Click the "Add Widget" button to open the widget picker. Available widgets are organized by type:

- **Multi-instance widgets** - Can be added multiple times (e.g., Monthly Statistics)
- **Single-instance widgets** - Can only appear once on the dashboard

### Removing Widgets

Click the delete icon on any widget card to remove it from your dashboard. This can be done by clicking Save to keep your changes or Cancel to discard them.

### Reordering Widgets

Use the up/down arrow buttons on each widget card to change its position in the dashboard layout. Widgets are displayed in the order shown in the editor.

### Configuring Widgets

Many widgets support custom configuration options. You will need to use the **Settings → Widgets tab** to configure wideget options.

The Dashboard Editor allows you to:

- Adjust visual settings
    - Display width (33%, 50%, 60% or 100%)
    - Enabled (true or false)
- View the widgets configured settings, in simple cases where the config has a single value, to update it here.  Lists or complex key values need to be configured in the Settings -> Widgets editor. 

---

## Widget Layout

The dashboard uses a responsive grid layout that automatically adjusts based on screen size:

### Desktop View

Widgets are displayed in a multi-column grid, with configurable widths for each widget

### Mobile View

Widgets automatically stack in a single column for optimal mobile viewing

---

## Widget Configuration Options

Common configuration options available for many widgets:

### Challenges

- Type and number of challenges to display 

### Sport Filter

- Show statistics for specific sports only (cycling, running, etc.)

### Date Range

- Filter data by time period (year, month, all-time, etc.)

### Gear Filter

- Show statistics for specific bikes or equipment

### Display Order

- Specify the order to show metrics (distance, time, elevation, etc.)

---

## Tips & Best Practices

### Start with the essentials

- Add key widgets first (Recent Activities, Weekly Stats) before customizing with specialized widgets

### Group related widgets

- Place similar widgets near each other (all cycling stats together, all training metrics together)

### Use descriptive titles

- When adding multiple instances of the same widget, use clear titles to distinguish them

### Test on different devices

- Preview your dashboard on mobile and desktop to ensure a good experience on all screen sizes

### Less is more

- Too many widgets can be overwhelming - focus on the metrics that matter most to you

---

## Saving Changes

Click the **Save** button to write your dashboard configuration to the config file.

> **⚠️ Changes require a rebuild**
>
> After modifying your dashboard configuration, you must rebuild the Stats for Strava HTML files for changes to appear.

```bash
docker compose restart app && docker compose exec app bin/console app:strava:build-files
```

See the main Help & Documentation page for detailed rebuild instructions.