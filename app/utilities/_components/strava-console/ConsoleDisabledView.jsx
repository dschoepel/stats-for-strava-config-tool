'use client';

import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Icon
} from '@chakra-ui/react';
import { MdTerminal, MdHelp } from 'react-icons/md';

/**
 * Displayed when the SFS Console feature is disabled in settings
 */
export default function ConsoleDisabledView() {
  return (
    <Box p={6} minH="100vh" bg="bg">
      <VStack align="stretch" gap={6} maxW="1400px" mx="auto">
        <HStack gap={3}>
          <Icon as={MdTerminal} boxSize={7} color="textMuted" />
          <Heading as="h2" size="xl" color="text">
            SFS Console
          </Heading>
        </HStack>

        <Box
          p={6}
          bg="cardBg"
          borderRadius="lg"
          border="1px solid"
          borderColor="border"
        >
          <VStack gap={4} align="center" py={8}>
            <Icon as={MdTerminal} boxSize={12} color="textMuted" />
            <Heading size="md" color="text">SFS Console is Disabled</Heading>
            <Text color="textMuted" textAlign="center" maxW="500px">
              The SFS Console allows you to execute Statistics for Strava commands
              via the Strava Runner sidecar service.
            </Text>
            <VStack align="start" gap={2} mt={4}>
              <Text color="textMuted" fontWeight="medium">To enable this feature:</Text>
              <Text color="textMuted" fontSize="sm">
                1. Enable the Strava Runner sidecar in your docker-compose.yml
              </Text>
              <Text color="textMuted" fontSize="sm">
                2. Go to Settings and toggle "Enable SFS Console"
              </Text>
            </VStack>
            <HStack gap={3} mt={4}>
              <Button
                as="a"
                href="/docs/sfs-console"
                colorPalette="blue"
                variant="outline"
                size="sm"
              >
                <Icon as={MdHelp} mr={2} />
                View Documentation
              </Button>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
