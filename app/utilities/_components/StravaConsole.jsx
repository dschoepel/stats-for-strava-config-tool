'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Icon,
  Flex,
  Spinner,
  Badge,
  Collapsible,
  NativeSelectRoot,
  NativeSelectField
} from '@chakra-ui/react';
import {
  MdTerminal,
  MdPlayArrow,
  MdStop,
  MdDownload,
  MdDelete,
  MdHistory,
  MdRefresh,
  MdExpandMore,
  MdExpandLess
} from 'react-icons/md';
import StravaConsoleTerminal from './strava-console/StravaConsoleTerminal';
import CommandHistoryPanel from './strava-console/CommandHistoryPanel';
import { useStravaConsole } from './hooks/useStravaConsole';
import { useCommandHistory } from './hooks/useCommandHistory';

export default function StravaConsole() {
  const searchParams = useSearchParams();
  const terminalRef = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const [terminalReady, setTerminalReady] = useState(false);

  const {
    commands,
    selectedCommandId,
    selectedCommand,
    isRunning,
    isLoadingCommands,
    lastLogPath,
    error,
    selectCommand,
    runCommand,
    stopCommand,
    clearTerminal,
    setTerminalRef,
    reloadCommands
  } = useStravaConsole();

  const {
    history,
    addToHistory,
    updateStatus,
    clearHistory
  } = useCommandHistory();

  // Handle terminal ready
  const handleTerminalReady = useCallback(() => {
    setTerminalReady(true);
    if (terminalRef.current) {
      setTerminalRef(terminalRef.current);
    }
  }, [setTerminalRef]);

  // Pre-select command from URL query param (from notification)
  useEffect(() => {
    const commandParam = searchParams.get('command');
    if (commandParam && commands.length > 0) {
      const matchingCmd = commands.find(cmd => cmd.command === commandParam);
      if (matchingCmd) {
        selectCommand(matchingCmd.id);
      }
    }
  }, [searchParams, commands, selectCommand]);

  // Handle run command
  const handleRun = useCallback(async () => {
    if (!selectedCommand) return;

    const historyId = addToHistory(selectedCommand.command, selectedCommand.name);

    const result = await runCommand((res) => {
      updateStatus(
        historyId,
        res.success ? 'success' : 'failed',
        res.logPath,
        res.exitCode
      );
    });

    return result;
  }, [selectedCommand, addToHistory, runCommand, updateStatus]);

  // Handle download log
  const handleDownload = useCallback(() => {
    if (lastLogPath) {
      window.open(`/api/download-log?path=${encodeURIComponent(lastLogPath)}`, '_blank');
    }
  }, [lastLogPath]);

  // Handle rerun from history
  const handleRerun = useCallback((command) => {
    const matchingCmd = commands.find(cmd => cmd.command === command);
    if (matchingCmd) {
      selectCommand(matchingCmd.id);
    }
  }, [commands, selectCommand]);

  return (
    <Box p={6} minH="100vh" bg="bg">
      <VStack align="stretch" gap={6} maxW="1400px" mx="auto">
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <HStack gap={3}>
            <Icon as={MdTerminal} boxSize={7} color="primary" />
            <Heading as="h2" size="xl" color="text">
              Statistics for Strava Console
            </Heading>
          </HStack>
          <HStack gap={2}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              color="text"
              borderColor="border"
            >
              <Icon as={showHistory ? MdExpandLess : MdExpandMore} mr={2} />
              {showHistory ? 'Hide History' : 'Show History'}
              {history.length > 0 && (
                <Badge ml={2} colorPalette="blue" variant="solid" size="sm">
                  {history.length}
                </Badge>
              )}
            </Button>
          </HStack>
        </Flex>

        <Text color="textMuted" fontSize="md">
          Execute Statistics for Strava console commands and view real-time output. Commands run inside the Docker container.
        </Text>

        {/* Error display */}
        {error && (
          <Box
            p={4}
            bg="red.50"
            _dark={{ bg: 'red.900' }}
            borderRadius="md"
            border="1px solid"
            borderColor="red.200"
            _darkBorder={{ borderColor: 'red.700' }}
          >
            <Text color="red.600" _dark={{ color: 'red.200' }}>
              {error}
            </Text>
          </Box>
        )}

        {/* Command Selection Card */}
        <Box
          p={5}
          bg="cardBg"
          borderRadius="lg"
          border="1px solid"
          borderColor="border"
        >
          <VStack align="stretch" gap={4}>
            <HStack gap={4} flexWrap="wrap" align="flex-end">
              <Box flex="1" minW="250px">
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Command
                </Text>
                {isLoadingCommands ? (
                  <HStack gap={2} h="40px" align="center">
                    <Spinner size="sm" color="primary" />
                    <Text fontSize="sm" color="textMuted">Loading commands...</Text>
                  </HStack>
                ) : (
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={selectedCommandId || ''}
                      onChange={(e) => selectCommand(e.target.value)}
                      disabled={isRunning}
                      placeholder="Select a command"
                    >
                      {commands.map((cmd) => (
                        <option key={cmd.id} value={cmd.id}>
                          {cmd.name}
                        </option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                )}
              </Box>

              {selectedCommand && (
                <Box flex="2" minW="300px">
                  <Text fontSize="sm" color="textMuted">
                    {selectedCommand.description}
                  </Text>
                  <Text fontSize="xs" color="textMuted" fontFamily="mono" mt={1}>
                    docker compose exec app bin/console app:strava:{selectedCommand.command}
                  </Text>
                </Box>
              )}

              <HStack gap={2} flexShrink={0}>
                {!isRunning ? (
                  <Button
                    colorPalette="green"
                    onClick={handleRun}
                    disabled={!selectedCommand || !terminalReady}
                  >
                    <Icon as={MdPlayArrow} mr={2} />
                    Run
                  </Button>
                ) : (
                  <Button
                    colorPalette="red"
                    onClick={stopCommand}
                  >
                    <Icon as={MdStop} mr={2} />
                    Stop
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={reloadCommands}
                  disabled={isRunning}
                  title="Reload commands"
                  color="text"
                  borderColor="border"
                >
                  <Icon as={MdRefresh} />
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </Box>

        {/* Terminal */}
        <Box
          bg="cardBg"
          borderRadius="lg"
          border="1px solid"
          borderColor="border"
          overflow="hidden"
        >
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
              <Icon as={MdTerminal} color="text" />
              <Text fontSize="sm" fontWeight="medium" color="text">
                Terminal Output
              </Text>
              {isRunning && (
                <Badge colorPalette="green" variant="solid" size="sm">
                  Running
                </Badge>
              )}
            </HStack>
            <HStack gap={2}>
              {lastLogPath && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleDownload}
                  color="text"
                >
                  <Icon as={MdDownload} mr={1} />
                  Download Log
                </Button>
              )}
              <Button
                size="xs"
                variant="ghost"
                onClick={clearTerminal}
                disabled={isRunning}
                color="text"
              >
                <Icon as={MdDelete} mr={1} />
                Clear
              </Button>
            </HStack>
          </Flex>
          <StravaConsoleTerminal
            ref={terminalRef}
            onReady={handleTerminalReady}
          />
        </Box>

        {/* Command History Panel */}
        <Collapsible.Root open={showHistory}>
          <Collapsible.Content>
            <CommandHistoryPanel
              history={history}
              onRerun={handleRerun}
              onClear={clearHistory}
            />
          </Collapsible.Content>
        </Collapsible.Root>
      </VStack>
    </Box>
  );
}
