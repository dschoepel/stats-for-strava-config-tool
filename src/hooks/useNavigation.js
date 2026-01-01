import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing navigation state and breadcrumbs
 * Handles page navigation, breadcrumb management, and localStorage persistence
 */
export const useNavigation = (initialPage = 'Configuration') => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [breadcrumbs, setBreadcrumbs] = useState([initialPage]);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Restore state from localStorage after hydration
  useEffect(() => {
    try {
      const savedPage = localStorage.getItem('stats-config-current-page');
      const savedBreadcrumbs = localStorage.getItem('stats-config-breadcrumbs');
      
      if (savedPage) {
        setCurrentPage(savedPage);
      }
      if (savedBreadcrumbs) {
        setBreadcrumbs(JSON.parse(savedBreadcrumbs));
      }
      
      setHasHydrated(true);
    } catch (error) {
      console.error('Error restoring navigation state:', error);
      setHasHydrated(true);
    }
  }, []);

  // Save current page and breadcrumbs to localStorage
  useEffect(() => {
    if (!hasHydrated) return;
    
    try {
      localStorage.setItem('stats-config-current-page', currentPage);
      localStorage.setItem('stats-config-breadcrumbs', JSON.stringify(breadcrumbs));
    } catch (error) {
      console.error('Error saving navigation state:', error);
    }
  }, [currentPage, breadcrumbs, hasHydrated]);

  /**
   * Navigate to a page
   * @param {string} page - Target page name
   * @param {string} parentPage - Optional parent page for breadcrumb hierarchy
   * @param {boolean} skipUnsavedCheck - Skip unsaved changes warning
   */
  const navigateTo = useCallback((page, parentPage = null, skipUnsavedCheck = false) => {
    if (parentPage) {
      setBreadcrumbs([parentPage, page]);
    } else {
      setBreadcrumbs([page]);
    }
    setCurrentPage(page);
    
    return { shouldNavigate: true, skipUnsavedCheck };
  }, []);

  /**
   * Navigate via breadcrumb click
   * @param {number} index - Breadcrumb index to navigate to
   */
  const navigateToBreadcrumb = useCallback((index) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    const targetPage = newBreadcrumbs[newBreadcrumbs.length - 1];
    setCurrentPage(targetPage);
    
    return { shouldNavigate: true };
  }, [breadcrumbs]);

  return {
    currentPage,
    breadcrumbs,
    hasHydrated,
    navigateTo,
    navigateToBreadcrumb,
  };
};
