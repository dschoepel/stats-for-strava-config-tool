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
 *   exitCode: number | null // Exit code from command
 * }
 */
export function useCommandHistory() {
  const [history, setHistory] = useState(() => loadHistory());

  // Save to localStorage whenever history changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);

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
      exitCode: null
    };

    setHistory(prev => {
      const updated = [newItem, ...prev];
      // Keep only the most recent items
      if (updated.length > MAX_HISTORY_ITEMS) {
        return updated.slice(0, MAX_HISTORY_ITEMS);
      }
      return updated;
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
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
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
    getHistoryItem
  };
}
