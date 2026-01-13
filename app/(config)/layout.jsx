'use client'

import AppShell from '../_components/layout/AppShell'

export default function ConfigLayout({ children }) {
  return (
    <AppShell section="config">
      {children}
    </AppShell>
  )
}
