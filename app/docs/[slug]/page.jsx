'use client'

import { useParams, notFound } from 'next/navigation'
import MarkdownHelp from '../../../src/components/MarkdownHelp'

// Map slugs to markdown files and page names
const docConfig = {
  'overview': {
    file: 'overview.md',
    pageName: 'Overview'
  },
  'dashboard-editor': {
    file: 'dashboard-editor.md',
    pageName: 'Dashboard Editor Help'
  },
  'sports-list-editor': {
    file: 'sports-list-editor.md',
    pageName: 'Sports List Editor Help'
  },
  'widget-definitions': {
    file: 'widget-definitions.md',
    pageName: 'Widget Definitions Help'
  },
  'settings-management': {
    file: 'settings-management.md',
    pageName: 'Settings Management Help'
  },
  'configuration-examples': {
    file: 'configuration-examples.md',
    pageName: 'Configuration Examples Help'
  }
}

export default function DocPage() {
  const params = useParams()
  const slug = params.slug

  const config = docConfig[slug]

  // 404 for invalid slugs
  if (!config) {
    notFound()
  }

  return <MarkdownHelp filePath={config.file} />
}
