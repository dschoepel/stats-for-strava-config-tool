# Changelog

All notable changes to the Stats for Strava Configuration Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] — v1.2.0

### Documentation
- Restructured README.md for better readability (~150 lines vs 737)
- New `docs/INSTALLATION.md` - Comprehensive installation guide
- New `docs/FEATURES.md` - Detailed feature documentation
- New `docs/SFS-CONSOLE-SETUP.md` - SFS Console setup guide
- New `docs/TROUBLESHOOTING.md` - Consolidated FAQ and troubleshooting

---

## [1.1.0-rc10] — 2026-01-25

### Summary

This release candidate series (rc1-rc10) introduces the **SFS Console** feature — a complete system for executing Statistics for Strava Symfony console commands directly from the web interface. This major addition includes a two-container security architecture, real-time command streaming, and comprehensive UI components.

### Added

#### SFS Console Feature
- Terminal-like UI panel for running Symfony console commands
- Real-time SSE (Server-Sent Events) streaming of command output
- Command dropdown with configurable allowlist of safe commands
- Command history panel showing past executions with status badges
- Log management dialog for viewing, downloading, and deleting command logs
- Command discovery feature to auto-detect available commands in container
- Command parameter support (pass arguments to commands)
- Navigation protection during command execution (prevents accidental page leave)
- Proper process termination — Stop button now kills the running PHP process
- "Stopped" status indicator when commands are manually terminated
- Console error boundary for graceful error recovery
- Auto-scrolling output window with toggle control
- Status indicators showing command execution state and exit codes

#### Console Architecture (Two-Container Security Model)
- **stats-cmd-runner**: Sidecar service for command validation and request proxying
  - Validates commands against YAML allowlist
  - No Docker socket access (security isolation)
  - Health check endpoint for monitoring
- **stats-cmd-helper**: Service running alongside Statistics for Strava container
  - Executes validated commands via `docker exec`
  - Session tracking for stop functionality
  - Log file capture with configurable directory
  - Process kill capability via `pkill`

#### Other Features
- **Currency Input**: New currency input component with formatting for gear pricing
- **Token Refresh**: New `/api/auth/refresh` endpoint for extending user sessions

### Changed

- **Container Renaming**: All container references renamed for brand clarity
  - `strava-runner` → `stats-cmd-runner`
  - `strava-command-helper` → `stats-cmd-helper`
  - Environment variable: `STRAVA_RUNNER_URL` → `STATS_CMD_RUNNER_URL`
  - Log directories: `strava-sh-logs/` → `stats-cmd-logs/`
- **Default View**: Configuration menu collapsed by default for cleaner initial view
- **Dark Mode**: Improved styling consistency throughout the application

### Fixed

- **NumberInput Bug**: Resolved critical Chakra UI v3 issue where typing multi-digit numbers resulted in corrupted values
  - Created `SafeNumberInput` wrapper component
  - Replaced all 7 NumberInput instances across the codebase
  - Added comprehensive documentation in `docs/SAFE_NUMBER_INPUT.md`
- **Session Security**: SESSION_SECRET now regenerates on password change to invalidate all existing tokens
- **Token Error Codes**: Improved distinction between TOKEN_EXPIRED and TOKEN_INVALID errors
- **Sports List**: Fixed file detection and auto-repopulation on startup when file is empty
- **Log Directory**: Fixed path resolution in download-log API
- Various UI/UX improvements and Chakra UI v3 compliance fixes

### Technical

- **Component Refactoring**: StravaConsole split into 14 focused sub-components:
  - CommandHistoryPanel, CommandSelectionCard, ConnectionStateBadge
  - ConsoleDisabledView, ConsoleErrorBoundary, ConsoleHeader
  - DiscoverCommandsDialog, ErrorAlert, LogManagementDialog
  - RunnerOfflineAlert, RunnerStatusBadge, StravaConsoleTerminal
  - TerminalPanel, WarningBanner
- **Hook Refactoring**: useStravaConsole split into 4 domain-specific hooks:
  - useStravaConsole (orchestrator)
  - useCommandHistory (history management)
  - useConsoleCommands (command loading)
  - useConsoleRunner (execution)
  - useRunnerHealth (health checks)
- **New API Routes**:
  - `/api/strava-console` - Runner health check
  - `/api/strava-console/discover` - Command discovery
  - `/api/strava-console/stop` - Stop running command
  - `/api/console-logs` - List command logs
  - `/api/download-log` - Download log files
  - `/api/auth/refresh` - Token refresh
- **Mobile Responsiveness**: Comprehensive responsive design across all console components

---

## [1.1.0] (Preview) — 2026-01-21

> **Note:** This entry documents the planned stable v1.1.0 release features. The actual implementation is available in the rc series above.

### Added

- **Statistics for Strava Console**: New utility for executing Statistics for Strava console commands directly from the web interface
  - Terminal-like UI panel with real-time streaming output
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

- **NumberInput Multi-Digit Typing Bug**: Resolved critical issue where typing multi-digit numbers would result in corrupted input values
  - Root cause: Chakra UI v3's NumberInput feedback loop with controlled components
  - Created new `SafeNumberInput` wrapper component
  - Added comprehensive developer documentation in `docs/SAFE_NUMBER_INPUT.md`

### Changed

- Improved number input validation with real-time feedback after first blur
- Number inputs now automatically clamp values to min/max bounds on blur
- Enhanced user experience with clearer error messages for invalid numeric input

---

## [1.0.1] — 2026-01-19

### Added

- **Resting Heart Rate Configuration**: Added support for tracking resting heart rate history in the Athlete section
  - New RestingHeartRateEditor component for managing resting HR values over time
  - Integrated with athlete configuration schema
- **Gear Maintenance Enhancement**: Added "days used" as a new unit option for tracking gear usage
  - Provides more flexible tracking options alongside existing distance-based units

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
