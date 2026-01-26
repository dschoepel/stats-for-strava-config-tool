'use client';

import { forwardRef } from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Button,
  Icon
} from '@chakra-ui/react';
import {
  MdTerminal,
  MdVerticalAlignBottom,
  MdDownload,
  MdDelete
} from 'react-icons/md';
import ConnectionStateBadge from './ConnectionStateBadge';
import StravaConsoleTerminal from './StravaConsoleTerminal';
import { formatElapsedTime } from './utils/formatters';

/**
 * Terminal panel with header toolbar and output display
 */
const TerminalPanel = forwardRef(function TerminalPanel({
  connectionState,
  isRunning,
  elapsedMs,
  autoScroll,
  lastLogPath,
  onAutoScrollToggle,
  onDownload,
  onClear,
  onTerminalReady
}, ref) {
  return (
    <Box
      bg="cardBg"
      borderRadius="lg"
      border="1px solid"
      borderColor="border"
      overflow="hidden"
    >
      <Flex
        px={{ base: 3, sm: 4 }}
        py={3}
        bg="panelBg"
        borderBottom="1px solid"
        borderColor="border"
        justify="space-between"
        align="center"
        direction={{ base: "column", sm: "row" }}
        gap={{ base: 2, sm: 0 }}
      >
        <HStack gap={2} flexWrap="wrap" w={{ base: "100%", sm: "auto" }}>
          <Icon as={MdTerminal} color="text" />
          <Text fontSize="sm" fontWeight="medium" color="text">
            Terminal Output
          </Text>
          {/* Connection State Badge */}
          <ConnectionStateBadge connectionState={connectionState} />
          {/* Elapsed Time */}
          {isRunning && (
            <Text fontSize="xs" color="textMuted" fontFamily="mono" ml={2}>
              {formatElapsedTime(elapsedMs)}
            </Text>
          )}
        </HStack>
        <HStack gap={2} w={{ base: "100%", sm: "auto" }} justify={{ base: "flex-end", sm: "flex-start" }}>
          {/* Auto-scroll toggle */}
          <Button
            size="xs"
            variant={autoScroll ? 'solid' : 'ghost'}
            colorPalette={autoScroll ? 'blue' : 'gray'}
            onClick={onAutoScrollToggle}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
          >
            <Icon as={MdVerticalAlignBottom} />
            <Text display={{ base: "none", sm: "inline" }} ml={1}>Auto-scroll</Text>
          </Button>
          {lastLogPath && (
            <Button
              size="xs"
              variant="ghost"
              onClick={onDownload}
              color="text"
              title="Download Log"
            >
              <Icon as={MdDownload} />
              <Text display={{ base: "none", sm: "inline" }} ml={1}>Download</Text>
            </Button>
          )}
          <Button
            size="xs"
            variant="ghost"
            onClick={onClear}
            disabled={isRunning}
            color="text"
            title="Clear"
          >
            <Icon as={MdDelete} />
            <Text display={{ base: "none", sm: "inline" }} ml={1}>Clear</Text>
          </Button>
        </HStack>
      </Flex>
      <StravaConsoleTerminal
        ref={ref}
        onReady={onTerminalReady}
      />
    </Box>
  );
});

export default TerminalPanel;
