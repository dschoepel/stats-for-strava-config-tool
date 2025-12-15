import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showInfo = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);
  const showSuccess = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const showWarning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
  const showError = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    showInfo,
    showSuccess,
    showWarning,
    showError
  };
};