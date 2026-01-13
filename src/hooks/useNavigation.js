import { useState, useEffect, useCallback } from 'react';
import { pages, buildBreadcrumbs } from '../../app/_config/pages';

/**
 * Safely get initial page from localStorage (client-side only)
 * This runs synchronously during initial render to prevent hydration mismatch
 */
const getInitialPage = (defaultPage) => {
  // Server-side: always return default
  if (typeof window === 'undefined') {
    return defaultPage;
  }

  // Client-side: try to read from localStorage
  try {
    const savedPage = localStorage.getItem('stats-config-current-page');
    return (savedPage && pages[savedPage]) ? savedPage : defaultPage;
  } catch (error) {
    console.error('Error reading navigation state:', error);
    return defaultPage;
  }
};

/**
 * Custom hook for managing navigation state and breadcrumbs
 * Now uses centralized pages config for automatic breadcrumb computation
 */
export const useNavigation = (initialPage = 'Configuration') => {
  // Initialize state from localStorage synchronously to prevent hydration mismatch
  const [currentPage, setCurrentPage] = useState(() => getInitialPage(initialPage));
  const [breadcrumbs, setBreadcrumbs] = useState(() => buildBreadcrumbs(getInitialPage(initialPage)));

  // Track if we're on the client side (for breadcrumb rendering)
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set to true on mount (client-side only)
    setIsClient(true);
  }, []);

  // For backwards compatibility, hasHydrated = isClient
  const hasHydrated = isClient;

  // Save current page to localStorage when it changes
  useEffect(() => {
    // Skip on server-side
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('stats-config-current-page', currentPage);
    } catch (error) {
      console.error('Error saving navigation state:', error);
    }
  }, [currentPage]);

  /**
   * Navigate to a page
   * @param {string} page - Target page name
   * @param {string} parentPage - Optional parent page (deprecated, auto-computed from config)
   * @param {boolean} skipUnsavedCheck - Skip unsaved changes warning
   */
  const navigateTo = useCallback((page, parentPage = null, skipUnsavedCheck = false) => {
    if (!pages[page]) {
      console.warn(`Page "${page}" not found in pages config`);
      return { shouldNavigate: false, skipUnsavedCheck };
    }

    // Auto-compute breadcrumbs from page config
    const newBreadcrumbs = buildBreadcrumbs(page);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentPage(page);

    return { shouldNavigate: true, skipUnsavedCheck };
  }, []);

  /**
   * Navigate via breadcrumb click
   * @param {number} index - Breadcrumb index to navigate to
   */
  const navigateToBreadcrumb = useCallback((index) => {
    if (index < 0 || index >= breadcrumbs.length) {
      return { shouldNavigate: false };
    }

    const targetPage = breadcrumbs[index];
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
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
