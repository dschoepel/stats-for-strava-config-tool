import React, { useState, useEffect } from 'react';
import { loadSettings, saveSettings } from '../../utils/settingsManager';
import './SettingModal.css';

const PerformanceSettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loaded = loadSettings();
      setSettings(loaded);
      setIsDirty(false);
    }
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
          <h2>⚡ Performance Settings</h2>
          <button onClick={handleClose} className="modal-close">✕</button>
        </div>

        <div className="modal-body">
          <div className="setting-group">
            <label>Maximum file size (MB)</label>
            <input 
              type="number"
              min="1"
              max="100"
              value={Math.round((settings.performance?.maxFileSize || 10485760) / 1024 / 1024)}
              onChange={(e) => handleChange('performance.maxFileSize', parseInt(e.target.value) * 1024 * 1024)}
            />
          </div>

          <div className="setting-group">
            <label>Search timeout (ms)</label>
            <input 
              type="number"
              min="100"
              max="2000"
              step="100"
              value={settings.performance?.searchTimeout || 500}
              onChange={(e) => handleChange('performance.searchTimeout', parseInt(e.target.value))}
            />
          </div>

          <div className="setting-group">
            <label>Auto-save interval (seconds)</label>
            <input 
              type="number"
              min="10"
              max="300"
              step="10"
              value={Math.round((settings.performance?.autoSaveInterval || 30000) / 1000)}
              onChange={(e) => handleChange('performance.autoSaveInterval', parseInt(e.target.value) * 1000)}
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

export default PerformanceSettingsModal;
