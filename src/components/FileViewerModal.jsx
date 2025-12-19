import React, { useEffect, useRef, useState } from 'react';
import MonacoYamlViewer from './MonacoYamlViewer';
import './FileViewerModal.css';

const FileViewerModal = ({ isOpen, onClose, fileName, fileContent }) => {
  const contentRef = useRef(null);
  const [editorHeight, setEditorHeight] = useState(600);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      const updateHeight = () => {
        const height = contentRef.current?.clientHeight || 600;
        setEditorHeight(height);
      };
      
      // Initial height calculation
      setTimeout(updateHeight, 0);
      
      // Update on window resize
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, [isOpen]);

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
        
        <div className="file-viewer-content" ref={contentRef}>
          <MonacoYamlViewer
            fileName={fileName}
            fileContent={fileContent}
            showFileInfo={false}
            showActions={true}
            className="modal-viewer"
            height={`${editorHeight}px`}
          />
        </div>
      </div>
    </div>
  );
};

export default FileViewerModal;