'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSettings } from '../../../../src/state/SettingsProvider';

/**
 * Custom hook for managing console commands
 * Handles command loading, selection, and discovery from the target container.
 */
export function useConsoleCommands() {
  const { settings } = useSettings();

  const [commands, setCommands] = useState([]);
  const [selectedCommandId, setSelectedCommandId] = useState('');
  const [isLoadingCommands, setIsLoadingCommands] = useState(true);
  const [commandsError, setCommandsError] = useState(null);

  // Discovery state
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredCommands, setDiscoveredCommands] = useState(null);
  const [discoverError, setDiscoverError] = useState(null);

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
        setCommandsError(data.error || 'Failed to load commands');
      }
    } catch (err) {
      console.error('Failed to load commands:', err);
      setCommandsError(err.message);
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
   * Select a command by its ID
   */
  const selectCommand = useCallback((commandId) => {
    setSelectedCommandId(commandId);
    setCommandsError(null);
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

  return {
    // Command state
    commands,
    selectedCommandId,
    selectedCommand: getSelectedCommand(),
    isLoadingCommands,
    commandsError,

    // Discovery state
    isDiscovering,
    discoveredCommands,
    discoverError,

    // Actions
    selectCommand,
    reloadCommands,
    discoverCommands,
    clearDiscovered,

    // Utilities
    getSelectedCommand
  };
}
