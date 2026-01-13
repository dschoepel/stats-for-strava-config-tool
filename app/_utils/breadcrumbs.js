/**
 * Maps URL pathname to breadcrumb array for navigation
 * @param {string} pathname - Current URL pathname (from usePathname())
 * @returns {Array} Breadcrumb strings (labels only, no hrefs needed)
 */
export function getBreadcrumbsFromPath(pathname) {
  // Remove leading/trailing slashes and split
  const segments = pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);

  // Root path
  if (segments.length === 0) {
    return ['Dashboard'];
  }

  // Map of path segments to breadcrumb labels
  const pathMap = {
    // Config pages
    'general': 'General',
    'athlete': 'Athlete',
    'appearance': 'Appearance',
    'gear': 'Gear',
    'daemon': 'Scheduling Daemon',
    'integrations': 'Integrations',
    'metrics': 'Metrics',
    'zwift': 'Zwift',
    'import': 'Import',

    // Utilities pages
    'utilities': 'Utilities',
    'yaml': 'YAML Utility',
    'gear-maintenance': 'Gear Maintenance',

    // Docs pages
    'docs': 'Documentation',
    'overview': 'Overview',
    'dashboard-editor': 'Dashboard Editor Help',
    'sports-list-editor': 'Sports List Editor Help',
    'widget-definitions': 'Widget Definitions Help',
    'settings-management': 'Settings Management Help',
    'configuration-examples': 'Configuration Examples Help'
  };

  const breadcrumbs = [];

  // Build breadcrumbs from segments
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const label = pathMap[segment];

    if (label) {
      breadcrumbs.push(label);
    } else {
      // Fallback: capitalize segment
      breadcrumbs.push(
        segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      );
    }
  }

  return breadcrumbs;
}
