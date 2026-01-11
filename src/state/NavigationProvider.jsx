'use client';

import { createContext, useContext, useCallback, useMemo } from 'react';
import { useNavigation as useNavigationHook } from '../hooks/useNavigation';
import { useDirtyState } from './DirtyStateProvider';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  // Use the existing navigation hook
  const { currentPage, breadcrumbs, hasHydrated, navigateTo: originalNavigateTo, navigateToBreadcrumb: originalNavigateToBreadcrumb } = useNavigationHook();
  const { checkAndConfirmNavigation } = useDirtyState();

  // Wrap navigateTo to add unsaved changes check
  const navigateTo = useCallback((page, parentPage = null, skipUnsavedCheck = false) => {
    if (!skipUnsavedCheck) {
      checkAndConfirmNavigation(() => {
        originalNavigateTo(page, parentPage, true);
      });
    } else {
      originalNavigateTo(page, parentPage, true);
    }
  }, [checkAndConfirmNavigation, originalNavigateTo]);

  // Wrap navigateToBreadcrumb to add unsaved changes check
  const navigateToBreadcrumb = useCallback((index) => {
    checkAndConfirmNavigation(() => {
      originalNavigateToBreadcrumb(index);
    });
  }, [checkAndConfirmNavigation, originalNavigateToBreadcrumb]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({
    currentPage,
    breadcrumbs,
    hasHydrated,
    navigateTo,
    navigateToBreadcrumb
  }), [
    currentPage,
    breadcrumbs,
    hasHydrated,
    navigateTo,
    navigateToBreadcrumb
  ]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
