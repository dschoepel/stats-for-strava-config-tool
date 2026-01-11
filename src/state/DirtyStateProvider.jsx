'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useDialog } from './DialogProvider';

const DirtyStateContext = createContext();

export const useDirtyState = () => {
  const context = useContext(DirtyStateContext);
  if (!context) {
    throw new Error('useDirtyState must be used within a DirtyStateProvider');
  }
  return context;
};

export const DirtyStateProvider = ({ children }) => {
  const { showConfirmDialog, closeDialog } = useDialog();

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sportsListDirty, setSportsListDirty] = useState(false);
  const [widgetDefinitionsDirty, setWidgetDefinitionsDirty] = useState(false);

  const clearAllDirtyState = useCallback(() => {
    setHasUnsavedChanges(false);
    setSportsListDirty(false);
    setWidgetDefinitionsDirty(false);
  }, []);

  const checkAndConfirmNavigation = useCallback((onConfirm) => {
    if (hasUnsavedChanges) {
      showConfirmDialog({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. These changes will be lost if you leave without saving.\n\nAre you sure you want to leave?',
        confirmText: 'Leave Anyway',
        confirmColorPalette: 'orange',
        onConfirm: () => {
          closeDialog();
          setHasUnsavedChanges(false);
          onConfirm();
        }
      });
    } else {
      onConfirm();
    }
  }, [hasUnsavedChanges, showConfirmDialog, closeDialog]);

  const checkAndConfirmModalClose = useCallback((modalName, onClose) => {
    const isDirty = modalName === 'sportsList' ? sportsListDirty : modalName === 'widgetDefinitions' ? widgetDefinitionsDirty : false;

    if (isDirty) {
      showConfirmDialog({
        title: 'Unsaved Changes',
        message: `You have unsaved changes in ${modalName === 'sportsList' ? 'Sports List' : 'Widget Definitions'}. These changes will be lost if you close without saving.\n\nAre you sure you want to close?`,
        confirmText: 'Close Anyway',
        confirmColorPalette: 'orange',
        onConfirm: () => {
          closeDialog();
          if (modalName === 'sportsList') setSportsListDirty(false);
          if (modalName === 'widgetDefinitions') setWidgetDefinitionsDirty(false);
          onClose();
        }
      });
    } else {
      onClose();
    }
  }, [sportsListDirty, widgetDefinitionsDirty, showConfirmDialog, closeDialog]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  // Note: State setters are stable references from useState and safe to include
  const value = useMemo(() => ({
    hasUnsavedChanges,
    sportsListDirty,
    widgetDefinitionsDirty,
    setHasUnsavedChanges,
    setSportsListDirty,
    setWidgetDefinitionsDirty,
    clearAllDirtyState,
    checkAndConfirmNavigation,
    checkAndConfirmModalClose
  }), [
    hasUnsavedChanges,
    sportsListDirty,
    widgetDefinitionsDirty,
    clearAllDirtyState,
    checkAndConfirmNavigation,
    checkAndConfirmModalClose
  ]);

  return (
    <DirtyStateContext.Provider value={value}>
      {children}
    </DirtyStateContext.Provider>
  );
};
