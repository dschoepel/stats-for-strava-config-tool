'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'strava-console-history';
const MAX_HISTORY_ITEMS = 50;

/**
 * Generate unique ID for history items
 */
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Load history from localStorage
 */
const loadHistory = () => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load command history:', error);
    return [];
  }
};

/**
 * Save history to localStorage
 */
const saveHistory = (history) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save command history:', error);
  }
};

/**
 * Custom hook for managing command history
 *
 * History item structure:
 * {
 *   id: string,
 *   command: string,        // The command that was run
 *   commandName: string,    // Display name of the command
 *   args: array,            // Command arguments
 *   timestamp: number,      // When the command was started
 *   status: 'running' | 'success' | 'failed',
 *   logPath: string | null, // Path to log file if available
 *   exitCode: number | null, // Exit code from command
 *   isHistorical: boolean   // Flag to distinguish from current session
 * }
 */
export function useCommandHistory() {
  const [history, setHistory] = useState(() => loadHistory());
  const [hasLoadedHistorical, setHasLoadedHistorical] = useState(false);

  // Save to localStorage whenever history changes (only non-historical)
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  /**
   * Load historical commands from log files
   * @returns {Promise<void>}
   */
  const loadHistoricalCommands = useCallback(async () => {
    if (hasLoadedHistorical) return; // Only load once
    
    try {
      const response = await fetch('/api/console-logs');
      const data = await response.json();
      
      if (data.success && data.logs && data.logs.length > 0) {
        // Sort by timestamp descending, take last 10
        const recentLogs = data.logs
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10);
        
        // Convert log files to commandHistory format
        const historicalCommands = recentLogs.map(log => ({
          id: `historical-${log.filename}`,
          command: log.command,
          commandName: log.command,
          args: [],
          timestamp: new Date(log.timestamp).getTime(),
          status: log.exitCode === 0 || log.exitCode === '0' ? 'success' : 'failed',
          exitCode: parseInt(log.exitCode, 10) || 0,
          logPath: log.path,
          isHistorical: true
        }));
        
        setHistory(prev => {
          // Remove any existing historical items and add new ones
          const sessionHistory = prev.filter(item => !item.isHistorical);
          return [...sessionHistory, ...historicalCommands];
        });
        setHasLoadedHistorical(true);
      }
    } catch (error) {
      console.error('Failed to load command history from logs:', error);
    }
  }, [hasLoadedHistorical]);

  /**
   * Add a new command to history
   * @param {string} command - The command being run
   * @param {string} commandName - Display name for the command
   * @param {Array} args - Command arguments array
   * @returns {string} The ID of the new history item
   */
  const addToHistory = useCallback((command, commandName, args = []) => {
    const id = generateId();
    const newItem = {
      id,
      command,
      commandName: commandName || command,
      args,
      timestamp: Date.now(),
      status: 'running',
      logPath: null,
      exitCode: null,
      isHistorical: false
    };

    setHistory(prev => {
      // Separate session and historical items
      const sessionItems = prev.filter(item => !item.isHistorical);
      const historicalItems = prev.filter(item => item.isHistorical);
      
      // Add new item to session history
      const updatedSession = [newItem, ...sessionItems];
      
      // Keep only the most recent session items
      const trimmedSession = updatedSession.length > MAX_HISTORY_ITEMS 
        ? updatedSession.slice(0, MAX_HISTORY_ITEMS)
        : updatedSession;
      
      // Return session items first, then historical
      return [...trimmedSession, ...historicalItems];
    });

    return id;
  }, []);

  /**
   * Update the status of a history item
   * @param {string} id - History item ID
   * @param {string} status - New status
   * @param {string|null} logPath - Path to log file
   * @param {number|null} exitCode - Command exit code
   */
  const updateStatus = useCallback((id, status, logPath = null, exitCode = null) => {
    setHistory(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status, logPath, exitCode }
          : item
      )
    );
  }, []);

  /**
   * Remove a history item
   * @param {string} id - History item ID
   */
  const removeFromHistory = useCallback((id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  /**
   * Clear session history (keeps historical items)
   */
  const clearHistory = useCallback(() => {
    setHistory(prev => prev.filter(item => item.isHistorical));
  }, []);

  /**
   * Get a specific history item
   * @param {string} id - History item ID
   * @returns {Object|undefined} The history item
   */
  const getHistoryItem = useCallback((id) => {
    return history.find(item => item.id === id);
  }, [history]);

  return {
    history,
    addToHistory,
    updateStatus,
    removeFromHistory,
    clearHistory,
    getHistoryItem,
    loadHistoricalCommands
  };
}
