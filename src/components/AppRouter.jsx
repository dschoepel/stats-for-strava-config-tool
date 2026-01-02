import React from 'react';
import { Box } from '@chakra-ui/react';
import YamlUtility from './YamlUtility';
import SportsListEditor from './SportsListEditor';
import WidgetDefinitionsEditor from './WidgetDefinitionsEditor';
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

/**
 * AppRouter component handles page routing and renders the appropriate component
 * based on the current page state.
 */
const AppRouter = ({
  currentPage,
  settings,
  sectionData,
  isLoadingSectionData,
  configListRef,
  fileCache,
  hasConfigInitialized,
  sectionToFileMap,
  onNavigate,
  onSaveSectionData,
  onUnsavedChangesChange,
  onConfigInitializedChange,
  onFileCacheChange,
  onSectionToFileMapChange
}) => {
  // Helper to navigate back to Configuration page
  const navigateToConfig = () => onNavigate('Configuration');

  // Render different pages based on currentPage
  if (currentPage === 'Configuration') {
    return (
      <ConfigFileList
        ref={configListRef}
        fileCache={fileCache}
        setFileCache={onFileCacheChange}
        hasConfigInitialized={hasConfigInitialized}
        setHasConfigInitialized={onConfigInitializedChange}
        sectionToFileMap={sectionToFileMap}
        setSectionToFileMap={onSectionToFileMapChange}
        onConfigSectionClick={(section, parentPage) => {
          onNavigate(section, parentPage);
        }}
        settings={settings}
      />
    );
  }

  if (currentPage === 'YAML Utility') {
    return <YamlUtility settings={settings} />;
  }

  if (currentPage === 'Athlete') {
    return (
      <AthleteConfigEditor
        key={JSON.stringify(sectionData.athlete)}
        initialData={sectionData.athlete || {}}
        onSave={(data) => onSaveSectionData('athlete', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={onUnsavedChangesChange}
      />
    );
  }

  if (currentPage === 'General') {
    return (
      <GeneralConfigEditor
        key={JSON.stringify(sectionData.general)}
        initialData={sectionData.general || {}}
        onSave={(data) => onSaveSectionData('general', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={onUnsavedChangesChange}
      />
    );
  }

  if (currentPage === 'Appearance') {
    return (
      <AppearanceConfigEditor
        key={JSON.stringify(sectionData.appearance)}
        initialData={sectionData.appearance || {}}
        onSave={(data) => onSaveSectionData('appearance', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={onUnsavedChangesChange}
      />
    );
  }

  if (currentPage === 'Import') {
    return (
      <ImportConfigEditor
        key={JSON.stringify(sectionData.import)}
        initialData={sectionData.import || {}}
        onSave={(data) => onSaveSectionData('import', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={onUnsavedChangesChange}
      />
    );
  }

  if (currentPage === 'Metrics') {
    return (
      <MetricsConfigEditor
        key={JSON.stringify(sectionData.metrics)}
        initialData={sectionData.metrics || {}}
        onSave={(data) => onSaveSectionData('metrics', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={onUnsavedChangesChange}
      />
    );
  }

  if (currentPage === 'Gear') {
    return (
      <GearConfigEditor
        key={JSON.stringify(sectionData.gear)}
        initialData={sectionData.gear || {}}
        onSave={(data) => onSaveSectionData('gear', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={onUnsavedChangesChange}
      />
    );
  }

  if (currentPage === 'Integrations') {
    return (
      <IntegrationsConfigEditor
        key={JSON.stringify(sectionData.integrations)}
        initialData={sectionData.integrations || {}}
        onSave={(data) => onSaveSectionData('integrations', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={onUnsavedChangesChange}
      />
    );
  }

  if (currentPage === 'Scheduling Daemon') {
    return (
      <DaemonConfigEditor
        key={JSON.stringify(sectionData.daemon)}
        initialData={sectionData.daemon || {}}
        onSave={(data) => onSaveSectionData('daemon', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={onUnsavedChangesChange}
      />
    );
  }

  if (currentPage === 'Zwift') {
    return (
      <ZwiftConfigEditor
        key={JSON.stringify(sectionData.zwift)}
        initialData={sectionData.zwift || {}}
        onSave={(data) => onSaveSectionData('zwift', data)}
        onCancel={navigateToConfig}
        isLoading={isLoadingSectionData}
        onDirtyChange={onUnsavedChangesChange}
      />
    );
  }

  if (currentPage === 'Documentation') {
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
