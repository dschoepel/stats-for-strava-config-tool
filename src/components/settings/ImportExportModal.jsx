import React, { useState } from 'react';
import { exportSettingsAsYaml, importSettingsFromYaml } from '../../utils/settingsManager';
import './SettingModal.css';

const ImportExportModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('export');
  const [yamlContent, setYamlContent] = useState(exportSettingsAsYaml());

  const handleExport = () => {
    setYamlContent(exportSettingsAsYaml());
    setMode('export');
  };

  const handleImport = () => {
    setYamlContent('');
    setMode('import');
  };

  const handleImportConfirm = () => {
    try {
      importSettingsFromYaml(yamlContent);
      alert('Settings imported successfully!');
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to import settings. Please check the YAML format.');
    }
  };

  const downloadSettings = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config-tool-settings.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="setting-modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📦 Import/Export Settings</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={handleExport} 
              className={mode === 'export' ? 'btn-primary' : 'btn-secondary'}
            >
              📤 Export
            </button>
            <button 
              onClick={handleImport} 
              className={mode === 'import' ? 'btn-primary' : 'btn-secondary'}
            >
              📥 Import
            </button>
          </div>

          <textarea
            value={yamlContent}
            onChange={(e) => setYamlContent(e.target.value)}
            placeholder={mode === 'import' ? 'Paste YAML settings here...' : ''}
            readOnly={mode === 'export'}
            style={{
              width: '100%',
              minHeight: '400px',
              padding: '1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}
          />
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Close</button>
          {mode === 'export' ? (
            <button onClick={downloadSettings} className="btn-primary">
              💾 Download
            </button>
          ) : (
            <button onClick={handleImportConfirm} className="btn-primary">
              📥 Import
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;
