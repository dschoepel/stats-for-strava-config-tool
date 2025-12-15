import React from 'react';
import YamlContentViewer from './YamlContentViewer';
import './FileViewerModal.css';

const FileViewerModal = ({ isOpen, onClose, fileName, fileContent }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="file-viewer-overlay" onClick={handleOverlayClick}>
      <div className="file-viewer-modal">
        <div className="file-viewer-header">
          <h3 className="file-viewer-title">📄 {fileName}</h3>
          <button className="file-viewer-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="file-viewer-content">
          <YamlContentViewer
            fileName={fileName}
            fileContent={fileContent}
            showFileInfo={false}
            showActions={true}
            showSearch={true}
            className="modal-viewer"
          />
        </div>
      </div>
    </div>
  );
};

export default FileViewerModal;