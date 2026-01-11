import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { readSportsList, initialSportsList } from '../utils/sportsListManager';

const SportsListContext = createContext();

export const useSportsList = () => {
  const context = useContext(SportsListContext);
  if (!context) {
    throw new Error('useSportsList must be used within a SportsListProvider');
  }
  return context;
};

export const SportsListProvider = ({ children }) => {
  const [sportsList, setSportsList] = useState(initialSportsList);
  const [isLoading, setIsLoading] = useState(false);

  const loadSportsList = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = JSON.parse(localStorage.getItem('config-tool-settings') || '{}');
      const list = await readSportsList(settings);
      setSportsList(list);
    } catch (error) {
      console.error('Error loading sports list:', error);
      setSportsList(initialSportsList);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load sports list on mount
  useEffect(() => {
    loadSportsList();
  }, [loadSportsList]);

  // Memoize the flat array of all sport types (prevents recreation on every call)
  const allSportTypes = useMemo(() => {
    const allSports = [];
    Object.values(sportsList).forEach(categoryArray => {
      if (Array.isArray(categoryArray)) {
        allSports.push(...categoryArray);
      }
    });
    return allSports;
  }, [sportsList]);

  // Get flat array of all sport types (now returns memoized value)
  const getAllSportTypes = useCallback(() => allSportTypes, [allSportTypes]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({
    sportsList,
    isLoading,
    loadSportsList,
    getAllSportTypes
  }), [
    sportsList,
    isLoading,
    loadSportsList,
    getAllSportTypes
  ]);

  return (
    <SportsListContext.Provider value={value}>
      {children}
    </SportsListContext.Provider>
  );
};
