import React, { useState, useEffect } from 'react';
import { loadSettings, saveSettings } from '../../utils/settingsManager';
import './SettingModal.css';

const EditorSettingsModal = ({ isOpen, onClose }) => {
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
          <h2>📝 Editor Settings</h2>
          <button onClick={handleClose} className="modal-close">✕</button>
        </div>

        <div className="modal-body">
          <div className="setting-group">
            <label>Font size</label>
            <input 
              type="number"
              min="10"
              max="24"
              value={settings.editor?.fontSize || 14}
              onChange={(e) => handleChange('editor.fontSize', parseInt(e.target.value))}
            />
          </div>

          <div className="setting-group">
            <label>Tab size</label>
            <input 
              type="number"
              min="2"
              max="8"
              value={settings.editor?.tabSize || 2}
              onChange={(e) => handleChange('editor.tabSize', parseInt(e.target.value))}
            />
          </div>

          <div className="setting-group">
            <label>
              <input 
                type="checkbox"
                checked={settings.editor?.wordWrap !== false}
                onChange={(e) => handleChange('editor.wordWrap', e.target.checked)}
              />
              Enable word wrap
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input 
                type="checkbox"
                checked={settings.ui?.showLineNumbers !== false}
                onChange={(e) => handleChange('ui.showLineNumbers', e.target.checked)}
              />
              Show line numbers
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input 
                type="checkbox"
                checked={settings.editor?.highlightSearch !== false}
                onChange={(e) => handleChange('editor.highlightSearch', e.target.checked)}
              />
              Highlight search matches
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

export default EditorSettingsModal;
