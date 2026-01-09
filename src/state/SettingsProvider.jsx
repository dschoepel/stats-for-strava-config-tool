'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useToast } from '../contexts/ToastContext';
import { loadSettings, loadSettingsFromFile, saveSettings as saveSettingsUtil, getSetting } from '../utils/settingsManager';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { theme, setTheme } = useTheme();
  const { showError } = useToast();

  const [settings, setSettings] = useState({});
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Initialize settings on mount
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        // Load settings - try from localStorage first (faster), then validate with file
        let loadedSettings = loadSettings();

        // Try to load from file in background
        try {
          const fileSettings = await loadSettingsFromFile();
          if (fileSettings) {
            loadedSettings = fileSettings;
          }
        } catch (fileError) {
          console.log('Using localStorage settings:', fileError);
        }

        setSettings(loadedSettings);
        if (loadedSettings.ui?.theme) {
          setTheme(loadedSettings.ui.theme);
        }

        // On mobile, start with sidebar collapsed; on desktop, use saved preference
        const isMobile = window.innerWidth < 768;
        setIsSidebarCollapsed(isMobile ? true : (loadedSettings.ui?.sidebarCollapsed ?? false));

        console.log('Loaded settings:', loadedSettings);
        console.log('Sidebar collapsed setting:', loadedSettings.ui?.sidebarCollapsed);

        setHasHydrated(true);
      } catch (error) {
        console.error('Error initializing settings:', error);
        // Fall back to defaults
        const loadedSettings = loadSettings();
        setSettings(loadedSettings);
        if (loadedSettings.ui?.theme) {
          setTheme(loadedSettings.ui.theme);
        }
        setIsSidebarCollapsed(getSetting('ui.sidebarCollapsed', false));
        setHasHydrated(true);
      }
    };

    initializeSettings();
    // setTheme is stable from next-themes and won't cause re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle settings changes from window events
  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
    // Update UI state based on new settings
    if (newSettings.ui?.sidebarCollapsed !== undefined) {
      setIsSidebarCollapsed(newSettings.ui.sidebarCollapsed);
    }
    if (newSettings.ui?.theme) {
      setTheme(newSettings.ui.theme);
    }
  }, [setTheme]);

  // Listen for settings changes from other parts of the app
  useEffect(() => {
    const handleSettingsChangedEvent = (event) => {
      handleSettingsChange(event.detail);
    };

    const handleSettingsResetEvent = () => {
      const defaultSettings = loadSettings();
      handleSettingsChange(defaultSettings);
    };

    window.addEventListener('settingsChanged', handleSettingsChangedEvent);
    window.addEventListener('settingsReset', handleSettingsResetEvent);

    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChangedEvent);
      window.removeEventListener('settingsReset', handleSettingsResetEvent);
    };
  }, [handleSettingsChange]);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      const success = await saveSettingsUtil(newSettings);
      if (success) {
        setSettings(newSettings);
        // Update derived state
        if (newSettings.ui?.sidebarCollapsed !== undefined) {
          setIsSidebarCollapsed(newSettings.ui.sidebarCollapsed);
        }
        if (newSettings.ui?.theme) {
          setTheme(newSettings.ui.theme);
        }
      } else {
        showError?.('Failed to save settings');
      }
      return success;
    } catch (error) {
      console.error('Error updating settings:', error);
      showError?.(`Failed to save settings: ${error.message}`);
      return false;
    }
  }, [setTheme, showError]);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // Save theme to settings
    const newSettings = { ...settings };
    if (!newSettings.ui) newSettings.ui = {};
    newSettings.ui.theme = newTheme;
    await updateSettings(newSettings);
  }, [theme, settings, setTheme, updateSettings]);

  const toggleSidebar = useCallback(async () => {
    const newCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsed);
    // Save sidebar state to settings
    const newSettings = { ...settings };
    if (!newSettings.ui) newSettings.ui = {};
    newSettings.ui.sidebarCollapsed = newCollapsed;

    console.log('Saving sidebar collapsed state:', newCollapsed);
    const success = await updateSettings(newSettings);
    if (!success) {
      console.error('Failed to save sidebar state');
    } else {
      console.log('Sidebar state saved successfully');
    }
  }, [isSidebarCollapsed, settings, updateSettings]);

  const resetSettings = useCallback(() => {
    const defaultSettings = loadSettings();
    handleSettingsChange(defaultSettings);
  }, [handleSettingsChange]);

  const value = {
    settings,
    hasHydrated,
    isSidebarCollapsed,
    theme,
    updateSettings,
    toggleTheme,
    toggleSidebar,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
