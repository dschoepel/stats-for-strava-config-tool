'use client';

import { Box, Flex, VStack, Text, Button, Icon } from '@chakra-ui/react';
import { MdWarning, MdRefresh } from 'react-icons/md';

/**
 * Alert box displayed when the Strava Runner sidecar is offline
 * @param {Object} props
 * @param {Function} props.onRetry - Callback to retry connection
 */
export default function RunnerOfflineAlert({ onRetry }) {
  return (
    <Box
      p={4}
      bg="orange.50"
      borderRadius="md"
      border="1px solid"
      borderColor="orange.200"
      _dark={{ bg: 'rgba(251, 146, 60, 0.1)', borderColor: 'orange.700' }}
    >
      <Flex gap={3} align="flex-start">
        <Icon as={MdWarning} color="orange.500" boxSize={5} mt={0.5} />
        <VStack align="start" gap={1} flex={1}>
          <Text fontWeight="medium" color="orange.700" _dark={{ color: 'orange.200' }}>
            Strava Runner Offline
          </Text>
          <Text fontSize="sm" color="orange.600" _dark={{ color: 'orange.300' }}>
            The Strava Runner sidecar is not responding. Make sure it's enabled in your
            docker-compose.yml and running. The Run button is disabled until the runner is available.
          </Text>
        </VStack>
        <Button
          size="sm"
          variant="outline"
          colorPalette="orange"
          onClick={onRetry}
        >
          <Icon as={MdRefresh} mr={1} />
          Retry
        </Button>
      </Flex>
    </Box>
  );
}
