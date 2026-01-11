'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useConfigData } from '../hooks/useConfigData';
import { useToast } from '../contexts/ToastContext';
import { useNavigation } from './NavigationProvider';
import { useDirtyState } from './DirtyStateProvider';
import { initializeWidgetDefinitions } from '../utils/widgetDefinitionsInitializer';
import { initializeSportsList } from '../utils/sportsListInitializer';

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }) => {
  const { showError, showSuccess } = useToast();
  const { currentPage } = useNavigation();
  const { setHasUnsavedChanges } = useDirtyState();

  // File cache management
  const [fileCache, setFileCache] = useState({ files: [], fileHashes: new Map(), directory: null });
  const [hasConfigInitialized, setHasConfigInitialized] = useState(false);
  const [sectionToFileMap, setSectionToFileMap] = useState(new Map());

  // Memoize complex objects to prevent unnecessary re-renders
  const memoizedFileCache = useMemo(() => fileCache, [fileCache]);
  const memoizedSectionToFileMap = useMemo(() => sectionToFileMap, [sectionToFileMap]);

  // Use the config data hook for managing section data
  const {
    sectionData,
    isLoadingSectionData,
    loadSectionData,
    saveSectionData: originalSaveSectionData
  } = useConfigData(fileCache, sectionToFileMap, showError, showSuccess, setHasUnsavedChanges, () => {});

  // Wrap saveSectionData to clear dirty state
  const saveSectionData = useCallback(async (sectionName, data) => {
    await originalSaveSectionData(sectionName, data);
    // Dirty state is cleared by useConfigData hook
  }, [originalSaveSectionData]);

  // Semantic wrapper functions for state updates (better than exposing raw setters)
  const updateFileCache = useCallback((cache) => {
    setFileCache(cache);
  }, []);

  const updateSectionToFileMap = useCallback((map) => {
    setSectionToFileMap(map);
  }, []);

  const updateHasConfigInitialized = useCallback((initialized) => {
    setHasConfigInitialized(initialized);
  }, []);

  // Initialize widget definitions and sports list when config files are loaded
  useEffect(() => {
    if (hasConfigInitialized && sectionToFileMap.size > 0) {
      // Initialize widget definitions
      initializeWidgetDefinitions(sectionToFileMap)
        .then(result => {
          if (result.success) {
            console.log('✅ Widget definitions initialization complete:', result.message);
          } else {
            console.error('❌ Widget definitions initialization failed:', result.message);
          }
        })
        .catch(error => {
          console.error('❌ Widget definitions initialization error:', error);
        });

      // Initialize sports list
      initializeSportsList()
        .then(result => {
          if (result.success) {
            console.log('✅ Sports list initialization complete:', result.message);
          } else {
            console.error('❌ Sports list initialization failed:', result.message);
          }
        })
        .catch(error => {
          console.error('❌ Sports list initialization error:', error);
        });
    }
  }, [hasConfigInitialized, sectionToFileMap]);

  // Load section data when navigating to section pages
  useEffect(() => {
    const configPages = ['General', 'Athlete', 'Appearance', 'Import', 'Metrics', 'Gear', 'Integrations', 'Scheduling Daemon', 'Zwift'];
    if (configPages.includes(currentPage) && sectionToFileMap.size > 0) {
      loadSectionData(currentPage);
    }
  }, [currentPage, sectionToFileMap, loadSectionData]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({
    fileCache: memoizedFileCache,
    sectionToFileMap: memoizedSectionToFileMap,
    hasConfigInitialized,
    sectionData,
    isLoadingSectionData,
    updateFileCache,
    updateSectionToFileMap,
    updateHasConfigInitialized,
    loadSectionData,
    saveSectionData
  }), [
    memoizedFileCache,
    memoizedSectionToFileMap,
    hasConfigInitialized,
    sectionData,
    isLoadingSectionData,
    updateFileCache,
    updateSectionToFileMap,
    updateHasConfigInitialized,
    loadSectionData,
    saveSectionData
  ]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};
