'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, VStack, Collapsible } from '@chakra-ui/react';
import CommandHistoryPanel from './strava-console/CommandHistoryPanel';
import DiscoverCommandsDialog from './strava-console/DiscoverCommandsDialog';
import ConsoleDisabledView from './strava-console/ConsoleDisabledView';
import WarningBanner from './strava-console/WarningBanner';
import RunnerOfflineAlert from './strava-console/RunnerOfflineAlert';
import ErrorAlert from './strava-console/ErrorAlert';
import ConsoleHeader from './strava-console/ConsoleHeader';
import CommandSelectionCard from './strava-console/CommandSelectionCard';
import TerminalPanel from './strava-console/TerminalPanel';
import ConsoleErrorBoundary from './strava-console/ConsoleErrorBoundary';
import { useStravaConsole } from './hooks/useStravaConsole';
import { useCommandHistory } from './hooks/useCommandHistory';
import { useSettings } from '../../../src/state/SettingsProvider';

export default function StravaConsole() {
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  const terminalRef = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const [terminalReady, setTerminalReady] = useState(false);
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
    autoScroll,
    setAutoScroll,
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
    clearHistory,
    loadHistoricalCommands,
    reloadHistory
  } = useCommandHistory(settings.features?.enableSfsConsole || false);

  // Load historical commands on mount
  useEffect(() => {
    loadHistoricalCommands();
  }, [loadHistoricalCommands]);

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
      // Determine status: stopped takes precedence, then success/failed
      let status = 'failed';
      if (res.stopped) {
        status = 'stopped';
      } else if (res.success) {
        status = 'success';
      }

      updateStatus(
        historyId,
        status,
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
    setAutoScroll(!autoScroll);
  }, [autoScroll, setAutoScroll]);

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
    return <ConsoleDisabledView />;
  }

  return (
    <Box p={{ base: 3, sm: 4, md: 6 }} minH="100vh" bg="bg">
      {/* Warning Banner - Command Running */}
      {isRunning && (
        <WarningBanner
          message="Command Running - Do Not Close This Page or Navigate Away"
          shortMessage="Command Running - Don't Navigate Away"
        />
      )}

      <VStack align="stretch" gap={{ base: 4, sm: 5, md: 6 }} maxW="1400px" mx="auto" mt={isRunning ? 12 : 0}>
        {/* Header */}
        <ConsoleHeader
          runnerStatus={runnerStatus}
          showHistory={showHistory}
          onToggleHistory={() => setShowHistory(!showHistory)}
          historyCount={history.length}
        />

        {/* Runner Offline Warning */}
        {runnerStatus === 'offline' && (
          <RunnerOfflineAlert onRetry={checkRunnerHealth} />
        )}

        {/* Error display */}
        <ErrorAlert message={error} />

        {/* Command Selection Card */}
        <CommandSelectionCard
          commands={commands}
          selectedCommandId={selectedCommandId}
          selectedCommand={selectedCommand}
          isRunning={isRunning}
          isLoadingCommands={isLoadingCommands}
          isDiscovering={isDiscovering}
          runnerStatus={runnerStatus}
          terminalReady={terminalReady}
          args={args}
          argsError={argsError}
          onSelectCommand={selectCommand}
          onRun={handleRun}
          onStop={stopCommand}
          onReload={reloadCommands}
          onDiscover={handleDiscover}
          onArgsChange={setArgs}
          onArgsErrorClear={() => setArgsError('')}
        />

        {/* Terminal */}
        <ConsoleErrorBoundary>
          <TerminalPanel
            ref={terminalRef}
            connectionState={connectionState}
            isRunning={isRunning}
            elapsedMs={elapsedMs}
            autoScroll={autoScroll}
            lastLogPath={lastLogPath}
            onAutoScrollToggle={handleAutoScrollToggle}
            onDownload={handleDownload}
            onClear={clearTerminal}
            onTerminalReady={handleTerminalReady}
          />
        </ConsoleErrorBoundary>

        {/* Command History Panel */}
        <Collapsible.Root open={showHistory}>
          <Collapsible.Content>
            <CommandHistoryPanel
              history={history}
              onRerun={handleRerun}
              onClear={clearHistory}
              onReload={reloadHistory}
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
