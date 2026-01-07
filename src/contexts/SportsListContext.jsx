import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // Get flat array of all sport types
  const getAllSportTypes = useCallback(() => {
    const allSports = [];
    Object.values(sportsList).forEach(categoryArray => {
      if (Array.isArray(categoryArray)) {
        allSports.push(...categoryArray);
      }
    });
    return allSports;
  }, [sportsList]);

  const value = {
    sportsList,
    isLoading,
    loadSportsList,
    getAllSportTypes
  };

  return (
    <SportsListContext.Provider value={value}>
      {children}
    </SportsListContext.Provider>
  );
};
