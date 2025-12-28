![Logo white gear on orange background.](/public/logo.svg)
# Stats for Strava - Configuration Tool

A modern web application for managing and editing Stats for Strava configuration files with an intuitive, form-based interface.

## Overview

The Stats for Strava Configuration Tool provides a user-friendly way to create and edit complex YAML configuration files for your Strava statistics dashboard. Instead of manually editing YAML files, use guided forms with validation, descriptions, and type-specific controls to ensure your configuration is correct.

## Key Features

### 📝 Form-Based Configuration Editor

- **Guided forms** for all configuration sections with clear field descriptions
- **Input validation** prevents invalid values from being saved
- **Type-specific controls** including dropdowns for enums, number inputs for numeric values
- **Required field indicators** mark mandatory fields with red asterisks (*)
- **Real-time validation** to catch errors before saving

### 🔧 Configuration Sections

Manage all aspects of your Strava statistics dashboard:

- **General** - Basic application settings like URLs and titles
- **Athlete** - Personal information including heart rate zones, weight history, and FTP data
- **Appearance** - Visual customization options for your statistics display
- **Import** - Data import settings and preferences
- **Metrics** - Configuration for statistical calculations and metrics
- **Gear** - Equipment and bike configuration
- **Zwift** - Zwift integration settings
- **Integrations** - Third-party service connections and API settings
- **Scheduling Daemon** - Automated task scheduling and background processes

### 📊 Dashboard & Widget Management

- **Dashboard Editor** - Configure dashboard layouts and widget placements
- **Sports List Editor** - Manage sport types and activity classifications
- **Widget Definitions Editor** - Manage widget templates (accessible via Settings → Widgets)
  - Define widget metadata, instance rules, and configuration options
  - 20+ built-in widget definitions including Most Recent Activities, Training Goals, Weekly Statistics, and more
  - Support for single-instance and multi-instance widgets
  - Custom configuration templates for each widget

### 🛠️ YAML Utility

Essential configuration file management tools:

- **Validate YAML files** - Check syntax and structure for errors
- **View file contents** - Browse and inspect configuration files with syntax highlighting
- **Combine configurations** - Merge multiple YAML files into a single unified configuration
- **Monaco Editor integration** - Professional code editing experience

### 🎨 Modern User Interface

Built with modern web technologies:

- **Next.js** - React framework for production-grade applications
- **Chakra UI** - Accessible and customizable component library
- **Monaco Editor** - VS Code's editor for YAML viewing and editing
- **React Icons** - Beautiful, consistent iconography
- **Dark mode support** - Comfortable viewing in any lighting condition

## Technology Stack

- **Framework:** Next.js 16
- **UI Library:** Chakra UI 3
- **Language:** JavaScript (React 19)
- **Editor:** Monaco Editor (React integration)
- **YAML Processing:** js-yaml, yaml
- **Styling:** Emotion, Framer Motion
- **Icons:** React Icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/dschoepel/stats-for-strava-config-tool.git

# Navigate to the project directory
cd stats-for-strava-config-tool

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:3000
```

### Building for Production

```bash
# Create an optimized production build
npm run build

# Start the production server
npm start
```

## Usage Guide

### Basic Workflow

1. **Choose a configuration section** from the sidebar menu
2. **Fill in the form fields** - required fields are marked with *
3. **Use the descriptions** to understand what each setting does
4. **Save your changes** - the tool will validate your input
5. **Review the results** - check that your configuration works as expected

### Widget Definitions Management

1. **Open Settings** - Click the gear icon in the top navigation
2. **Select Widgets tab** - Navigate to the Widget Definitions section
3. **View widgets** - Widgets are grouped by instance rules
4. **Expand details** - Click the toggle arrow to see properties and configuration templates
5. **Add/Edit/Delete** - Use the respective buttons to manage widget definitions
6. **Save changes** - Click the Save button to write all changes to file

### YAML File Management

1. **Access YAML Utility** - Navigate to the YAML Utility section
2. **Validate files** - Check your configuration files for syntax errors
3. **View contents** - Inspect configuration files with syntax highlighting
4. **Combine files** - Merge multiple configuration files into one

## Important Notes

### Comment Preservation

⚠️ When saving configuration changes through the form editor:

- **Section headers are preserved** - Main comments like section titles remain intact
- **Embedded comments may be removed** - Detailed comments within YAML structures might be lost
- **This is by design** - The forms provide all necessary guidance, making embedded comments redundant

If you need to preserve all comments, edit the YAML files manually instead of using this tool.

### Widget Definitions

⚠️ Individual widget changes are saved in memory only. You must click the main **Save** button to write all changes to the file.

The widget definitions file (`settings/widget-definitions.yaml`) is automatically created when you first open the tool and includes 20 default widget definitions.

## Default Widget Definitions

The system includes these built-in widget definitions:

- Most Recent Activities
- Introduction Text
- Training Goals
- Weekly Statistics
- Peak Power Outputs
- Heart Rate Zones
- Activity Grid
- Monthly Statistics
- Training Load
- Weekday Statistics
- Day Time Statistics
- Distance Breakdown
- Yearly Statistics
- Zwift Statistics
- Gear Statistics
- Eddington Number
- Challenge Consistency
- Most Recent Challenges
- FTP History
- Athlete Weight History

## Troubleshooting

### Common Issues

**Form validation errors**
- Check that all required fields are filled and values are in the correct format

**Changes not saving**
- Ensure you have write permissions to the configuration directory

**Lost comments after saving**
- This is expected behavior - use manual YAML editing to preserve all comments

**Configuration not loading**
- Verify your YAML files have valid syntax and are in the expected directory

**Widget definitions not updating**
- Remember to click the main Save button after editing widgets - individual changes are held in memory

**Widget definition file missing**
- The file is auto-created on app startup. Check your default file path in Settings → Files

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See the [LICENSE](LICENSE) file for details.

## Related Projects

This tool is designed to work with the Stats for Strava application. Visit the main Stats for Strava project for more information about the statistics dashboard.

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.
