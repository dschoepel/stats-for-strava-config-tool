'use client'

import { lazy, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, VStack, Spinner, Text } from '@chakra-ui/react'
import { useConfig } from '../../../src/state/ConfigProvider'
import { useDirtyState } from '../../../src/state/DirtyStateProvider'

// Lazy-load the editor
const IntegrationsConfigEditor = lazy(() =>
  import('../_components/IntegrationsConfigEditor')
)

export default function IntegrationsPage() {
  const router = useRouter()
  const { sectionData, saveSectionData, isLoadingSectionData, loadSectionData, sectionToFileMap } = useConfig()
  const { setHasUnsavedChanges, checkAndConfirmNavigation } = useDirtyState()

  // Load section data if not already loaded
  useEffect(() => {
    if (sectionToFileMap.size > 0 && !sectionData.integrations) {
      loadSectionData('Integrations')
    }
  }, [sectionToFileMap, sectionData.integrations, loadSectionData])

  const handleSave = (data) => saveSectionData('integrations', data)
  const handleCancel = () => {
    checkAndConfirmNavigation(() => {
      router.push('/')
    })
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <IntegrationsConfigEditor
        key={JSON.stringify(sectionData.integrations)}
        initialData={sectionData.integrations || {}}
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
        <Text color="textMuted">Loading Integrations configuration...</Text>
      </VStack>
    </Box>
  )
}
