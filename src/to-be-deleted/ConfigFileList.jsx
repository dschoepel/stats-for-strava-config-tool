import React, { useState, useEffect } from 'react';
import { getSetting } from '../utils/settingsManager';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';
import FileViewerModal from './FileViewerModal';
import './ConfigFileList.css';

const ConfigFileList = () => {
  const [configFiles, setConfigFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFileName, setModalFileName] = useState('');
  const [modalFileContent, setModalFileContent] = useState('');
  const { toasts, removeToast, showInfo, showWarning, showError, showSuccess } = useToast();
  const [defaultPath] = useState(() => {
    const envPath = process.env.NEXT_PUBLIC_DEFAULT_STATS_CONFIG_PATH;
    
    console.log('Stats config path from env:', envPath);
    
    let displayPath = envPath || 'Not configured';
    
    // Convert tilde (~) to a more user-friendly description
    if (displayPath && displayPath.startsWith('~/')) {
      displayPath = displayPath.replace('~/', 'Home Directory/');
    }
    
    console.log('Final stats config path:', displayPath);
    return displayPath || 'Not configured';
  });

  // Check if File System Access API is supported
  const isFileSystemAccessSupported = 'showDirectoryPicker' in window;
  const [hasScannedDefault, setHasScannedDefault] = useState(false);

  // Auto-scan default directory on component mount
  useEffect(() => {
    if (isFileSystemAccessSupported && !hasScannedDefault) {
      scanDefaultDirectory();
    }
  }, [isFileSystemAccessSupported, hasScannedDefault]);

  const scanDefaultDirectory = async () => {
    const envPath = import.meta.env.VITE_DEFAULT_STATS_CONFIG_PATH;
    
    if (!envPath || envPath === 'Not configured') {
      showError('No default directory configured in environment variables.');
      setHasScannedDefault(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setHasScannedDefault(true);
      
      showInfo(`Requesting access to default directory: ${envPath.replace('~/', 'Home Directory/')}`, 8000);
      
      // Try to access the default directory automatically
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'documents'
      });
      
      setSelectedDirectory(directoryHandle);
      const files = await scanForConfigFiles(directoryHandle);
      setConfigFiles(files);
      
      if (files.length === 0) {
        showWarning('No configuration files found in the selected directory. Looking for config.yaml and config-*.yaml files.');
        setError('No configuration files found in the selected directory.');
      } else {
        showSuccess(`Found ${files.length} configuration file${files.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        showWarning('Directory access was cancelled. For security reasons, browsers require manual directory selection.');
        setError('Directory access was cancelled. Use "Select Directory" to browse for config files.');
      } else {
        showError(`Could not access default directory: ${error.message}`);
        setError('Could not access default directory. Use "Select Directory" to browse for config files.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const scanForConfigFiles = async (directoryHandle) => {
    const files = [];
    try {
      for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === 'file') {
          // Check if file matches our criteria: config.yaml or config-*.yaml
          if (name === 'config.yaml' || (name.startsWith('config-') && name.endsWith('.yaml'))) {
            const file = await handle.getFile();
            files.push({
              name: name,
              size: file.size,
              lastModified: new Date(file.lastModified),
              handle: handle,
              path: `${selectedDirectory?.name || 'Selected Directory'}/${name}`
            });
          }
        }
      }
      return files.sort((a, b) => {
        // Sort with config.yaml first, then alphabetically
        if (a.name === 'config.yaml') return -1;
        if (b.name === 'config.yaml') return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error scanning directory:', error);
      throw error;
    }
  };

  const handleSelectDirectory = async () => {
    if (!isFileSystemAccessSupported) {
      showError('File System Access API is not supported in this browser. Please use Chrome/Edge 86+ or enable the feature flag.');
      setError('File System Access API is not supported in this browser. Please use Chrome/Edge 86+ or enable the feature flag.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      showInfo('Opening directory picker... Please select your configuration directory.', 5000);
      
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'documents'
      });
      
      setSelectedDirectory(directoryHandle);
      const files = await scanForConfigFiles(directoryHandle);
      setConfigFiles(files);
      
      if (files.length === 0) {
        showWarning('No configuration files found in the selected directory. Make sure you have config.yaml or config-*.yaml files.');
        setError('No configuration files found in the selected directory.');
      } else {
        showSuccess(`Successfully loaded ${files.length} configuration file${files.length > 1 ? 's' : ''} from ${directoryHandle.name}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        showInfo('Directory selection was cancelled.');
      } else {
        showError(`Failed to access directory: ${error.message}`);
        setError('Failed to access directory: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };



  const handleRefreshFiles = async () => {
    if (!selectedDirectory) return;

    try {
      setIsLoading(true);
      setError(null);
      showInfo('Refreshing configuration files...', 3000);
      const files = await scanForConfigFiles(selectedDirectory);
      setConfigFiles(files);
      
      if (files.length === 0) {
        showWarning('No configuration files found after refresh.');
      } else {
        showSuccess(`Refreshed: Found ${files.length} configuration file${files.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      showError(`Failed to refresh files: ${error.message}`);
      setError('Failed to refresh files: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFile = async (fileInfo) => {
    try {
      showInfo(`Loading ${fileInfo.name}...`, 2000);
      const file = await fileInfo.handle.getFile();
      const content = await file.text();
      
      setModalFileName(fileInfo.name);
      setModalFileContent(content);
      setIsModalOpen(true);
      showSuccess(`${fileInfo.name} loaded successfully`);
    } catch (error) {
      showError(`Failed to load file: ${error.message}`);
      setError('Failed to load file: ' + error.message);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalFileName('');
    setModalFileContent('');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="config-file-list">
      <div className="section-header">
        <h3>📁 Configuration Files</h3>
        <p className="section-description">
          Browse and manage Stats for Strava configuration files from the default path: 
          <code>{defaultPath}</code>
        </p>
      </div>

      <div className="file-list-controls">
        {isFileSystemAccessSupported && (configFiles.length === 0 || error) && (
          <div className="control-group">
            <button 
              onClick={handleSelectDirectory}
              className="btn-primary"
              disabled={isLoading}
            >
              📁 Select Directory
            </button>
            
            {selectedDirectory && (
              <button 
                onClick={handleRefreshFiles}
                className="btn-secondary"
                disabled={isLoading}
              >
                🔄 Refresh Files
              </button>
            )}
          </div>
        )}
        
        {!isFileSystemAccessSupported && (
          <div className="unsupported-notice">
            <div className="notice-icon">⚠️</div>
            <div className="notice-content">
              <strong>File System Access Not Supported</strong>
              <p>Your browser doesn't support direct file system access. Please use the YAML Utility to upload files manually.</p>
            </div>
          </div>
        )}
      </div>

      {selectedDirectory && (
        <div className="directory-info">
          <span className="directory-label">Selected Directory:</span>
          <code className="directory-path">{selectedDirectory.name}</code>
        </div>
      )}

      {error && (
        <div className={`error-message ${error.includes('Click') ? 'info-message' : ''}`}>
          <span className="error-icon">{error.includes('Click') ? '💡' : '❌'}</span>
          <span className="error-text">{error}</span>
          <button onClick={() => setError(null)} className="error-close">✕</button>
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Scanning for configuration files...</span>
        </div>
      )}

      {configFiles.length > 0 && (
        <div className="file-list">
          <div className="file-list-header">
            <h4>Found {configFiles.length} configuration file{configFiles.length > 1 ? 's' : ''}</h4>
          </div>
          
          <div className="file-grid">
            {configFiles.map((file, index) => (
              <div key={index} className={`file-card ${file.name === 'config.yaml' ? 'primary-config' : ''}`}>
                <div className="file-header">
                  <div className="file-icon">
                    {file.name === 'config.yaml' ? '⚙️' : '📄'}
                  </div>
                  {file.name === 'config.yaml' && (
                    <div className="primary-badge">Primary Config</div>
                  )}
                </div>
                
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    <span className="file-size">{formatFileSize(file.size)}</span>
                    <span className="file-date">
                      {file.lastModified.toLocaleDateString()} {file.lastModified.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                <div className="file-actions">
                  <button 
                    onClick={() => handleViewFile(file)}
                    className="btn-file-action"
                    title="View file contents"
                  >
                    👁️ View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && configFiles.length === 0 && selectedDirectory && (
        <div className="no-files-message">
          <div className="no-files-icon">📭</div>
          <div className="no-files-content">
            <h4>No Configuration Files Found</h4>
            <p>No files matching the pattern were found in the selected directory.</p>
            <p>Looking for:</p>
            <ul>
              <li><code>config.yaml</code> (main configuration)</li>
              <li><code>config-*.yaml</code> (additional configurations)</li>
            </ul>
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <FileViewerModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        fileName={modalFileName}
        fileContent={modalFileContent}
      />
    </div>
  );
};

export default ConfigFileList;