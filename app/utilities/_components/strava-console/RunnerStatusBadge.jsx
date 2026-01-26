'use client';

import { Badge, HStack, Icon, Text, Spinner } from '@chakra-ui/react';
import { MdCheckCircle } from 'react-icons/md';

/**
 * Badge showing the Strava Runner connection status
 * @param {Object} props
 * @param {string} props.status - 'online' | 'offline' | 'checking' | 'unknown'
 */
export default function RunnerStatusBadge({ status }) {
  if (status === 'online') {
    return (
      <Badge colorPalette="green" variant="solid" size="sm">
        <HStack gap={1}>
          <Icon as={MdCheckCircle} boxSize={3} />
          <Text>Runner Connected</Text>
        </HStack>
      </Badge>
    );
  }

  if (status === 'checking') {
    return (
      <Badge colorPalette="gray" variant="solid" size="sm">
        <HStack gap={1}>
          <Spinner size="xs" />
          <Text>Checking...</Text>
        </HStack>
      </Badge>
    );
  }

  // Don't render for 'offline' or 'unknown' - those have separate UI
  return null;
}
