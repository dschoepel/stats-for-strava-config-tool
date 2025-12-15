import React, { useState } from 'react';
import FileSelector from './FileSelector';
import YamlViewer from './YamlViewer';
import { processYamlFiles } from '../utils/yamlFileHandler';
import './YamlUtility.css';

const YamlUtility = () => {
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
  const [error, setError] = useState(null);
  const [showViewer, setShowViewer] = useState(() => {
    try {
      const saved = localStorage.getItem('yaml-utility-viewer-open');
      const savedFiles = localStorage.getItem('yaml-utility-files');
      return saved === 'true' && savedFiles && JSON.parse(savedFiles).length > 0;
    } catch {
      return false;
    }
  });

  // Save files to localStorage whenever they change
  React.useEffect(() => {
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

  return (
    <div className="yaml-utility">
      <div className="utility-header">
        <h2>⚙️ YAML Config File Utility</h2>
        <p>
          Upload and view your Strava configuration YAML files. This tool helps you inspect 
          config files that start with "config" and have .yaml or .yml extensions.
        </p>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <strong>Error:</strong> {error}
          </div>
          <button onClick={() => setError(null)} className="error-close">
            ✕
          </button>
        </div>
      )}

      {!showViewer && (
        <FileSelector 
          onFilesSelected={handleFilesSelected}
          onError={handleError}
        />
      )}

      {showViewer && selectedFiles.length > 0 && (
        <YamlViewer 
          files={selectedFiles}
          onClose={handleCloseViewer}
          onClearFiles={handleClearFiles}
          onLoadMoreFiles={handleLoadMoreFiles}
          onFilesUpdated={setSelectedFiles}
        />
      )}

      {selectedFiles.length === 0 && !showViewer && (
        <div className="getting-started">
          <div className="getting-started-content">
            <h3>🚀 Getting Started</h3>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Select Files</h4>
                  <p>Choose config YAML files from your local directory</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>View Content</h4>
                  <p>Inspect the YAML content with syntax validation</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Search & Export</h4>
                  <p>Search within files and download individual configs</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="features">
            <h4>✨ Features</h4>
            <ul className="feature-list">
              <li>🔍 Multi-file support with tabbed interface</li>
              <li>📝 Real-time YAML validation</li>
              <li>🔎 Content search functionality</li>
              <li>💾 Download individual files</li>
              <li>📋 Copy to clipboard</li>
              <li>🎨 Responsive design</li>
              <li>🔒 Secure local processing</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default YamlUtility;