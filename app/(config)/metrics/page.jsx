'use client'

import { lazy, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, VStack, Spinner, Text } from '@chakra-ui/react'
import { useConfig } from '../../../src/state/useConfig'
import { useDirtyState } from '../../../src/state/DirtyStateProvider'

// Lazy-load the editor
const MetricsConfigEditor = lazy(() =>
  import('../_components/MetricsConfigEditor')
)

export default function MetricsPage() {
  const router = useRouter()
  const { sectionData, saveSectionData, isLoadingSectionData, loadSectionData, sectionToFileMap } = useConfig()
  const { setHasUnsavedChanges, checkAndConfirmNavigation } = useDirtyState()

  // Load section data if not already loaded
  useEffect(() => {
    if (sectionToFileMap.size > 0 && !sectionData.metrics) {
      loadSectionData('Metrics')
    }
  }, [sectionToFileMap, sectionData.metrics, loadSectionData])

  const handleSave = (data) => saveSectionData('metrics', data)
  const handleCancel = () => {
    checkAndConfirmNavigation(() => {
      router.push('/')
    })
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <MetricsConfigEditor
        key={JSON.stringify(sectionData.metrics)}
        initialData={sectionData.metrics || {}}
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
        <Text color="textMuted">Loading Metrics configuration...</Text>
      </VStack>
    </Box>
  )
}
