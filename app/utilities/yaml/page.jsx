'use client'

import { useEffect } from 'react'
import { useNavigation } from '../../../src/state/NavigationProvider'
import YamlUtility from '../_components/YamlUtility'

export default function YamlUtilityPage() {
  const { navigateTo, setBreadcrumbs, breadcrumbs } = useNavigation()

  // Sync navigation state for breadcrumbs
  useEffect(() => {
    navigateTo('YAML Utility', null, true) // skipUnsavedCheck = true
  }, [navigateTo])

  return (
    <YamlUtility
      setBreadcrumbs={setBreadcrumbs}
      breadcrumbs={breadcrumbs}
    />
  )
}
