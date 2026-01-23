'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  Flex,
  Collapsible,
  Spinner
} from '@chakra-ui/react';
import {
  MdHistory,
  MdPlayArrow,
  MdDownload,
  MdDelete,
  MdCheckCircle,
  MdError,
  MdSync,
  MdExpandMore,
  MdExpandLess,
  MdVisibility
} from 'react-icons/md';

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / 60000);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Get status badge props
 */
function getStatusBadge(status) {
  switch (status) {
    case 'success':
      return {
        colorPalette: 'green',
        icon: MdCheckCircle,
        label: 'Success'
      };
    case 'failed':
      return {
        colorPalette: 'red',
        icon: MdError,
        label: 'Failed'
      };
    case 'running':
      return {
        colorPalette: 'yellow',
        icon: MdSync,
        label: 'Running'
      };
    default:
      return {
        colorPalette: 'gray',
        icon: null,
        label: status
      };
  }
}

/**
 * Individual history item with expandable log
 */
function HistoryItem({ item, index, totalItems, onRerun }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logContent, setLogContent] = useState(null);
  const [isLoadingLog, setIsLoadingLog] = useState(false);
  const [logError, setLogError] = useState(null);

  const statusBadge = getStatusBadge(item.status);

  const handleViewLog = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    if (!item.logPath) {
      setLogError('No log file available');
      setIsExpanded(true);
      return;
    }

    // If we already have the content, just expand
    if (logContent) {
      setIsExpanded(true);
      return;
    }

    setIsLoadingLog(true);
    setLogError(null);

    try {
      const response = await fetch(`/api/download-log?path=${encodeURIComponent(item.logPath)}&view=true`);
      const data = await response.json();

      if (data.success) {
        setLogContent(data.content);
      } else {
        setLogError(data.error || 'Failed to load log');
      }
    } catch (err) {
      setLogError(err.message || 'Failed to fetch log');
    } finally {
      setIsLoadingLog(false);
      setIsExpanded(true);
    }
  }, [isExpanded, item.logPath, logContent]);

  return (
    <Box
      borderBottom={index < totalItems - 1 ? '1px solid' : 'none'}
      borderColor="border"
    >
      <Box
        px={4}
        py={3}
        _hover={{ bg: 'panelBg' }}
        transition="background 0.2s"
      >
        <Flex justify="space-between" align="flex-start" gap={4}>
          <VStack align="flex-start" gap={1} flex={1}>
            <HStack gap={2}>
              <Text fontWeight="medium" color="text" fontSize="sm">
                {item.commandName}
              </Text>
              <Badge
                colorPalette={statusBadge.colorPalette}
                variant="subtle"
                size="sm"
              >
                <HStack gap={1}>
                  {statusBadge.icon && <Icon as={statusBadge.icon} boxSize={3} />}
                  <Text>{statusBadge.label}</Text>
                </HStack>
              </Badge>
            </HStack>
            <Text fontSize="xs" color="textMuted" fontFamily="mono">
              app:strava:{item.command}
              {item.args && item.args.length > 0 && (
                <Text as="span" color="blue.500" ml={2}>
                  {item.args.join(' ')}
                </Text>
              )}
            </Text>
            <Text fontSize="xs" color="textMuted">{formatRelativeTime(item.timestamp)}
              {item.exitCode !== null && item.exitCode !== 0 && (
                <Text as="span" ml={2} color="red.500">
                  Exit code: {item.exitCode}
                </Text>
              )}
            </Text>
          </VStack>

          <HStack gap={1} flexShrink={0}>
            <Button
              size="xs"
              variant="ghost"
              onClick={handleViewLog}
              title={isExpanded ? 'Hide log' : 'View log'}
              color="text"
              disabled={item.status === 'running'}
            >
              {isLoadingLog ? (
                <Spinner size="xs" />
              ) : (
                <Icon as={isExpanded ? MdExpandLess : MdVisibility} />
              )}
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onRerun(item.command, item.args)}
              title="Run this command again"
              color="text"
              disabled={item.status === 'running'}
            >
              <Icon as={MdPlayArrow} />
            </Button>
            {item.logPath && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  window.open(`/api/download-log?path=${encodeURIComponent(item.logPath)}`, '_blank');
                }}
                title="Download log"
                color="text"
              >
                <Icon as={MdDownload} />
              </Button>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Expandable Log Content */}
      <Collapsible.Root open={isExpanded}>
        <Collapsible.Content>
          <Box
            mx={4}
            mb={3}
            p={3}
            bg="gray.900"
            borderRadius="md"
            border="1px solid"
            borderColor="border"
            maxH="200px"
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'var(--chakra-colors-gray-600)',
                borderRadius: '4px',
              },
            }}
          >
            {logError ? (
              <Text fontSize="xs" color="red.400">
                {logError}
              </Text>
            ) : logContent ? (
              <Text
                fontSize="xs"
                fontFamily="mono"
                color="gray.100"
                whiteSpace="pre-wrap"
                wordBreak="break-all"
              >
                {logContent}
              </Text>
            ) : (
              <Text fontSize="xs" color="textMuted">
                No log content available
              </Text>
            )}
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
}

/**
 * Command History Panel
 * Displays a list of previously run commands with their status
 */
export default function CommandHistoryPanel({ history, onRerun, onClear }) {
  if (history.length === 0) {
    return (
      <Box
        p={6}
        bg="cardBg"
        borderRadius="lg"
        border="1px solid"
        borderColor="border"
      >
        <VStack gap={3}>
          <Icon as={MdHistory} boxSize={8} color="textMuted" />
          <Text color="textMuted" fontSize="sm">
            No command history yet. Run a command to see it here.
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg="cardBg"
      borderRadius="lg"
      border="1px solid"
      borderColor="border"
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        px={4}
        py={3}
        bg="panelBg"
        borderBottom="1px solid"
        borderColor="border"
        justify="space-between"
        align="center"
      >
        <HStack gap={2}>
          <Icon as={MdHistory} color="text" />
          <Text fontSize="sm" fontWeight="medium" color="text">
            Command History
          </Text>
          <Badge colorPalette="gray" variant="subtle" size="sm">
            {history.length}
          </Badge>
        </HStack>
        <Button
          size="xs"
          variant="ghost"
          onClick={onClear}
          color="text"
        >
          <Icon as={MdDelete} mr={1} />
          Clear All
        </Button>
      </Flex>

      {/* History List */}
      <Box maxH="400px" overflowY="auto">
        <VStack gap={0} align="stretch">
          {history.map((item, index) => (
            <HistoryItem
              key={item.id}
              item={item}
              index={index}
              totalItems={history.length}
              onRerun={onRerun}
            />
          ))}
        </VStack>
      </Box>
    </Box>
  );
}
