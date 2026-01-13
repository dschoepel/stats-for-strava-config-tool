import { useState, useEffect } from 'react';
import { processYamlFiles } from '../../../../src/utils/yamlFileHandler';
import { getSetting } from '../../../../src/utils/settingsManager';
import { checkFileExists as checkFileExistsService, readFile } from '../../../../src/services';

/**
 * Custom hook to manage YAML utility file operations
 * Handles file selection, creation, validation, and localStorage persistence
 */
export const useYamlUtilityFiles = () => {
  const [selectedFiles, setSelectedFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('yaml-utility-files');
      if (saved) {
        const files = JSON.parse(saved);
        // Reconstruct Date objects for lastModified property
        return files.map(file => ({
          ...file,
          lastModified: new Date(file.lastModified)
        }));
      }
      return [];
    } catch (err) {
      console.error('Error loading saved files:', err);
      return [];
    }
  });

  const [showViewer, setShowViewer] = useState(() => {
    try {
      const saved = localStorage.getItem('yaml-utility-viewer-open');
      const savedFiles = localStorage.getItem('yaml-utility-files');
      return saved === 'true' && savedFiles && JSON.parse(savedFiles).length > 0;
    } catch {
      return false;
    }
  });

  const [error, setError] = useState(null);

  // Save files to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('yaml-utility-files', JSON.stringify(selectedFiles));
      localStorage.setItem('yaml-utility-viewer-open', showViewer.toString());
    } catch (err) {
      console.error('Error saving files to localStorage:', err);
    }
  }, [selectedFiles, showViewer]);

  const handleFilesSelected = (files) => {
    setSelectedFiles(prevFiles => {
      // Create a map of existing files by name to avoid duplicates
      const existingFiles = new Map(prevFiles.map(file => [file.name, file]));
      
      // Add new files, replacing any with the same name
      files.forEach(file => {
        existingFiles.set(file.name, file);
      });
      
      const result = Array.from(existingFiles.values());
      
      // Force immediate save to localStorage
      try {
        localStorage.setItem('yaml-utility-files', JSON.stringify(result));
        localStorage.setItem('yaml-utility-viewer-open', 'true');
      } catch (err) {
        console.error('Error in force save:', err);
      }
      
      return result;
    });
    setShowViewer(true);
    setError(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setSelectedFiles([]);
    setShowViewer(false);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    setShowViewer(false);
    setError(null);
    // Clear localStorage
    try {
      localStorage.removeItem('yaml-utility-files');
      localStorage.removeItem('yaml-utility-viewer-open');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  const handleLoadMoreFiles = (callback) => {
    // Create a temporary file input
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.yaml,.yml';
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      
      try {
        const processedFiles = await processYamlFiles(files);
        // Use the existing handleFilesSelected to properly merge and save
        handleFilesSelected(processedFiles);
        // Also call the callback for YamlViewer compatibility
        callback(processedFiles);
      } catch (error) {
        console.error('Error processing additional files:', error);
        alert('Error loading additional files. Please try again.');
      }
    };
    
    input.click();
  };

  const validateFileName = (fileName) => {
    const trimmedName = fileName.trim();
    
    if (!trimmedName) {
      return { valid: false, error: 'Filename cannot be empty' };
    }

    // Ensure .yaml extension
    let finalName = trimmedName;
    if (!finalName.endsWith('.yaml') && !finalName.endsWith('.yml')) {
      finalName = `${finalName}.yaml`;
    }

    // Validate naming convention
    const isValidName = finalName === 'config.yaml' || 
                       finalName === 'gear-maintenance.yaml' ||
                       (finalName.startsWith('config-') && finalName.endsWith('.yaml'));
    
    if (!isValidName) {
      return { 
        valid: false, 
        error: 'Filename must be "config.yaml", "gear-maintenance.yaml", or start with "config-" and end with ".yaml"',
        fileName: finalName
      };
    }

    return { valid: true, fileName: finalName };
  };

  const checkFileExists = async (fileName) => {
    const defaultPath = getSetting('files.defaultPath', '');
    const filePath = `${defaultPath}/${fileName}`;

    try {
      const result = await checkFileExistsService(filePath);
      return { exists: result.exists, filePath };
    } catch (error) {
      console.error('Error checking file existence:', error);
      return { exists: false, filePath };
    }
  };

  const loadFileContent = async (filePath) => {
    try {
      const result = await readFile(filePath);
      return result.content || null;
    } catch (error) {
      console.error('Error loading file content:', error);
      return null;
    }
  };

  const addFileToViewer = (fileName, content) => {
    const newFile = {
      name: fileName,
      size: new Blob([content]).size,
      lastModified: new Date(),
      content: content
    };
    handleFilesSelected([newFile]);
  };

  return {
    selectedFiles,
    setSelectedFiles,
    showViewer,
    setShowViewer,
    error,
    setError,
    handleFilesSelected,
    handleError,
    handleCloseViewer,
    handleClearFiles,
    handleLoadMoreFiles,
    validateFileName,
    checkFileExists,
    loadFileContent,
    addFileToViewer
  };
};
