import { useState, useRef } from 'react';
import { processYamlFiles } from '../utils/yamlFileHandler';
import './FileSelector.css';

const FileSelector = ({ onFilesSelected, onError }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) {
      return;
    }

    setIsProcessing(true);
    
    try {
      const processedFiles = await processYamlFiles(files);
      
      if (processedFiles.length === 0) {
        onError('No config YAML files found. Please select files that start with "config" and have .yaml or .yml extension.');
        return;
      }
      
      onFilesSelected(processedFiles);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (event) => {
    handleFileSelect(event.target.files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-selector">
      <div className="file-selector-header">
        <h3>📁 Select Config YAML Files</h3>
        <p>Choose one or more files that start with "config" and end with .yaml or .yml</p>
      </div>
      
      <div
        className={`file-drop-zone ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".yaml,.yml"
          onChange={handleInputChange}
          className="file-input-hidden"
        />
        
        {isProcessing ? (
          <div className="processing-indicator">
            <div className="spinner"></div>
            <span>Processing files...</span>
          </div>
        ) : (
          <div className="drop-zone-content">
            <div className="drop-zone-icon">📄</div>
            <h4>Drop files here or click to select</h4>
            <p>Supports: config*.yaml, config*.yml files</p>
            <button type="button" className="select-files-btn">
              Select Files
            </button>
          </div>
        )}
      </div>
      
      <div className="file-selector-info">
        <div className="info-item">
          <span className="info-icon">ℹ️</span>
          <span>Only files starting with "config" will be processed</span>
        </div>
        <div className="info-item">
          <span className="info-icon">📋</span>
          <span>YAML and YML extensions are supported</span>
        </div>
        <div className="info-item">
          <span className="info-icon">🔒</span>
          <span>Files are processed locally in your browser</span>
        </div>
      </div>
    </div>
  );
};

export default FileSelector;