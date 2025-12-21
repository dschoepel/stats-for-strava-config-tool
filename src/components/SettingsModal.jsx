import React, { useState, useEffect } from 'react';
import SportsListEditor from './SportsListEditor';
import WidgetDefinitionsEditor from './WidgetDefinitionsEditor';
import { loadSettings, saveSettings, resetSettings, exportSettingsAsYaml, importSettingsFromYaml } from '../utils/settingsManager';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose, onSettingsChange }) => {
  const [settings, setSettings] = useState({}); // Will be loaded when modal opens
  const [activeTab, setActiveTab] = useState('ui');
  const [isDirty, setIsDirty] = useState(false);
  const [sportsListDirty, setSportsListDirty] = useState(false);
  const [widgetDefinitionsDirty, setWidgetDefinitionsDirty] = useState(false);
  const [importExportMode, setImportExportMode] = useState(null); // 'import' or 'export'
  const [yamlContent, setYamlContent] = useState('');

  // Initialize settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadedSettings = loadSettings();
      setSettings(loadedSettings);
      setIsDirty(false);
      setSportsListDirty(false);
      setWidgetDefinitionsDirty(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isDirty || sportsListDirty || widgetDefinitionsDirty) {
      let message;
      if (sportsListDirty) {
        message = 'You have unsaved changes in the Sports List. These changes will be lost if you close without saving.';
      } else if (widgetDefinitionsDirty) {
        message = 'You have unsaved changes in Widget Definitions. These changes will be lost if you close without saving.';
      } else {
        message = 'You have unsaved settings. These changes will be lost if you close without saving.';
      }
      
      if (window.confirm(`${message}\n\nAre you sure you want to close?`)) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleTabChange = (newTab) => {
    if (activeTab === 'sportsList' && sportsListDirty) {
      if (window.confirm('You have unsaved changes in the Sports List. These changes will be lost if you switch tabs.\n\nAre you sure you want to continue?')) {
        setSportsListDirty(false);
        setActiveTab(newTab);
      }
    } else if (activeTab === 'widgetDefinitions' && widgetDefinitionsDirty) {
      if (window.confirm('You have unsaved changes in Widget Definitions. These changes will be lost if you switch tabs.\n\nAre you sure you want to continue?')) {
        setWidgetDefinitionsDirty(false);
        setActiveTab(newTab);
      }
    } else {
      setActiveTab(newTab);
    }
  };



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
    saveSettings(settings);
    setIsDirty(false);
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettings();
      setSettings(loadSettings());
      setIsDirty(false);
      if (onSettingsChange) {
        onSettingsChange(loadSettings());
      }
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
    try {
      const imported = importSettingsFromYaml(yamlContent);
      setSettings(imported);
      setIsDirty(true);
      setImportExportMode(null);
      setYamlContent('');
    } catch (err) {
      console.error('Import error:', err);
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
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'sportsList', label: 'Sports List', icon: '🏅' },
    { id: 'widgetDefinitions', label: 'Widgets', icon: '🧩' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Settings</h2>
          <button onClick={handleClose} className="modal-close">✕</button>
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
                  onClick={() => handleTabChange(tab.id)}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}{(tab.id === 'sportsList' && sportsListDirty) || (tab.id === 'widgetDefinitions' && widgetDefinitionsDirty) ? ' *' : ''}</span>
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
                      min="1"
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
                      type="number"
                      min="10"
                      max="24"
                      value={settings.editor?.fontSize || 14}
                      onChange={(e) => handleSettingChange('editor.fontSize', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="setting-group">
                    <label>Tab size</label>
                    <input 
                      type="number"
                      min="2"
                      max="8"
                      value={settings.editor?.tabSize || 2}
                      onChange={(e) => handleSettingChange('editor.tabSize', parseInt(e.target.value))}
                    />
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

              {activeTab === 'sportsList' && (
                <SportsListEditor 
                  settings={settings} 
                  onDirtyChange={setSportsListDirty}
                />
              )}

              {activeTab === 'widgetDefinitions' && (
                <WidgetDefinitionsEditor 
                  settings={settings} 
                  onDirtyChange={setWidgetDefinitionsDirty}
                />
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
                <button onClick={handleClose} className="btn-secondary">
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