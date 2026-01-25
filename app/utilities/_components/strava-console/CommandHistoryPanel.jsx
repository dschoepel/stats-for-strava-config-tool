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
  MdVisibility,
  MdFolder,
  MdWarning,
  MdClear
} from 'react-icons/md';
import LogManagementDialog from './LogManagementDialog';
import { ConfirmDialog } from '../../../../src/components/ui/ConfirmDialog';

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
        px={{ base: 3, sm: 4 }}
        py={3}
        _hover={{ bg: 'panelBg' }}
        transition="background 0.2s"
      >
        <Flex justify="space-between" align={{ base: "stretch", sm: "flex-start" }} direction={{ base: "column", sm: "row" }} gap={{ base: 3, sm: 4 }}>
          <VStack align="flex-start" gap={1} flex={1} minW={0}>
            <HStack gap={2} flexWrap="wrap">
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
              {item.isHistorical && (
                <Badge colorPalette="gray" variant="subtle" size="xs">
                  Previous Session
                </Badge>
              )}
              {!item.isHistorical && !item.logPath && item.status !== 'running' && (
                <Badge colorPalette="orange" variant="subtle" size="xs">
                  <HStack gap={1}>
                    <Icon as={MdWarning} boxSize={3} />
                    <Text>No Log File</Text>
                  </HStack>
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" color="textMuted" fontFamily="mono" overflow="hidden" textOverflow="ellipsis" whiteSpace={{ base: "normal", sm: "nowrap" }} wordBreak={{ base: "break-word", sm: "normal" }}>
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

          <HStack gap={1} flexShrink={0} w={{ base: "100%", sm: "auto" }} justify={{ base: "flex-end", sm: "flex-start" }}>
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
              <Text display={{ base: "none", sm: "inline" }} ml={1}>Rerun</Text>
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
            mx={{ base: 3, sm: 4 }}
            mb={3}
            p={3}
            bg="gray.900"
            borderRadius="md"
            border="1px solid"
            borderColor="border"
            maxH={{ base: "150px", sm: "200px" }}
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
  const [showLogManager, setShowLogManager] = useState(false);
  const [showClearBrowserHistory, setShowClearBrowserHistory] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Count session vs historical items
  const sessionCount = history.filter(item => !item.isHistorical).length;
  const historicalCount = history.filter(item => item.isHistorical).length;

  const handleClearBrowserHistory = useCallback(async () => {
    setIsClearing(true);
    try {
      // Call API to clear localStorage
      const response = await fetch('/api/console-history', {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        // Clear localStorage on client side
        localStorage.removeItem('strava-console-history');
        
        // Clear session history (will trigger parent to reload)
        if (onClear) {
          onClear();
        }
        
        setShowClearBrowserHistory(false);
      } else {
        console.error('Failed to clear browser history:', data.message);
      }
    } catch (error) {
      console.error('Error clearing browser history:', error);
    } finally {
      setIsClearing(false);
    }
  }, [onClear]);

  if (history.length === 0) {
    return (
      <>
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLogManager(true)}
              colorScheme="blue"
              mt={2}
            >
              <Icon as={MdFolder} mr={2} />
              Manage Command Logs
            </Button>
          </VStack>
        </Box>
        <LogManagementDialog
          isOpen={showLogManager}
          onClose={() => setShowLogManager(false)}
        />
      </>
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
        px={{ base: 3, sm: 4 }}
        py={3}
        bg="panelBg"
        borderBottom="1px solid"
        borderColor="border"
        justify="space-between"
        align={{ base: "flex-start", sm: "center" }}
        direction={{ base: "column", sm: "row" }}
        gap={{ base: 2, sm: 0 }}
      >
        <HStack gap={2}>
          <Icon as={MdHistory} color="text" boxSize={{ base: 4, sm: 5 }} />
          <Text fontSize="sm" fontWeight="medium" color="text">
            Command History
          </Text>
          <Badge colorPalette="gray" variant="subtle" size="sm">
            {history.length}
          </Badge>
          {sessionCount > 0 && (
            <Badge colorPalette="blue" variant="subtle" size="sm">
              {sessionCount} session
            </Badge>
          )}
          {historicalCount > 0 && (
            <Badge colorPalette="purple" variant="subtle" size="sm">
              {historicalCount} historical
            </Badge>
          )}
        </HStack>
        <HStack gap={2} w={{ base: "100%", sm: "auto" }}>
          {sessionCount > 0 && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => setShowClearBrowserHistory(true)}
              color="text"
              borderColor="border"
              w={{ base: "auto", sm: "auto" }}
              title="Clear browser history (localStorage only, keeps log files)"
            >
              <Icon as={MdClear} />
              <Text display={{ base: "none", sm: "inline" }} ml={1}>Clear Browser History</Text>
            </Button>
          )}
          <Button
            size="xs"
            variant="outline"
            onClick={() => setShowLogManager(true)}
            color="text"
            borderColor="border"
            w={{ base: "50%", sm: "auto" }}
          >
            <Icon as={MdFolder} />
            <Text display={{ base: "none", sm: "inline" }} ml={1}>Manage Logs</Text>
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={onClear}
            color="text"
            w={{ base: "50%", sm: "auto" }}
            title="Clear current session history (keeps previous sessions)"
          >
            <Icon as={MdDelete} />
            <Text display={{ base: "none", sm: "inline" }} ml={1}>Clear Session</Text>
          </Button>
        </HStack>
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

      {/* Log Management Dialog */}
      <LogManagementDialog
        isOpen={showLogManager}
        onClose={() => setShowLogManager(false)}
      />

      {/* Clear Browser History Dialog */}
      <ConfirmDialog
        isOpen={showClearBrowserHistory}
        onClose={() => setShowClearBrowserHistory(false)}
        onConfirm={handleClearBrowserHistory}
        title="Clear Browser History?"
        message={`This will remove ${sessionCount} command(s) from browser storage (localStorage). Historical commands from log files will be preserved and remain visible.`}
        confirmText="Clear History"
        cancelText="Cancel"
        confirmColorPalette="orange"
        isLoading={isClearing}
      />
    </Box>
  );
}
