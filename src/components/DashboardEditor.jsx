import React, { useState, useEffect } from 'react';
import { readWidgetDefinitions } from '../utils/widgetDefinitionsManager';
import './DashboardEditor.css';

export default function DashboardEditor({ dashboardLayout, onClose, onSave }) {
  const [widgetDefinitions, setWidgetDefinitions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [layout, setLayout] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [expandedConfigs, setExpandedConfigs] = useState({});
  const [expandedWidgets, setExpandedWidgets] = useState({});

  useEffect(() => {
    async function loadDefinitions() {
      try {
        const definitions = await readWidgetDefinitions();
        setWidgetDefinitions(definitions);
      } catch (error) {
        console.error('Error loading widget definitions:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDefinitions();
  }, []);

  useEffect(() => {
    // Initialize layout from props
    setLayout(dashboardLayout || []);
  }, [dashboardLayout]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      if (isDirty) {
        if (window.confirm('You have unsaved changes. Discard them?')) {
          onClose();
        }
      } else {
        onClose();
      }
    }
  };

  // Move widget up in the list
  const moveUp = (index) => {
    if (index === 0) return;
    const newLayout = [...layout];
    [newLayout[index - 1], newLayout[index]] = [newLayout[index], newLayout[index - 1]];
    setLayout(newLayout);
    setIsDirty(true);
  };

  // Move widget down in the list
  const moveDown = (index) => {
    if (index === layout.length - 1) return;
    const newLayout = [...layout];
    [newLayout[index], newLayout[index + 1]] = [newLayout[index + 1], newLayout[index]];
    setLayout(newLayout);
    setIsDirty(true);
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newLayout = [...layout];
    const draggedItem = newLayout[draggedIndex];
    newLayout.splice(draggedIndex, 1);
    newLayout.splice(index, 0, draggedItem);
    
    setLayout(newLayout);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(layout);
    setIsDirty(false);
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Discard them?')) {
        setLayout(dashboardLayout || []);
        setIsDirty(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Delete widget from layout
  const handleDeleteWidget = (index) => {
    if (window.confirm('Remove this widget from the dashboard?')) {
      const newLayout = layout.filter((_, i) => i !== index);
      setLayout(newLayout);
      setIsDirty(true);
    }
  };

  // Update widget width
  const handleWidthChange = (index, newWidth) => {
    const newLayout = [...layout];
    newLayout[index] = { ...newLayout[index], width: Number(newWidth) };
    setLayout(newLayout);
    setIsDirty(true);
  };

  // Toggle widget enabled state
  const handleEnabledToggle = (index) => {
    const newLayout = [...layout];
    newLayout[index] = { ...newLayout[index], enabled: !newLayout[index].enabled };
    setLayout(newLayout);
    setIsDirty(true);
  };

  // Toggle widget expansion (show/hide details)
  const toggleWidgetExpansion = (index) => {
    setExpandedWidgets(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Toggle config editor expansion
  const toggleConfigEditor = (index) => {
    setExpandedConfigs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Update a config value
  const handleConfigChange = (index, configKey, value) => {
    const newLayout = [...layout];
    newLayout[index] = {
      ...newLayout[index],
      config: {
        ...newLayout[index].config,
        [configKey]: value
      }
    };
    setLayout(newLayout);
    setIsDirty(true);
  };

  // Add widget to layout
  const handleAddWidget = (widgetName) => {
    const widgetDef = widgetDefinitions[widgetName];
    if (!widgetDef) return;

    const newWidget = {
      name: widgetName,
      width: 100,
      enabled: true
    };

    // Add default config if widget has config options
    if (widgetDef.hasConfig && widgetDef.defaultConfig) {
      newWidget.config = { ...widgetDef.defaultConfig };
    }

    setLayout([...layout, newWidget]);
    setIsDirty(true);
  };

  // Get available widgets for the add dropdown
  const getAvailableWidgets = () => {
    const widgetsInLayout = layout.map(w => w.name);
    
    return Object.values(widgetDefinitions).filter(def => {
      // If widget allows multiple instances, always show it
      if (def.allowMultiple) return true;
      
      // If widget doesn't allow multiple instances, only show if not already in layout
      return !widgetsInLayout.includes(def.name);
    }).sort((a, b) => a.displayName.localeCompare(b.displayName));
  };

  // Get widget display name from definitions
  const getWidgetDisplayName = (widgetName) => {
    const def = widgetDefinitions[widgetName];
    return def ? def.displayName : widgetName;
  };

  // Get widget description from definitions
  const getWidgetDescription = (widgetName) => {
    const def = widgetDefinitions[widgetName];
    return def ? def.description : '';
  };

  // Convert config object to YAML string for display
  const configToYAML = (config, indent = 0) => {
    const spaces = '  '.repeat(indent);
    const lines = [];
    
    for (const [key, value] of Object.entries(config)) {
      // Check if this is a single-key nested object with the same key (flatten it)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const valueKeys = Object.keys(value);
        if (valueKeys.length === 1 && valueKeys[0] === key) {
          // Flatten: use the nested value directly
          const flatValue = value[key];
          if (Array.isArray(flatValue)) {
            if (flatValue.length === 0) {
              lines.push(`${spaces}${key}: []`);
            } else {
              lines.push(`${spaces}${key}:`);
              flatValue.forEach(item => {
                lines.push(`${spaces}  - ${item}`);
              });
            }
          } else {
            lines.push(`${spaces}${key}: ${flatValue}`);
          }
          continue;
        }
      }
      
      if (Array.isArray(value)) {
        if (value.length === 0) {
          lines.push(`${spaces}${key}: []`);
        } else {
          lines.push(`${spaces}${key}:`);
          value.forEach(item => {
            if (typeof item === 'string') {
              lines.push(`${spaces}  - ${item}`);
            } else {
              lines.push(`${spaces}  - ${item}`);
            }
          });
        }
      } else if (typeof value === 'object' && value !== null) {
        lines.push(`${spaces}${key}:`);
        lines.push(configToYAML(value, indent + 1));
      } else if (typeof value === 'string') {
        lines.push(`${spaces}${key}: "${value}"`);
      } else {
        lines.push(`${spaces}${key}: ${value}`);
      }
    }
    
    return lines.join('\n');
  };

  // Render appropriate input control based on config value type
  const renderConfigInput = (widgetIndex, configKey, configValue) => {
    // Handle number inputs
    if (typeof configValue === 'number') {
      const minValue = 0;
      const maxValue = configKey === 'enableLastXYearsByDefault' ? 50 : 100;
      
      return (
        <input
          type="number"
          className="config-input-number"
          value={configValue}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (!isNaN(val) && val >= minValue && val <= maxValue) {
              handleConfigChange(widgetIndex, configKey, val);
            }
          }}
          min={minValue}
          max={maxValue}
          title={`Enter a number between ${minValue} and ${maxValue}`}
        />
      );
    }
    
    // Handle boolean inputs
    if (typeof configValue === 'boolean') {
      return (
        <label className="config-checkbox-label">
          <input
            type="checkbox"
            className="config-input-checkbox"
            checked={configValue}
            onChange={(e) => handleConfigChange(widgetIndex, configKey, e.target.checked)}
          />
          <span>{configValue ? 'Yes' : 'No'}</span>
        </label>
      );
    }
    
    // Handle array inputs (simple tag/multi-select)
    if (Array.isArray(configValue)) {
      const availableOptions = ['distance', 'movingTime', 'elevation', 'activities'];
      
      return (
        <div className="config-array-editor">
          <div className="config-array-items">
            {configValue.map((item, itemIndex) => (
              <div key={itemIndex} className="config-array-item">
                <span>{item}</span>
                <button
                  className="btn-array-remove"
                  onClick={() => {
                    const newArray = configValue.filter((_, i) => i !== itemIndex);
                    handleConfigChange(widgetIndex, configKey, newArray);
                  }}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <select
            className="config-array-add"
            value=""
            onChange={(e) => {
              if (e.target.value && !configValue.includes(e.target.value)) {
                handleConfigChange(widgetIndex, configKey, [...configValue, e.target.value]);
              }
            }}
          >
            <option value="">+ Add item...</option>
            {availableOptions.filter(opt => !configValue.includes(opt)).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }
    
    // Handle nested objects (show as read-only for now)
    if (typeof configValue === 'object' && configValue !== null) {
      return (
        <div className="config-complex">
          <span className="config-complex-note">Complex configuration - use Widget Definitions Editor in Settings</span>
        </div>
      );
    }
    
    // Fallback for string or other types
    return (
      <input
        type="text"
        className="config-input-text"
        value={configValue}
        onChange={(e) => handleConfigChange(widgetIndex, configKey, e.target.value)}
      />
    );
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content dashboard-modal">
        <div className="modal-header">
          <h3>Dashboard Layout Editor</h3>
          <button 
            className="btn-close" 
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <p>Loading widget definitions...</p>
          </div>
        ) : (
          <>
            <div className="dashboard-info">
              <div className="info-row">
                <p>
                  {layout && layout.length > 0 
                    ? `${layout.length} widget${layout.length !== 1 ? 's' : ''} in dashboard layout`
                    : 'No widgets configured in dashboard'}
                </p>
                {layout && layout.length > 0 && (
                  <button
                    className="btn-reset"
                    onClick={() => {
                      if (window.confirm('Reset to default layout? This will remove all widgets and cannot be undone.')) {
                        setLayout([]);
                        setIsDirty(true);
                      }
                    }}
                    title="Clear all widgets"
                  >
                    🔄 Reset
                  </button>
                )}
              </div>
              {isDirty && (
                <p className="dirty-indicator">
                  ⚠️ You have unsaved changes
                </p>
              )}
            </div>

            <div className="widgets-list">
              {!layout || layout.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <p className="empty-title">No widgets in dashboard</p>
                  <p className="empty-hint">Add widgets using the dropdown below to customize your dashboard layout.</p>
                  <p className="empty-tip">💡 Tip: You can reorder widgets by dragging them or using the arrow buttons.</p>
                </div>
              ) : (
                layout.map((widget, index) => (
                  <div 
                    key={index} 
                    className={`widget-item ${draggedIndex === index ? 'dragging' : ''} ${expandedWidgets[index] ? 'expanded' : 'collapsed'}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="widget-header">
                      <div className="drag-handle" title="Drag to reorder">
                        ⋮⋮
                      </div>
                      <button
                        className="btn-expand"
                        onClick={() => toggleWidgetExpansion(index)}
                        title={expandedWidgets[index] ? "Collapse" : "Expand"}
                      >
                        {expandedWidgets[index] ? '▼' : '▶'}
                      </button>
                      <div className="widget-info">
                        <div className="widget-name-row">
                          <span 
                            className="widget-display-name"
                            title={getWidgetDescription(widget.name)}
                          >
                            {getWidgetDisplayName(widget.name)}
                          </span>
                          <span className="widget-code-name">
                            ({widget.name})
                          </span>
                        </div>
                      </div>
                      <div className="widget-actions">
                        <button
                          className="btn-icon btn-move"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          className="btn-icon btn-move"
                          onClick={() => moveDown(index)}
                          disabled={index === layout.length - 1}
                          title="Move down"
                        >
                          ▼
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDeleteWidget(index)}
                          title="Remove widget"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    {expandedWidgets[index] && (
                      <>
                        <div className="widget-properties">
                      <div className="property-group">
                        <label htmlFor={`width-${index}`} className="property-label">Width:</label>
                        <select 
                          id={`width-${index}`}
                          className="property-select"
                          value={widget.width}
                          onChange={(e) => handleWidthChange(index, e.target.value)}
                          title="Widget width as percentage"
                        >
                          <option value="33">33%</option>
                          <option value="50">50%</option>
                          <option value="66">66%</option>
                          <option value="100">100%</option>
                        </select>
                      </div>
                      
                      <div className="property-group">
                        <label htmlFor={`enabled-${index}`} className="property-label">Enabled:</label>
                        <button
                          id={`enabled-${index}`}
                          className={`property-toggle ${widget.enabled ? 'enabled' : 'disabled'}`}
                          onClick={() => handleEnabledToggle(index)}
                          title={widget.enabled ? 'Click to disable' : 'Click to enable'}
                        >
                          {!widget.enabled && (
                            <span className="toggle-label">
                              No
                            </span>
                          )}
                          <span className="toggle-switch"></span>
                          {widget.enabled && (
                            <span className="toggle-label">
                              Yes
                            </span>
                          )}
                        </button>
                      </div>
                      
                      {widget.config && Object.keys(widget.config).length > 0 && (
                        <div className="property-group config-info">
                          <span className="property-label">Config:</span>
                          <span className="property-value config-badge">
                            ✓ {Object.keys(widget.config).length} setting{Object.keys(widget.config).length !== 1 ? 's' : ''}
                          </span>
                          <button
                            className="btn-config-edit"
                            onClick={() => toggleConfigEditor(index)}
                            title="Edit configuration"
                          >
                            {expandedConfigs[index] ? '▼' : '▶'} Edit
                          </button>
                          <div className="config-tooltip">
                            <pre>{configToYAML(widget.config)}</pre>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expandable Config Editor */}
                    {expandedConfigs[index] && widget.config && (
                      <div className="config-editor">
                        <div className="config-editor-header">
                          <span>Configuration Settings</span>
                        </div>
                        <div className="config-editor-fields">
                          {Object.entries(widget.config).map(([configKey, configValue]) => (
                            <div key={configKey} className="config-field">
                              <label className="config-field-label">{configKey}:</label>
                              {renderConfigInput(index, configKey, configValue)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="add-widget-section">
              <label htmlFor="add-widget-select" className="add-widget-label">
                Add Widget:
              </label>
              <select 
                id="add-widget-select"
                className="add-widget-select"
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddWidget(e.target.value);
                    e.target.value = ''; // Reset dropdown
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Select a widget to add...</option>
                {getAvailableWidgets().map(def => (
                  <option key={def.name} value={def.name}>
                    {def.displayName}
                    {def.allowMultiple ? ' (can add multiple)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSave}
                disabled={!isDirty}
              >
                💾 Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
