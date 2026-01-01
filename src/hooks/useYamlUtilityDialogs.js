import { useState, useRef } from 'react';

/**
 * Custom hook to manage YAML utility dialog states
 * Handles filename dialog, file exists dialog, and editor modal
 */
export const useYamlUtilityDialogs = () => {
  const [showFileNameDialog, setShowFileNameDialog] = useState(false);
  const [showFileExistsDialog, setShowFileExistsDialog] = useState(false);
  const [showNewFileEditor, setShowNewFileEditor] = useState(false);
  const [fileNameInput, setFileNameInput] = useState('config-new.yaml');
  const [fileNameError, setFileNameError] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [existingFilePath, setExistingFilePath] = useState('');
  const [existingFileContent, setExistingFileContent] = useState('');
  
  const existingFilePathRef = useRef('');

  const openFileNameDialog = () => {
    setFileNameInput('config-new.yaml');
    setFileNameError('');
    setShowFileNameDialog(true);
  };

  const closeFileNameDialog = () => {
    setShowFileNameDialog(false);
    setFileNameInput('config-new.yaml');
    setFileNameError('');
  };

  const openFileExistsDialog = (fileName, filePath) => {
    setNewFileName(fileName);
    setExistingFilePath(filePath);
    existingFilePathRef.current = filePath;
    setExistingFileContent('');
    setShowFileExistsDialog(true);
  };

  const closeFileExistsDialog = () => {
    setShowFileExistsDialog(false);
  };

  const openNewFileEditor = (fileName, content = '', filePath = '') => {
    setNewFileName(fileName);
    setExistingFileContent(content);
    setExistingFilePath(filePath);
    setShowFileNameDialog(false);
    setShowNewFileEditor(true);
  };

  const closeNewFileEditor = () => {
    setShowNewFileEditor(false);
    setNewFileName('');
    setExistingFileContent('');
    setExistingFilePath('');
    existingFilePathRef.current = '';
  };

  const resetAll = () => {
    setShowFileNameDialog(false);
    setShowFileExistsDialog(false);
    setShowNewFileEditor(false);
    setFileNameInput('config-new.yaml');
    setFileNameError('');
    setNewFileName('');
    setExistingFilePath('');
    setExistingFileContent('');
    existingFilePathRef.current = '';
  };

  return {
    // State
    showFileNameDialog,
    showFileExistsDialog,
    showNewFileEditor,
    fileNameInput,
    fileNameError,
    newFileName,
    existingFilePath,
    existingFileContent,
    existingFilePathRef,
    
    // Setters
    setFileNameInput,
    setFileNameError,
    
    // Actions
    openFileNameDialog,
    closeFileNameDialog,
    openFileExistsDialog,
    closeFileExistsDialog,
    openNewFileEditor,
    closeNewFileEditor,
    resetAll
  };
};
