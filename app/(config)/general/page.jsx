'use client'

import { lazy, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, VStack, Spinner, Text } from '@chakra-ui/react'
import { useConfig } from '../../../src/state/useConfig'
import { useDirtyState } from '../../../src/state/DirtyStateProvider'

// Lazy-load the editor
const GeneralConfigEditor = lazy(() =>
  import('../_components/GeneralConfigEditor')
)

export default function GeneralPage() {
  const router = useRouter()
  const { sectionData, saveSectionData, isLoadingSectionData, loadSectionData, sectionToFileMap } = useConfig()
  const { setHasUnsavedChanges, checkAndConfirmNavigation } = useDirtyState()

  // Load section data if not already loaded
  useEffect(() => {
    if (sectionToFileMap.size > 0 && !sectionData.general) {
      loadSectionData('General')
    }
  }, [sectionToFileMap, sectionData.general, loadSectionData])

  const handleSave = (data) => saveSectionData('general', data)
  const handleCancel = () => {
    checkAndConfirmNavigation(() => {
      router.push('/')
    })
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <GeneralConfigEditor
        key={JSON.stringify(sectionData.general)}
        initialData={sectionData.general || {}}
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
        <Text color="textMuted">Loading General configuration...</Text>
      </VStack>
    </Box>
  )
}
