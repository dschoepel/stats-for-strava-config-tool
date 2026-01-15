/**
 * Navigation Configuration
 * Single source of truth for all pages in the application
 */

export const pages = {
  // Top-level pages
  'Configuration': {
    id: 'Configuration',
    label: 'Configuration',
    parent: null,
    icon: 'FcDataConfiguration',
    group: 'main',
    hasSubmenu: true,
    path: null // No direct navigation - only toggles submenu
  },

  // Configuration submenu pages
  'General': {
    id: 'General',
    label: 'General',
    parent: 'Configuration',
    icon: 'MdBuild',
    group: 'config',
    sectionKey: 'general'
  },
  'Athlete': {
    id: 'Athlete',
    label: 'Athlete',
    parent: 'Configuration',
    icon: 'MdPerson',
    group: 'config',
    sectionKey: 'athlete'
  },
  'Appearance': {
    id: 'Appearance',
    label: 'Appearance',
    parent: 'Configuration',
    icon: 'MdPalette',
    group: 'config',
    sectionKey: 'appearance'
  },
  'Import': {
    id: 'Import',
    label: 'Import',
    parent: 'Configuration',
    icon: 'MdFileDownload',
    group: 'config',
    sectionKey: 'import'
  },
  'Metrics': {
    id: 'Metrics',
    label: 'Metrics',
    parent: 'Configuration',
    icon: 'MdBarChart',
    group: 'config',
    sectionKey: 'metrics'
  },
  'Gear': {
    id: 'Gear',
    label: 'Gear',
    parent: 'Configuration',
    icon: 'MdDirectionsBike',
    group: 'config',
    sectionKey: 'gear'
  },
  'Zwift': {
    id: 'Zwift',
    label: 'Zwift',
    parent: 'Configuration',
    icon: 'TbBrandZwift',
    group: 'config',
    sectionKey: 'zwift'
  },
  'Integrations': {
    id: 'Integrations',
    label: 'Integrations',
    parent: 'Configuration',
    icon: 'MdLink',
    group: 'config',
    sectionKey: 'integrations'
  },
  'Scheduling Daemon': {
    id: 'Scheduling Daemon',
    label: 'Scheduling Daemon',
    parent: 'Configuration',
    icon: 'MdSchedule',
    group: 'config',
    sectionKey: 'daemon'
  },

  // Utilities parent menu
  'Utilities': {
    id: 'Utilities',
    label: 'Utilities',
    parent: null,
    icon: 'MdConstruction',
    group: 'tools',
    hasSubmenu: true,
    path: null // No direct navigation - only toggles submenu
  },

  // Standalone pages (Utilities submenu)
  'Gear Maintenance': {
    id: 'Gear Maintenance',
    label: 'Gear Maintenance',
    parent: 'Utilities',
    icon: 'MdConstruction',
    group: 'tools'
  },
  'YAML Utility': {
    id: 'YAML Utility',
    label: 'YAML Utility',
    parent: 'Utilities',
    icon: 'SiYaml',
    group: 'tools'
  },

  // Documentation pages
  'Documentation': {
    id: 'Documentation',
    label: 'Documentation',
    parent: null,
    icon: 'MdHelp',
    group: 'help',
    hasSubmenu: true
  },
  'Overview': {
    id: 'Overview',
    label: 'Overview',
    parent: 'Documentation',
    group: 'help',
    helpFile: 'overview.md'
  },
'Authentication Help': {
    id: 'Authentication Help',
    label: 'Authentication',
    parent: 'Documentation',
    group: 'help',
    helpFile: 'authentication.md'
  },
  'Dashboard Editor Help': {
    id: 'Dashboard Editor Help',
    label: 'Dashboard Editor',
    parent: 'Documentation',
    group: 'help',
    helpFile: 'dashboard-editor.md'
  },
  'Sports List Editor Help': {
    id: 'Sports List Editor Help',
    label: 'Sports List Editor',
    parent: 'Documentation',
    group: 'help',
    helpFile: 'sports-list-editor.md'
  },
  'Widget Definitions Help': {
    id: 'Widget Definitions Help',
    label: 'Widget Definitions',
    parent: 'Documentation',
    group: 'help',
    helpFile: 'widget-definitions.md'
  },
  'Settings Management Help': {
    id: 'Settings Management Help',
    label: 'Settings Management',
    parent: 'Documentation',
    group: 'help',
    helpFile: 'settings-management.md'
  },
  'Configuration Examples Help': {
    id: 'Configuration Examples Help',
    label: 'Configuration Examples',
    parent: 'Documentation',
    group: 'help',
    helpFile: 'configuration-examples.md'
  }
};

/**
 * Helper functions
 */

export const getPage = (pageId) => pages[pageId];

export const getChildren = (parentId) =>
  Object.values(pages).filter(page => page.parent === parentId);

export const getPagesByGroup = (group) =>
  Object.values(pages).filter(page => page.group === group);

export const buildBreadcrumbs = (pageId) => {
  const breadcrumbs = [];
  let currentPage = pages[pageId];

  while (currentPage) {
    breadcrumbs.unshift(currentPage.id);
    currentPage = currentPage.parent ? pages[currentPage.parent] : null;
  }

  return breadcrumbs;
};

export const getParent = (pageId) => {
  const page = pages[pageId];
  return page?.parent ? pages[page.parent] : null;
};
