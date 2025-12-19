import React, { useState, useEffect } from 'react';
import { getSchemaBySection } from '../../schemas/configSchemas';
import '../ConfigSectionEditor.css';

/**
 * BaseConfigEditor - Common form logic for all config section editors
 * Provides state management, validation, dirty tracking, and basic field rendering
 */
const BaseConfigEditor = ({
  sectionName,
  initialData = {},
  onSave,
  onCancel,
  isLoading = false,
  onDirtyChange,
  children,
  customValidation
}) => {
  const [formData, setFormData] = useState(() => initialData);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const schema = React.useMemo(() => getSchemaBySection(sectionName), [sectionName]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Notify parent of dirty state changes
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange]);

  // Nested value helpers
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
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
    return obj;
  };

  // Field change handler
  const handleFieldChange = (fieldPath, value) => {
    setFormData(prevData => {
      const newData = JSON.parse(JSON.stringify(prevData));
      setNestedValue(newData, fieldPath, value);
      return newData;
    });
    setIsDirty(true);
    
    // Clear error for this field
    if (errors[fieldPath]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldPath];
        return newErrors;
      });
    }
  };

  // Base validation
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
    
    // Apply custom validation if provided
    if (customValidation) {
      const customErrors = customValidation(formData, getNestedValue);
      Object.assign(newErrors, customErrors);
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
      setIsDirty(false);
    }
  };

  // Cancel with confirmation
  const handleCancelWithConfirm = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. These changes will be lost if you leave without saving.\n\nAre you sure you want to leave?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  // Render basic field types
  const renderBasicField = (fieldName, fieldSchema, fieldPath = fieldName, skipDescription = false) => {
    const value = getNestedValue(formData, fieldPath);
    const hasError = errors[fieldPath];
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
              {!skipDescription && fieldSchema.description && (
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
              type="text"
              id={fieldPath}
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
              className={`field-input ${hasError ? 'error' : ''}`}
              placeholder={fieldSchema.default}
            />
            {!skipDescription && fieldSchema.description && (
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
              type="number"
              id={fieldPath}
              value={value ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : (fieldType === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value));
                handleFieldChange(fieldPath, val);
              }}
              className={`field-input ${hasError ? 'error' : ''}`}
              placeholder={fieldSchema.default?.toString()}
            />
            {!skipDescription && fieldSchema.description && (
              <p className="field-description">{fieldSchema.description}</p>
            )}
            {hasError && <span className="field-error">{hasError}</span>}
          </div>
        );

      case 'boolean':
        return (
          <div key={fieldPath} className="form-field checkbox-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                id={fieldPath}
                checked={value || false}
                onChange={(e) => handleFieldChange(fieldPath, e.target.checked)}
                className="checkbox-input"
              />
              <span>{fieldSchema.title || fieldName}</span>
              {schema?.required?.includes(fieldName) && <span className="required">*</span>}
            </label>
            {!skipDescription && fieldSchema.description && (
              <p className="field-description">{fieldSchema.description}</p>
            )}
            {hasError && <span className="field-error">{hasError}</span>}
          </div>
        );

      default:
        return null;
    }
  };

  // Render object fields
  const renderObjectField = (fieldName, fieldSchema, fieldPath = fieldName) => {
    const properties = fieldSchema.properties || {};
    
    return (
      <div key={fieldPath} className="form-field object-field">
        <div className="field-label-section">
          <h4 className="field-label">{fieldSchema.title || fieldName}</h4>
          {fieldSchema.description && (
            <p className="field-description">{fieldSchema.description}</p>
          )}
        </div>
        <div className="object-fields">
          {Object.entries(properties).map(([propName, propSchema]) => 
            renderBasicField(propName, propSchema, `${fieldPath}.${propName}`, true)
          )}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="config-section-editor">
      <div className="editor-header">
        <h3 className="editor-title">{schema?.title || sectionName}</h3>
        {schema?.description && (
          <p className="editor-description">{schema.description}</p>
        )}
      </div>

      <div className="editor-content">
        {children({
          formData,
          errors,
          schema,
          handleFieldChange,
          getNestedValue,
          renderBasicField,
          renderObjectField
        })}
      </div>

      <div className="editor-actions">
        <button 
          type="button" 
          onClick={handleCancelWithConfirm} 
          className="btn-cancel"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn-save"
          disabled={isLoading || !isDirty}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default BaseConfigEditor;
