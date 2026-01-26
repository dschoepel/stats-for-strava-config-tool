'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSettings } from '../../../../src/state/SettingsProvider';

/**
 * Custom hook for managing Strava Runner health checks
 * Handles runner status monitoring, health checks, and feature flag state.
 */
export function useRunnerHealth() {
  const { settings } = useSettings();

  // Health check state for the Strava Runner sidecar
  const [runnerStatus, setRunnerStatus] = useState('unknown'); // 'online', 'offline', 'checking', 'unknown'
  const [lastHealthCheck, setLastHealthCheck] = useState(null);

  // Check if the SFS Console feature is enabled
  const isFeatureEnabled = settings?.features?.enableSfsConsole ?? false;

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

  return {
    runnerStatus,
    lastHealthCheck,
    isFeatureEnabled,
    checkRunnerHealth
  };
}
