# Sports List Editor Guide

Manage sport types and activity classifications for your statistics

## What is the Sports List?

The Sports List defines which Strava activity types are recognized and tracked by your statistics dashboard. This allows you to customize which activities appear in your statistics and how they're categorized.

Navigate to **Sports List** in the sidebar to access the editor.

## Managing Sports

### Adding a Sport

Click "Add Sport" to include a new activity type. You'll need to specify:

- **Sport Name** - The Strava activity type (must match exactly)
- **Display Name** - (Optional) Custom name shown in your statistics
- **Icon/Color** - (Optional) Visual customization for the sport

### Editing a Sport

Click the edit icon next to any sport to modify its settings. You can change the display name, icon, color, or other visual properties without affecting the underlying Strava activity type.

### Removing a Sport

Click the delete icon to remove a sport from your statistics. This will:

- Exclude activities of this type from most statistics
- Hide the sport from sport-specific widgets and filters
- Not delete the actual Strava activities (they remain in your account)

## Common Strava Activity Types

Most commonly used Strava activity types (names must match exactly):

- **Ride**
- **Run**
- **VirtualRide**
- **Walk**
- **Hike**
- **Swim**
- **WeightTraining**
- **Workout**
- **Yoga**
- **RockClimbing**
- **AlpineSki**
- **NordicSki**

> **Note:** Activity type names are case-sensitive and must match Strava's naming exactly.

## Best Practices

**Match Strava activity types exactly**
Sport names must match Strava's activity types character-for-character, including capitalization

**Use display names for clarity**
Add custom display names to make activities more readable (e.g., "Virtual Ride" instead of "VirtualRide")

**Keep your list focused**
Only include sports you actually track - a shorter list makes your statistics easier to navigate

**Consider virtual activities separately**
VirtualRide (Zwift, etc.) is treated as a separate sport type from regular Ride activities

**Check the Strava API documentation**
For less common activities, verify the exact naming in Strava's API documentation

## Important Considerations

> **⚠️ Removing sports affects statistics**
>
> If you remove a sport from your list, activities of that type will not appear in most statistics. The activities still exist in Strava, but they won't be included in your Stats for Strava calculations.

> **⚠️ Changes require a rebuild**
>
> After modifying your sports list, you must rebuild the Stats for Strava HTML files for changes to appear.

> **ℹ️ Historical data is preserved**
>
> Adding or removing sports doesn't affect your Strava data - it only controls what appears in your statistics.

## Saving Changes

Click **Save** to write your sports list configuration to the config file.

After saving, rebuild your Stats for Strava container and regenerate the HTML files:

```bash
docker compose restart app && docker compose exec app bin/console app:strava:build-files
```

> See the main Help & Documentation page for detailed rebuild instructions.
