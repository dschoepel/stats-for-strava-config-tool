import React, { useState, useMemo } from 'react';
import './CombineFilesModal.css';

const CombineFilesModal = ({ files, isOpen, onClose, onCombine }) => {
  const [orderedFiles, setOrderedFiles] = useState(() => [...files]);
  const [combineMethod, setCombineMethod] = useState('append'); // 'append' or 'merge'
  const [separator, setSeparator] = useState('---');
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Reset ordered files when modal opens with new files
  const [lastFilesLength, setLastFilesLength] = useState(files.length);
  
  if (isOpen && files.length !== lastFilesLength) {
    setOrderedFiles([...files]);
    setLastFilesLength(files.length);
  }

  const checkForDuplicateKeys = (files) => {
    const allKeys = new Set();
    const duplicates = new Set();
    const fileKeys = {};

    files.forEach((file, fileIndex) => {
      const normalizedContent = file.content.replace(/\\n/g, '\n');
      const lines = normalizedContent.split('\n');
      const keys = [];
      
      lines.forEach(line => {
        // Match top-level YAML keys (not indented, followed by colon)
        const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
        if (match) {
          const key = match[1];
          keys.push(key);
          
          if (allKeys.has(key)) {
            duplicates.add(key);
          } else {
            allKeys.add(key);
          }
        }
      });
      
      fileKeys[fileIndex] = keys;
    });

    return {
      hasDuplicates: duplicates.size > 0,
      duplicateKeys: Array.from(duplicates),
      fileKeys
    };
  };

  const removeDuplicateKeys = (files) => {
    const duplicateCheck = checkForDuplicateKeys(files);
    
    if (!duplicateCheck.hasDuplicates) {
      return files; // No duplicates, return original files
    }

    const duplicateKeys = new Set(duplicateCheck.duplicateKeys);
    const processedFiles = [];
    const keysAlreadySeen = new Set();

    // Process files in order to keep the first occurrence of each key
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Normalize line endings: replace literal \n with actual newlines, then split
      const normalizedContent = file.content.replace(/\\n/g, '\n');
      const lines = normalizedContent.split('\n');
      const filteredLines = [];
      
      lines.forEach(line => {
        const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
        
        if (match) {
          // This is a top-level key line
          const key = match[1];
          if (duplicateKeys.has(key) && keysAlreadySeen.has(key)) {
            // This is a duplicate key we've seen before - skip only this line
            return;
          } else {
            // Either not a duplicate, or first occurrence of a duplicate
            if (duplicateKeys.has(key)) {
              keysAlreadySeen.add(key);
            }
            filteredLines.push(line);
          }
        } else {
          // This is a value line, comment, or continuation - always keep it
          filteredLines.push(line);
        }
      });

      processedFiles.push({
        ...file,
        content: filteredLines.join('\n'),
        size: new Blob([filteredLines.join('\n')]).size
      });
    }

    return processedFiles;
  };

  // Check for duplicates when files or order changes
  const duplicateInfo = useMemo(() => {
    if (orderedFiles.length > 1) {
      return checkForDuplicateKeys(orderedFiles);
    }
    return null;
  }, [orderedFiles]);

  if (!isOpen) return null;

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;
    
    const newFiles = [...orderedFiles];
    const draggedFile = newFiles[draggedIndex];
    
    // Remove dragged item
    newFiles.splice(draggedIndex, 1);
    
    // Insert at new position
    newFiles.splice(dropIndex, 0, draggedFile);
    
    setOrderedFiles(newFiles);
    setDraggedIndex(null);
  };

  const moveFile = (fromIndex, toIndex) => {
    const newFiles = [...orderedFiles];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setOrderedFiles(newFiles);
  };



  const handleCombine = () => {
    // Check for duplicate keys
    const duplicateCheck = checkForDuplicateKeys(orderedFiles);
    
    let filesToCombine = orderedFiles;
    
    if (duplicateCheck.hasDuplicates) {
      const proceed = window.confirm(
        `Duplicate keys found: ${duplicateCheck.duplicateKeys.join(', ')}\n\nDuplicate keys will be automatically removed from later files, keeping only the first occurrence of each key. Continue?`
      );
      
      if (!proceed) {
        return;
      }
      
      // Remove duplicate keys from earlier files
      filesToCombine = removeDuplicateKeys(orderedFiles);
    }
    
    let combinedContent = '';
    
    if (combineMethod === 'append') {
      // Simple append - just concatenate files
      combinedContent = filesToCombine.map(file => file.content.trim()).join('\n');
    } else {
      // Merge method with separator only if separator is provided and not empty
      if (separator && separator.trim()) {
        combinedContent = filesToCombine.map(file => file.content.trim()).join('\n' + separator.trim() + '\n');
      } else {
        combinedContent = filesToCombine.map(file => file.content.trim()).join('\n');
      }
    }

    const combinedFile = {
      name: `combined_config_${Date.now()}.yaml`,
      size: new Blob([combinedContent]).size,
      lastModified: new Date(),
      content: combinedContent
    };

    onCombine(combinedFile);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="combine-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔗 Combine YAML Files</h3>
          {duplicateInfo && duplicateInfo.hasDuplicates && (
            <div className="header-warning">
              ⚠️ Duplicates detected - scroll down for details
            </div>
          )}
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <div className="modal-body">
          <div className="combine-options">
            <div className="option-group">
              <label>Combine Method:</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input 
                    type="radio" 
                    value="append" 
                    checked={combineMethod === 'append'}
                    onChange={(e) => setCombineMethod(e.target.value)}
                  />
                  <span>Append Files</span>
                  <small>Add files one after another</small>
                </label>
                <label className="radio-option">
                  <input 
                    type="radio" 
                    value="merge" 
                    checked={combineMethod === 'merge'}
                    onChange={(e) => setCombineMethod(e.target.value)}
                  />
                  <span>Merge with Separator</span>
                  <small>Add separator between files</small>
                </label>
              </div>
            </div>

            <div className="option-group">
              <label htmlFor="separator">Separator (optional):</label>
              <input
                id="separator"
                type="text"
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                placeholder="--- (YAML document separator)"
                className="separator-input"
              />
            </div>
          </div>

          <div className="file-ordering">
            <h4>📋 File Order (drag to reorder)</h4>
            <p className="order-instruction">Files will be combined in the order shown below:</p>
            
            <div className="file-list">
              {orderedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className={`file-item ${draggedIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="file-info">
                    <span className="file-order">{index + 1}.</span>
                    <span className="file-name">📄 {file.name}</span>
                    <span className="file-size">({Math.round(file.size / 1024)} KB)</span>
                  </div>
                  <div className="file-controls">
                    <button 
                      onClick={() => moveFile(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      className="move-btn"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => moveFile(index, Math.min(orderedFiles.length - 1, index + 1))}
                      disabled={index === orderedFiles.length - 1}
                      className="move-btn"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="preview-info">
            <h4>📊 Combined File Preview</h4>
            <div className="preview-stats">
              <span>Files: {orderedFiles.length}</span>
              <span>Total Size: ~{Math.round(orderedFiles.reduce((sum, file) => sum + file.size, 0) / 1024)} KB</span>
              <span>Method: {combineMethod === 'append' ? 'Append' : 'Merge'}</span>
            </div>
            
            {duplicateInfo && duplicateInfo.hasDuplicates && (
              <div className="duplicate-warning">
                <div className="warning-header">
                  <span className="warning-icon">⚠️</span>
                  <span className="warning-title">Duplicate Keys Detected</span>
                </div>
                <div className="warning-content">
                  <p>The following first-level keys appear in multiple files:</p>
                  <div className="duplicate-keys">
                    {duplicateInfo.duplicateKeys.map(key => (
                      <span key={key} className="duplicate-key">{key}</span>
                    ))}
                  </div>
                  <p className="warning-note">
                    <strong>Auto-Resolution:</strong> Duplicate keys will be removed from later files, keeping only the first occurrence.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleCombine} className="btn-primary">
            🔗 Combine Files
          </button>
        </div>
      </div>
    </div>
  );
};

export default CombineFilesModal;