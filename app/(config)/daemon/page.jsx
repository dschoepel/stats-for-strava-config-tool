'use client'

import { lazy, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, VStack, Spinner, Text } from '@chakra-ui/react'
import { useConfig } from '../../../src/state/ConfigProvider'
import { useDirtyState } from '../../../src/state/DirtyStateProvider'
import { useNavigation } from '../../../src/state/NavigationProvider'

// Lazy-load the editor
const DaemonConfigEditor = lazy(() =>
  import('../../../src/components/config/DaemonConfigEditor')
)

export default function DaemonPage() {
  const router = useRouter()
  const { sectionData, saveSectionData, isLoadingSectionData, loadSectionData, sectionToFileMap } = useConfig()
  const { setHasUnsavedChanges, checkAndConfirmNavigation } = useDirtyState()
  const { navigateTo } = useNavigation()

  // Sync navigation state for breadcrumbs
  useEffect(() => {
    navigateTo('Scheduling Daemon', null, true) // skipUnsavedCheck = true
  }, [navigateTo])

  // Load section data if not already loaded
  useEffect(() => {
    if (sectionToFileMap.size > 0 && !sectionData.daemon) {
      loadSectionData('Scheduling Daemon')
    }
  }, [sectionToFileMap, sectionData.daemon, loadSectionData])

  const handleSave = (data) => saveSectionData('daemon', data)
  const handleCancel = () => {
    checkAndConfirmNavigation(() => {
      router.push('/')
    })
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <DaemonConfigEditor
        key={JSON.stringify(sectionData.daemon)}
        initialData={sectionData.daemon || {}}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoadingSectionData}
        onDirtyChange={setHasUnsavedChanges}
      />
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
        <Text color="textMuted">Loading Scheduling Daemon configuration...</Text>
      </VStack>
    </Box>
  )
}
