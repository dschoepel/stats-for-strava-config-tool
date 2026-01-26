'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '../../../../src/state/SettingsProvider';

/**
 * Custom hook for managing SFS console command execution
 * Supports streaming SSE output with keep-alive ping filtering,
 * connection state tracking, elapsed timer, auto-scroll, and command discovery.
 */
export function useStravaConsole() {
  const router = useRouter();
  const { settings } = useSettings();
  const [commands, setCommands] = useState([]);
  const [selectedCommandId, setSelectedCommandId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [lastLogPath, setLastLogPath] = useState(null);
  const [error, setError] = useState(null);
  const [isLoadingCommands, setIsLoadingCommands] = useState(true);

  // Health check state for the Strava Runner sidecar
  const [runnerStatus, setRunnerStatus] = useState('unknown'); // 'online', 'offline', 'checking', 'unknown'
  const [lastHealthCheck, setLastHealthCheck] = useState(null);

  // Connection state tracking
  const [connectionState, setConnectionState] = useState('idle');
  // 'idle' | 'connecting' | 'running' | 'streaming' | 'completed' | 'error' | 'disconnected'

  // Elapsed time tracking
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Auto-scroll support (state + ref for reactive updates + internal use)
  const [autoScroll, setAutoScrollState] = useState(true);
  const autoScrollRef = useRef(true);

  // Discovery state
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredCommands, setDiscoveredCommands] = useState(null);
  const [discoverError, setDiscoverError] = useState(null);

  const abortControllerRef = useRef(null);
  const terminalRef = useRef(null);
  const hasReceivedData = useRef(false);
  const mutexErrorDetected = useRef(false);
  const sessionIdRef = useRef(null); // Track current session for stop functionality

  // Check if the SFS Console feature is enabled
  const isFeatureEnabled = settings?.features?.enableSfsConsole ?? false;

  /**
   * Start the elapsed timer
   */
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsedMs(0);
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 1000);
  }, []);

  /**
   * Stop the elapsed timer
   */
  const stopTimer = useCallback(() => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  }, []);

  /**
   * Set auto-scroll state (updates both ref and state for reactivity)
   */
  const setAutoScroll = useCallback((val) => {
    autoScrollRef.current = val;
    setAutoScrollState(val);
  }, []);

  /**
   * Check the health of the Strava Runner sidecar
   */
  const checkRunnerHealth = useCallback(async () => {
    setRunnerStatus('checking');
    try {
      const response = await fetch('/api/strava-console');
      const data = await response.json();

      setRunnerStatus(data.success ? 'online' : 'offline');
      setLastHealthCheck(new Date());
      return data.success;
    } catch (err) {
      console.error('Health check failed:', err);
      setRunnerStatus('offline');
      setLastHealthCheck(new Date());
      return false;
    }
  }, []);

  // Check health on mount and periodically when feature is enabled
  useEffect(() => {
    if (isFeatureEnabled) {
      checkRunnerHealth();
      const interval = setInterval(checkRunnerHealth, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    } else {
      setRunnerStatus('unknown');
    }
  }, [isFeatureEnabled, checkRunnerHealth]);

  // Warn user before leaving page during command execution
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isRunning) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // Some browsers return this message
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRunning]);

  // Block Next.js client-side navigation during command execution
  useEffect(() => {
    if (!isRunning) return;

    // Store original router push/replace to intercept
    const originalPush = router.push;
    const originalReplace = router.replace;
    const originalBack = router.back;

    const confirmNavigation = (action, ...args) => {
      const confirmLeave = window.confirm(
        'A command is currently running. Leaving this page will interrupt the command. Are you sure you want to leave?'
      );
      if (confirmLeave) {
        return action.apply(router, args);
      }
      // Return a rejected promise to prevent navigation
      return Promise.reject(new Error('Navigation cancelled by user'));
    };

    // Override router methods
    router.push = (...args) => confirmNavigation(originalPush, ...args);
    router.replace = (...args) => confirmNavigation(originalReplace, ...args);
    router.back = (...args) => confirmNavigation(originalBack, ...args);

    return () => {
      // Restore original methods
      router.push = originalPush;
      router.replace = originalReplace;
      router.back = originalBack;
    };
  }, [isRunning, router]);

  /**
   * Load available commands from the API
   */
  const loadCommands = useCallback(async () => {
    setIsLoadingCommands(true);
    try {
      const defaultPath = settings?.files?.defaultPath || '/data/config/';
      const response = await fetch(`/api/console-commands?defaultPath=${encodeURIComponent(defaultPath)}`);
      const data = await response.json();

      if (data.success) {
        setCommands(data.commands);
        // Select first command by default if none selected
        if (!selectedCommandId && data.commands.length > 0) {
          setSelectedCommandId(data.commands[0].id);
        }
      } else {
        setError(data.error || 'Failed to load commands');
      }
    } catch (err) {
      console.error('Failed to load commands:', err);
      setError(err.message);
    } finally {
      setIsLoadingCommands(false);
    }
  }, [settings?.files?.defaultPath, selectedCommandId]);

  // Load commands on mount and when settings change
  useEffect(() => {
    loadCommands();
  }, [loadCommands]);

  /**
   * Get the currently selected command object
   */
  const getSelectedCommand = useCallback(() => {
    return commands.find(cmd => cmd.id === selectedCommandId) || null;
  }, [commands, selectedCommandId]);

  /**
   * Set the terminal ref for writing output
   */
  const setTerminalRef = useCallback((ref) => {
    terminalRef.current = ref;
  }, []);

  /**
   * Write text to the terminal with ANSI color codes
   */
  const writeToTerminal = useCallback((text, type = 'stdout') => {
    if (!terminalRef.current) return;

    // Apply ANSI colors based on type
    let coloredText = text;
    switch (type) {
      case 'stderr':
        coloredText = `\x1b[31m${text}\x1b[0m`; // Red
        break;
      case 'info':
        coloredText = `\x1b[36m${text}\x1b[0m`; // Cyan
        break;
      case 'error':
        coloredText = `\x1b[1;31m${text}\x1b[0m`; // Bold Red
        break;
      case 'success':
        coloredText = `\x1b[32m${text}\x1b[0m`; // Green
        break;
      default:
        coloredText = text;
    }

    terminalRef.current.writeln(coloredText);

    // Auto-scroll to bottom if enabled
    if (autoScrollRef.current) {
      terminalRef.current.scrollToBottom?.();
    }
  }, []);

  /**
   * Write mutex error message to terminal (used when command is already running)
   */
  const writeMutexErrorMessage = useCallback(() => {
    writeToTerminal('', 'stdout');
    writeToTerminal('═══════════════════════════════════════════════════════════', 'info');
    writeToTerminal('⚠ COMMAND ALREADY RUNNING', 'error');
    writeToTerminal('═══════════════════════════════════════════════════════════', 'info');
    writeToTerminal('', 'stdout');
    writeToTerminal('This command uses a mutex lock to prevent concurrent execution.', 'info');
    writeToTerminal('The same command is currently running in another process.', 'info');
    writeToTerminal('', 'stdout');
    writeToTerminal('Possible causes:', 'info');
    writeToTerminal('  • The command is still running from a previous execution', 'info');
    writeToTerminal('  • You navigated away while the command was running', 'info');
    writeToTerminal('  • The command is running in another terminal/session', 'info');
    writeToTerminal('', 'stdout');
    writeToTerminal('Please wait for the other instance to complete, or stop it manually.', 'info');
    writeToTerminal('', 'stdout');
    writeToTerminal('═══════════════════════════════════════════════════════════', 'info');
    writeToTerminal('', 'stdout');
  }, [writeToTerminal]);

  /**
   * Run the selected command via the Strava Runner sidecar
   * @param {Array} args - Command arguments array
   * @param {Function} onComplete - Callback when command completes
   * @returns {Promise<{success: boolean, logPath: string|null, exitCode: number|null}>}
   */
  const runCommand = useCallback(async (args = [], onComplete) => {
    const selectedCommand = getSelectedCommand();
    if (!selectedCommand) {
      setError('No command selected');
      return { success: false, logPath: null, exitCode: null };
    }

    if (isRunning) {
      setError('A command is already running');
      return { success: false, logPath: null, exitCode: null };
    }

    setIsRunning(true);
    setError(null);
    setLastLogPath(null);
    setConnectionState('connecting');
    hasReceivedData.current = false;
    mutexErrorDetected.current = false;
    startTimer();

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Clear terminal and show command being executed
      if (terminalRef.current) {
        terminalRef.current.clear();
      }
      const argsDisplay = args.length > 0 ? ` ${args.join(' ')}` : '';
      writeToTerminal(`$ php bin/console ${selectedCommand.command}${argsDisplay}`, 'info');
      writeToTerminal('', 'stdout');

      // Use the strava-console API (Strava Runner sidecar)
      const response = await fetch('/api/strava-console', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: selectedCommand.command,
          args
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute command');
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let result = { success: false, logPath: null, exitCode: null };

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete message in buffer

        for (const line of lines) {
          // Skip SSE comments (keep-alive pings from helper)
          if (line.startsWith(':')) {
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'start':
                  setConnectionState('running');
                  // Capture session ID for stop functionality
                  if (data.data?.sessionId) {
                    sessionIdRef.current = data.data.sessionId;
                  }
                  break;
                case 'stdout':
                  if (!hasReceivedData.current) {
                    hasReceivedData.current = true;
                    setConnectionState('streaming');
                  }
                  // Check for mutex lock error pattern
                  if (!mutexErrorDetected.current &&
                      (data.data.includes('Lock "') && data.data.includes('is already acquired by'))) {
                    mutexErrorDetected.current = true;
                    writeMutexErrorMessage();
                  }
                  writeToTerminal(data.data, 'stdout');
                  break;
                case 'stderr':
                  if (!hasReceivedData.current) {
                    hasReceivedData.current = true;
                    setConnectionState('streaming');
                  }
                  // Check for mutex lock error pattern in stderr too
                  if (!mutexErrorDetected.current &&
                      (data.data.includes('Lock "') && data.data.includes('is already acquired by'))) {
                    mutexErrorDetected.current = true;
                    writeMutexErrorMessage();
                  }
                  writeToTerminal(data.data, 'stderr');
                  break;
                case 'info':
                  writeToTerminal(data.data, 'info');
                  break;
                case 'error':
                  writeToTerminal(data.data?.message || data.data, 'error');
                  setConnectionState('error');
                  break;
                case 'exit':
                  // Runner uses 'exit' event instead of 'complete'
                  result = {
                    success: data.data.code === 0,
                    logPath: data.data.logPath || null,
                    exitCode: data.data.code
                  };
                  
                  // Set log path if provided
                  if (data.data.logPath) {
                    setLastLogPath(data.data.logPath);
                  }

                  // Write completion message
                  writeToTerminal('', 'stdout');
                  if (data.data.code === 0) {
                    writeToTerminal('✓ Command completed successfully', 'success');
                    setConnectionState('completed');
                  } else {
                    writeToTerminal(`✗ Command failed with exit code ${data.data.code}`, 'error');
                    setConnectionState('error');
                  }
                  break;
                case 'complete':
                  // Legacy format from run-strava API
                  result = {
                    success: data.data.success,
                    logPath: data.data.logPath,
                    exitCode: data.data.code
                  };
                  setLastLogPath(data.data.logPath);

                  // Write completion message
                  writeToTerminal('', 'stdout');
                  if (data.data.success) {
                    writeToTerminal('✓ Command completed successfully', 'success');
                    setConnectionState('completed');
                  } else {
                    writeToTerminal(`✗ Command failed with exit code ${data.data.code}`, 'error');
                    setConnectionState('error');
                  }
                  break;
              }
            } catch (parseError) {
              console.error('Failed to parse SSE message:', parseError);
            }
          }
        }
      }

      stopTimer();
      setIsRunning(false);
      sessionIdRef.current = null; // Clear session on completion
      onComplete?.(result);
      return result;

    } catch (err) {
      stopTimer();
      sessionIdRef.current = null; // Clear session on error

      if (err.name === 'AbortError') {
        writeToTerminal('', 'stdout');
        writeToTerminal('Command cancelled by user', 'info');
        setIsRunning(false);
        setConnectionState('idle');
        return { success: false, logPath: null, exitCode: null, cancelled: true };
      }

      console.error('Command execution error:', err);
      setError(err.message);
      writeToTerminal('', 'stdout');
      writeToTerminal(`Error: ${err.message}`, 'error');
      setIsRunning(false);
      setConnectionState('disconnected');
      onComplete?.({ success: false, logPath: null, exitCode: null, error: err.message });
      return { success: false, logPath: null, exitCode: null, error: err.message };
    }
  }, [getSelectedCommand, isRunning, writeToTerminal, startTimer, stopTimer]);

  /**
   * Stop the currently running command
   * Calls the stop API to kill the process in the container, then aborts the SSE stream
   */
  const stopCommand = useCallback(async () => {
    const sessionId = sessionIdRef.current;

    // If we have a session ID, call the stop API to kill the process
    if (sessionId) {
      try {
        const response = await fetch('/api/strava-console/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            writeToTerminal('', 'stdout');
            writeToTerminal('Process terminated by user', 'info');
          }
        }
      } catch (err) {
        console.error('Stop API error:', err);
        // Continue with abort even if stop API fails
      }
    }

    // Always abort the fetch to disconnect the SSE stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear session ID
    sessionIdRef.current = null;
  }, [writeToTerminal]);

  /**
   * Clear the terminal
   */
  const clearTerminal = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.clear();
    }
    setElapsedMs(0);
    setConnectionState('idle');
  }, []);

  /**
   * Select a command by its ID
   */
  const selectCommand = useCallback((commandId) => {
    setSelectedCommandId(commandId);
    setError(null);
  }, []);

  /**
   * Reload the commands list
   */
  const reloadCommands = useCallback(() => {
    loadCommands();
  }, [loadCommands]);

  /**
   * Discover available commands from the target container
   */
  const discoverCommands = useCallback(async () => {
    setIsDiscovering(true);
    setDiscoverError(null);
    try {
      const response = await fetch('/api/strava-console/discover');
      const data = await response.json();
      if (data.success) {
        setDiscoveredCommands(data.commands);
      } else {
        setDiscoverError(data.error || 'Discovery failed');
      }
      return data;
    } catch (err) {
      setDiscoverError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsDiscovering(false);
    }
  }, []);

  /**
   * Clear discovered commands state
   */
  const clearDiscovered = useCallback(() => {
    setDiscoveredCommands(null);
    setDiscoverError(null);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    commands,
    selectedCommandId,
    selectedCommand: getSelectedCommand(),
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
