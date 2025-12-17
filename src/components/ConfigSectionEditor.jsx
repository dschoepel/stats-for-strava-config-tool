import React, { useState, useEffect } from 'react';
import { getSchemaBySection } from '../schemas/configSchemas';
import './ConfigSectionEditor.css';

// Heart rate calculation functions
const heartRateFormulas = {
  arena: (age) => Math.round(209.3 - (0.7 * age)),
  astrand: (age) => Math.round(216.6 - (0.84 * age)),
  fox: (age) => Math.round(220 - age),
  gellish: (age) => Math.round(207 - (0.7 * age)),
  nes: (age) => Math.round(211 - (0.64 * age)),
  tanaka: (age) => Math.round(208 - (0.7 * age))
};

const calculateAge = (birthday) => {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const calculateMaxHeartRate = (birthday, formula) => {
  if (!birthday || !formula) return null;
  const age = calculateAge(birthday);
  if (age === null || typeof formula !== 'string') return null;
  
  const calculator = heartRateFormulas[formula];
  return calculator ? calculator(age) : null;
};

const calculateDefaultZones = (maxHR, mode) => {
  if (!maxHR) return null;
  
  const zoneRanges = [
    { from: 50, to: 60 },  // Zone 1
    { from: 61, to: 70 },  // Zone 2  
    { from: 71, to: 80 },  // Zone 3
    { from: 81, to: 90 },  // Zone 4
    { from: 91, to: null } // Zone 5
  ];
  
  const zones = {};
  zoneRanges.forEach((range, index) => {
    const zoneNum = index + 1;
    if (mode === 'relative') {
      zones[`zone${zoneNum}`] = {
        from: range.from,
        to: range.to
      };
    } else { // absolute
      zones[`zone${zoneNum}`] = {
        from: Math.round((range.from / 100) * maxHR),
        to: range.to === null ? null : Math.round((range.to / 100) * maxHR)
      };
    }
  });
  
  return zones;
};

const ConfigSectionEditor = ({ 
  sectionName, 
  initialData = {}, 
  onSave, 
  onCancel,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const schema = React.useMemo(() => getSchemaBySection(sectionName), [sectionName]);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleFieldChange = (fieldPath, value) => {
    // Get the field schema to check if null is allowed
    const fieldSchema = getFieldSchema(schema, fieldPath);
    
    // Convert empty strings to null for fields that allow null values
    let processedValue = value;
    if (value === '' && fieldSchema && Array.isArray(fieldSchema.type) && fieldSchema.type.includes('null')) {
      processedValue = null;
    }
    
    setFormData(prev => {
      const newData = { ...prev };
      setNestedValue(newData, fieldPath, processedValue);
      return newData;
    });
    
    // Clear error for this field when user starts typing
    if (errors[fieldPath]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldPath];
        return newErrors;
      });
    }
  };

  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  };

  // Helper function to get field schema by path
  const getFieldSchema = (schema, fieldPath) => {
    if (!schema?.properties) return null;
    
    const keys = fieldPath.split('.');
    let current = schema.properties[keys[0]];
    
    for (let i = 1; i < keys.length; i++) {
      if (!current?.properties) return null;
      current = current.properties[keys[i]];
    }
    
    return current;
  };

  const getNestedValue = (obj, path, defaultValue = '') => {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !Object.prototype.hasOwnProperty.call(current, key)) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation based on schema requirements
    if (schema?.required) {
      schema.required.forEach(field => {
        const value = getNestedValue(formData, field);
        if (value === undefined || value === null || value === '') {
          newErrors[field] = `${field} is required`;
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  // Handle zone value changes with chaining logic
  const handleZoneChange = (zoneNumber, field, newValue) => {
    const zones = { ...(formData.heartRateZones?.default || {}) };
    
    // Update the current zone
    if (!zones[`zone${zoneNumber}`]) {
      zones[`zone${zoneNumber}`] = {};
    }
    zones[`zone${zoneNumber}`][field] = newValue === '' ? null : parseInt(newValue);
    
    // If changing a "to" value, update next zone's "from" value (chaining)
    if (field === 'to' && zoneNumber < 5 && newValue !== '' && newValue !== null) {
      const nextZoneNum = zoneNumber + 1;
      if (!zones[`zone${nextZoneNum}`]) {
        zones[`zone${nextZoneNum}`] = {};
      }
      zones[`zone${nextZoneNum}`].from = parseInt(newValue) + 1;
    }
    
    // Update form data
    handleFieldChange('heartRateZones.default', zones);
  };

  // Auto-populate zones based on birthday, formula and mode
  const autoPopulateZones = () => {
    const birthday = formData.birthday;
    const formula = formData.maxHeartRateFormula;
    const mode = formData.heartRateZones?.mode || 'relative';
    
    const maxHR = calculateMaxHeartRate(birthday, formula);
    if (maxHR) {
      const defaultZones = calculateDefaultZones(maxHR, mode);
      if (defaultZones) {
        handleFieldChange('heartRateZones.default', defaultZones);
      }
    }
  };

  // Auto-populate zones when mode changes or when birthday/formula changes
  React.useEffect(() => {
    const birthday = formData.birthday;
    const formula = formData.maxHeartRateFormula;
    const mode = formData.heartRateZones?.mode;
    
    if (birthday && formula && mode) {
      autoPopulateZones();
    }
  }, [formData.birthday, formData.maxHeartRateFormula, formData.heartRateZones?.mode]);

  const renderHeartRateZones = (fieldName, fieldSchema, fieldPath, value, hasError) => {
    const currentZones = value?.default || {};
    const currentMode = value?.mode || 'relative';
    const birthday = formData.birthday;
    const formula = formData.maxHeartRateFormula;
    const maxHR = calculateMaxHeartRate(birthday, formula);
    
    return (
      <div key={fieldPath} className="form-field heart-rate-zones">
        <div className="field-label-section">
          <h4 className="field-label">{fieldSchema.title || fieldName}</h4>
          {fieldSchema.description && (
            <p className="field-description">{fieldSchema.description}</p>
          )}
          <p className="zones-subtitle">Default heart rate zones for all activities</p>
        </div>

        {/* Mode Selection */}
        <div className="zone-mode-section">
          <label htmlFor="heartRateZones.mode" className="field-label">
            Zone Mode
            {schema?.required?.includes(fieldName) && <span className="required">*</span>}
          </label>
          <select
            id="heartRateZones.mode"
            value={currentMode}
            onChange={(e) => handleFieldChange('heartRateZones.mode', e.target.value)}
            className="field-input select-input"
          >
            <option value="relative">Relative (%)</option>
            <option value="absolute">Absolute (BPM)</option>
          </select>
        </div>



        {/* Zone Table */}
        <div className="zones-table-container">
          <table className="zones-table">
            <thead>
              <tr>
                <th>Values</th>
                <th>Zone-1</th>
                <th>Zone-2</th>
                <th>Zone-3</th>
                <th>Zone-4</th>
                <th>Zone-5</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>From {currentMode === 'relative' ? '(%)' : '(BPM)'}:</th>
                {[1, 2, 3, 4, 5].map(zoneNum => (
                  <td key={`zone${zoneNum}-from`}>
                    <input
                      type="number"
                      value={currentZones[`zone${zoneNum}`]?.from || ''}
                      onChange={(e) => handleZoneChange(zoneNum, 'from', e.target.value)}
                      className="zone-input"
                      min="0"
                      max="250"
                      placeholder="0"
                    />
                    <span className="zone-unit">
                      {currentMode === 'relative' ? '%' : 'BPM'}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <th>To {currentMode === 'relative' ? '(%)' : '(BPM)'}:</th>
                {[1, 2, 3, 4, 5].map(zoneNum => (
                  <td key={`zone${zoneNum}-to`}>
                    {zoneNum === 5 ? (
                      <div className="zone-infinity-container">
                        <input
                          type="text"
                          value="∞"
                          readOnly
                          className="zone-input zone-infinity"
                          title="Zone 5 'to' value is always infinity (null)"
                        />
                      </div>
                    ) : (
                      <>
                        <input
                          type="number"
                          value={currentZones[`zone${zoneNum}`]?.to || ''}
                          onChange={(e) => handleZoneChange(zoneNum, 'to', e.target.value)}
                          className="zone-input"
                          min="0"
                          max="250"
                          placeholder="0"
                        />
                        <span className="zone-unit">
                          {currentMode === 'relative' ? '%' : 'BPM'}
                        </span>
                      </>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {hasError && <span className="field-error">{hasError}</span>}
      </div>
    );
  };

  const renderField = (fieldName, fieldSchema, fieldPath = fieldName, skipDescription = false) => {
    const value = getNestedValue(formData, fieldPath);
    const hasError = errors[fieldPath];

    // Special handling for heartRateZones field
    if (fieldName === 'heartRateZones') {
      return renderHeartRateZones(fieldName, fieldSchema, fieldPath, value, hasError);
    }

    // Handle oneOf schemas (like maxHeartRateFormula)
    if (fieldSchema.oneOf) {
      // For now, handle the common case where oneOf has string enum and object options
      const stringOption = fieldSchema.oneOf.find(option => option.type === 'string' && option.enum);
      if (stringOption) {
        return (
          <div key={fieldPath} className="form-field">
            <label htmlFor={fieldPath} className="field-label">
              {stringOption.title || fieldName}
              {schema?.required?.includes(fieldName) && <span className="required">*</span>}
            </label>
            <select
              id={fieldPath}
              value={value || stringOption.default || ''}
              onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
              className={`field-input select-input ${hasError ? 'error' : ''}`}
            >
              <option value="">Select...</option>
              {stringOption.enum.map((option, idx) => (
                <option key={option} value={option}>
                  {stringOption.enumTitles?.[idx] || option}
                </option>
              ))}
            </select>
            {!skipDescription && stringOption.description && (
              <p className="field-description">{stringOption.description}</p>
            )}
            {hasError && <span className="field-error">{hasError}</span>}
          </div>
        );
      }
    }

    // Handle array types (e.g., ["string", "null"]) by using the primary type
    const fieldType = Array.isArray(fieldSchema.type) ? fieldSchema.type[0] : fieldSchema.type;

    switch (fieldType) {
      case 'string':
        if (fieldSchema.enum) {
          return (
            <div key={fieldPath} className="form-field">
              <label htmlFor={fieldPath} className="field-label">
                {fieldSchema.title || fieldName}
                {schema?.required?.includes(fieldName) && <span className="required">*</span>}
              </label>
              <select
                id={fieldPath}
                value={value || ''}
                onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
                className={`field-input select-input ${hasError ? 'error' : ''}`}
              >
                <option value="">Select...</option>
                {fieldSchema.enum.map((option, idx) => (
                  <option key={option} value={option}>
                    {fieldSchema.enumTitles?.[idx] || option}
                  </option>
                ))}
              </select>
              {fieldSchema.description && (
                <p className="field-description">{fieldSchema.description}</p>
              )}
              {hasError && <span className="field-error">{hasError}</span>}
            </div>
          );
        }
        
        return (
          <div key={fieldPath} className="form-field">
            <label htmlFor={fieldPath} className="field-label">
              {fieldSchema.title || fieldName}
              {schema?.required?.includes(fieldName) && <span className="required">*</span>}
            </label>
            <input
              id={fieldPath}
              type={fieldSchema.format === 'date' ? 'date' : fieldSchema.format === 'uri' ? 'url' : 'text'}
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
              placeholder={fieldSchema.examples?.[0] || ''}
              className={`field-input text-input ${hasError ? 'error' : ''}`}
            />
            {fieldSchema.description && (
              <p className="field-description">{fieldSchema.description}</p>
            )}
            {hasError && <span className="field-error">{hasError}</span>}
          </div>
        );

      case 'number':
      case 'integer':
        return (
          <div key={fieldPath} className="form-field">
            <label htmlFor={fieldPath} className="field-label">
              {fieldSchema.title || fieldName}
              {schema?.required?.includes(fieldName) && <span className="required">*</span>}
            </label>
            <input
              id={fieldPath}
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldPath, parseFloat(e.target.value) || '')}
              min={fieldSchema.minimum}
              max={fieldSchema.maximum}
              step={fieldSchema.type === 'integer' ? 1 : 0.1}
              className={`field-input number-input ${hasError ? 'error' : ''}`}
            />
            {fieldSchema.description && (
              <p className="field-description">{fieldSchema.description}</p>
            )}
            {hasError && <span className="field-error">{hasError}</span>}
          </div>
        );

      case 'object':
        return (
          <div key={fieldPath} className="form-section">
            <h4 className="section-title">{fieldSchema.title || fieldName}</h4>
            {fieldSchema.description && (
              <p className="section-description">{fieldSchema.description}</p>
            )}
            <div className="section-fields">
              {Object.entries(fieldSchema.properties || {}).map(([subFieldName, subFieldSchema]) =>
                renderField(subFieldName, subFieldSchema, `${fieldPath}.${subFieldName}`)
              )}
            </div>
          </div>
        );

      default:
        return (
          <div key={fieldPath} className="form-field">
            <label className="field-label">{fieldSchema.title || fieldName}</label>
            <p className="field-note">Unsupported field type: {fieldType} (original: {JSON.stringify(fieldSchema.type)})</p>
          </div>
        );
    }
  };

  if (!schema) {
    return (
      <div className="config-section-editor">
        <div className="editor-error">
          <p>❌ Schema not found for section: {sectionName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="config-section-editor">
      <div className="editor-header">
        <h3>{schema.title || sectionName}</h3>
        {schema.description && <p className="editor-description">{schema.description}</p>}
        
        <div className="info-notice">
          <div className="info-notice-content">
            <span className="info-icon">ℹ️</span>
            <span className="info-text">
              <strong>Note:</strong> Saving changes through this editor will preserve section headers but may remove embedded comments from YAML files. 
              This form provides guided input with descriptions and validation.
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="editor-form">
        <div className="form-fields">
          {Object.entries(schema.properties || {}).map(([fieldName, fieldSchema]) => {
            // Special layout for maxHeartRateFormula with calculated HR display
            if (fieldName === 'maxHeartRateFormula') {
              const birthday = formData.birthday;
              const formula = formData.maxHeartRateFormula;
              const maxHR = calculateMaxHeartRate(birthday, formula);
              const value = getNestedValue(formData, fieldName);
              const hasError = errors[fieldName];
              
              // Handle oneOf schema for heart rate formula
              const stringOption = fieldSchema.oneOf?.find(option => option.type === 'string' && option.enum);
              
              return (
                <div key={fieldName} className="form-field">
                  <label htmlFor={fieldName} className="field-label">
                    {stringOption?.title || fieldName}
                    {schema?.required?.includes(fieldName) && <span className="required">*</span>}
                  </label>
                  <div className="hr-formula-input-row">
                    <select
                      id={fieldName}
                      value={value || stringOption?.default || ''}
                      onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                      className={`field-input select-input ${hasError ? 'error' : ''}`}
                    >
                      <option value="">Select...</option>
                      {stringOption?.enum.map((option, idx) => (
                        <option key={option} value={option}>
                          {stringOption.enumTitles?.[idx] || option}
                        </option>
                      ))}
                    </select>
                    {maxHR && (
                      <div className="max-hr-info-inline">
                        <span className="max-hr-label">Calculated Max Heart Rate: <strong>{maxHR} BPM</strong></span>
                      </div>
                    )}
                  </div>
                  {hasError && <span className="field-error">{hasError}</span>}
                </div>
              );
            }
            
            return renderField(fieldName, fieldSchema);
          })}
        </div>

        <div className="editor-actions">
          <button 
            type="button" 
            onClick={onCancel}
            className="btn-cancel"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-save"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfigSectionEditor;