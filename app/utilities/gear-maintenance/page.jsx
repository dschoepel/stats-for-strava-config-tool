'use client'

import { lazy, Suspense, useEffect } from 'react'
import { Box, VStack, Spinner, Text } from '@chakra-ui/react'
import { useNavigation } from '../../../src/state/NavigationProvider'
import { useDirtyState } from '../../../src/state/DirtyStateProvider'

// Lazy-load the editor
const GearMaintenanceEditor = lazy(() =>
  import('../_components/GearMaintenanceEditor')
)

export default function GearMaintenancePage() {
  const { navigateTo } = useNavigation()
  const { setHasUnsavedChanges } = useDirtyState()

  // Sync navigation state for breadcrumbs
  useEffect(() => {
    navigateTo('Gear Maintenance', null, true) // skipUnsavedCheck = true
  }, [navigateTo])

  return (
    <Suspense fallback={<LoadingFallback />}>
      <GearMaintenanceEditor onDirtyChange={setHasUnsavedChanges} />
    </Suspense>
  )
}

function LoadingFallback() {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="50vh"
    >
      <VStack gap={3}>
        <Spinner size="xl" color="primary" />
        <Text color="textMuted">Loading Gear Maintenance...</Text>
      </VStack>
    </Box>
  )
}
