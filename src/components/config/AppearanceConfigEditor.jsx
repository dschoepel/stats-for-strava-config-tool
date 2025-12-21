import React, { useState, useEffect, useRef } from 'react';
import BaseConfigEditor from './BaseConfigEditor';
import { readSportsList, initialSportsList } from '../../utils/sportsListManager';
import CountrySelector from '../config-fields/CountrySelector';
import DashboardEditor from '../DashboardEditor';

/**
 * AppearanceConfigEditor - Handles appearance-specific configuration fields
 * Uses BaseConfigEditor for most fields with custom rendering for complex types
 */
const AppearanceConfigEditor = ({ 
  initialData, 
  onSave, 
  onCancel, 
  isLoading,
  onDirtyChange 
}) => {
  const [sportsList, setSportsList] = useState(initialSportsList);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [showDashboardEditor, setShowDashboardEditor] = useState(false);
  const [dashboardJustSaved, setDashboardJustSaved] = useState(false);
  const countryChangeHandlerRef = useRef(null);
  const [expandedGroups, setExpandedGroups] = useState({
    globalSettings: false,
    dateFormat: false,
    dashboard: false,
    heatmap: false,
    photos: false,
    sportTypesSortingOrder: false
  });
  const [expandedSportCategories, setExpandedSportCategories] = useState({});

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const collapseAll = () => {
    setExpandedGroups({
      globalSettings: false,
      dateFormat: false,
      dashboard: false,
      heatmap: false,
      photos: false,
      sportTypesSortingOrder: false
    });
  };

  const expandAll = () => {
    setExpandedGroups({
      globalSettings: true,
      dateFormat: true,
      dashboard: true,
      heatmap: true,
      photos: true,
      sportTypesSortingOrder: true
    });
  };

  // Load sports list for sport type selection
  useEffect(() => {
    async function loadSports() {
      try {
        const settings = JSON.parse(localStorage.getItem('config-tool-settings') || '{}');
        const list = await readSportsList(settings);
        setSportsList(list);
      } catch (error) {
        console.error('Error loading sports list:', error);
      }
    }
    loadSports();
  }, []);

  // Get flat array of all sport types
  const getAllSportTypes = () => {
    const allSports = [];
    Object.values(sportsList).forEach(categoryArray => {
      if (Array.isArray(categoryArray)) {
        allSports.push(...categoryArray);
      }
    });
    return allSports;
  };

  // Custom validation for appearance fields
  const validateAppearanceFields = (formData, getNestedValue) => {
    const errors = {};
    
    // Validate polyline color format
    const polylineColor = getNestedValue(formData, 'heatmap.polylineColor');
    if (polylineColor && !polylineColor.match(/^(#[0-9A-Fa-f]{3,6}|rgb|rgba|hsl|hsla|[a-z]+)/)) {
      errors['heatmap.polylineColor'] = 'Must be a valid CSS color (e.g., #fc6719, red, rgb(252, 103, 25))';
    }

    // Validate country code format if provided
    const countryCode = getNestedValue(formData, 'photos.defaultEnabledFilters.countryCode');
    if (countryCode && countryCode !== null && !countryCode.match(/^[A-Z]{2}$/)) {
      errors['photos.defaultEnabledFilters.countryCode'] = 'Must be a 2-letter uppercase ISO2 country code (e.g., US, GB, FR)';
    }

    return errors;
  };

  // Render sport type multi-select
  const renderSportTypeMultiSelect = (fieldName, fieldSchema, fieldPath, value, handleFieldChange, hasError) => {
    const selectedSports = Array.isArray(value) ? value : [];

    const handleSportToggle = (sport) => {
      const newSelection = selectedSports.includes(sport)
        ? selectedSports.filter(s => s !== sport)
        : [...selectedSports, sport];
      handleFieldChange(fieldPath, newSelection);
    };

    const toggleSportCategory = (category) => {
      setExpandedSportCategories(prev => ({
        ...prev,
        [category]: !prev[category]
      }));
    };

    return (
      <div key={fieldPath} className="form-field">
        <label className="field-label">
          {fieldSchema.title || fieldName}
        </label>
        {fieldSchema.description && (
          <p className="field-description">{fieldSchema.description}</p>
        )}
        <div className="sport-type-multiselect">
          {Object.keys(sportsList).length === 0 ? (
            <p className="sport-list-empty">
              No sports configured. Add sports in Settings → Sports List.
            </p>
          ) : (
            <div className="sport-categories">
              {Object.entries(sportsList).map(([category, sports]) => (
                <div key={category} className="sport-category">
                  <h5 
                    className="sport-category-header collapsible"
                    onClick={() => toggleSportCategory(category)}
                  >
                    <span className="group-toggle-icon">
                      {expandedSportCategories[category] !== false ? '▼' : '▶'}
                    </span>
                    {category}
                  </h5>
                  {expandedSportCategories[category] !== false && (
                    <div className="sport-type-grid">
                      {sports.map(sport => (
                        <label key={sport} className="sport-type-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedSports.includes(sport)}
                            onChange={() => handleSportToggle(sport)}
                          />
                          <span>{sport}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {hasError && <span className="field-error">{hasError}</span>}
      </div>
    );
  };

  // Render sport type sorting order (drag and drop or list)
  const renderSportTypeSortingOrder = (fieldName, fieldSchema, fieldPath, value, handleFieldChange, hasError) => {
    const allSports = getAllSportTypes();
    const sortingOrder = Array.isArray(value) ? value : [];

    const handleAddSport = (sport) => {
      if (!sortingOrder.includes(sport)) {
        handleFieldChange(fieldPath, [...sortingOrder, sport]);
      }
    };

    const handleRemoveSport = (sport) => {
      handleFieldChange(fieldPath, sortingOrder.filter(s => s !== sport));
    };

    const handleMoveUp = (index) => {
      if (index > 0) {
        const newOrder = [...sortingOrder];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        handleFieldChange(fieldPath, newOrder);
      }
    };

    const handleMoveDown = (index) => {
      if (index < sortingOrder.length - 1) {
        const newOrder = [...sortingOrder];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        handleFieldChange(fieldPath, newOrder);
      }
    };

    const availableSports = allSports.filter(sport => !sortingOrder.includes(sport));

    return (
      <div key={fieldPath} className="form-field">
        <label className="field-label">
          {fieldSchema.title || fieldName}
        </label>
        {fieldSchema.description && (
          <p className="field-description">{fieldSchema.description}</p>
        )}
        
        <div className="sport-sorting-container">
          {sortingOrder.length > 0 && (
            <div className="sorted-sports-list">
              <h6>Current Sort Order:</h6>
              {sortingOrder.map((sport, index) => (
                <div key={sport} className="sorted-sport-item">
                  <span className="sport-order-number">{index + 1}.</span>
                  <span className="sport-name">{sport}</span>
                  <div className="sport-actions">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="move-btn"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === sortingOrder.length - 1}
                      className="move-btn"
                      title="Move down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSport(sport)}
                      className="remove-btn"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {availableSports.length > 0 && (
            <div className="available-sports">
              <h6>Add Sport to Order:</h6>
              <div className="sport-categories">
                {Object.entries(sportsList).map(([category, categoryArray]) => {
                  const availableInCategory = categoryArray.filter(sport => !sortingOrder.includes(sport));
                  if (availableInCategory.length === 0) return null;
                  
                  return (
                    <div key={category} className="sport-category">
                      <h5 
                        className="sport-category-header collapsible"
                        onClick={() => setExpandedSportCategories(prev => ({
                          ...prev,
                          [`sorting_${category}`]: !prev[`sorting_${category}`]
                        }))}
                      >
                        <span className="group-toggle-icon">
                          {expandedSportCategories[`sorting_${category}`] !== false ? '▼' : '▶'}
                        </span>
                        {category}
                      </h5>
                      {expandedSportCategories[`sorting_${category}`] !== false && (
                        <div className="sport-type-grid">
                          {availableInCategory.map(sport => (
                            <button
                              key={sport}
                              type="button"
                              onClick={() => handleAddSport(sport)}
                              className="add-sport-btn"
                            >
                              + {sport}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {hasError && <span className="field-error">{hasError}</span>}
      </div>
    );
  };

  return (
    <>
      <BaseConfigEditor
        sectionName="appearance"
        initialData={initialData}
        onSave={onSave}
        onCancel={onCancel}
        isLoading={isLoading}
        onDirtyChange={onDirtyChange}
        customValidation={validateAppearanceFields}
      >
        {({ formData, errors, schema, handleFieldChange, getNestedValue, renderBasicField, renderObjectField }) => {
          // Store the change handler in ref for use in modal
          countryChangeHandlerRef.current = handleFieldChange;
          
          return (
            <>
              {/* Collapse/Expand All Controls */}
              <div className="group-controls">
                <button type="button" onClick={expandAll} className="group-control-btn">
                  Expand All
                </button>
                <button type="button" onClick={collapseAll} className="group-control-btn">
                  Collapse All
                </button>
              </div>

          {/* Global Appearance Settings Group */}
          {schema?.properties && (
            <div className="form-field-group">
              <h4 
                className="field-group-title collapsible" 
                onClick={() => toggleGroup('globalSettings')}
              >
                <span className="group-toggle-icon">{expandedGroups.globalSettings ? '▼' : '▶'}</span>
                Global Appearance Settings
              </h4>
              {expandedGroups.globalSettings && (
                <div className="field-group-content">
                  {schema.properties.locale && renderBasicField('locale', schema.properties.locale)}
                  {schema.properties.unitSystem && renderBasicField('unitSystem', schema.properties.unitSystem)}
                  {schema.properties.timeFormat && renderBasicField('timeFormat', schema.properties.timeFormat)}
                </div>
              )}
            </div>
          )}

          {schema?.properties && Object.entries(schema.properties).map(([fieldName, fieldSchema]) => {
            const value = getNestedValue(formData, fieldName);
            const hasError = errors[fieldName];

            // Skip fields that are in the Global Appearance Settings group
            if (fieldName === 'locale' || fieldName === 'unitSystem' || fieldName === 'timeFormat') {
              return null;
            }

            // Special handling for dateFormat - wrap in visual group
            if (fieldName === 'dateFormat') {
              return (
                <div key={fieldName} className="form-field-group">
                  <h4 
                    className="field-group-title collapsible" 
                    onClick={() => toggleGroup('dateFormat')}
                  >
                    <span className="group-toggle-icon">{expandedGroups.dateFormat ? '▼' : '▶'}</span>
                    {fieldSchema.title}
                  </h4>
                  {expandedGroups.dateFormat && (
                    <div className="field-group-content">
                      {fieldSchema.description && (
                        <p className="field-description">{fieldSchema.description}</p>
                      )}
                      {renderBasicField('dateFormat.short', fieldSchema.properties.short)}
                      {renderBasicField('dateFormat.normal', fieldSchema.properties.normal)}
                    </div>
                  )}
                </div>
              );
            }

            // Special handling for dashboard - wrap in visual group
            if (fieldName === 'dashboard') {
              return (
                <div key={fieldName} className="form-field-group">
                  <h4 
                    className="field-group-title collapsible" 
                    onClick={() => toggleGroup('dashboard')}
                  >
                    <span className="group-toggle-icon">{expandedGroups.dashboard ? '▼' : '▶'}</span>
                    {fieldSchema.title}
                  </h4>
                  {expandedGroups.dashboard && (
                    <div className="field-group-content">
                      {fieldSchema.description && (
                        <p className="field-description">{fieldSchema.description}</p>
                      )}
                      <div className="info-notice">
                        <span className="info-icon">ℹ️</span>
                        <span>
                          Dashboard layout is a complex nested structure. 
                          Use the Dashboard Editor below to view and manage your widgets.
                          Leave as <code>null</code> to use the default layout.
                        </span>
                      </div>
                      {dashboardJustSaved && (
                        <div className="warning-notice" style={{ marginTop: '12px' }}>
                          <span className="info-icon">⚠️</span>
                          <span>
                            Dashboard changes saved to form. <strong>Click the main Save button below to persist these changes to your config file.</strong>
                          </span>
                        </div>
                      )}
                      <div style={{ marginTop: '12px' }}>
                        <button 
                          type="button"
                          className="btn-secondary"
                          onClick={() => setShowDashboardEditor(true)}
                        >
                          📊 Edit Dashboard Layout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Special handling for sport type sorting - wrap in visual group
            if (fieldName === 'sportTypesSortingOrder') {
              return (
                <div key={fieldName} className="form-field-group">
                  <h4 
                    className="field-group-title collapsible" 
                    onClick={() => toggleGroup('sportTypesSortingOrder')}
                  >
                    <span className="group-toggle-icon">{expandedGroups.sportTypesSortingOrder ? '▼' : '▶'}</span>
                    {fieldSchema.title}
                  </h4>
                  {expandedGroups.sportTypesSortingOrder && (
                    <div className="field-group-content">
                      {fieldSchema.description && (
                        <p className="field-description">{fieldSchema.description}</p>
                      )}
                      {renderSportTypeSortingOrder(
                        fieldName, 
                        fieldSchema, 
                        fieldName, 
                        value, 
                        handleFieldChange, 
                        hasError
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Handle heatmap with special tileLayerUrl rendering
            if (fieldName === 'heatmap') {
              const tileLayerValue = getNestedValue(formData, 'heatmap.tileLayerUrl');
              const isArray = Array.isArray(tileLayerValue);
              
              return (
                <div key={fieldName} className="form-field-group">
                  <h4 
                    className="field-group-title collapsible" 
                    onClick={() => toggleGroup('heatmap')}
                  >
                    <span className="group-toggle-icon">{expandedGroups.heatmap ? '▼' : '▶'}</span>
                    {fieldSchema.title}
                  </h4>
                  {expandedGroups.heatmap && (
                    <div className="field-group-content">
                      {fieldSchema.description && (
                        <p className="field-description">{fieldSchema.description}</p>
                      )}
                      
                      {/* polylineColor */}
                      {renderBasicField('heatmap.polylineColor', fieldSchema.properties.polylineColor)}
                  
                  {/* tileLayerUrl - special handling for oneOf (string or array) */}
                  <div className="form-field">
                    <label htmlFor="heatmap.tileLayerUrl" className="field-label">
                      {fieldSchema.properties.tileLayerUrl.oneOf[0].title || 'Tile Layer URL'}
                    </label>
                    <p className="field-description">
                      URL template for map tiles. Can be a single URL or multiple URLs for layered maps.
                    </p>
                    
                    {!isArray ? (
                      <>
                        <input
                          type="text"
                          id="heatmap.tileLayerUrl"
                          value={tileLayerValue || ''}
                          onChange={(e) => handleFieldChange('heatmap.tileLayerUrl', e.target.value)}
                          className={`field-input ${errors['heatmap.tileLayerUrl'] ? 'error' : ''}`}
                          placeholder="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <button
                          type="button"
                          onClick={() => handleFieldChange('heatmap.tileLayerUrl', [tileLayerValue || ''])}
                          className="convert-to-array-btn"
                        >
                          Convert to Multiple Layers
                        </button>
                      </>
                    ) : (
                      <>
                        {tileLayerValue.map((url, index) => (
                          <div key={index} className="array-item">
                            <input
                              type="text"
                              value={url}
                              onChange={(e) => {
                                const newArray = [...tileLayerValue];
                                newArray[index] = e.target.value;
                                handleFieldChange('heatmap.tileLayerUrl', newArray);
                              }}
                              className="field-input"
                              placeholder={`Layer ${index + 1} URL`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newArray = tileLayerValue.filter((_, i) => i !== index);
                                handleFieldChange('heatmap.tileLayerUrl', newArray.length === 1 ? newArray[0] : newArray);
                              }}
                              className="remove-array-item-btn"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleFieldChange('heatmap.tileLayerUrl', [...tileLayerValue, ''])}
                          className="add-array-item-btn"
                        >
                          + Add Layer
                        </button>
                      </>
                    )}
                    {errors['heatmap.tileLayerUrl'] && <span className="field-error">{errors['heatmap.tileLayerUrl']}</span>}
                  </div>
                  
                  {/* enableGreyScale */}
                  {renderBasicField('heatmap.enableGreyScale', fieldSchema.properties.enableGreyScale)}
                    </div>
                  )}
                </div>
              );
            }

            // Handle nested sport type arrays in photos
            if (fieldName === 'photos') {
              return (
                <div key={fieldName} className="form-field-group">
                  <h4 
                    className="field-group-title collapsible" 
                    onClick={() => toggleGroup('photos')}
                  >
                    <span className="group-toggle-icon">{expandedGroups.photos ? '▼' : '▶'}</span>
                    {fieldSchema.title}
                  </h4>
                  {expandedGroups.photos && (
                    <div className="field-group-content">
                      {fieldSchema.description && (
                        <p className="field-description">{fieldSchema.description}</p>
                      )}
                  
                  {/* hidePhotosForSportTypes */}
                  {renderSportTypeMultiSelect(
                    'hidePhotosForSportTypes',
                    fieldSchema.properties.hidePhotosForSportTypes,
                    'photos.hidePhotosForSportTypes',
                    getNestedValue(formData, 'photos.hidePhotosForSportTypes'),
                    handleFieldChange,
                    errors['photos.hidePhotosForSportTypes']
                  )}

                  {/* defaultEnabledFilters.sportTypes */}
                  {renderSportTypeMultiSelect(
                    'sportTypes',
                    fieldSchema.properties.defaultEnabledFilters.properties.sportTypes,
                    'photos.defaultEnabledFilters.sportTypes',
                    getNestedValue(formData, 'photos.defaultEnabledFilters.sportTypes'),
                    handleFieldChange,
                    errors['photos.defaultEnabledFilters.sportTypes']
                  )}

                  {/* defaultEnabledFilters.countryCode */}
                  <div className="config-field">
                    <label className="field-label">
                      Country Code
                      {fieldSchema.properties.defaultEnabledFilters.properties.countryCode.description && (
                        <span className="field-description">
                          {fieldSchema.properties.defaultEnabledFilters.properties.countryCode.description}
                        </span>
                      )}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="field-input"
                        value={getNestedValue(formData, 'photos.defaultEnabledFilters.countryCode') || ''}
                        readOnly
                        placeholder="Click button to select country"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="field-button"
                        onClick={() => setShowCountrySelector(true)}
                      >
                        Select Country
                      </button>
                    </div>
                    {errors['photos.defaultEnabledFilters.countryCode'] && (
                      <div className="field-error">{errors['photos.defaultEnabledFilters.countryCode']}</div>
                    )}
                  </div>
                    </div>
                  )}
                </div>
              );
            }

            // Handle object types (but skip dashboard and dateFormat as they're already handled above)
            if ((fieldSchema.type === 'object' || (Array.isArray(fieldSchema.type) && fieldSchema.type.includes('object'))) 
                && fieldName !== 'dashboard' && fieldName !== 'dateFormat') {
              return renderObjectField(fieldName, fieldSchema);
            }

            // Default to basic field rendering
            return renderBasicField(fieldName, fieldSchema);
          })}
            </>
          );
        }}
      </BaseConfigEditor>
      
      {showCountrySelector && (
        <CountrySelector
          value={initialData?.photos?.defaultEnabledFilters?.countryCode}
          onChange={(countryCode) => {
            if (countryChangeHandlerRef.current) {
              countryChangeHandlerRef.current('photos.defaultEnabledFilters.countryCode', countryCode);
            }
          }}
          onClose={() => setShowCountrySelector(false)}
        />
      )}

      {showDashboardEditor && (
        <DashboardEditor
          dashboardLayout={initialData?.dashboard?.layout || []}
          onClose={() => setShowDashboardEditor(false)}
          onSave={(updatedLayout) => {
            // Update the dashboard.layout in the form data
            // This will trigger the dirty state in BaseConfigEditor
            if (countryChangeHandlerRef.current) {
              countryChangeHandlerRef.current('dashboard.layout', updatedLayout);
            }
            setShowDashboardEditor(false);
            setDashboardJustSaved(true);
            // Clear the indicator after 8 seconds
            setTimeout(() => setDashboardJustSaved(false), 8000);
          }}
        />
      )}
    </>
  );
};

export default AppearanceConfigEditor;
