'use client'

import AppShell from '../_components/layout/AppShell'

export default function DocsLayout({ children }) {
  return (
    <AppShell section="docs">
      {children}
    </AppShell>
  )
}
