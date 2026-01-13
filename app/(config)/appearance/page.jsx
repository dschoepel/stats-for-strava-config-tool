'use client'

import { lazy, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, VStack, Spinner, Text } from '@chakra-ui/react'
import { useConfig } from '../../../src/state/ConfigProvider'
import { useDirtyState } from '../../../src/state/DirtyStateProvider'
import { useNavigation } from '../../../src/state/NavigationProvider'

// Lazy-load the editor
const AppearanceConfigEditor = lazy(() =>
  import('../_components/AppearanceConfigEditor')
)

export default function AppearancePage() {
  const router = useRouter()
  const { sectionData, saveSectionData, isLoadingSectionData, loadSectionData, sectionToFileMap } = useConfig()
  const { setHasUnsavedChanges, checkAndConfirmNavigation } = useDirtyState()
  const { navigateTo } = useNavigation()

  // Sync navigation state for breadcrumbs
  useEffect(() => {
    navigateTo('Appearance', null, true) // skipUnsavedCheck = true
  }, [navigateTo])

  // Load section data if not already loaded
  useEffect(() => {
    if (sectionToFileMap.size > 0 && !sectionData.appearance) {
      loadSectionData('Appearance')
    }
  }, [sectionToFileMap, sectionData.appearance, loadSectionData])

  const handleSave = (data) => saveSectionData('appearance', data)
  const handleCancel = () => {
    checkAndConfirmNavigation(() => {
      router.push('/')
    })
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AppearanceConfigEditor
        key={JSON.stringify(sectionData.appearance)}
        initialData={sectionData.appearance || {}}
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
        <Text color="textMuted">Loading Appearance configuration...</Text>
      </VStack>
    </Box>
  )
}
