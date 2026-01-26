'use client';

import {
  Flex,
  HStack,
  Heading,
  Text,
  Button,
  Icon,
  Badge
} from '@chakra-ui/react';
import { MdTerminal, MdExpandMore, MdExpandLess } from 'react-icons/md';
import RunnerStatusBadge from './RunnerStatusBadge';

/**
 * Header section of the console with title, runner status, and history toggle
 * @param {Object} props
 * @param {string} props.runnerStatus - 'online' | 'offline' | 'checking' | 'unknown'
 * @param {boolean} props.showHistory - Whether history panel is visible
 * @param {Function} props.onToggleHistory - Callback to toggle history panel
 * @param {number} props.historyCount - Number of items in history
 */
export default function ConsoleHeader({
  runnerStatus,
  showHistory,
  onToggleHistory,
  historyCount
}) {
  return (
    <>
      <Flex
        justify="space-between"
        align={{ base: "flex-start", sm: "center" }}
        direction={{ base: "column", sm: "row" }}
        wrap="wrap"
        gap={4}
      >
        <HStack gap={{ base: 2, sm: 3 }}>
          <Icon as={MdTerminal} boxSize={{ base: 6, sm: 7 }} color="primary" />
          <Heading as="h2" size={{ base: "md", sm: "lg", md: "xl" }} color="text">
            Statistics for Strava Console
          </Heading>
        </HStack>
        <HStack gap={2} flexWrap="wrap" w={{ base: "100%", sm: "auto" }}>
          <RunnerStatusBadge status={runnerStatus} />
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleHistory}
            color="text"
            borderColor="border"
            w={{ base: "100%", sm: "auto" }}
          >
            <Icon as={showHistory ? MdExpandLess : MdExpandMore} mr={2} />
            <Text display={{ base: "none", sm: "inline" }}>
              {showHistory ? 'Hide History' : 'Show History'}
            </Text>
            <Text display={{ base: "inline", sm: "none" }}>
              History
            </Text>
            {historyCount > 0 && (
              <Badge ml={2} colorPalette="blue" variant="solid" size="sm">
                {historyCount}
              </Badge>
            )}
          </Button>
        </HStack>
      </Flex>

      <Text color="textMuted" fontSize="md">
        Execute Statistics for Strava console commands and view real-time output.
        Commands run inside the Strava Runner container.
      </Text>
    </>
  );
}
