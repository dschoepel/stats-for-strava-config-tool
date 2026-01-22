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
  MdRefresh,
  MdExpandMore,
  MdExpandLess,
  MdWarning,
  MdCheckCircle,
  MdHelp
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
    reloadCommands,
    // Health check state
    runnerStatus,
    isFeatureEnabled,
    checkRunnerHealth
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

  // Show disabled state if feature is not enabled
  if (!isFeatureEnabled) {
    return (
      <Box p={6} minH="100vh" bg="bg">
        <VStack align="stretch" gap={6} maxW="1400px" mx="auto">
          <HStack gap={3}>
            <Icon as={MdTerminal} boxSize={7} color="fg.muted" />
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
              <Icon as={MdTerminal} boxSize={12} color="fg.muted" />
              <Heading size="md" color="text">SFS Console is Disabled</Heading>
              <Text color="fg.muted" textAlign="center" maxW="500px">
                The SFS Console allows you to execute Statistics for Strava commands
                via the Strava Runner sidecar service.
              </Text>
              <VStack align="start" gap={2} mt={4}>
                <Text color="fg.muted" fontWeight="medium">To enable this feature:</Text>
                <Text color="fg.muted" fontSize="sm">
                  1. Enable the Strava Runner sidecar in your docker-compose.yml
                </Text>
                <Text color="fg.muted" fontSize="sm">
                  2. Go to Settings and toggle "Enable SFS Console"
                </Text>
              </VStack>
              <HStack gap={3} mt={4}>
                <Button
                  as="a"
                  href="/help/sfs-console"
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
            {/* Runner Status Badge */}
            {runnerStatus === 'online' && (
              <Badge colorPalette="green" variant="solid" size="sm">
                <HStack gap={1}>
                  <Icon as={MdCheckCircle} boxSize={3} />
                  <Text>Runner Connected</Text>
                </HStack>
              </Badge>
            )}
            {runnerStatus === 'checking' && (
              <Badge colorPalette="gray" variant="solid" size="sm">
                <HStack gap={1}>
                  <Spinner size="xs" />
                  <Text>Checking...</Text>
                </HStack>
              </Badge>
            )}
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
          Execute Statistics for Strava console commands and view real-time output.
          Commands run inside the Strava Runner container.
        </Text>

        {/* Runner Offline Warning */}
        {runnerStatus === 'offline' && (
          <Box
            p={4}
            bg="orange.50"
            _dark={{ bg: 'rgba(251, 146, 60, 0.1)' }}
            borderRadius="md"
            border="1px solid"
            borderColor="orange.200"
            _darkBorderColor="orange.700"
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
                onClick={checkRunnerHealth}
              >
                <Icon as={MdRefresh} mr={1} />
                Retry
              </Button>
            </Flex>
          </Box>
        )}

        {/* Error display */}
        {error && (
          <Box
            p={4}
            bg="red.50"
            _dark={{ bg: 'rgba(239, 68, 68, 0.1)' }}
            borderRadius="md"
            border="1px solid"
            borderColor="red.200"
            _darkBorderColor="red.700"
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
                    php bin/console {selectedCommand.command}
                  </Text>
                </Box>
              )}

              <HStack gap={2} flexShrink={0}>
                {!isRunning ? (
                  <Button
                    colorPalette="green"
                    onClick={handleRun}
                    disabled={!selectedCommand || !terminalReady || runnerStatus !== 'online'}
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
