'use client';

import { lazy, Suspense } from 'react';
import { Box, VStack, Spinner, Text } from '@chakra-ui/react';

// Lazy-load the StravaConsole component
const StravaConsole = lazy(() => import('../_components/StravaConsole'));

function LoadingFallback() {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minH="50vh">
      <VStack gap={3}>
        <Spinner size="xl" color="primary" />
        <Text color="textMuted">Loading Strava Console...</Text>
      </VStack>
    </Box>
  );
}

export default function StravaConsolePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StravaConsole />
    </Suspense>
  );
}
