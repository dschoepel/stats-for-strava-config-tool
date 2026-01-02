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

Click the delete icon on any widget card to remove it from your dashboard. This can be undone by clicking Save to keep your changes or Cancel to discard them.

### Reordering Widgets

Use the up/down arrow buttons on each widget card to change its position in the dashboard layout. Widgets are displayed in the order shown in the editor.

### Configuring Widgets

Many widgets support custom configuration options. Click the "Configure" button on a widget card to:

- Set display preferences (chart types, date ranges, etc.)
- Filter data (specific sports, gear, time periods)
- Customize titles and labels
- Adjust visual settings

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

### Title
Custom display title for the widget

### Sport Filter
Show statistics for specific sports only (cycling, running, etc.)

### Date Range
Filter data by time period (year, month, all-time, etc.)

### Gear Filter
Show statistics for specific bikes or equipment

### Chart Type
Choose visualization style (bar, line, pie, etc.)

### Metric Display
Select which metrics to show (distance, time, elevation, etc.)

---

## Tips & Best Practices

### Start with the essentials
Add key widgets first (Recent Activities, Weekly Stats) before customizing with specialized widgets

### Group related widgets
Place similar widgets near each other (all cycling stats together, all training metrics together)

### Use descriptive titles
When adding multiple instances of the same widget, use clear titles to distinguish them

### Test on different devices
Preview your dashboard on mobile and desktop to ensure a good experience on all screen sizes

### Less is more
Too many widgets can be overwhelming - focus on the metrics that matter most to you

---

## Saving Changes

Click the **Save** button to write your dashboard configuration to the config file.

After saving, remember to rebuild your Stats for Strava container and regenerate the HTML files:

```bash
docker compose restart app && docker compose exec app bin/console app:strava:build-files
```

See the main Help & Documentation page for detailed rebuild instructions.
