'use client';

import { useState, useEffect } from 'react';
import { Box, Flex, Spinner, Text } from '@chakra-ui/react';

/**
 * ClientOnly component - prevents hydration mismatches by only rendering children on client
 * Shows a loading state during SSR and initial hydration
 */
export function ClientOnly({ children }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // During SSR and initial client render, show loading state
  if (!hasMounted) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        h="100vh"
        w="100vw"
        bg="bg"
        color="text"
      >
        <Spinner size="xl" color="primary" thickness="4px" />
        <Text mt={4} fontSize="lg" color="textMuted">
          Loading Stats for Strava Config Tool...
        </Text>
      </Flex>
    );
  }

  // After mounting on client, render children
  return <>{children}</>;
}
