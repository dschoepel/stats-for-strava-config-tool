import React, { useState } from 'react';
import { loadSettings, saveSettings, resetSettings, exportSettingsAsYaml, importSettingsFromYaml } from '../utils/settingsManager';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose, onSettingsChange }) => {
  const [settings, setSettings] = useState(() => loadSettings());
  const [activeTab, setActiveTab] = useState('ui');
  const [isDirty, setIsDirty] = useState(false);
  const [importExportMode, setImportExportMode] = useState(null); // 'import' or 'export'
  const [yamlContent, setYamlContent] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize settings when modal opens
  if (isOpen && !isInitialized) {
    setSettings(loadSettings());
    setIsDirty(false);
    setIsInitialized(true);
  } else if (!isOpen && isInitialized) {
    setIsInitialized(false);
  }

  const handleSettingChange = (path, value) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    
    let current = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (saveSettings(settings)) {
      setIsDirty(false);
      onSettingsChange?.(settings);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      const defaultSettings = resetSettings();
      setSettings(defaultSettings);
      setIsDirty(false);
      onSettingsChange?.(defaultSettings);
    }
  };

  const handleExport = () => {
    const yamlString = exportSettingsAsYaml();
    setYamlContent(yamlString);
    setImportExportMode('export');
  };

  const handleImport = () => {
    setYamlContent('');
    setImportExportMode('import');
  };

  const handleImportConfirm = () => {
    if (importSettingsFromYaml(yamlContent)) {
      const importedSettings = loadSettings();
      setSettings(importedSettings);
      setIsDirty(false);
      setImportExportMode(null);
      setYamlContent('');
      onSettingsChange?.(importedSettings);
    } else {
      alert('Failed to import settings. Please check the YAML format.');
    }
  };

  const downloadSettings = () => {
    const yamlString = exportSettingsAsYaml();
    const blob = new Blob([yamlString], { type: 'text/yaml' });
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

  const tabs = [
    { id: 'ui', label: 'User Interface', icon: '🎨' },
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'editor', label: 'Editor', icon: '📝' },
    { id: 'performance', label: 'Performance', icon: '⚡' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Settings</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        {importExportMode ? (
          <div className="import-export-section">
            <div className="import-export-header">
              <h3>{importExportMode === 'export' ? '📤 Export Settings' : '📥 Import Settings'}</h3>
              <button 
                onClick={() => {
                  setImportExportMode(null);
                  setYamlContent('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
            
            <div className="yaml-editor">
              <textarea
                value={yamlContent}
                onChange={(e) => setYamlContent(e.target.value)}
                placeholder={importExportMode === 'import' ? 'Paste YAML settings here...' : ''}
                readOnly={importExportMode === 'export'}
                rows={20}
              />
            </div>
            
            <div className="import-export-actions">
              {importExportMode === 'export' ? (
                <button onClick={downloadSettings} className="btn-primary">
                  💾 Download as File
                </button>
              ) : (
                <button onClick={handleImportConfirm} className="btn-primary">
                  📥 Import Settings
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="modal-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="modal-body">
              {activeTab === 'ui' && (
                <div className="settings-section">
                  <h3>User Interface Settings</h3>
                  
                  <div className="setting-group">
                    <label>Theme</label>
                    <select 
                      value={settings.ui?.theme || 'dark'}
                      onChange={(e) => handleSettingChange('ui.theme', e.target.value)}
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
                        onChange={(e) => handleSettingChange('ui.sidebarCollapsed', e.target.checked)}
                      />
                      Start with sidebar collapsed
                    </label>
                  </div>

                  <div className="setting-group">
                    <label>
                      <input 
                        type="checkbox"
                        checked={settings.ui?.autoSave || true}
                        onChange={(e) => handleSettingChange('ui.autoSave', e.target.checked)}
                      />
                      Auto-save changes
                    </label>
                  </div>

                  <div className="setting-group">
                    <label>
                      <input 
                        type="checkbox"
                        checked={settings.ui?.showLineNumbers || true}
                        onChange={(e) => handleSettingChange('ui.showLineNumbers', e.target.checked)}
                      />
                      Show line numbers in YAML viewer
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'files' && (
                <div className="settings-section">
                  <h3>File Settings</h3>
                  
                  <div className="setting-group">
                    <label>Default file path</label>
                    <input 
                      type="text"
                      value={settings.files?.defaultPath || ''}
                      onChange={(e) => handleSettingChange('files.defaultPath', e.target.value)}
                      placeholder="~/Documents/strava-config-tool/"
                    />
                  </div>

                  <div className="setting-group">
                    <label>
                      <input 
                        type="checkbox"
                        checked={settings.files?.autoBackup || true}
                        onChange={(e) => handleSettingChange('files.autoBackup', e.target.checked)}
                      />
                      Create automatic backups
                    </label>
                  </div>

                  <div className="setting-group">
                    <label>
                      <input 
                        type="checkbox"
                        checked={settings.files?.validateOnLoad || true}
                        onChange={(e) => handleSettingChange('files.validateOnLoad', e.target.checked)}
                      />
                      Validate YAML syntax on file load
                    </label>
                  </div>

                  <div className="setting-group">
                    <label>Maximum recent files</label>
                    <input 
                      type="number"
                      min="5"
                      max="50"
                      value={settings.files?.maxRecentFiles || 10}
                      onChange={(e) => handleSettingChange('files.maxRecentFiles', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'editor' && (
                <div className="settings-section">
                  <h3>Editor Settings</h3>
                  
                  <div className="setting-group">
                    <label>Font size</label>
                    <input 
                      type="range"
                      min="10"
                      max="24"
                      value={settings.editor?.fontSize || 14}
                      onChange={(e) => handleSettingChange('editor.fontSize', parseInt(e.target.value))}
                    />
                    <span className="range-value">{settings.editor?.fontSize || 14}px</span>
                  </div>

                  <div className="setting-group">
                    <label>Tab size</label>
                    <select 
                      value={settings.editor?.tabSize || 2}
                      onChange={(e) => handleSettingChange('editor.tabSize', parseInt(e.target.value))}
                    >
                      <option value={2}>2 spaces</option>
                      <option value={4}>4 spaces</option>
                      <option value={8}>8 spaces</option>
                    </select>
                  </div>

                  <div className="setting-group">
                    <label>
                      <input 
                        type="checkbox"
                        checked={settings.editor?.wordWrap || true}
                        onChange={(e) => handleSettingChange('editor.wordWrap', e.target.checked)}
                      />
                      Enable word wrap
                    </label>
                  </div>

                  <div className="setting-group">
                    <label>
                      <input 
                        type="checkbox"
                        checked={settings.editor?.highlightSearch || true}
                        onChange={(e) => handleSettingChange('editor.highlightSearch', e.target.checked)}
                      />
                      Highlight search matches
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="settings-section">
                  <h3>Performance Settings</h3>
                  
                  <div className="setting-group">
                    <label>Maximum file size (MB)</label>
                    <input 
                      type="number"
                      min="1"
                      max="100"
                      value={Math.round((settings.performance?.maxFileSize || 10485760) / 1024 / 1024)}
                      onChange={(e) => handleSettingChange('performance.maxFileSize', parseInt(e.target.value) * 1024 * 1024)}
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
                      onChange={(e) => handleSettingChange('performance.searchTimeout', parseInt(e.target.value))}
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
                      onChange={(e) => handleSettingChange('performance.autoSaveInterval', parseInt(e.target.value) * 1000)}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="modal-footer">
          {!importExportMode && (
            <>
              <div className="footer-left">
                <button onClick={handleExport} className="btn-secondary">
                  📤 Export
                </button>
                <button onClick={handleImport} className="btn-secondary">
                  📥 Import
                </button>
                <button onClick={handleReset} className="btn-danger">
                  🔄 Reset to Defaults
                </button>
              </div>
              
              <div className="footer-right">
                <button onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  className="btn-primary"
                  disabled={!isDirty}
                >
                  💾 Save Settings
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;