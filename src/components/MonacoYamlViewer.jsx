import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { formatFileSize, validateYamlContent } from '../utils/yamlFileHandler';
import './MonacoYamlViewer.css';

const MonacoYamlViewer = ({ 
  fileName, 
  fileContent, 
  fileSize = null, 
  lastModified = null,
  showFileInfo = true,
  showActions = true,
  onDownload = null,
  onCopy = null,
  className = '',
  height = '100%'
}) => {
  const editorRef = useRef(null);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    
    // Focus the editor
    editor.focus();
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const blob = new Blob([fileContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
    } else {
      try {
        await navigator.clipboard.writeText(fileContent);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  const handleSearch = () => {
    if (editorRef.current) {
      // Trigger the find widget (Ctrl+F)
      editorRef.current.trigger('keyboard', 'actions.find');
    }
  };

  return (
    <div className={`monaco-yaml-viewer ${className}`}>
      {showFileInfo && (
        <div className="file-info-bar">
          <div className="file-details">
            <span className="file-name">📁 {fileName}</span>
            {fileSize && lastModified && (
              <span className="file-meta">
                {formatFileSize(fileSize)} • 
                Modified: {(() => {
                  const date = new Date(lastModified);
                  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                })()}
              </span>
            )}
            <span className={`validation-status ${validateYamlContent(fileContent) ? 'valid' : 'invalid'}`}>
              {validateYamlContent(fileContent) ? '✓ Valid YAML' : '⚠️ Invalid YAML'}
            </span>
          </div>
          {showActions && (
            <div className="file-actions">
              <button onClick={handleSearch} className="btn-action" title="Search (Ctrl+F)">
                🔍 Search
              </button>
              <button onClick={handleCopy} className="btn-action" title="Copy to clipboard">
                📋 Copy
              </button>
              <button onClick={handleDownload} className="btn-action" title="Download file">
                💾 Download
              </button>
            </div>
          )}
        </div>
      )}

      <div className="monaco-editor-container">
        <Editor
          height={height}
          language="yaml"
          value={fileContent}
          theme="vs-dark"
          onMount={handleEditorMount}
          options={{
            readOnly: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'off',
            automaticLayout: true,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10
            },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            contextmenu: true,
            selectOnLineNumbers: true,
            matchBrackets: 'always',
            folding: true,
            foldingHighlight: true,
            showFoldingControls: 'always'
          }}
        />
      </div>
    </div>
  );
};

export default MonacoYamlViewer;
