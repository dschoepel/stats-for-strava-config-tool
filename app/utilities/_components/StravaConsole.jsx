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
  NativeSelectField,
  Input
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
  MdHelp,
  MdSearch,
  MdVerticalAlignBottom
} from 'react-icons/md';
import StravaConsoleTerminal from './strava-console/StravaConsoleTerminal';
import CommandHistoryPanel from './strava-console/CommandHistoryPanel';
import DiscoverCommandsDialog from './strava-console/DiscoverCommandsDialog';
import { useStravaConsole } from './hooks/useStravaConsole';
import { useCommandHistory } from './hooks/useCommandHistory';

/**
 * Format elapsed milliseconds as H:MM:SS or M:SS
 */
function formatElapsedTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function StravaConsole() {
  const searchParams = useSearchParams();
  const terminalRef = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const [terminalReady, setTerminalReady] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [args, setArgs] = useState('');
  const [argsError, setArgsError] = useState('');

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
    checkRunnerHealth,
    // Connection state
    connectionState,
    // Elapsed time
    elapsedMs,
    // Auto-scroll
    setAutoScroll: hookSetAutoScroll,
    // Discovery
    isDiscovering,
    discoveredCommands,
    discoverError,
    discoverCommands,
    clearDiscovered
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

    // Validate args if command requires them
    if (selectedCommand.acceptsArgs && !args.trim()) {
      setArgsError('This command requires arguments');
      return;
    }

    // Clear any previous args error
    setArgsError('');

    // Parse args string into array (split by spaces, preserve quoted strings)
    const argsArray = args.trim() ? args.trim().split(/\s+/) : [];

    const historyId = addToHistory(selectedCommand.command, selectedCommand.name, argsArray);

    const result = await runCommand(argsArray, (res) => {
      updateStatus(
        historyId,
        res.success ? 'success' : 'failed',
        res.logPath,
        res.exitCode
      );
    });

    return result;
  }, [selectedCommand, args, addToHistory, runCommand, updateStatus]);

  // Handle download log
  const handleDownload = useCallback(() => {
    if (lastLogPath) {
      window.open(`/api/download-log?path=${encodeURIComponent(lastLogPath)}`, '_blank');
    }
  }, [lastLogPath]);

  // Handle rerun from history
  const handleRerun = useCallback((command, historyArgs) => {
    const matchingCmd = commands.find(cmd => cmd.command === command);
    if (matchingCmd) {
      selectCommand(matchingCmd.id);
      // Restore args from history
      if (historyArgs && historyArgs.length > 0) {
        setArgs(historyArgs.join(' '));
      }
    }
  }, [commands, selectCommand]);

  // Handle auto-scroll toggle
  const handleAutoScrollToggle = useCallback(() => {
    const newVal = !autoScroll;
    setAutoScroll(newVal);
    hookSetAutoScroll(newVal);
  }, [autoScroll, hookSetAutoScroll]);

  // Handle discover
  const handleDiscover = useCallback(() => {
    discoverCommands();
  }, [discoverCommands]);

  // Save commands to API
  const saveCommands = useCallback(async (commandsList) => {
    try {
      const defaultPath = '/data/config/';
      await fetch('/api/console-commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: commandsList, defaultPath })
      });
    } catch (err) {
      console.error('Failed to save commands:', err);
    }
  }, []);

  // Handle merge discovered commands
  const handleMergeCommands = useCallback(async (newCommands) => {
    // Merge: keep existing, add new
    const existingIds = new Set(commands.map(cmd => cmd.id));
    const merged = [...commands];
    for (const [id, entry] of Object.entries(newCommands)) {
      if (!existingIds.has(id)) {
        merged.push({
          id,
          name: entry.name || id,
          command: entry.command[2],
          description: entry.description || '',
          acceptsArgs: entry.acceptsArgs || false,
          argsDescription: entry.argsDescription || '',
          argsPlaceholder: entry.argsPlaceholder || ''
        });
      }
    }
    await saveCommands(merged);
    clearDiscovered();
    reloadCommands();
  }, [commands, clearDiscovered, reloadCommands, saveCommands]);

  // Handle overwrite with discovered commands
  const handleOverwriteCommands = useCallback(async (newCommands) => {
    const commandsList = Object.entries(newCommands).map(([id, entry]) => ({
      id,
      name: entry.name || id,
      command: entry.command[2],
      description: entry.description || '',
      acceptsArgs: entry.acceptsArgs || false,
      argsDescription: entry.argsDescription || '',
      argsPlaceholder: entry.argsPlaceholder || ''
    }));
    await saveCommands(commandsList);
    clearDiscovered();
    reloadCommands();
  }, [clearDiscovered, reloadCommands, saveCommands]);

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

  return (
    <Box p={{ base: 3, sm: 4, md: 6 }} minH="100vh" bg="bg">
      {/* Warning Banner - Command Running */}
      {isRunning && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bg="orange.500"
          color="white"
          py={2}
          px={{ base: 2, sm: 4 }}
          textAlign="center"
          zIndex={9999}
          fontWeight="bold"
          boxShadow="lg"
        >
          <HStack justify="center" gap={{ base: 1, sm: 2 }}>
            <Icon as={MdWarning} boxSize={{ base: 4, sm: 5 }} />
            <Text fontSize={{ base: "xs", sm: "sm" }} display={{ base: "none", sm: "block" }}>
              Command Running - Do Not Close This Page or Navigate Away
            </Text>
            <Text fontSize="xs" display={{ base: "block", sm: "none" }}>
              Command Running - Don't Navigate Away
            </Text>
            <Icon as={MdWarning} boxSize={{ base: 4, sm: 5 }} />
          </HStack>
        </Box>
      )}

      <VStack align="stretch" gap={{ base: 4, sm: 5, md: 6 }} maxW="1400px" mx="auto" mt={isRunning ? 12 : 0}>
        {/* Header */}
        <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} direction={{ base: "column", sm: "row" }} wrap="wrap" gap={4}>
          <HStack gap={{ base: 2, sm: 3 }}>
            <Icon as={MdTerminal} boxSize={{ base: 6, sm: 7 }} color="primary" />
            <Heading as="h2" size={{ base: "md", sm: "lg", md: "xl" }} color="text">
              Statistics for Strava Console
            </Heading>
          </HStack>
          <HStack gap={2} flexWrap="wrap" w={{ base: "100%", sm: "auto" }}>
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
              w={{ base: "100%", sm: "auto" }}
            >
              <Icon as={showHistory ? MdExpandLess : MdExpandMore} mr={2} />
              <Text display={{ base: "none", sm: "inline" }}>
                {showHistory ? 'Hide History' : 'Show History'}
              </Text>
              <Text display={{ base: "inline", sm: "none" }}>
                History
              </Text>
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
          p={{ base: 4, sm: 5 }}
          bg="cardBg"
          borderRadius="lg"
          border="1px solid"
          borderColor="border"
        >
          <VStack align="stretch" gap={3}>
            {/* Command Row with Buttons */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                Command
              </Text>
              {isLoadingCommands ? (
                <HStack gap={2} h="40px" align="center">
                  <Spinner size="sm" color="primary" />
                  <Text fontSize="sm" color="textMuted">Loading commands...</Text>
                </HStack>
              ) : (
                <Flex gap={2} wrap="wrap" align="center">
                  <Box flex="1" minW={{ base: "100%", sm: "200px" }}>
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
                  </Box>

                  {/* Action Buttons */}
                  {!isRunning ? (
                    <Button
                      colorPalette="green"
                      onClick={handleRun}
                      disabled={!selectedCommand || !terminalReady || runnerStatus !== 'online'}
                      size="sm"
                      title="Run command"
                    >
                      <Icon as={MdPlayArrow} />
                      <Text display={{ base: "none", sm: "inline" }} ml={1}>Run</Text>
                    </Button>
                  ) : (
                    <Button
                      colorPalette="red"
                      onClick={stopCommand}
                      size="sm"
                      title="Stop command"
                    >
                      <Icon as={MdStop} />
                      <Text display={{ base: "none", sm: "inline" }} ml={1}>Stop</Text>
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
                    <Text display={{ base: "none", sm: "inline" }} ml={1}>Reload</Text>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscover}
                    disabled={isRunning || isDiscovering || runnerStatus !== 'online'}
                    title="Discover commands from the Strava container"
                    color="text"
                    borderColor="border"
                  >
                    {isDiscovering ? <Spinner size="xs" /> : <Icon as={MdSearch} />}
                    <Text display={{ base: "none", sm: "inline" }} ml={1}>Discover</Text>
                  </Button>
                </Flex>
              )}
            </Box>

            {/* Command Info */}
            {selectedCommand && (
              <Box 
                p={3} 
                bg="gray.50" 
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }} 
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              >
                <VStack align="stretch" gap={1}>
                  <Text fontSize="xs" color="gray.700" _dark={{ color: 'gray.200' }}>
                    {selectedCommand.description}
                  </Text>
                  <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }} fontFamily="mono" wordBreak="break-word">
                    php bin/console {selectedCommand.command}
                  </Text>
                </VStack>
              </Box>
            )}

            {/* Arguments Input - Show when command accepts args */}
            {selectedCommand?.acceptsArgs && (
              <Box mt={3}>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Arguments {selectedCommand.argsDescription && (
                    <Text as="span" fontWeight="normal" color="textMuted">
                      — {selectedCommand.argsDescription}
                    </Text>
                  )}
                </Text>
                <VStack align="stretch" gap={2}>
                  <Input
                    value={args}
                    onChange={(e) => {
                      setArgs(e.target.value);
                      setArgsError('');
                    }}
                    placeholder={selectedCommand.argsPlaceholder || 'Enter arguments'}
                    disabled={isRunning}
                    fontFamily="mono"
                    fontSize="sm"
                    borderColor={argsError ? 'red.500' : 'border'}
                    _focus={{
                      borderColor: argsError ? 'red.500' : 'blue.500',
                      boxShadow: argsError ? '0 0 0 1px var(--chakra-colors-red-500)' : '0 0 0 1px var(--chakra-colors-blue-500)'
                    }}
                  />
                  {argsError && (
                    <Text fontSize="sm" color="red.500">
                      {argsError}
                    </Text>
                  )}
                </VStack>
              </Box>
            )}
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
              {/* Connection State Badges */}
              {connectionState === 'running' && (
                <Badge colorPalette="green" variant="solid" size="sm">
                  <HStack gap={1}>
                    <Spinner size="xs" />
                    <Text>Running</Text>
                  </HStack>
                </Badge>
              )}
              {connectionState === 'streaming' && (
                <Badge colorPalette="blue" variant="solid" size="sm">
                  <HStack gap={1}>
                    <Spinner size="xs" />
                    <Text>Streaming</Text>
                  </HStack>
                </Badge>
              )}
              {connectionState === 'completed' && (
                <Badge colorPalette="green" variant="subtle" size="sm">
                  Completed
                </Badge>
              )}
              {connectionState === 'error' && (
                <Badge colorPalette="red" variant="subtle" size="sm">
                  Error
                </Badge>
              )}
              {connectionState === 'disconnected' && (
                <Badge colorPalette="orange" variant="subtle" size="sm">
                  Disconnected
                </Badge>
              )}
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
                onClick={handleAutoScrollToggle}
                title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
              >
                <Icon as={MdVerticalAlignBottom} />
                <Text display={{ base: "none", sm: "inline" }} ml={1}>Auto-scroll</Text>
              </Button>
              {lastLogPath && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleDownload}
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
                onClick={clearTerminal}
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

        {/* Discover Commands Dialog */}
        {discoveredCommands && (
          <DiscoverCommandsDialog
            commands={discoveredCommands}
            existingCommands={commands}
            onMerge={handleMergeCommands}
            onOverwrite={handleOverwriteCommands}
            onClose={clearDiscovered}
            error={discoverError}
          />
        )}
      </VStack>
    </Box>
  );
}
