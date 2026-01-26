import { useState, useCallback } from 'react';

/**
 * Custom hook for checking Strava Runner health
 * Reusable across Settings modal and Console page
 */
export function useRunnerHealth() {
  const [status, setStatus] = useState('unknown'); // 'unknown' | 'checking' | 'online' | 'offline'
  const [lastCheck, setLastCheck] = useState(null);

  /**
   * Check the health of the Strava Runner sidecar
   * @returns {Promise<boolean>} True if runner is online
   */
  const checkHealth = useCallback(async () => {
    setStatus('checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout (API has 5s timeout)

      const response = await fetch('/api/strava-console', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      const isOnline = data.success && data.status === 'online';
      
      setStatus(isOnline ? 'online' : 'offline');
      setLastCheck(new Date());
      
      return isOnline;
    } catch (err) {
      console.error('Health check failed:', err);
      setStatus('offline');
      setLastCheck(new Date());
      return false;
    }
  }, []);

  return {
    status,
    lastCheck,
    checkHealth,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isChecking: status === 'checking'
  };
}
