# Developer Guide

This guide provides technical documentation for developers working on the Stats for Strava Configuration Tool codebase.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Phase 3 Refactoring](#phase-3-refactoring)
- [Technology Stack](#technology-stack)
- [Custom Hooks](#custom-hooks)
- [Reusable Components](#reusable-components)
- [API Client](#api-client)
- [Component Patterns](#component-patterns)
- [State Management](#state-management)
- [Styling Guidelines](#styling-guidelines)
- [Development Workflow](#development-workflow)
- [Debug Logging](#debug-logging)

## Architecture Overview

The application is built with Next.js 16 and React 19, using a modern component-based architecture with custom hooks for shared logic.

### Project Structure

```
src/
├── components/          # React components
│   ├── config/         # Configuration section editors
│   ├── config-fields/  # Specialized form field components
│   └── settings/       # Settings modal components
├── hooks/              # Custom React hooks
├── schemas/            # JSON schemas for validation
└── utils/              # Utility functions and managers
app/
├── api/                # Next.js API routes
└── [pages]             # Next.js pages
```

## Phase 3 Refactoring

A comprehensive refactoring effort was completed in January 2026, focusing on code quality, maintainability, and developer experience.

### Goals & Results

**Primary Objectives:**
1. Reduce code duplication and complexity
2. Create reusable component library
3. Implement PropTypes for type safety
4. Centralize API communication
5. Extract custom hooks for shared logic

**Achievements:**
- ✅ **70% Code Reduction**: 5,250 lines → 1,563 lines across 8 major components
- ✅ **21 Reusable Components**: Extracted form fields and UI elements
- ✅ **3 Custom Hooks**: useConfigData, useToast, and other shared logic
- ✅ **PropTypes Validation**: 100% component coverage
- ✅ **Centralized API Client**: Unified server communication layer
- ✅ **Responsive Design**: Mobile-optimized layouts (≤425px breakpoint)

### Components Refactored

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| AppearanceConfigEditor | 830 lines | 243 lines | 71% |
| AthleteConfigEditor | 810 lines | 356 lines | 56% |
| GeneralConfigEditor | 292 lines | 141 lines | 52% |
| ImportConfigEditor | 594 lines | 206 lines | 65% |
| IntegrationsConfigEditor | 885 lines | 286 lines | 68% |
| MetricsConfigEditor | 480 lines | 121 lines | 75% |
| GearConfigEditor | 820 lines | 123 lines | 85% |
| DaemonConfigEditor | 539 lines | 87 lines | 84% |
| **Total** | **5,250 lines** | **1,563 lines** | **70%** |

### Benefits Achieved

**Maintainability:**
- Smaller, focused components are easier to understand
- Consistent patterns across all configuration editors
- Reduced cognitive load when making changes

**Reusability:**

## Debug Logging

The application includes a configurable debug logging system that allows you to enable verbose console logging during development or troubleshooting.

### Environment Variable

Set the `NEXT_PUBLIC_ENABLE_DEBUG_LOGS` environment variable to control debug output:

```bash
# In your .env.local file for local development
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true

# In your .env.config-tool file for Docker
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true
```

**Default:** `false` (debug logs disabled)

### Using Debug Functions

Import and use the debug utility functions in your code:

```javascript
import { debugLog, debugWarn, isDebugEnabled } from '../utils/debug';

// Use debugLog for verbose logging that should be gated
debugLog('Processing section:', sectionName);
debugLog('Data preview:', JSON.stringify(data).substring(0, 200));

// Use debugWarn for debug warnings
debugWarn('Potential issue detected:', issue);

// Check if debug is enabled
if (isDebugEnabled()) {
  // Expensive debug operation
}
```

### Guidelines

**When to use debug logging:**
- Verbose flow tracking (section loading, file parsing)
- Data structure previews and transformations
- Path resolution and file system operations
- Non-critical informational messages
- Temporary debugging during development

**When NOT to use debug logging:**
- Error conditions (use `console.error` directly)
- Critical warnings (use `console.warn` directly)
- User-facing messages (use toast notifications)
- Security-sensitive information (never log credentials)

**Benefits:**
- Clean production logs by default
- Granular control for troubleshooting
- No need to remove/comment debug statements
- Easy to enable in production when needed

### Debug Log Categories

The following areas have debug logging implemented:

1. **Configuration Section Loading** (`src/hooks/useConfigData.js`)
   - Section file mapping and resolution
   - YAML parsing and data extraction

2. **File Updates** (`app/api/update-section/route.js`)
   - Backup creation and management
   - YAML content transformation
   - Comment preservation tracking

3. **Section Parsing** (`app/api/parse-sections/route.js`)
   - Split file detection
   - Section mapping creation

### Local Development

For local development, create a `.env.local` file:

```bash
# .env.local
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true
```

This enables verbose logging during development without affecting production builds.
- Form field components used across multiple sections
- Shared validation and error handling logic
- Consistent UI/UX through component reuse

**Type Safety:**
- PropTypes catch type errors during development
- Self-documenting component interfaces
- Better IDE autocomplete support

**Performance:**
- Smaller component trees optimize React rendering
- Reduced bundle size through code elimination
- Better code splitting opportunities

**Developer Experience:**
- Clear component APIs via PropTypes
- Consistent coding patterns
- Comprehensive documentation
- Easier onboarding for new contributors

### Migration Notes

If working with pre-refactoring code:
- Replace inline forms with extracted field components
- Use `useConfigData` hook instead of manual state + API calls
- Import from `apiClient.js` instead of inline fetch calls
- Add PropTypes to any new components
- Follow the configuration editor pattern (see Component Patterns section)

No breaking changes were introduced - all refactoring maintained backward compatibility.

## Technology Stack

**Framework & Libraries:**
- **Next.js 16** - React framework with App Router
- **React 19** - UI library with modern hooks
- **Chakra UI 3** - Component library and design system
- **Monaco Editor** - Code editor component (VS Code)
- **React Icons** - Icon library

**Data & State:**
- **js-yaml / yaml** - YAML parsing and serialization
- **PropTypes** - Runtime type checking
- **localStorage** - Settings persistence

**Styling:**
- **Emotion** - CSS-in-JS styling engine
- **Framer Motion** - Animation library

**Development:**
- **ESLint** - Code linting
- **Turbopack** - Fast build tooling (Next.js)

## Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev  # http://localhost:3000

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Creating New Features

1. **Plan the component structure** - Identify reusable parts
2. **Check existing components** - Reuse before creating new
3. **Add PropTypes** - Define component interface
4. **Follow patterns** - Use established coding patterns
5. **Test responsive** - Verify mobile layout (≤425px)
6. **Document** - Update this guide if adding reusable components

### Build Verification

Always verify builds after changes:

```bash
npm run build
```

Expected output:
- ✓ Compiled successfully
- No TypeScript errors  
- No lint warnings
- Build time: 13-16 seconds

### Code Review Checklist

- [ ] PropTypes added/updated
- [ ] Responsive design tested
- [ ] Dark mode tested
- [ ] Console warnings checked
- [ ] Build successful
- [ ] Documentation updated (if reusable component)

## Custom Hooks

### useConfigData

Central hook for managing configuration data with automatic API integration.

**Location**: `src/hooks/useConfigData.js`

**Usage**:
```javascript
import { useConfigData } from '@/hooks/useConfigData';

function MyComponent() {
  const {
    configData,
    updateConfigData,
    savedData,
    isLoading,
    error,
    saveChanges,
    hasUnsavedChanges
  } = useConfigData(sectionName);
  
  // Update local state
  updateConfigData({ fieldName: newValue });
  
  // Save to server
  const success = await saveChanges();
}
```

**Features**:
- Automatic data fetching on mount
- Optimistic updates with error handling
- Tracks unsaved changes
- Toast notifications for success/error states
- Loading and error states

**Props**:
- `sectionName` (string, required): Configuration section name (e.g., 'general', 'athlete')

**Returns**:
- `configData` (object): Current configuration data (local state)
- `updateConfigData` (function): Update local state
- `savedData` (object): Last saved data from server
- `isLoading` (boolean): Loading state
- `error` (string|null): Error message if any
- `saveChanges` (async function): Save current data to server
- `hasUnsavedChanges` (boolean): True if local differs from saved

### useToast

Toast notification system integration.

**Location**: `src/hooks/useToast.js`

**Usage**:
```javascript
import { useToast } from '@/hooks/useToast';

function MyComponent() {
  const { showToast } = useToast();
  
  showToast('Success message', 'success');
  showToast('Error occurred', 'error');
  showToast('Warning', 'warning');
  showToast('Information', 'info');
}
```

**Returns**:
- `showToast(message, type)`: Display toast notification
  - `message` (string): Text to display
  - `type` (string): 'success' | 'error' | 'warning' | 'info'

## Reusable Components

### Form Field Components

#### FormFieldWrapper

Wrapper for form fields with label, description, and required indicator.

**Location**: `src/components/config-fields/FormFieldWrapper.jsx`

**Props**:
```javascript
FormFieldWrapper.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  required: PropTypes.bool,
  children: PropTypes.node.isRequired
};
```

**Usage**:
```javascript
<FormFieldWrapper
  label="Field Name"
  description="Helper text"
  required={true}
>
  <Input />
</FormFieldWrapper>
```

#### SectionHeader

Styled header for configuration sections.

**Location**: `src/components/config-fields/SectionHeader.jsx`

**Props**:
```javascript
SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string
};
```

#### SaveButton

Button with loading state for save operations.

**Location**: `src/components/config-fields/SaveButton.jsx`

**Props**:
```javascript
SaveButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  hasUnsavedChanges: PropTypes.bool,
  children: PropTypes.node
};
```

**Features**:
- Disabled when no unsaved changes
- Shows loading spinner during save
- Visual feedback for unsaved changes

### Configuration Section Components

#### LocaleField

Dropdown for selecting application locale.

**Location**: `src/components/config-fields/LocaleField.jsx`

**Props**:
```javascript
LocaleField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool
};
```

**Supported Locales**:
- English (US)
- French (France)
- Italian
- Dutch (Belgium)
- German
- Portuguese (Brazil)
- Portuguese (Portugal)
- Swedish
- Chinese

#### UnitSystemField

Toggle for metric/imperial units.

**Location**: `src/components/config-fields/UnitSystemField.jsx`

**Props**:
```javascript
UnitSystemField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool
};
```

#### TimeFormatField

Radio group for 12/24-hour time format.

**Location**: `src/components/config-fields/TimeFormatField.jsx`

#### DateFormatFields

Dual input fields for short and normal date formats.

**Location**: `src/components/config-fields/DateFormatFields.jsx`

**Props**:
```javascript
DateFormatFields.propTypes = {
  shortFormat: PropTypes.string.isRequired,
  normalFormat: PropTypes.string.isRequired,
  onShortChange: PropTypes.func.isRequired,
  onNormalChange: PropTypes.func.isRequired
};
```

#### SportTypesField

Text input with tag support for sport type arrays.

**Location**: `src/components/config-fields/SportTypesField.jsx`

**Props**:
```javascript
SportTypesField.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  placeholder: PropTypes.string
};
```

#### UrlField

URL input with validation.

**Location**: `src/components/config-fields/UrlField.jsx`

#### HeatmapPolylineColorField

Color picker for heatmap polyline color.

**Location**: `src/components/config-fields/HeatmapPolylineColorField.jsx`

#### HeatmapTileLayerField

Dynamic field for single or multiple tile layer URLs.

**Location**: `src/components/config-fields/HeatmapTileLayerField.jsx`

**Props**:
```javascript
HeatmapTileLayerField.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]).isRequired,
  onChange: PropTypes.func.isRequired
};
```

**Features**:
- Supports single URL string
- Supports array of URLs
- Add/remove layer functionality

#### PhotosDefaultFiltersField

Combined field for default photo filters (sport types and country).

**Location**: `src/components/config-fields/PhotosDefaultFiltersField.jsx`

### Specialized Components

#### FtpHistoryField

Complex field for managing FTP history with date-based values.

**Location**: `src/components/config-fields/FtpHistoryField.jsx`

**Props**:
```javascript
FtpHistoryField.propTypes = {
  value: PropTypes.shape({
    cycling: PropTypes.object,
    running: PropTypes.array
  }).isRequired,
  onChange: PropTypes.func.isRequired
};
```

**Features**:
- Separate cycling/running sections
- Date-based entries (YYYY-MM-DD format)
- Add/remove entries
- Validation (50-600 watts for cycling)

#### WeightHistoryField

Field for managing weight history entries.

**Location**: `src/components/config-fields/WeightHistoryField.jsx`

**Props**:
```javascript
WeightHistoryField.propTypes = {
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  unitSystem: PropTypes.string
};
```

**Features**:
- Date-based entries
- Unit-aware (kg/lbs based on unitSystem)
- Validation (30-300 range)

#### CountrySelector

Searchable dropdown for country selection.

**Location**: `src/components/config-fields/CountrySelector.jsx`

**Props**:
```javascript
CountrySelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  description: PropTypes.string
};
```

**Features**:
- Full list of countries with ISO2 codes
- Search functionality
- Clear/reset option

### Import Configuration Components

#### ImportNumberField

Number input for import settings.

**Location**: `src/components/config-fields/ImportNumberField.jsx`

#### ImportDateField

Date picker for skip-before date.

**Location**: `src/components/config-fields/ImportDateField.jsx`

#### WebhooksField

Complex field group for webhook configuration.

**Location**: `src/components/config-fields/WebhooksField.jsx`

**Props**:
```javascript
WebhooksField.propTypes = {
  value: PropTypes.shape({
    enabled: PropTypes.bool,
    verifyToken: PropTypes.string,
    checkIntervalInMinutes: PropTypes.number
  }).isRequired,
  onChange: PropTypes.func.isRequired
};
```

### Integration Components

#### NotificationServicesField

Field for managing notification service URLs.

**Location**: `src/components/config-fields/NotificationServicesField.jsx`

**Features**:
- Array of URL entries
- Add/remove URLs
- URL validation

#### AIConfigurationField

Complex field group for AI provider configuration.

**Location**: `src/components/config-fields/AIConfigurationField.jsx`

**Props**:
```javascript
AIConfigurationField.propTypes = {
  enabled: PropTypes.bool.isRequired,
  enableUI: PropTypes.bool.isRequired,
  provider: PropTypes.string.isRequired,
  configuration: PropTypes.shape({
    key: PropTypes.string,
    model: PropTypes.string,
    url: PropTypes.string
  }).isRequired,
  onEnabledChange: PropTypes.func.isRequired,
  onEnableUIChange: PropTypes.func.isRequired,
  onProviderChange: PropTypes.func.isRequired,
  onConfigChange: PropTypes.func.isRequired
};
```

**Supported Providers**:
- OpenAI
- Anthropic (Claude)
- Azure OpenAI
- Google Gemini
- Ollama (self-hosted)
- DeepSeek
- Mistral

### Metrics Components

#### EddingtonConfigurationField

Field for managing Eddington score configurations.

**Location**: `src/components/config-fields/EddingtonConfigurationField.jsx`

**Features**:
- Multiple Eddington configurations
- Sport type grouping
- Navigation bar toggle
- Dashboard widget toggle

### Daemon Components

#### CronJobField

Field for managing individual cron job configurations.

**Location**: `src/components/config-fields/CronJobField.jsx`

**Props**:
```javascript
CronJobField.propTypes = {
  job: PropTypes.shape({
    action: PropTypes.string.isRequired,
    expression: PropTypes.string.isRequired,
    enabled: PropTypes.bool.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggleExpand: PropTypes.func.isRequired
};
```

**Features**:
- Expandable/collapsible cards
- Visual cron expression builder (react-js-cron)
- Enable/disable toggle
- Action type selector
- Responsive layout for mobile

## API Client

Centralized API communication layer.

**Location**: `src/utils/apiClient.js`

### Available Methods

#### fetchConfigSection

Fetch configuration data for a specific section.

```javascript
import { fetchConfigSection } from '@/utils/apiClient';

const data = await fetchConfigSection('general');
```

**Parameters**:
- `section` (string): Section name

**Returns**: Promise<object> - Configuration data

#### updateConfigSection

Update configuration data for a section.

```javascript
import { updateConfigSection } from '@/utils/apiClient';

await updateConfigSection('general', { appUrl: 'https://example.com' });
```

**Parameters**:
- `section` (string): Section name
- `data` (object): Updated configuration data

**Returns**: Promise<object> - Updated configuration

#### parseSections

Parse YAML file into sections.

```javascript
import { parseSections } from '@/utils/apiClient';

const sections = await parseSections('/path/to/config.yaml');
```

**Parameters**:
- `filePath` (string): Path to YAML file

**Returns**: Promise<object> - Parsed sections

#### saveFile

Save file content to disk.

```javascript
import { saveFile } from '@/utils/apiClient';

await saveFile('/path/to/file.yaml', yamlContent);
```

**Parameters**:
- `filePath` (string): Destination path
- `content` (string): File content

**Returns**: Promise<object> - Save result

#### getSportsList

Fetch available sports list.

```javascript
import { getSportsList } from '@/utils/apiClient';

const sports = await getSportsList();
```

**Returns**: Promise<object> - Sports list data

#### checkFileExists

Check if a file exists.

```javascript
import { checkFileExists } from '@/utils/apiClient';

const exists = await checkFileExists('/path/to/file.yaml');
```

**Parameters**:
- `filePath` (string): Path to check

**Returns**: Promise<boolean> - File existence

#### expandPath

Expand tilde and environment variables in path.

```javascript
import { expandPath } from '@/utils/apiClient';

const fullPath = await expandPath('~/Documents/config.yaml');
```

**Parameters**:
- `path` (string): Path with variables

**Returns**: Promise<string> - Expanded path

#### getFileContent

Fetch file content.

```javascript
import { getFileContent } from '@/utils/apiClient';

const content = await getFileContent('/path/to/file.yaml');
```

**Parameters**:
- `filePath` (string): File to read

**Returns**: Promise<string> - File content

## Component Patterns

### Configuration Section Editor Pattern

All configuration section editors follow this pattern:

```javascript
import { useConfigData } from '@/hooks/useConfigData';
import SectionHeader from '@/components/config-fields/SectionHeader';
import FormFieldWrapper from '@/components/config-fields/FormFieldWrapper';
import SaveButton from '@/components/config-fields/SaveButton';

export default function MySectionEditor({ sectionName = 'mysection' }) {
  const {
    configData,
    updateConfigData,
    isLoading,
    error,
    saveChanges,
    hasUnsavedChanges
  } = useConfigData(sectionName);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Box>
      <SectionHeader
        title="My Section"
        description="Section description"
      />
      
      <VStack gap={6}>
        <FormFieldWrapper
          label="Field Name"
          description="Field description"
          required
        >
          <Input
            value={configData.fieldName || ''}
            onChange={(e) => updateConfigData({ fieldName: e.target.value })}
          />
        </FormFieldWrapper>
        
        <SaveButton
          onClick={saveChanges}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      </VStack>
    </Box>
  );
}
```

### Responsive Design Pattern

Use Chakra UI responsive props for mobile layouts:

```javascript
<Box
  display="flex"
  flexDirection={{ base: "column", sm: "row" }}
  gap={{ base: 2, sm: 4 }}
>
  {/* Content */}
</Box>
```

**Breakpoints**:
- `base`: 0px - 425px (mobile)
- `sm`: 425px+ (tablet and up)
- `md`: 768px+ (desktop)

### Modal Component Pattern

Settings modals support embedded mode:

```javascript
export default function MySettingsModal({ isOpen, onClose, embedded = false }) {
  const content = (
    <VStack gap={4}>
      {/* Modal content */}
    </VStack>
  );

  if (embedded) {
    return content; // No modal wrapper
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <DialogBody>{content}</DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}
```

## State Management

### Local Component State

Use `useState` for component-specific state:

```javascript
const [isExpanded, setIsExpanded] = useState(false);
```

### Configuration Data State

Use `useConfigData` hook for configuration data:

```javascript
const { configData, updateConfigData } = useConfigData('general');
```

### Settings State

Settings are managed via `settingsManager.js`:

```javascript
import { getSettings, saveSetting } from '@/utils/settingsManager';

const settings = getSettings();
saveSetting('ui', 'theme', 'dark');
```

**Available Settings**:
- `ui.theme`: 'light' | 'dark' | 'system'
- `ui.sidebarCollapsed`: boolean
- `files.defaultPath`: string
- `files.autoBackup`: boolean
- `files.validateOnLoad`: boolean
- `editor.showLineNumbers`: boolean
- `editor.wordWrap`: boolean
- `editor.fontSize`: number
- `performance.enableVirtualization`: boolean
- `performance.lazyLoadImages`: boolean

## Styling Guidelines

### Chakra UI System

Use Chakra UI's design tokens for consistency:

```javascript
// Colors
<Box bg="bg.panel" color="fg">

// Spacing
<VStack gap={4}>

// Typography
<Text fontSize="sm" fontWeight="medium">

// Responsive
<Box display={{ base: "none", md: "block" }}>
```

### Theme Integration

The app supports light/dark mode via Chakra UI's color mode:

```javascript
import { useColorMode } from '@chakra-ui/react';

const { colorMode, toggleColorMode } = useColorMode();
```

### CSS-in-JS

Avoid inline styles. Use Chakra props or create styled components:

```javascript
const StyledBox = chakra(Box, {
  baseStyle: {
    p: 4,
    borderRadius: 'md',
    bg: 'bg.panel'
  }
});
```

## Testing Guidelines

### Manual Testing Checklist

When making changes, test:

1. **Form validation** - Try invalid inputs
2. **Save operations** - Verify data persists
3. **Loading states** - Check spinners appear
4. **Error handling** - Test API failures
5. **Responsive design** - Test on mobile width (≤425px)
6. **Dark mode** - Toggle and verify contrast
7. **PropTypes warnings** - Check console for type errors

### Build Verification

Always run a production build after changes:

```bash
npm run build
```

Expected output:
- ✓ Compiled successfully
- No TypeScript errors
- No lint warnings

## Performance Considerations

### Component Optimization

- Use `React.memo()` for expensive components
- Implement `useMemo()` for computed values
- Use `useCallback()` for event handlers passed to children

### Bundle Size

Current production build metrics:
- First Load JS: ~300KB
- Route-specific chunks: 20-50KB each

### Lazy Loading

Consider lazy loading for:
- Monaco Editor (large bundle)
- Rarely used modals
- Complex visualization components

## Common Tasks

### Adding a New Configuration Field

1. Update schema in `src/schemas/configSchemas.js`
2. Create field component if needed in `src/components/config-fields/`
3. Add field to appropriate section editor in `src/components/config/`
4. Add PropTypes validation
5. Test save/load operations

### Adding a New Configuration Section

1. Create schema in `configSchemas.js`
2. Create section editor component in `src/components/config/`
3. Add route to sidebar in layout
4. Add API endpoint if needed in `app/api/`
5. Test full CRUD operations

### Creating a Reusable Component

1. Create component in appropriate directory
2. Add PropTypes with complete documentation
3. Export from component file
4. Document in this developer guide
5. Use consistent naming (PascalCase, descriptive)

## Debugging Tips

### Common Issues

**PropTypes warnings**: Check component props match PropTypes definition

**API errors**: Check network tab, verify endpoint exists

**State not updating**: Ensure using proper update functions (not mutating state)

**Styling issues**: Check Chakra props, verify theme tokens exist

**Build failures**: Clear `.next` folder and rebuild

### Development Tools

- **React DevTools**: Inspect component hierarchy and props
- **Network Tab**: Monitor API calls and responses
- **Console**: Watch for PropTypes warnings and errors
- **React Profiler**: Identify performance bottlenecks

## Best Practices

### Code Style

- Use functional components with hooks
- Destructure props at function signature
- Use descriptive variable names
- Keep components focused and small (< 300 lines)
- Extract complex logic to custom hooks
- Add PropTypes to all components

### Git Workflow

- Write descriptive commit messages
- Keep commits atomic and focused
- Test before committing
- Run build verification before pushing

### Documentation

- Comment complex logic
- Update this guide when adding reusable components
- Document PropTypes thoroughly
- Add JSDoc comments for utility functions

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Chakra UI Documentation](https://chakra-ui.com/docs)
- [PropTypes Documentation](https://reactjs.org/docs/typechecking-with-proptypes.html)
- [Monaco Editor React](https://github.com/suren-atoyan/monaco-react)

## Support

For questions about the codebase:
1. Check this developer guide
2. Review component PropTypes
3. Search existing issues on GitHub
4. Open a new issue with [DEV] prefix
