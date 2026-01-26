'use client';

import { useState, useCallback } from 'react';

const MAX_HISTORY_ITEMS = 50;

/**
 * Generate unique ID for history items
 */
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Custom hook for managing command history
 * 
 * History is built from log files only (single source of truth).
 * Session commands are tracked in-memory until they complete and appear in logs.
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
 * 
 * @param {boolean} featureEnabled - Whether SFS Console feature is enabled
 */
export function useCommandHistory(featureEnabled = true) {
  const [history, setHistory] = useState([]);
  const [hasLoadedHistorical, setHasLoadedHistorical] = useState(false);

  /**
   * Load historical commands from log files (single source of truth)
   * @returns {Promise<void>}
   */
  const loadHistoricalCommands = useCallback(async () => {
    if (hasLoadedHistorical || !featureEnabled) return; // Only load once and if feature enabled
    
    try {
      const response = await fetch('/api/console-logs');
      const data = await response.json();
      
      if (data.success && data.logs && data.logs.length > 0) {
        // Sort by timestamp descending, take last 50
        const recentLogs = data.logs
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 50);
        
        // Convert log files to commandHistory format
        const historicalCommands = recentLogs.map(log => {
          // Parse timestamp: "2026-01-24 21:21:21" format (UTC time from log filename)
          // Use createdAt (ISO format) as fallback if timestamp parsing fails
          let timestampMs;
          if (log.timestamp) {
            // Replace space with 'T' and add 'Z' to indicate UTC time
            const isoFormat = log.timestamp.replace(' ', 'T') + 'Z';
            timestampMs = new Date(isoFormat).getTime();
          }
          
          // Fallback to createdAt or current time
          if (!timestampMs || isNaN(timestampMs)) {
            timestampMs = log.createdAt ? new Date(log.createdAt).getTime() : Date.now();
          }
          
          return {
            id: `historical-${log.filename}`,
            command: log.command,
            commandName: log.command,
            args: [],
            timestamp: timestampMs,
            status: log.exitCode === 0 || log.exitCode === '0' ? 'success' : 'failed',
            exitCode: parseInt(log.exitCode, 10) || 0,
            logPath: log.path,
            isHistorical: true
          };
        });
        
        setHistory(prev => {
          // Keep only running session commands (not yet finished)
          const runningCommands = prev.filter(item => !item.isHistorical && item.status === 'running');
          return [...runningCommands, ...historicalCommands];
        });
        setHasLoadedHistorical(true);
      }
    } catch (error) {
      console.error('Failed to load command history from logs:', error);
    }
  }, [hasLoadedHistorical, featureEnabled]);

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
   * Clear running session commands (historical log-based items remain)
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
