'use client';

import { useCallback } from 'react';
import { useRunnerHealth } from './useRunnerHealth';
import { useConsoleCommands } from './useConsoleCommands';
import { useConsoleRunner } from './useConsoleRunner';

/**
 * Custom hook for managing SFS console command execution
 *
 * This is an orchestrator hook that combines:
 * - useRunnerHealth: Health checks, feature flag, status
 * - useConsoleCommands: Command loading, selection, discovery
 * - useConsoleRunner: Execution, SSE streaming, terminal, timer
 *
 * Provides a unified API for the StravaConsole component.
 */
export function useStravaConsole() {
  // Runner health and feature flag
  const {
    runnerStatus,
    lastHealthCheck,
    isFeatureEnabled,
    checkRunnerHealth
  } = useRunnerHealth();

  // Command management
  const {
    commands,
    selectedCommandId,
    selectedCommand,
    isLoadingCommands,
    commandsError,
    isDiscovering,
    discoveredCommands,
    discoverError,
    selectCommand,
    reloadCommands,
    discoverCommands,
    clearDiscovered,
    getSelectedCommand
  } = useConsoleCommands();

  // Command execution
  const {
    isRunning,
    lastLogPath,
    executionError,
    connectionState,
    elapsedMs,
    autoScroll,
    setAutoScroll,
    runCommand: runCommandInternal,
    stopCommand,
    clearTerminal,
    setTerminalRef
  } = useConsoleRunner();

  /**
   * Run the selected command via the Strava Runner sidecar
   * Wraps the internal runCommand to use the selected command from useConsoleCommands
   * @param {Array} args - Command arguments array
   * @param {Function} onComplete - Callback when command completes
   * @returns {Promise<{success: boolean, logPath: string|null, exitCode: number|null}>}
   */
  const runCommand = useCallback(async (args = [], onComplete) => {
    const command = getSelectedCommand();
    return runCommandInternal(command, args, onComplete);
  }, [getSelectedCommand, runCommandInternal]);

  // Combine errors (commands error or execution error)
  const error = commandsError || executionError;

  return {
    // Command state
    commands,
    selectedCommandId,
    selectedCommand,
    isRunning,
    isLoadingCommands,
    lastLogPath,
    error,

    // Health check state
    runnerStatus,
    lastHealthCheck,
    isFeatureEnabled,

    // Connection state
    connectionState,

    // Elapsed time
    elapsedMs,

    // Auto-scroll (state for reactivity, setter for updates)
    autoScroll,
    setAutoScroll,

    // Discovery state
    isDiscovering,
    discoveredCommands,
    discoverError,

    // Actions
    selectCommand,
    runCommand,
    stopCommand,
    clearTerminal,
    setTerminalRef,
    reloadCommands,
    checkRunnerHealth,
    discoverCommands,
    clearDiscovered,

    // Utilities
    getSelectedCommand
  };
}
