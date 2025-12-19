import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import * as YAML from 'yaml';
import './YamlEditorModal.css';

const YamlEditorModal = ({ isOpen, onClose, fileName, fileContent, filePath, onSave }) => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (isOpen && fileContent) {
      setContent(fileContent);
      setOriginalContent(fileContent);
      setIsDirty(false);
      setError(null);
      setValidationError(null);
    }
  }, [isOpen, fileContent]);

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && isOpen) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isOpen]);

  const handleEditorChange = (value) => {
    setContent(value || '');
    setIsDirty(value !== originalContent);
    setValidationError(null); // Clear validation error when editing
  };

  const validateYaml = (yamlContent) => {
    try {
      YAML.parse(yamlContent);
      return { valid: true };
    } catch (err) {
      return { 
        valid: false, 
        error: err.message,
        line: err.linePos?.[0]?.line || null
      };
    }
  };

  const handleSave = async () => {
    // Validate YAML before saving
    const validation = validateYaml(content);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/save-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: content
        })
      });

      const result = await response.json();

      if (result.success) {
        setOriginalContent(content);
        setIsDirty(false);
        if (onSave) {
          onSave(result);
        }
      } else {
        throw new Error(result.error || 'Failed to save file');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleEditorMount = (editor) => {
    // Configure Monaco editor settings
    editor.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="yaml-editor-modal-overlay" onClick={handleClose}>
      <div className="yaml-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="yaml-editor-header">
          <div className="yaml-editor-title">
            <span className="editor-icon">✏️</span>
            <h3>{fileName}</h3>
            {isDirty && <span className="dirty-indicator">● Unsaved</span>}
          </div>
          <button className="yaml-editor-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className="yaml-editor-error">
            <span className="error-icon">❌</span>
            <span>{error}</span>
          </div>
        )}

        {validationError && (
          <div className="yaml-editor-validation-error">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>YAML Syntax Error:</strong>
              <div>{validationError}</div>
            </div>
          </div>
        )}

        <div className="yaml-editor-content">
          <Editor
            height="100%"
            defaultLanguage="yaml"
            value={content}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              rulers: [80],
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: true
            }}
          />
        </div>

        <div className="yaml-editor-footer">
          <div className="editor-info">
            <span className="info-text">
              Lines: {content.split('\n').length} | 
              Size: {new Blob([content]).size} bytes
            </span>
          </div>
          <div className="yaml-editor-actions">
            <button
              onClick={handleClose}
              className="btn-cancel"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-save"
              disabled={!isDirty || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YamlEditorModal;
