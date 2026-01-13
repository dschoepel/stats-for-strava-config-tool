'use client'

import { lazy, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, VStack, Spinner, Text } from '@chakra-ui/react'
import { useConfig } from '../../../src/state/ConfigProvider'
import { useDirtyState } from '../../../src/state/DirtyStateProvider'
import { useNavigation } from '../../../src/state/NavigationProvider'

// Lazy-load the editor
const AthleteConfigEditor = lazy(() =>
  import('../../../src/components/config/AthleteConfigEditor')
)

export default function AthletePage() {
  const router = useRouter()
  const { sectionData, saveSectionData, isLoadingSectionData, loadSectionData, sectionToFileMap } = useConfig()
  const { setHasUnsavedChanges, checkAndConfirmNavigation } = useDirtyState()
  const { navigateTo } = useNavigation()

  // Sync navigation state for breadcrumbs
  useEffect(() => {
    navigateTo('Athlete', null, true) // skipUnsavedCheck = true
  }, [navigateTo])

  // Load section data if not already loaded
  useEffect(() => {
    if (sectionToFileMap.size > 0 && !sectionData.athlete) {
      loadSectionData('Athlete')
    }
  }, [sectionToFileMap, sectionData.athlete, loadSectionData])

  const handleSave = (data) => saveSectionData('athlete', data)
  const handleCancel = () => {
    checkAndConfirmNavigation(() => {
      router.push('/')
    })
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AthleteConfigEditor
        key={JSON.stringify(sectionData.athlete)}
        initialData={sectionData.athlete || {}}
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
        <Text color="textMuted">Loading Athlete configuration...</Text>
      </VStack>
    </Box>
  )
}
