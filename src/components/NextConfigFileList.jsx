import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';
import FileViewerModal from './FileViewerModal';
import YamlEditorModal from './YamlEditorModal';
import './ConfigFileList.css';

const NextConfigFileList = forwardRef((props, ref) => {
  const { 
    fileCache, 
    setFileCache, 
    hasConfigInitialized, 
    setHasConfigInitialized,
    configMode,
    sectionToFileMap,
    setSectionToFileMap
  } = props;
  const [configFiles, setConfigFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [defaultPath, setDefaultPath] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFileName, setModalFileName] = useState('');
  const [modalFileContent, setModalFileContent] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorFileName, setEditorFileName] = useState('');
  const [editorFileContent, setEditorFileContent] = useState('');
  const [editorFilePath, setEditorFilePath] = useState('');
  const [lastCheck, setLastCheck] = useState(null);
  const [isSectionMappingExpanded, setIsSectionMappingExpanded] = useState(false);

  // Parse sections from loaded files
  const parseSections = async (files) => {
    if (!files || files.length === 0) return;
    
    try {
      const response = await fetch('/api/parse-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Use detailed mapping instead of simple section mapping for full section info
        const mappingToUse = result.detailedMapping || result.sectionMapping;
        const newMapping = new Map(Object.entries(mappingToUse));
        setSectionToFileMap(newMapping);
        
        console.log('Section mapping (using detailed):', mappingToUse);
        if (result.conflicts.length > 0) {
          console.warn('Section conflicts detected:', result.conflicts);
          showWarning(`Section conflicts detected in: ${result.conflicts.map(c => c.section).join(', ')}`);
        } else {
          showSuccess(`Mapped ${result.totalSections} configuration sections`);
        }
      } else {
        console.warn('Failed to parse sections:', result.error);
      }
    } catch (error) {
      console.warn('Section parsing failed:', error.message);
    }
  };
  const { toasts, removeToast, showInfo, showWarning, showError, showSuccess } = useToast();

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    checkForUpdates: async () => {
      if (!hasConfigInitialized || !selectedDirectory) {
        return;
      }
      await checkForFileChanges();
    },
    forceRefresh: async () => {
      if (!selectedDirectory) return;
      showInfo('Force refreshing files...', 2000);
      await scanDirectory(selectedDirectory, true);
    }
  }));

  // Check for file changes without full reload by comparing content hashes
  const checkForFileChanges = async () => {
    if (!selectedDirectory || fileCache.fileHashes.size === 0) {
      return;
    }
    
    try {
      const response = await fetch('/api/config-files');
      const result = await response.json();
      
      if (result.success && result.files.length > 0) {
        // Check if any files have different content hashes
        let hasChanges = false;
        
        // Check if file count changed
        if (result.files.length !== fileCache.files.length) {
          hasChanges = true;
        } else {
          // Compare content hashes for each file
          for (const file of result.files) {
            const cachedHash = fileCache.fileHashes.get(file.name);
            if (!cachedHash || cachedHash !== file.hash) {
              hasChanges = true;
              break;
            }
          }
        }
        
        if (hasChanges) {
          showInfo('File content changes detected, refreshing...', 2000);
          await scanDirectory(selectedDirectory, false);
        }
      }
    } catch (error) {
      // Silently fail for background checks
      console.warn('Background file check failed:', error.message);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        showInfo('Checking default configuration directory...', 3000);
        
        // Try to load files from default directory
        const response = await fetch('/api/config-files');
        const result = await response.json();
        
        if (result.success) {
          // Create hash map for quick lookup
          const fileHashes = new Map();
          result.files.forEach(file => {
            if (file.hash) {
              fileHashes.set(file.name, file.hash);
            }
          });
            
          setConfigFiles(result.files);
          setSelectedDirectory(result.directory);
          setDefaultPath(result.directory);
          setFileCache({
            files: result.files,
            fileHashes: fileHashes,
            directory: result.directory
          });
          setHasConfigInitialized(true);
          
          // Parse sections to build mapping
          await parseSections(result.files);
          
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
          setHasConfigInitialized(true);
        }
      } catch (error) {
        showError(`Failed to initialize: ${error.message}`);
        setError(`Initialization failed: ${error.message}`);
      }
    };

    // Only initialize if we don't have cached data and haven't initialized yet
    if (!hasConfigInitialized || fileCache.files.length === 0) {
      initializeApp();
    } else {
      // Use cached data
      console.log('Using cached configuration data');
      setConfigFiles(fileCache.files);
      setSelectedDirectory(fileCache.directory);
      setDefaultPath(fileCache.directory);
    }
  }, [showInfo, showWarning, showError, showSuccess, hasConfigInitialized, fileCache]);



  const scanDirectory = async (dirPath, forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check cache first if not forcing refresh
      if (!forceRefresh && fileCache.directory === dirPath && fileCache.files.length > 0 && fileCache.fileHashes.size > 0) {
        const response = await fetch('/api/config-files');
        const result = await response.json();
        
        if (result.success && result.files.length > 0) {
          // Compare file content hashes
          let hasChanges = false;
          
          // Check if file count changed
          if (result.files.length !== fileCache.files.length) {
            hasChanges = true;
          } else {
            // Compare hashes for each file
            for (const file of result.files) {
              const cachedHash = fileCache.fileHashes.get(file.name);
              if (!cachedHash || cachedHash !== file.hash) {
                hasChanges = true;
                break;
              }
            }
          }
          
          if (!hasChanges) {
            // No content changes detected, use cached data
            setConfigFiles(fileCache.files);
            setSelectedDirectory(fileCache.directory);
            setIsLoading(false);
            return;
          }
        }
      }
      
      const response = await fetch('/api/config-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ directory: dirPath }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Create hash map for quick lookup
        const fileHashes = new Map();
        result.files.forEach(file => {
          if (file.hash) {
            fileHashes.set(file.name, file.hash);
          }
        });
          
        setConfigFiles(result.files);
        setSelectedDirectory(result.directory);
        setFileCache({
          files: result.files,
          fileHashes: fileHashes,
          directory: result.directory
        });
        
        // Parse sections to build mapping
        await parseSections(result.files);
        
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
    await scanDirectory(selectedDirectory, true); // Force refresh
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

  const handleEditFile = async (fileInfo) => {
    try {
      showInfo(`Loading ${fileInfo.name} for editing...`, 2000);
      
      const response = await fetch(`/api/file-content?path=${encodeURIComponent(fileInfo.path)}`);
      const result = await response.json();
      
      if (result.success) {
        setEditorFileName(fileInfo.name);
        setEditorFileContent(result.content);
        setEditorFilePath(fileInfo.path);
        setIsEditorOpen(true);
        showSuccess(`${fileInfo.name} loaded in editor`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showError(`Failed to load file: ${error.message}`);
    }
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditorFileName('');
    setEditorFileContent('');
    setEditorFilePath('');
  };

  const handleSaveFile = async (result) => {
    showSuccess(`${editorFileName} saved successfully`);
    // Refresh the file list to show updated file info
    await handleRefreshFiles();
    handleCloseEditor();
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
        {configMode && (
          <div className="info-card">
            <div className="info-card-header">
              <span className="info-card-icon">⚙️</span>
              <span className="info-card-title">Configuration Mode</span>
              <span className={`mode-badge ${configMode}`}>
                {configMode === 'single-file' ? '📄 Single File' : 
                 configMode === 'multi-file' ? '📁 Multi-File' : 
                 configMode === 'invalid' ? '❌ Invalid' :
                 '❓ Unknown'}
              </span>
            </div>
            <div className="info-card-content">
              {configMode === 'single-file' && (
                <span className="info-description">All configuration sections managed in a single config.yaml file</span>
              )}
              {configMode === 'multi-file' && (
                <span className="info-description">Configuration distributed across multiple specialized files with config.yaml as the base</span>
              )}
              {configMode === 'invalid' && (
                <span className="info-description error">Missing required config.yaml file - configuration editing is disabled</span>
              )}
            </div>
          </div>
        )}
        {sectionToFileMap && sectionToFileMap.size > 0 && (
          <div className="info-card">
            <div 
              className="info-card-header clickable"
              onClick={() => setIsSectionMappingExpanded(!isSectionMappingExpanded)}
            >
              <span className="info-card-icon">📋</span>
              <span className="info-card-title">Section Mapping</span>
              <span className="section-count">({sectionToFileMap.size} sections)</span>
              <button className="expand-toggle">
                {isSectionMappingExpanded ? '▼' : '▶'}
              </button>
            </div>
            {isSectionMappingExpanded && (
              <div className="info-card-content">
                <div className="mapping-grid">
                  {Array.from(sectionToFileMap.entries()).map(([section, fileInfo]) => (
                    <div key={section} className="mapping-item">
                      <span className="section-name">{section}</span>
                      <span className="mapping-arrow">→</span>
                      <span className="file-name">
                        {typeof fileInfo === 'string' ? fileInfo : fileInfo.fileName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="file-list-controls" style={{ marginTop: '1rem' }}>
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
                  <button 
                    onClick={() => handleEditFile(file)}
                    className="btn-file-action btn-edit"
                    title="Edit file"
                  >
                    ✏️ Edit
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

      <YamlEditorModal
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        fileName={editorFileName}
        fileContent={editorFileContent}
        filePath={editorFilePath}
        onSave={handleSaveFile}
      />
    </div>
  );
});

NextConfigFileList.displayName = 'NextConfigFileList';

export default NextConfigFileList;