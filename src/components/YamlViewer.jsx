import React, { useState } from 'react';
import { formatFileSize } from '../utils/yamlFileHandler';
import CombineFilesModal from './CombineFilesModal';
import YamlContentViewer from './YamlContentViewer';
import './YamlViewer.css';

const YamlViewer = ({ files, onClose, onClearFiles, onLoadMoreFiles, onFilesUpdated }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [showCombineModal, setShowCombineModal] = useState(false);
  const [allFiles, setAllFiles] = useState(files);

  // Sync allFiles with files prop when it changes
  React.useEffect(() => {
    setAllFiles(files);
  }, [files]);

  if (!allFiles || allFiles.length === 0) {
    return null;
  }

  const currentFile = allFiles[selectedFileIndex];
  
  // Custom download and copy handlers for the current file
  const handleDownloadFile = () => {
    handleDownload(currentFile);
  };

  const handleCopyFile = async () => {
    await copyToClipboard(currentFile.content);
  };



  const handleDownload = (file) => {
    const blob = new Blob([file.content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleCombineFiles = (combinedFile) => {
    // Add the combined file to the list and select it
    const updatedFiles = [...allFiles, combinedFile];
    setAllFiles(updatedFiles);
    setSelectedFileIndex(updatedFiles.length - 1);
    setShowCombineModal(false);
    // Notify parent component to update and save to localStorage
    if (onFilesUpdated) {
      onFilesUpdated(updatedFiles);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    const updatedFiles = allFiles.filter((_, index) => index !== indexToRemove);
    setAllFiles(updatedFiles);
    // Notify parent component to update and save to localStorage
    if (onFilesUpdated) {
      onFilesUpdated(updatedFiles);
    }
    
    // Adjust selected index if necessary
    if (selectedFileIndex >= indexToRemove && selectedFileIndex > 0) {
      setSelectedFileIndex(selectedFileIndex - 1);
    } else if (updatedFiles.length === 0) {
      onClose();
    } else if (selectedFileIndex >= updatedFiles.length) {
      setSelectedFileIndex(updatedFiles.length - 1);
    }
  };

  const handleLoadMoreFiles = () => {
    onLoadMoreFiles(() => {
      // Don't update local state here - the parent will update via props
      // This prevents double-adding and state sync issues
    });
  };

  return (
    <div className="yaml-viewer">
      <div className="yaml-viewer-header">
        <div className="header-left">
          <h3>📄 Config YAML Viewer</h3>
          <span className="file-count">{allFiles.length} file{allFiles.length > 1 ? 's' : ''} loaded</span>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleLoadMoreFiles}
            className="btn-load-more"
            title="Load additional YAML files"
          >
            📁 Load More
          </button>
          {allFiles.length > 1 && (
            <button 
              onClick={() => setShowCombineModal(true)} 
              className="btn-combine"
              title="Combine multiple files into one"
            >
              🔗 Combine Files
            </button>
          )}
          <button onClick={onClearFiles} className="btn-secondary">
            Clear All
          </button>
          <button onClick={onClose} className="btn-close">
            ✕
          </button>
        </div>
      </div>

      {allFiles.length > 1 && (
        <div className="file-tabs">
          {allFiles.map((file, index) => (
            <div key={index} className="file-tab-container">
              <button
                className={`file-tab ${selectedFileIndex === index ? 'active' : ''} ${file.name.startsWith('combined_') ? 'combined' : ''}`}
                onClick={() => setSelectedFileIndex(index)}
              >
                <span className="tab-name">{file.name.startsWith('combined_') ? '🔗 ' : ''}{file.name}</span>
                <span className="tab-size">({formatFileSize(file.size)})</span>
              </button>
              <button
                className="remove-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(index);
                }}
                title={`Remove ${file.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <YamlContentViewer
        fileName={currentFile.name}
        fileContent={currentFile.content}
        fileSize={currentFile.size}
        lastModified={currentFile.lastModified}
        showFileInfo={true}
        showActions={true}
        showSearch={true}
        onDownload={handleDownloadFile}
        onCopy={handleCopyFile}
        className="page-viewer"
      />
      
      <CombineFilesModal
        files={allFiles}
        isOpen={showCombineModal}
        onClose={() => setShowCombineModal(false)}
        onCombine={handleCombineFiles}
      />
    </div>
  );
};

export default YamlViewer;