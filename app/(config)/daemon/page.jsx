'use client'

import { lazy, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, VStack, Spinner, Text } from '@chakra-ui/react'
import { useConfig } from '../../../src/state/useConfig'
import { useDirtyState } from '../../../src/state/DirtyStateProvider'

// Lazy-load the editor
const DaemonConfigEditor = lazy(() =>
  import('../_components/DaemonConfigEditor')
)

export default function DaemonPage() {
  const router = useRouter()
  const { sectionData, saveSectionData, isLoadingSectionData, loadSectionData, sectionToFileMap } = useConfig()
  const { setHasUnsavedChanges, checkAndConfirmNavigation } = useDirtyState()

  // Reload on every navigation to pick up external file edits
  useEffect(() => {
    if (sectionToFileMap.size > 0) {
      loadSectionData('Scheduling Daemon')
    }
  }, [sectionToFileMap, loadSectionData])

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
