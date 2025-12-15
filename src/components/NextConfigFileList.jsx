import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';
import FileViewerModal from './FileViewerModal';
import './ConfigFileList.css';

const NextConfigFileList = () => {
  const [configFiles, setConfigFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [defaultPath, setDefaultPath] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFileName, setModalFileName] = useState('');
  const [modalFileContent, setModalFileContent] = useState('');
  const { toasts, removeToast, showInfo, showWarning, showError, showSuccess } = useToast();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        showInfo('Checking default configuration directory...', 3000);
        
        // Try to load files from default directory
        const response = await fetch('/api/config-files');
        const result = await response.json();
        
        if (result.success) {
          setConfigFiles(result.files);
          setSelectedDirectory(result.directory);
          setDefaultPath(result.directory);
          
          if (result.files.length === 0) {
            showWarning(`Default directory found but no config files present: ${result.directory}`);
            setError('No configuration files found in the default directory.');
          } else {
            showSuccess(`Automatically loaded ${result.files.length} file${result.files.length > 1 ? 's' : ''} from: ${result.directory}`);
          }
        } else {
          setDefaultPath(result.directory || 'Not configured');
          showWarning(`Default directory not accessible: ${result.directory}. Use "Browse Directory" to select another location.`);
          setError(result.error);
        }
      } catch (error) {
        showError(`Failed to initialize: ${error.message}`);
        setError(`Initialization failed: ${error.message}`);
      }
    };

    initializeApp();
  }, [showInfo, showWarning, showError, showSuccess]);



  const scanDirectory = async (dirPath) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/config-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ directory: dirPath }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConfigFiles(result.files);
        setSelectedDirectory(result.directory);
        
        if (result.files.length === 0) {
          showWarning('No configuration files found. Looking for config.yaml and config-*.yaml files.');
          setError('No configuration files found in the selected directory.');
        } else {
          showSuccess(`Found ${result.files.length} configuration file${result.files.length > 1 ? 's' : ''}`);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showError(`Failed to scan directory: ${error.message}`);
      setError(`Failed to scan directory: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowseDirectory = async () => {
    const directoryPath = prompt('Enter the full path to your configuration directory:', defaultPath || '/home/user/Documents/config');
    
    if (directoryPath && directoryPath.trim()) {
      showInfo(`Scanning directory: ${directoryPath}`, 3000);
      await scanDirectory(directoryPath.trim());
    }
  };

  const handleRefreshFiles = async () => {
    if (!selectedDirectory) return;
    
    showInfo('Refreshing files...', 2000);
    await scanDirectory(selectedDirectory);
  };

  const handleViewFile = async (fileInfo) => {
    try {
      showInfo(`Loading ${fileInfo.name}...`, 2000);
      
      const response = await fetch(`/api/file-content?path=${encodeURIComponent(fileInfo.path)}`);
      const result = await response.json();
      
      if (result.success) {
        setModalFileName(fileInfo.name);
        setModalFileContent(result.content);
        setIsModalOpen(true);
        showSuccess(`${fileInfo.name} loaded successfully`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showError(`Failed to load file: ${error.message}`);
      setError(`Failed to load file: ${error.message}`);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="config-file-list">
      <div className="section-header">
        <h3>📁 Configuration Files</h3>
        <p className="section-description">
          Server-side file system access to Stats for Strava configuration files from: 
          <code>{defaultPath || 'Loading...'}</code>
        </p>
      </div>

      <div className="file-list-controls">
        <div className="control-group">
          <button 
            onClick={handleBrowseDirectory}
            className="btn-primary"
            disabled={isLoading}
          >
            📁 Browse Directory
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
      </div>

      {selectedDirectory && (
        <div className="directory-info">
          <span className="directory-label">Current Directory:</span>
          <code className="directory-path">{selectedDirectory}</code>
        </div>
      )}

      {error && (
        <div className={`error-message ${error.includes('not found') ? 'info-message' : ''}`}>
          <span className="error-icon">{error.includes('not found') ? '💡' : '❌'}</span>
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
              <div key={index} className={`file-card ${file.isMainConfig ? 'primary-config' : ''}`}>
                <div className="file-header">
                  <div className="file-icon">
                    {file.isMainConfig ? '⚙️' : '📄'}
                  </div>
                  {file.isMainConfig && (
                    <div className="primary-badge">Primary Config</div>
                  )}
                </div>
                
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    <span className="file-size">{formatFileSize(file.size)}</span>
                    <span className="file-date">{formatDate(file.lastModified)}</span>
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

export default NextConfigFileList;