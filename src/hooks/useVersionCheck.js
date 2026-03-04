'use client';

import { useState, useEffect } from 'react';

export function useVersionCheck() {
  const [state, setState] = useState({
    latestVersion: null,
    isUpdateAvailable: false,
    releaseUrl: null,
    isLoading: true,
  });

  useEffect(() => {
    fetch('/api/version/check')
      .then((res) => res.json())
      .then((data) => {
        setState({
          latestVersion: data.latestVersion || null,
          isUpdateAvailable: data.isUpdateAvailable ?? false,
          releaseUrl: data.releaseUrl || null,
          isLoading: false,
        });
      })
      .catch(() => {
        setState({ latestVersion: null, isUpdateAvailable: false, releaseUrl: null, isLoading: false });
      });
  }, []);

  return state;
}
