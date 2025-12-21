import React, { useEffect, useState } from 'react';
import { 
  readWidgetDefinitions, 
  writeWidgetDefinitions, 
  initialWidgetDefinitions
} from '../utils/widgetDefinitionsManager';
import { getSetting } from '../utils/settingsManager';
import './WidgetDefinitionsEditor.css';

export default function WidgetDefinitionsEditor({ settings, onDirtyChange }) {
  const [widgetDefinitions, setWidgetDefinitions] = useState(initialWidgetDefinitions);
  const [expandedWidgets, setExpandedWidgets] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [isDirty, setIsDirty] = useState(false);
  
  // Modal states
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [showEditWidgetModal, setShowEditWidgetModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [modalError, setModalError] = useState('');
  
  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    allowMultiple: false,
    hasConfig: false,
    configTemplate: ''
  });

  useEffect(() => {
    async function load() {
      const definitions = await readWidgetDefinitions(settings);
      setWidgetDefinitions(definitions);
      setIsDirty(false);
      if (onDirtyChange) onDirtyChange(false);
    }
    load();
  }, [settings, onDirtyChange]);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleWidget = (widgetName) => {
    setExpandedWidgets(prev => ({
      ...prev,
      [widgetName]: !prev[widgetName]
    }));
  };

  const collapseAll = () => {
    setExpandedWidgets({});
  };

  const expandAll = () => {
    const expanded = {};
    Object.keys(widgetDefinitions).forEach(name => expanded[name] = true);
    setExpandedWidgets(expanded);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setModalError('Widget name cannot be empty');
      return false;
    }
    
    // Check camelCase format
    if (!/^[a-z][a-zA-Z0-9]*$/.test(formData.name)) {
      setModalError('Widget name must be in camelCase (start with lowercase, no spaces)');
      return false;
    }
    
    if (!formData.displayName.trim()) {
      setModalError('Display name cannot be empty');
      return false;
    }
    
    // Check for duplicate name (only if adding or changing name)
    if (!editingWidget || editingWidget.name !== formData.name) {
      if (widgetDefinitions[formData.name]) {
        setModalError('Widget name already exists');
        return false;
      }
    }
    
    return true;
  };

  const handleAddWidget = () => {
    if (!validateForm()) return;
    
    const newDefinition = {
      name: formData.name.trim(),
      displayName: formData.displayName.trim(),
      description: formData.description.trim(),
      allowMultiple: formData.allowMultiple,
      hasConfig: formData.hasConfig,
      ...(formData.hasConfig && { configTemplate: formData.configTemplate.trim() })
    };
    
    setWidgetDefinitions({
      ...widgetDefinitions,
      [newDefinition.name]: newDefinition
    });
    setIsDirty(true);
    if (onDirtyChange) onDirtyChange(true);
    setShowAddWidgetModal(false);
    resetForm();
    showMessage(`Widget "${newDefinition.displayName}" added`, 'success');
  };

  const handleEditWidget = () => {
    if (!validateForm()) return;
    
    const updatedDefinition = {
      name: formData.name.trim(),
      displayName: formData.displayName.trim(),
      description: formData.description.trim(),
      allowMultiple: formData.allowMultiple,
      hasConfig: formData.hasConfig,
      ...(formData.hasConfig && { configTemplate: formData.configTemplate.trim() })
    };
    
    const updated = { ...widgetDefinitions };
    
    // If name changed, remove old entry
    if (editingWidget.name !== updatedDefinition.name) {
      delete updated[editingWidget.name];
    }
    
    updated[updatedDefinition.name] = updatedDefinition;
    
    setWidgetDefinitions(updated);
    setIsDirty(true);
    if (onDirtyChange) onDirtyChange(true);
    setShowEditWidgetModal(false);
    setEditingWidget(null);
    resetForm();
    showMessage('Widget definition updated', 'success');
  };

  const handleDeleteWidget = async (widgetName) => {
    if (window.confirm(`Delete widget "${widgetDefinitions[widgetName].displayName}"?`)) {
      const updated = { ...widgetDefinitions };
      delete updated[widgetName];
      setWidgetDefinitions(updated);
      setIsDirty(true);
      if (onDirtyChange) onDirtyChange(true);
      showMessage(`Widget "${widgetDefinitions[widgetName].displayName}" deleted`, 'success');
    }
  };

  const handleSave = async () => {
    try {
      await writeWidgetDefinitions(widgetDefinitions);
      setIsDirty(false);
      if (onDirtyChange) onDirtyChange(false);
      showMessage('✅ Saved successfully!', 'success');
    } catch (err) {
      showMessage(`❌ Error saving: ${err.message}`, 'error');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all widget definitions to defaults? This will delete any custom widgets you have added.')) {
      setWidgetDefinitions(initialWidgetDefinitions);
      setIsDirty(true);
      if (onDirtyChange) onDirtyChange(true);
      showMessage('Widget definitions reset to defaults', 'success');
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddWidgetModal(true);
  };

  const openEditModal = (widget) => {
    setEditingWidget(widget);
    setFormData({
      name: widget.name,
      displayName: widget.displayName,
      description: widget.description || '',
      allowMultiple: widget.allowMultiple || false,
      hasConfig: widget.hasConfig || false,
      configTemplate: widget.configTemplate || ''
    });
    setShowEditWidgetModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      allowMultiple: false,
      hasConfig: false,
      configTemplate: ''
    });
    setModalError('');
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setModalError('');
  };

  // Group widgets by type
  const allowMultipleWidgets = Object.values(widgetDefinitions).filter(w => w.allowMultiple);
  const allowOnceWidgets = Object.values(widgetDefinitions).filter(w => !w.allowMultiple);

  return (
    <div className="widget-definitions-editor">
      <div className="widget-info">
        <p>
          📄 Widget definitions are saved to: <code>{getSetting('files.defaultPath', '~/Documents/strava-config-tool/')}settings/widget-definitions.yaml</code>
        </p>
        <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-muted, #888)' }}>
          💡 <strong>Note:</strong> Changes to individual widgets are saved in memory. Click the <strong>Save</strong> button below to write all changes to the file.
        </p>
      </div>
      
      <div className="editor-header">
        <h3>Widget Definitions</h3>
        <div className="header-actions">
          <button 
            className="btn-secondary btn-sm"
            onClick={collapseAll}
            title="Collapse all widgets"
          >
            ▸ Collapse
          </button>
          <button 
            className="btn-secondary btn-sm"
            onClick={expandAll}
            title="Expand all widgets"
          >
            ▾ Expand
          </button>
          <button 
            className="btn-secondary"
            onClick={handleReset}
            title="Reset to default widget definitions"
          >
            ↺ Reset
          </button>
          <button 
            className="btn-secondary"
            onClick={openAddModal}
          >
            + Widget
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={!isDirty}
            title={isDirty ? 'Save changes to widget definitions' : 'No changes to save'}
          >
            💾 Save{isDirty ? ' *' : ''}
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="widget-info">
        <p>
          Widget definitions determine what widgets are available in the Dashboard editor. 
          Custom widgets can be added for future-proofing.
        </p>
      </div>

      {/* Widgets that allow multiple instances */}
      <div className="widget-section">
        <h4>Widgets that can be added multiple times ({allowMultipleWidgets.length})</h4>
        <div className="widgets-list">
          {allowMultipleWidgets.map(widget => (
            <div key={widget.name} className="widget-item">
              <div className="widget-header">
                <button 
                  className="widget-toggle"
                  onClick={() => toggleWidget(widget.name)}
                >
                  <span className="toggle-icon">
                    {expandedWidgets[widget.name] ? '▾' : '▸'}
                  </span>
                  <span className="widget-name">{widget.displayName}</span>
                  <span className="widget-badge">{widget.hasConfig ? 'Config' : 'No Config'}</span>
                </button>
                <div className="widget-actions">
                  <button
                    className="btn-icon"
                    onClick={() => openEditModal(widget)}
                    title="Edit widget definition"
                  >
                    ✎
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDeleteWidget(widget.name)}
                    title="Delete widget definition"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {expandedWidgets[widget.name] && (
                <div className="widget-details">
                  <div className="detail-row">
                    <strong>Name:</strong> <code>{widget.name}</code>
                  </div>
                  <div className="detail-row">
                    <strong>Description:</strong> {widget.description}
                  </div>
                  {widget.hasConfig && widget.configTemplate && (
                    <div className="detail-row">
                      <strong>Config Template:</strong>
                      <pre className="config-template">{widget.configTemplate}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Widgets that allow only one instance */}
      <div className="widget-section">
        <h4>Widgets that can be added once only ({allowOnceWidgets.length})</h4>
        <div className="widgets-list">
          {allowOnceWidgets.map(widget => (
            <div key={widget.name} className="widget-item">
              <div className="widget-header">
                <button 
                  className="widget-toggle"
                  onClick={() => toggleWidget(widget.name)}
                >
                  <span className="toggle-icon">
                    {expandedWidgets[widget.name] ? '▾' : '▸'}
                  </span>
                  <span className="widget-name">{widget.displayName}</span>
                  <span className="widget-badge">{widget.hasConfig ? 'Config' : 'No Config'}</span>
                </button>
                <div className="widget-actions">
                  <button
                    className="btn-icon"
                    onClick={() => openEditModal(widget)}
                    title="Edit widget definition"
                  >
                    ✎
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDeleteWidget(widget.name)}
                    title="Delete widget definition"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {expandedWidgets[widget.name] && (
                <div className="widget-details">
                  <div className="detail-row">
                    <strong>Name:</strong> <code>{widget.name}</code>
                  </div>
                  <div className="detail-row">
                    <strong>Description:</strong> {widget.description}
                  </div>
                  {widget.hasConfig && widget.configTemplate && (
                    <div className="detail-row">
                      <strong>Config Template:</strong>
                      <pre className="config-template">{widget.configTemplate}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Widget Modal */}
      {showAddWidgetModal && (
        <div className="modal-overlay" onClick={() => { setShowAddWidgetModal(false); resetForm(); }}>
          <div className="modal-content widget-modal" onClick={e => e.stopPropagation()}>
            <h4>Add Custom Widget</h4>
            {modalError && <div className="modal-error">{modalError}</div>}
            
            <div className="form-field">
              <label>Widget Name (camelCase)*</label>
              <input
                type="text"
                placeholder="myCustomWidget"
                value={formData.name}
                onChange={e => handleFormChange('name', e.target.value)}
              />
            </div>
            
            <div className="form-field">
              <label>Display Name*</label>
              <input
                type="text"
                placeholder="My Custom Widget"
                value={formData.displayName}
                onChange={e => handleFormChange('displayName', e.target.value)}
              />
            </div>
            
            <div className="form-field">
              <label>Description</label>
              <textarea
                placeholder="What does this widget do?"
                value={formData.description}
                onChange={e => handleFormChange('description', e.target.value)}
                rows="3"
              />
            </div>
            
            <div className="form-field checkbox-field">
              <label>
                <input
                  type="checkbox"
                  checked={formData.allowMultiple}
                  onChange={e => handleFormChange('allowMultiple', e.target.checked)}
                />
                Allow multiple instances
              </label>
            </div>
            
            <div className="form-field checkbox-field">
              <label>
                <input
                  type="checkbox"
                  checked={formData.hasConfig}
                  onChange={e => handleFormChange('hasConfig', e.target.checked)}
                />
                Has configuration options
              </label>
            </div>
            
            {formData.hasConfig && (
              <div className="form-field">
                <label>Config Template (YAML)</label>
                <textarea
                  placeholder="key: value"
                  value={formData.configTemplate}
                  onChange={e => handleFormChange('configTemplate', e.target.value)}
                  rows="5"
                  className="code-input"
                />
              </div>
            )}
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowAddWidgetModal(false); resetForm(); }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddWidget}>
                Add Widget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Widget Modal */}
      {showEditWidgetModal && editingWidget && (
        <div className="modal-overlay" onClick={() => { setShowEditWidgetModal(false); setEditingWidget(null); resetForm(); }}>
          <div className="modal-content widget-modal" onClick={e => e.stopPropagation()}>
            <h4>Edit Widget Definition</h4>
            {modalError && <div className="modal-error">{modalError}</div>}
            
            <div className="form-field">
              <label>Widget Name (camelCase)*</label>
              <input
                type="text"
                placeholder="myCustomWidget"
                value={formData.name}
                onChange={e => handleFormChange('name', e.target.value)}
              />
            </div>
            
            <div className="form-field">
              <label>Display Name*</label>
              <input
                type="text"
                placeholder="My Custom Widget"
                value={formData.displayName}
                onChange={e => handleFormChange('displayName', e.target.value)}
              />
            </div>
            
            <div className="form-field">
              <label>Description</label>
              <textarea
                placeholder="What does this widget do?"
                value={formData.description}
                onChange={e => handleFormChange('description', e.target.value)}
                rows="3"
              />
            </div>
            
            <div className="form-field checkbox-field">
              <label>
                <input
                  type="checkbox"
                  checked={formData.allowMultiple}
                  onChange={e => handleFormChange('allowMultiple', e.target.checked)}
                />
                Allow multiple instances
              </label>
            </div>
            
            <div className="form-field checkbox-field">
              <label>
                <input
                  type="checkbox"
                  checked={formData.hasConfig}
                  onChange={e => handleFormChange('hasConfig', e.target.checked)}
                />
                Has configuration options
              </label>
            </div>
            
            {formData.hasConfig && (
              <div className="form-field">
                <label>Config Template (YAML)</label>
                <textarea
                  placeholder="key: value"
                  value={formData.configTemplate}
                  onChange={e => handleFormChange('configTemplate', e.target.value)}
                  rows="5"
                  className="code-input"
                />
              </div>
            )}
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowEditWidgetModal(false); setEditingWidget(null); resetForm(); }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleEditWidget}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
