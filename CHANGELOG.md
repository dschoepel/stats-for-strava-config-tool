## [1.0.0] — 2026-01-16

### Initial Release

This is the first stable release of the **Stats for Strava – Configuration Tool**, a web-based companion application that provides a guided, form-driven interface for creating and maintaining the configuration file used by *Statistics for Strava*.

This release includes a complete, production-ready feature set and is recommended for all users.

### Added

- Full form-based configuration editor with field descriptions, validation, and type-specific controls
- Guided editors for complex data structures:
    - Heart rate zones
    - Weight history
    - FTP history
    - Cron expression builder
- Dashboard and widget management tools:
    - Dashboard layout editor
    - Sports List Editor
    - Widget Definitions Editor (20+ built-in widget templates)
- YAML Utility:
    - YAML validation
    - Syntax-highlighted file viewer
    - YAML merge/combine tool
    - Monaco Editor integration
- Gear Maintenance Utility for tracking mileage and service intervals
- Automatic configuration backups with timestamped filenames
- Auto-created settings folder with:
    - `config-tool-settings.yaml`
    - `strava-sports-by-category.yaml`
    - `widget-definitions.yaml`
- Single-user authentication system:
    - First-time registration
    - Login/logout
    - Password reset
    - Secure bcrypt hashing and signed cookies
    - Session persistence (default 7 days)
- Notifications system with navbar badge indicator
- Unified AppShell layout with breadcrumb navigation
- Dark-mode-ready UI using Chakra UI v3 and semantic tokens
- Docker image published to GitHub Container Registry
- Support for standalone Node.js usage and reverse proxy deployments

### Notes

This release represents the first complete, stable version of the tool. Feedback and issue reports are welcome as the project continues to evolve.