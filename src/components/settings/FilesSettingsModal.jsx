import React, { useState, useEffect } from 'react';
import { loadSettings, saveSettings } from '../../utils/settingsManager';
import './SettingModal.css';

const FilesSettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Expand tilde to full path
  const expandPath = async (path) => {
    if (!path || !path.startsWith('~')) return path;
    
    try {
      const response = await fetch('/api/expand-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      const data = await response.json();
      return data.success ? data.expandedPath : path;
    } catch (error) {
      console.error('Failed to expand path:', error);
      return path;
    }
  };

  useEffect(() => {
    const loadAndExpandSettings = async () => {
      if (isOpen) {
        const loaded = loadSettings();
        
        // Expand the default path if it contains tilde
        if (loaded.files?.defaultPath?.startsWith('~')) {
          const expandedPath = await expandPath(loaded.files.defaultPath);
          if (expandedPath !== loaded.files.defaultPath) {
            loaded.files.defaultPath = expandedPath;
          }
        }
        
        setSettings(loaded);
        setIsDirty(false);
      }
    };
    
    loadAndExpandSettings();
  }, [isOpen]);

  const handleClose = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
    onClose();
  };

  const handleChange = (path, value) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
    setIsDirty(true);
  };

  const handleSave = async () => {
    const success = await saveSettings(settings);
    if (success) {
      setIsDirty(false);
    } else {
      alert('Failed to save settings. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="setting-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📁 File Settings</h2>
          <button onClick={handleClose} className="modal-close">✕</button>
        </div>

        <div className="modal-body">
          <div className="setting-group">
            <label>Default file path</label>
            <input 
              type="text"
              value={settings.files?.defaultPath || ''}
              onChange={(e) => handleChange('files.defaultPath', e.target.value)}
              placeholder="~/Documents/strava-config-tool/"
            />
          </div>

          <div className="setting-group">
            <label>
              <input 
                type="checkbox"
                checked={settings.files?.autoBackup !== false}
                onChange={(e) => handleChange('files.autoBackup', e.target.checked)}
              />
              Create automatic backups
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input 
                type="checkbox"
                checked={settings.files?.validateOnLoad !== false}
                onChange={(e) => handleChange('files.validateOnLoad', e.target.checked)}
              />
              Validate YAML syntax on file load
            </label>
          </div>

          <div className="setting-group">
            <label>Maximum recent files</label>
            <input 
              type="number"
              min="1"
              max="50"
              value={settings.files?.maxRecentFiles || 10}
              onChange={(e) => handleChange('files.maxRecentFiles', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={handleClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary" disabled={!isDirty}>
            💾 Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilesSettingsModal;