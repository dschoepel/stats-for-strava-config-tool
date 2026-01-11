/**
 * Route Configuration
 * Maps page IDs to their corresponding components
 */

import YamlUtility from '../components/YamlUtility';
import GearMaintenanceEditor from '../components/GearMaintenanceEditor';
import ConfigFileList from '../components/ConfigFileList';
import AthleteConfigEditor from '../components/config/AthleteConfigEditor';
import GeneralConfigEditor from '../components/config/GeneralConfigEditor';
import AppearanceConfigEditor from '../components/config/AppearanceConfigEditor';
import ImportConfigEditor from '../components/config/ImportConfigEditor';
import MetricsConfigEditor from '../components/config/MetricsConfigEditor';
import GearConfigEditor from '../components/config/GearConfigEditor';
import IntegrationsConfigEditor from '../components/config/IntegrationsConfigEditor';
import DaemonConfigEditor from '../components/config/DaemonConfigEditor';
import ZwiftConfigEditor from '../components/config/ZwiftConfigEditor';
import MarkdownHelp from '../components/MarkdownHelp';

export const routes = {
  'Configuration': {
    component: ConfigFileList,
    requiresRef: true, // Special case - needs configListRef
    props: (context) => ({
      ref: context.configListRef,
      onConfigSectionClick: (section, parentPage) => {
        context.onNavigate(section, parentPage);
      }
    })
  },

  'YAML Utility': {
    component: YamlUtility,
    props: (context) => ({
      settings: context.settings
    })
  },

  'Gear Maintenance': {
    component: GearMaintenanceEditor,
    props: () => ({})
  },

  // Config section editors
  'Athlete': {
    component: AthleteConfigEditor,
    isConfigEditor: true,
    sectionKey: 'athlete'
  },
  'General': {
    component: GeneralConfigEditor,
    isConfigEditor: true,
    sectionKey: 'general'
  },
  'Appearance': {
    component: AppearanceConfigEditor,
    isConfigEditor: true,
    sectionKey: 'appearance'
  },
  'Import': {
    component: ImportConfigEditor,
    isConfigEditor: true,
    sectionKey: 'import'
  },
  'Metrics': {
    component: MetricsConfigEditor,
    isConfigEditor: true,
    sectionKey: 'metrics'
  },
  'Gear': {
    component: GearConfigEditor,
    isConfigEditor: true,
    sectionKey: 'gear'
  },
  'Integrations': {
    component: IntegrationsConfigEditor,
    isConfigEditor: true,
    sectionKey: 'integrations'
  },
  'Scheduling Daemon': {
    component: DaemonConfigEditor,
    isConfigEditor: true,
    sectionKey: 'daemon'
  },
  'Zwift': {
    component: ZwiftConfigEditor,
    isConfigEditor: true,
    sectionKey: 'zwift'
  },

  // Documentation pages
  'Documentation': {
    component: MarkdownHelp,
    props: () => ({ filePath: 'overview.md' })
  },
  'Overview': {
    component: MarkdownHelp,
    props: () => ({ filePath: 'overview.md' })
  },
  'Dashboard Editor Help': {
    component: MarkdownHelp,
    props: () => ({ filePath: 'dashboard-editor.md' })
  },
  'Sports List Editor Help': {
    component: MarkdownHelp,
    props: () => ({ filePath: 'sports-list-editor.md' })
  },
  'Widget Definitions Help': {
    component: MarkdownHelp,
    props: () => ({ filePath: 'widget-definitions.md' })
  },
  'Settings Management Help': {
    component: MarkdownHelp,
    props: () => ({ filePath: 'settings-management.md' })
  },
  'Configuration Examples Help': {
    component: MarkdownHelp,
    props: () => ({ filePath: 'configuration-examples.md' })
  }
};

/**
 * Get standard config editor props
 */
export const getConfigEditorProps = (sectionKey, sectionData, saveSectionData, navigateToConfig, isLoadingSectionData, setHasUnsavedChanges) => ({
  key: JSON.stringify(sectionData[sectionKey]),
  initialData: sectionData[sectionKey] || {},
  onSave: (data) => saveSectionData(sectionKey, data),
  onCancel: navigateToConfig,
  isLoading: isLoadingSectionData,
  onDirtyChange: setHasUnsavedChanges
});
