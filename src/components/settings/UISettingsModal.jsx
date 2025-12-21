import React, { useState, useEffect } from 'react';
import { loadSettings, saveSettings } from '../../utils/settingsManager';
import './SettingModal.css';

const UISettingsModal = ({ isOpen, onClose }) => {
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
          <h2>🎨 User Interface Settings</h2>
          <button onClick={handleClose} className="modal-close">✕</button>
        </div>

        <div className="modal-body">
          <div className="setting-group">
            <label>Theme</label>
            <select 
              value={settings.ui?.theme || 'dark'}
              onChange={(e) => handleChange('ui.theme', e.target.value)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div className="setting-group">
            <label>
              <input 
                type="checkbox"
                checked={settings.ui?.sidebarCollapsed || false}
                onChange={(e) => handleChange('ui.sidebarCollapsed', e.target.checked)}
              />
              Start with sidebar collapsed
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input 
                type="checkbox"
                checked={settings.ui?.autoSave !== false}
                onChange={(e) => handleChange('ui.autoSave', e.target.checked)}
              />
              Auto-save changes
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input 
                type="checkbox"
                checked={settings.ui?.showLineNumbers !== false}
                onChange={(e) => handleChange('ui.showLineNumbers', e.target.checked)}
              />
              Show line numbers in YAML viewer
            </label>
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

export default UISettingsModal;
