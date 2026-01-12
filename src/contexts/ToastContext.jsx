import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { toaster } from '../components/ui/toaster';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const showInfo = useCallback((message, duration = 5000) => {
    queueMicrotask(() => {
      toaster.create({
        title: message,
        type: 'info',
        duration
      });
    });
  }, []);

  const showSuccess = useCallback((message, duration = 5000) => {
    queueMicrotask(() => {
      toaster.create({
        title: message,
        type: 'success',
        duration
      });
    });
  }, []);

  const showWarning = useCallback((message, duration = 5000) => {
    queueMicrotask(() => {
      toaster.create({
        title: message,
        type: 'warning',
        duration
      });
    });
  }, []);

  const showError = useCallback((message, duration = 5000) => {
    queueMicrotask(() => {
      toaster.create({
        title: message,
        type: 'error',
        duration
      });
    });
  }, []);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({
    showInfo,
    showSuccess,
    showWarning,
    showError
  }), [
    showInfo,
    showSuccess,
    showWarning,
    showError
  ]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
