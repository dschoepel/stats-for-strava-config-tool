import React from 'react';
import { Box } from '@chakra-ui/react';
import YamlUtility from './YamlUtility';
import SportsListEditor from './SportsListEditor';
import WidgetDefinitionsEditor from './WidgetDefinitionsEditor';
import GearMaintenanceEditor from './GearMaintenanceEditor';
import ConfigFileList from './ConfigFileList';
import AthleteConfigEditor from './config/AthleteConfigEditor';
import GeneralConfigEditor from './config/GeneralConfigEditor';
import AppearanceConfigEditor from './config/AppearanceConfigEditor';
import ImportConfigEditor from './config/ImportConfigEditor';
import MetricsConfigEditor from './config/MetricsConfigEditor';
import GearConfigEditor from './config/GearConfigEditor';
import IntegrationsConfigEditor from './config/IntegrationsConfigEditor';
import DaemonConfigEditor from './config/DaemonConfigEditor';
import ZwiftConfigEditor from './config/ZwiftConfigEditor';
import MarkdownHelp from './MarkdownHelp';
import { useSettings } from '../state/SettingsProvider';
import { useNavigation } from '../state/NavigationProvider';
import { useConfig } from '../state/ConfigProvider';
import { useDirtyState } from '../state/DirtyStateProvider';

/**
 * AppRouter component handles page routing and renders the appropriate component
 * based on the current page state.
 */
const AppRouter = ({ configListRef, onNavigate }) => {
  // Use contexts internally
  const { settings } = useSettings();
  const { currentPage } = useNavigation();
  const { sectionData, isLoadingSectionData, saveSectionData } = useConfig();
  const { setHasUnsavedChanges } = useDirtyState();
  // Helper to navigate back to Configuration page
  const navigateToConfig = () => onNavigate('Configuration');

  // Render different pages based on currentPage
  if (currentPage === 'Configuration') {
    return (
      <ConfigFileList
        ref={configListRef}
        onConfigSectionClick={(section, parentPage) => {
          onNavigate(section, parentPage);
        }}
      />
    );
  }

  if (currentPage === 'YAML Utility') {
    return <YamlUtility settings={settings} />;
  }

  if (currentPage === 'Gear Maintenance') {
    return <GearMaintenanceEditor />;
  }

  if (currentPage === 'Athlete') {
    return (
      <AthleteConfigEditor
        key={JSON.stringify(sectionData.athlete)}
        initialData={sectionData.athlete || {}}
        onSave={(data) => saveSectionData('athlete', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={setHasUnsavedChanges}
      />
    );
  }

  if (currentPage === 'General') {
    return (
      <GeneralConfigEditor
        key={JSON.stringify(sectionData.general)}
        initialData={sectionData.general || {}}
        onSave={(data) => saveSectionData('general', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={setHasUnsavedChanges}
      />
    );
  }

  if (currentPage === 'Appearance') {
    return (
      <AppearanceConfigEditor
        key={JSON.stringify(sectionData.appearance)}
        initialData={sectionData.appearance || {}}
        onSave={(data) => saveSectionData('appearance', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={setHasUnsavedChanges}
      />
    );
  }

  if (currentPage === 'Import') {
    return (
      <ImportConfigEditor
        key={JSON.stringify(sectionData.import)}
        initialData={sectionData.import || {}}
        onSave={(data) => saveSectionData('import', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={setHasUnsavedChanges}
      />
    );
  }

  if (currentPage === 'Metrics') {
    return (
      <MetricsConfigEditor
        key={JSON.stringify(sectionData.metrics)}
        initialData={sectionData.metrics || {}}
        onSave={(data) => saveSectionData('metrics', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={setHasUnsavedChanges}
      />
    );
  }

  if (currentPage === 'Gear') {
    return (
      <GearConfigEditor
        key={JSON.stringify(sectionData.gear)}
        initialData={sectionData.gear || {}}
        onSave={(data) => saveSectionData('gear', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={setHasUnsavedChanges}
      />
    );
  }

  if (currentPage === 'Integrations') {
    return (
      <IntegrationsConfigEditor
        key={JSON.stringify(sectionData.integrations)}
        initialData={sectionData.integrations || {}}
        onSave={(data) => saveSectionData('integrations', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={setHasUnsavedChanges}
      />
    );
  }

  if (currentPage === 'Scheduling Daemon') {
    return (
      <DaemonConfigEditor
        key={JSON.stringify(sectionData.daemon)}
        initialData={sectionData.daemon || {}}
        onSave={(data) => saveSectionData('daemon', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={setHasUnsavedChanges}
      />
    );
  }

  if (currentPage === 'Zwift') {
    return (
      <ZwiftConfigEditor
        key={JSON.stringify(sectionData.zwift)}
        initialData={sectionData.zwift || {}}
        onSave={(data) => saveSectionData('zwift', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={setHasUnsavedChanges}
      />
    );
  }

  if (currentPage === 'Documentation' || currentPage === 'Overview') {
    return <MarkdownHelp filePath="overview.md" />;
  }

  if (currentPage === 'Dashboard Editor Help') {
    return <MarkdownHelp filePath="dashboard-editor.md" />;
  }

  if (currentPage === 'Sports List Editor Help') {
    return <MarkdownHelp filePath="sports-list-editor.md" />;
  }

  if (currentPage === 'Widget Definitions Help') {
    return <MarkdownHelp filePath="widget-definitions.md" />;
  }

  if (currentPage === 'Settings Management Help') {
    return <MarkdownHelp filePath="settings-management.md" />;
  }

  if (currentPage === 'Configuration Examples Help') {
    return <MarkdownHelp filePath="configuration-examples.md" />;
  }

  // Default/fallback page
  return (
    <Box>
      <h2>{currentPage}</h2>
      {/* Content for {currentPage} will be displayed here */}
    </Box>
  );
};

export default AppRouter;
