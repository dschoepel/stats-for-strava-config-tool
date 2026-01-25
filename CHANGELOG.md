## [1.1.0-rc9] — 2026-01-25

### Changed

- **Container Renaming**: Renamed all "strava-*" container references to "stats-cmd-*" for brand clarity
  - `strava-runner` → `stats-cmd-runner`
  - `strava-command-helper` → `stats-cmd-helper`
  - Environment variable: `STRAVA_RUNNER_URL` → `STATS_CMD_RUNNER_URL`
  - Log directories: `strava-sh-logs/` → `stats-cmd-logs/`, `runner-logs/` → `stats-cmd-runner-logs/`
  - Updated docker-compose.yml example with clearer setup instructions and README link
  - Runner and helper versions bumped to v0.9.0

### Fixed

- **Authentication Security**: SESSION_SECRET now regenerates on password change to invalidate all existing tokens
- **UI/UX Improvements**: Configuration menu collapsed by default for cleaner initial view
- **Token Management**: Added `/api/auth/refresh` endpoint for extending user sessions
- **Error Handling**: Improved token error codes (TOKEN_EXPIRED vs TOKEN_INVALID)

## [1.1.0] — 2026-01-21

### Added

- **Statistics for Strava Console**: New utility for executing Statistics for Strava console commands directly from the web interface
  - Terminal-like UI panel with real-time streaming output for running commands inside the container
  - Command dropdown with allowlist of safe commands:
    - `app:strava:build-files` - Build Statistics for Strava data files
    - `app:strava:import-data` - Import activity data from Strava
    - `app:strava:webhooks-create` - Create Strava webhook subscriptions
    - `app:strava:webhooks-unsubscribe` - Remove webhook subscriptions
    - `app:strava:webhooks-view` - View current webhook subscriptions
  - Server-Sent Events (SSE) for live stdout/stderr streaming
  - Auto-scrolling output window with monospace font
  - Status indicators showing command execution state and exit codes
  - Input disabled during command execution to prevent concurrent runs
  - Clear output button for managing console history
  - Secure backend API with command validation against allowlist
  - Added to utilities navigation alongside YAML tools and gear maintenance

### Fixed

- **NumberInput Multi-Digit Typing Bug**: Resolved critical issue where typing multi-digit numbers (e.g., "42") would result in corrupted input values (e.g., "1220")
  - Root cause: Chakra UI v3's NumberInput component has a feedback loop when used as controlled component with immediate numeric parsing
  - Created new `SafeNumberInput` wrapper component that stores raw string during typing and only parses on blur
  - Replaced all 7 NumberInput instances across the codebase:
    - Resting heart rate editor (fixed and date range modes)
    - FTP history editor
    - Weight history editor
    - Gear purchase price editor
    - Backup threshold settings (embedded and modal modes)
  - Added automatic validation with error UI for invalid, out-of-range, and required values
  - Added comprehensive developer documentation in `SAFE_NUMBER_INPUT.md`

### Changed

- Improved number input validation with real-time feedback after first blur
- Number inputs now automatically clamp values to min/max bounds on blur
- Enhanced user experience with clearer error messages for invalid numeric input

### Technical

- New API route: `/api/strava-console` for secure command execution with SSE streaming
- New page: `/utilities/strava-console` with terminal-style interface
- New reusable component: `SafeNumberInput` at `src/components/ui/SafeNumberInput.jsx`
- Backend uses `child_process.spawn` for safe command execution
- Removed 100+ lines of boilerplate state management code across multiple components
- All number inputs now follow consistent validation and error handling patterns

---

## [1.0.1] — 2026-01-19

### Added

- **Resting Heart Rate Configuration**: Added support for tracking resting heart rate history in the Athlete section
  - New RestingHeartRateEditor component for managing resting HR values over time
  - Integrated with athlete configuration schema
- **Gear Maintenance Enhancement**: Added "days used" as a new unit option for tracking gear usage
  - Provides more flexible tracking options alongside exigitsting distance-based units

### Fixed

- **Configuration Integrity**: Resolved critical issue where athlete section content was being merged back into `config.yaml` when saving general section, despite athlete being in a separate `config-general-athlete.yaml` file
  - Fixed split file save logic to properly exclude nested sections from parent file
  - Ensures clean separation of configuration sections across split files
- **Code Quality**: Resolved lint errors in AthleteConfigEditor component
  - Removed React Hooks from inside render prop callback
  - Cleaned up unused imports and variables

### Changed

- Updated configuration schemas to support new resting heart rate field
- Enhanced gear maintenance schema with additional unit option

---

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