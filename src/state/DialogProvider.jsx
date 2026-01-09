'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const DialogContext = createContext();

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export const DialogProvider = ({ children }) => {
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: undefined,
    confirmColorPalette: undefined
  });

  const showConfirmDialog = useCallback(({
    title,
    message,
    onConfirm,
    confirmText,
    confirmColorPalette
  }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      confirmColorPalette
    });
  }, []);

  const closeDialog = useCallback(() => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      confirmText: undefined,
      confirmColorPalette: undefined
    });
  }, []);

  const value = {
    confirmDialog,
    showConfirmDialog,
    closeDialog
  };

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  );
};
