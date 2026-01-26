'use client';

import { Badge, HStack, Text, Spinner } from '@chakra-ui/react';

const BADGE_CONFIG = {
  running: { colorPalette: 'green', variant: 'solid', label: 'Running', showSpinner: true },
  streaming: { colorPalette: 'blue', variant: 'solid', label: 'Streaming', showSpinner: true },
  completed: { colorPalette: 'green', variant: 'subtle', label: 'Completed', showSpinner: false },
  error: { colorPalette: 'red', variant: 'subtle', label: 'Error', showSpinner: false },
  disconnected: { colorPalette: 'orange', variant: 'subtle', label: 'Disconnected', showSpinner: false }
};

/**
 * Badge showing the current connection/execution state
 * @param {Object} props
 * @param {string} props.connectionState - 'idle' | 'connecting' | 'running' | 'streaming' | 'completed' | 'error' | 'disconnected'
 */
export default function ConnectionStateBadge({ connectionState }) {
  const config = BADGE_CONFIG[connectionState];
  if (!config) return null;

  return (
    <Badge colorPalette={config.colorPalette} variant={config.variant} size="sm">
      {config.showSpinner ? (
        <HStack gap={1}>
          <Spinner size="xs" />
          <Text>{config.label}</Text>
        </HStack>
      ) : (
        config.label
      )}
    </Badge>
  );
}
