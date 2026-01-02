# Configuration Examples

Common configuration patterns and templates for Stats for Strava

## Using These Examples

These examples show common configuration patterns you can adapt for your own setup. Rather than copying YAML directly, use the Config Tool's form editors to create similar configurations.

Each example includes explanations of the key settings and when you might use that pattern.

## Example 1: Multi-Sport Athlete Configuration

**Use case:** You participate in multiple sports (cycling, running, swimming) and want separate tracking for each.

### Key Settings

**Sports List**
Add entries for: Ride, Run, Swim, VirtualRide

**Dashboard Widgets**
Add separate "Monthly Statistics" widgets for each sport, with sport-specific filters

**Athlete Configuration**
Configure different heart rate zones for running vs. cycling if they differ

### Dashboard Setup

1. Add "Most Recent Activities" widget (shows all sports)
2. Add "Monthly Statistics" for Cycling
3. Add "Monthly Statistics" for Running
4. Add "Monthly Statistics" for Swimming
5. Add "Yearly Statistics" (combined view)
6. Add sport-specific "Heart Rate Zones" widgets if needed

## Example 2: Cyclist with Multiple Bikes/Gear

**Use case:** You ride multiple bikes (road bike, mountain bike, gravel bike) and want to track mileage and statistics for each separately.

### Key Settings

**Gear Configuration**
Add entries for each bike with names, purchase dates, and initial mileage

**Sports List**
Include: Ride, MountainBikeRide, GravelRide (if you want separate tracking)

**Dashboard Widgets**
Add "Gear Statistics" widget to show mileage breakdown by bike

### Gear Section Setup

For each bike, configure:
- Name: "Trek Domane SL7" 
- Type: "Road Bike"
- Purchase Date: "2023-01-15"
- Purchase Price: 8500
- Brand: "Trek"
- Model: "Domane SL7"
- Initial Distance: 0 (or previous mileage)

### Maintenance Tracking

Use the Gear configuration to track when components need replacement based on mileage milestones.

## Example 3: Training-Focused Dashboard

**Use case:** You're training for an event and want to focus on training load, FTP progression, and weekly mileage goals.

### Key Settings

**Athlete Configuration**
Set up FTP history with dates and values to track power improvements

**Dashboard Widgets**
Prioritize training-focused widgets: Training Load, FTP History, Weekly Statistics, Training Goals

**Import Settings**
Enable power data import and ensure heart rate data is captured

### Optimal Widget Order

1. Training Goals (current week's targets)
2. Weekly Statistics (this week's progress)
3. Training Load (TSS/intensity trend)
4. FTP History (power progression over time)
5. Peak Power Outputs (PR tracking)
6. Monthly Statistics (broader view)
7. Heart Rate Zones (training intensity distribution)

### FTP History Setup

Track your Functional Threshold Power progression:

Example entries:
- Date: "2024-01-01", FTP: 250
- Date: "2024-03-15", FTP: 265
- Date: "2024-06-01", FTP: 275
- Date: "2024-09-10", FTP: 285

## Example 4: Zwift-Focused Configuration

**Use case:** You primarily ride indoors on Zwift and want to track virtual achievements and racing statistics.

### Key Settings

**Zwift Configuration**
Enter your current Zwift level and ZwiftPower racing score

**Sports List**
Ensure VirtualRide is included as a sport type

**Dashboard Widgets**
Add "Zwift Statistics" widget to showcase virtual riding stats

### Separating Indoor/Outdoor Rides

Create separate dashboard sections:

- Add "Monthly Statistics" filtered to VirtualRide only
- Add "Monthly Statistics" filtered to Ride only (outdoor)
- Add combined "Yearly Statistics" for total mileage

### Zwift Integration Tips

Zwift activities automatically sync to Strava as VirtualRide type. Update your Zwift level in the Config Tool periodically to keep statistics accurate.

## Example 5: Minimal Dashboard for Casual Tracking

**Use case:** You want a simple overview without too much data - just the basics.

### Recommended Widget Set

1. Most Recent Activities
2. Weekly Statistics
3. Monthly Statistics
4. Yearly Statistics
5. Activity Grid (calendar view)

Keep the configuration simple - use default settings for most options, and only configure the sports you actually do. This gives you a clean, uncluttered view of your activities.

## General Configuration Tips

**Start simple, add complexity later**
Begin with a basic dashboard and add more widgets as you identify what statistics matter to you

**Use meaningful widget titles**
When adding multiple instances of the same widget, customize titles to make them distinguishable

**Test after major changes**
After adding many widgets or changing configuration, rebuild and verify everything displays correctly

**Keep backups**
Enable automatic backups in Settings so you can revert changes if needed

## Need More Help?

These examples cover common scenarios, but your setup might be unique. Resources:

- Check the main **Help & Documentation** page for detailed feature guides
- Review the **Dashboard Editor** and **Sports List** help pages
- Visit the Stats for Strava documentation at [statistics-for-strava-docs.robiningelbrecht.be](https://statistics-for-strava-docs.robiningelbrecht.be/)
- Report issues or request help at [GitHub Issues](https://github.com/dschoepel/stats-for-strava-config-tool/issues)
