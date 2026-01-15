'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';
import { onConfigSave } from '../utils/configEvents';

const STORAGE_KEY = 'config-tool-notifications';
const BUILD_FILES_NOTIFICATION_ID = 'build-files-reminder';
const BUILD_FILES_FLAG_KEY = 'config-tool-save-notification-shown';
const MAX_NOTIFICATIONS = 50;
const MAX_AGE_DAYS = 7;
const DEDUPE_WINDOW_MS = 5000;

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Clean old notifications (older than 7 days)
const cleanOldNotifications = (notifications) => {
  const maxAge = Date.now() - (MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  return notifications.filter(n => n.createdAt > maxAge);
};

// Load notifications from localStorage
const loadNotifications = () => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return cleanOldNotifications(parsed);
  } catch (error) {
    console.error('Failed to load notifications:', error);
    return [];
  }
};

// Save notifications to localStorage
const saveNotifications = (notifications) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Failed to save notifications:', error);
  }
};

// Load build-files flag from localStorage
const loadBuildFilesFlag = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    return localStorage.getItem(BUILD_FILES_FLAG_KEY) === 'true';
  } catch (error) {
    console.error('Failed to load build-files flag:', error);
    return false;
  }
};

// Save build-files flag to localStorage
const saveBuildFilesFlag = (value) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(BUILD_FILES_FLAG_KEY, value.toString());
  } catch (error) {
    console.error('Failed to save build-files flag:', error);
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => loadNotifications());
  const [hasSavedConfigNotification, setHasSavedConfigNotification] = useState(() => loadBuildFilesFlag());

  // Validate flag against actual notifications on mount (self-healing)
  useEffect(() => {
    const buildFilesNotificationExists = notifications.some(n => n.id === BUILD_FILES_NOTIFICATION_ID);
    const flagValue = loadBuildFilesFlag();
    
    console.log('[NotificationProvider] Mount validation - Flag:', flagValue, 'Notification exists:', buildFilesNotificationExists);
    
    // If flag is true but notification doesn't exist, reset the flag
    if (flagValue && !buildFilesNotificationExists) {
      console.log('[NotificationProvider] Flag out of sync, resetting to false');
      setHasSavedConfigNotification(false);
      saveBuildFilesFlag(false);
    }
  }, []); // Only run on mount

  // Save to localStorage whenever notifications change (after hydration)
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  // Add notification with deduplication
  const addNotification = useCallback((type, message) => {
    setNotifications(prev => {
      // Check for duplicates within dedupe window
      const now = Date.now();
      const isDuplicate = prev.some(n => 
        n.type === type && 
        n.message === message && 
        (now - n.createdAt) < DEDUPE_WINDOW_MS
      );

      if (isDuplicate) {
        return prev;
      }

      // Create new notification
      const newNotification = {
        id: generateId(),
        type,
        message,
        createdAt: now,
        read: false
      };

      // Add and maintain max limit
      const updated = [newNotification, ...prev];
      
      // Keep only the most recent MAX_NOTIFICATIONS
      if (updated.length > MAX_NOTIFICATIONS) {
        return updated.slice(0, MAX_NOTIFICATIONS);
      }

      return updated;
    });
  }, []);

  // Add config save notification (only once until cleared)
  const addConfigSaveNotification = useCallback(() => {
    console.log('[NotificationProvider] addConfigSaveNotification called, flag:', hasSavedConfigNotification);
    
    // Check if notification already shown
    if (hasSavedConfigNotification) {
      console.log('[NotificationProvider] Notification already shown, skipping');
      return;
    }

    // Create notification with fixed ID
    setNotifications(prev => {
      // Check if this notification already exists
      const exists = prev.some(n => n.id === BUILD_FILES_NOTIFICATION_ID);
      if (exists) {
        console.log('[NotificationProvider] Notification already exists in list, skipping');
        return prev;
      }

      console.log('[NotificationProvider] Creating new build-files notification');
      const newNotification = {
        id: BUILD_FILES_NOTIFICATION_ID,
        type: 'info',
        message: "You've made/saved changes to the configuration. Remember to execute the 'build-files' command in Statistics for Strava!",
        createdAt: Date.now(),
        read: false
      };

      const updated = [newNotification, ...prev];
      
      // Keep only the most recent MAX_NOTIFICATIONS
      if (updated.length > MAX_NOTIFICATIONS) {
        return updated.slice(0, MAX_NOTIFICATIONS);
      }

      return updated;
    });

    // Set flag to prevent duplicate notifications
    console.log('[NotificationProvider] Setting flag to true');
    setHasSavedConfigNotification(true);
    saveBuildFilesFlag(true);
  }, [hasSavedConfigNotification]);

  // Listen for config save events and trigger notification
  useEffect(() => {
    const cleanup = onConfigSave(() => {
      addConfigSaveNotification();
    });
    
    return cleanup;
  }, [addConfigSaveNotification]);

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Clear single notification
  const clearNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Reset flag if build-files notification was cleared
    if (id === BUILD_FILES_NOTIFICATION_ID) {
      setHasSavedConfigNotification(false);
      saveBuildFilesFlag(false);
    }
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    console.log('[NotificationProvider] clearAll called');
    
    // Check if build-files notification exists before clearing
    const hasBuildFilesNotification = notifications.some(n => n.id === BUILD_FILES_NOTIFICATION_ID);
    
    console.log('[NotificationProvider] Has build-files notification:', hasBuildFilesNotification);
    
    // Reset flag if build-files notification is being cleared
    if (hasBuildFilesNotification) {
      console.log('[NotificationProvider] Resetting flag to false');
      setHasSavedConfigNotification(false);
      saveBuildFilesFlag(false);
    }
    
    // Clear all notifications
    setNotifications([]);
  }, [notifications]);

  // Clear all read notifications
  const clearAllRead = useCallback(() => {
    setNotifications(prev => {
      // Check if build-files notification is being cleared
      const buildFilesNotification = prev.find(n => n.id === BUILD_FILES_NOTIFICATION_ID);
      const isBuildFilesRead = buildFilesNotification && buildFilesNotification.read;
      
      // Reset flag if build-files notification is read and being cleared
      if (isBuildFilesRead) {
        setHasSavedConfigNotification(false);
        saveBuildFilesFlag(false);
      }
      
      return prev.filter(n => !n.read);
    });
  }, []);

  // Computed values
  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => b.createdAt - a.createdAt),
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications: sortedNotifications,
      unreadCount,
      addNotification,
      addConfigSaveNotification,
      markAsRead,
      clearNotification,
      clearAll,
      clearAllRead
    }),
    [sortedNotifications, unreadCount, addNotification, addConfigSaveNotification, markAsRead, clearNotification, clearAll, clearAllRead]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
