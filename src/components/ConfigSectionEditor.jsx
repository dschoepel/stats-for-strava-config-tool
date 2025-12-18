import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getSchemaBySection } from '../schemas/configSchemas';
import { readSportsList, initialSportsList } from '../utils/sportsListManager';
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
  isLoading = false,
  onDirtyChange 
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [sportsList, setSportsList] = useState(initialSportsList);
  const [showSportModal, setShowSportModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const schema = React.useMemo(() => getSchemaBySection(sectionName), [sectionName]);

  useEffect(() => {
    setFormData(initialData);
    setIsDirty(false);
  }, [initialData]);

  // Warn user before leaving page/closing tab with unsaved changes
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

  // Warn user before leaving page/closing tab with unsaved changes
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

  // Load sports list for athlete config section
  useEffect(() => {
    console.log('ConfigSectionEditor mounted. Section name:', sectionName);
    if (sectionName === 'athleteConfig') {
      console.log('Section is athleteConfig, loading sports list...');
      async function loadSports() {
        try {
          // Load settings to get the default path
          const settings = JSON.parse(localStorage.getItem('config-tool-settings') || '{}');
          console.log('Loading sports with settings:', settings);
          const list = await readSportsList(settings);
          console.log('Loaded sports list from API:', list);
          console.log('Sports list type:', typeof list, 'Keys:', Object.keys(list));
          setSportsList(list);
        } catch (error) {
          console.error('Error loading sports list:', error);
          // Keep initialSportsList as fallback
        }
      }
      loadSports();
    } else {
      console.log('Section is NOT athleteConfig, skipping sports list load');
    }
  }, [sectionName]);

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

  const handleFieldChange = useCallback((fieldPath, value) => {
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
    
    // Mark as dirty when changes are made
    setIsDirty(true);
    
    // Clear error for this field when user starts typing
    if (errors[fieldPath]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldPath];
        return newErrors;
      });
    }
  }, [schema, errors]);

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
      setIsDirty(false);
    }
  };

  const handleCancelWithConfirm = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. These changes will be lost if you leave without saving.\n\nAre you sure you want to leave?')) {
        onCancel();
      }
    } else {
      onCancel();
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
  const autoPopulateZones = useCallback(() => {
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
  }, [formData.birthday, formData.maxHeartRateFormula, formData.heartRateZones?.mode, handleFieldChange]);

  // Auto-populate zones when mode changes or when birthday/formula changes
  React.useEffect(() => {
    const birthday = formData.birthday;
    const formula = formData.maxHeartRateFormula;
    const mode = formData.heartRateZones?.mode;
    
    if (birthday && formula && mode) {
      autoPopulateZones();
    }
  }, [formData.birthday, formData.maxHeartRateFormula, formData.heartRateZones?.mode, autoPopulateZones]);

  const renderHeartRateZones = (fieldName, fieldSchema, fieldPath, value, hasError) => {
    const currentZones = value?.default || {};
    const currentMode = value?.mode || 'relative';
    const dateRanges = value?.dateRanges || {};

    // Helper to update a date range zone
    const handleDateRangeZoneChange = (date, zoneNum, field, val) => {
      const updated = { ...dateRanges };
      if (!updated[date]) updated[date] = {};
      if (!updated[date][`zone${zoneNum}`]) updated[date][`zone${zoneNum}`] = {};
      updated[date][`zone${zoneNum}`][field] = val === '' ? null : Number(val);
      handleFieldChange('heartRateZones.dateRanges', updated);
    };

    // Add/remove date range
    const handleAddDateRange = () => {
      const today = new Date();
      const iso = today.toISOString().slice(0, 10);
      let newDate = iso;
      let counter = 1;
      
      // Find a unique date
      while (dateRanges[newDate]) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + counter);
        newDate = nextDay.toISOString().slice(0, 10);
        counter++;
      }
      
      // Pre-populate with default zones based on current settings
      const defaultZones = currentZones && Object.keys(currentZones).length > 0 ? { ...currentZones } : {};
      
      handleFieldChange('heartRateZones.dateRanges', { ...dateRanges, [newDate]: defaultZones });
    };
    const handleRemoveDateRange = (date) => {
      const updated = { ...dateRanges };
      delete updated[date];
      handleFieldChange('heartRateZones.dateRanges', updated);
    };

    // Handle date change for existing date range
    const handleDateChange = (oldDate, selectedDate) => {
      if (!selectedDate) return;
      
      const newDate = selectedDate.toISOString().slice(0, 10);
      if (newDate === oldDate) return;
      
      // Check if date is in the future
      const today = new Date();
      if (selectedDate > today) {
        alert('Date cannot be in the future. Please select today\'s date or a past date.');
        return;
      }
      
      // Check if new date already exists
      if (dateRanges[newDate]) {
        alert('A date range for this date already exists.');
        return;
      }
      
      const updated = { ...dateRanges };
      updated[newDate] = updated[oldDate];
      delete updated[oldDate];
      handleFieldChange('heartRateZones.dateRanges', updated);
    };

    // Sport Types handlers
    const sportTypes = value?.sportTypes || {};
    
    const handleAddSportType = (sportName) => {
      if (!sportName) return;
      
      console.log('Adding sport type:', sportName);
      console.log('Current sport types:', sportTypes);
      console.log('Current zones for prefill:', currentZones);
      
      // Pre-populate with default zones (don't include dateRanges if empty)
      const defaultZones = currentZones && Object.keys(currentZones).length > 0 ? { ...currentZones } : {};
      
      const updatedSportTypes = { 
        ...sportTypes, 
        [sportName]: { default: defaultZones } 
      };
      
      console.log('Updated sport types:', updatedSportTypes);
      
      handleFieldChange('heartRateZones.sportTypes', updatedSportTypes);
      setShowSportModal(false);
    };
    
    const handleRemoveSportType = (sportName) => {
      const updated = { ...sportTypes };
      delete updated[sportName];
      
      // If no sport types remain, remove the sportTypes key entirely
      if (Object.keys(updated).length === 0) {
        // Remove sportTypes key from heartRateZones
        const heartRateZonesData = { ...value };
        const { sportTypes: _removed, ...rest } = heartRateZonesData;
        handleFieldChange('heartRateZones', rest);
      } else {
        handleFieldChange('heartRateZones.sportTypes', updated);
      }
    };
    
    const handleSportTypeZoneChange = (sportName, zoneNum, field, val) => {
      const updated = { ...sportTypes };
      if (!updated[sportName]) updated[sportName] = { default: {}, dateRanges: {} };
      if (!updated[sportName].default) updated[sportName].default = {};
      if (!updated[sportName].default[`zone${zoneNum}`]) updated[sportName].default[`zone${zoneNum}`] = {};
      updated[sportName].default[`zone${zoneNum}`][field] = val === '' ? null : Number(val);
      handleFieldChange('heartRateZones.sportTypes', updated);
    };
    
    const handleSportTypeDateRangeZoneChange = (sportName, date, zoneNum, field, val) => {
      const updated = { ...sportTypes };
      if (!updated[sportName]) updated[sportName] = { default: {}, dateRanges: {} };
      if (!updated[sportName].dateRanges) updated[sportName].dateRanges = {};
      if (!updated[sportName].dateRanges[date]) updated[sportName].dateRanges[date] = {};
      if (!updated[sportName].dateRanges[date][`zone${zoneNum}`]) updated[sportName].dateRanges[date][`zone${zoneNum}`] = {};
      updated[sportName].dateRanges[date][`zone${zoneNum}`][field] = val === '' ? null : Number(val);
      handleFieldChange('heartRateZones.sportTypes', updated);
    };
    
    const handleAddSportTypeDateRange = (sportName) => {
      const today = new Date();
      const iso = today.toISOString().slice(0, 10);
      let newDate = iso;
      let counter = 1;
      
      const sportDateRanges = sportTypes[sportName]?.dateRanges || {};
      while (sportDateRanges[newDate]) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + counter);
        newDate = nextDay.toISOString().slice(0, 10);
        counter++;
      }
      
      const defaultZones = sportTypes[sportName]?.default || currentZones || {};
      const updated = { ...sportTypes };
      // Create dateRanges if it doesn't exist
      if (!updated[sportName].dateRanges) {
        updated[sportName] = { ...updated[sportName], dateRanges: {} };
      }
      updated[sportName].dateRanges[newDate] = { ...defaultZones };
      handleFieldChange('heartRateZones.sportTypes', updated);
    };
    
    const handleRemoveSportTypeDateRange = (sportName, date) => {
      const updated = { ...sportTypes };
      delete updated[sportName].dateRanges[date];
      
      // Remove dateRanges key if empty
      if (Object.keys(updated[sportName].dateRanges).length === 0) {
        // eslint-disable-next-line no-unused-vars
        const { dateRanges, ...rest } = updated[sportName];
        updated[sportName] = rest;
      }
      
      handleFieldChange('heartRateZones.sportTypes', updated);
    };
    
    const handleSportTypeDateChange = (sportName, oldDate, selectedDate) => {
      if (!selectedDate) return;
      
      const newDate = selectedDate.toISOString().slice(0, 10);
      if (newDate === oldDate) return;
      
      const today = new Date();
      if (selectedDate > today) {
        alert('Date cannot be in the future. Please select today\'s date or a past date.');
        return;
      }
      
      const sportDateRanges = sportTypes[sportName]?.dateRanges || {};
      if (sportDateRanges[newDate]) {
        alert('A date range for this date already exists for this sport.');
        return;
      }
      
      const updated = { ...sportTypes };
      updated[sportName].dateRanges[newDate] = updated[sportName].dateRanges[oldDate];
      delete updated[sportName].dateRanges[oldDate];
      handleFieldChange('heartRateZones.sportTypes', updated);
    };
    
    // Get available sports (not already used)
    console.log('Sports list in renderHeartRateZones:', sportsList);
    console.log('Sport types:', sportTypes);
    const usedSports = Object.keys(sportTypes);
    console.log('Used sports:', usedSports);
    const availableSports = [];
    Object.entries(sportsList).forEach(([category, sports]) => {
      console.log(`Processing category ${category} with sports:`, sports);
      sports.forEach(sport => {
        if (!usedSports.includes(sport)) {
          availableSports.push({ category, sport });
        }
      });
    });
    console.log('Available sports:', availableSports);
    availableSports.sort((a, b) => {
      if (a.category === b.category) return a.sport.localeCompare(b.sport);
      return a.category.localeCompare(b.category);
    });

    return (
      <div key={fieldPath} className="form-field heart-rate-zones">
        <div className="field-label-section">
          <h4 className="field-label">{fieldSchema.title || fieldName}</h4>
          {fieldSchema.description && (
            <p className="field-description">{fieldSchema.description}</p>
          )}
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

        <h5>Default Heart Rate Zones</h5>

        {/* Default Zone Table */}
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

        {/* Date Ranges Section */}
        <div className="date-ranges-section">
          <div className="date-ranges-header">
            <h5>Date Ranges</h5>
            <button type="button" className="add-date-range-btn" onClick={handleAddDateRange}>
              + Add Date Range
            </button>
          </div>
          {Object.keys(dateRanges).length === 0 && (
            <div className="date-ranges-empty">No date ranges defined.</div>
          )}
          {Object.entries(dateRanges)
            .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA)) // Sort by date descending
            .map(([date, zones]) => (
            <div key={date} className="date-range-entry">
              <div className="date-range-header-row">
                <DatePicker
                  selected={new Date(date)}
                  onChange={(selectedDate) => handleDateChange(date, selectedDate)}
                  maxDate={new Date()}
                  dateFormat="yyyy-MM-dd"
                  className="date-range-input"
                  showPopperArrow={true}
                  popperPlacement="bottom-start"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  yearDropdownItemNumber={50}
                  withPortal
                  popperModifiers={[
                    {
                      name: "offset",
                      options: {
                        offset: [0, 5],
                      },
                    },
                  ]}
                />
                <button type="button" className="remove-date-range-btn" onClick={() => handleRemoveDateRange(date)}>
                  Remove
                </button>
              </div>
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
                        <td key={`date-${date}-zone${zoneNum}-from`}>
                          <input
                            type="number"
                            value={zones[`zone${zoneNum}`]?.from || ''}
                            onChange={(e) => handleDateRangeZoneChange(date, zoneNum, 'from', e.target.value)}
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
                        <td key={`date-${date}-zone${zoneNum}-to`}>
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
                                value={zones[`zone${zoneNum}`]?.to || ''}
                                onChange={(e) => handleDateRangeZoneChange(date, zoneNum, 'to', e.target.value)}
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
            </div>
          ))}
        </div>

        {/* Sport Types Section */}
        <div className="sport-types-section">
          <div className="sport-types-header">
            <h5>Sport Type Overrides</h5>
            <button 
              type="button" 
              className="add-sport-type-btn" 
              onClick={() => {
                console.log('Opening sport modal. Sports list state:', sportsList);
                console.log('Available sports count:', availableSports.length);
                setShowSportModal(true);
              }}
            >
              + Add Sport Type
            </button>
          </div>
          
          {Object.keys(sportTypes).length === 0 && (
            <div className="sport-types-empty">No sport type overrides defined.</div>
          )}
          
          {Object.entries(sportTypes)
            .sort(([sportA], [sportB]) => sportA.localeCompare(sportB))
            .map(([sportName, sportData]) => (
            <div key={sportName} className="sport-type-entry">
              <div className="sport-type-header-row">
                <h6 className="sport-type-name">{sportName}</h6>
                <button 
                  type="button" 
                  className="remove-sport-type-btn" 
                  onClick={() => handleRemoveSportType(sportName)}
                >
                  Remove Sport
                </button>
              </div>
              
              {/* Default zones for this sport */}
              <div className="sport-default-zones">
                <h6>Default Zones</h6>
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
                          <td key={`sport-${sportName}-zone${zoneNum}-from`}>
                            <input
                              type="number"
                              value={sportData.default?.[`zone${zoneNum}`]?.from || ''}
                              onChange={(e) => handleSportTypeZoneChange(sportName, zoneNum, 'from', e.target.value)}
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
                          <td key={`sport-${sportName}-zone${zoneNum}-to`}>
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
                                  value={sportData.default?.[`zone${zoneNum}`]?.to || ''}
                                  onChange={(e) => handleSportTypeZoneChange(sportName, zoneNum, 'to', e.target.value)}
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
              </div>
              
              {/* Date ranges for this sport */}
              <div className="sport-date-ranges">
                <div className="sport-date-ranges-header">
                  <h6>Date Ranges for {sportName}</h6>
                  <button 
                    type="button" 
                    className="add-date-range-btn btn-sm" 
                    onClick={() => handleAddSportTypeDateRange(sportName)}
                  >
                    + Add Date Range
                  </button>
                </div>
                
                {(!sportData.dateRanges || Object.keys(sportData.dateRanges).length === 0) && (
                  <div className="sport-date-ranges-empty">No date ranges for this sport.</div>
                )}
                
                {sportData.dateRanges && Object.entries(sportData.dateRanges)
                  .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                  .map(([date, zones]) => (
                  <div key={date} className="sport-date-range-entry">
                    <div className="date-range-header-row">
                      <DatePicker
                        selected={new Date(date)}
                        onChange={(selectedDate) => handleSportTypeDateChange(sportName, date, selectedDate)}
                        maxDate={new Date()}
                        dateFormat="yyyy-MM-dd"
                        className="date-range-input"
                        showPopperArrow={true}
                        popperPlacement="bottom-start"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        yearDropdownItemNumber={50}
                        withPortal
                        popperModifiers={[
                          {
                            name: "offset",
                            options: {
                              offset: [0, 5],
                            },
                          },
                        ]}
                      />
                      <button 
                        type="button" 
                        className="remove-date-range-btn" 
                        onClick={() => handleRemoveSportTypeDateRange(sportName, date)}
                      >
                        Remove
                      </button>
                    </div>
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
                              <td key={`sport-${sportName}-date-${date}-zone${zoneNum}-from`}>
                                <input
                                  type="number"
                                  value={zones[`zone${zoneNum}`]?.from || ''}
                                  onChange={(e) => handleSportTypeDateRangeZoneChange(sportName, date, zoneNum, 'from', e.target.value)}
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
                              <td key={`sport-${sportName}-date-${date}-zone${zoneNum}-to`}>
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
                                      value={zones[`zone${zoneNum}`]?.to || ''}
                                      onChange={(e) => handleSportTypeDateRangeZoneChange(sportName, date, zoneNum, 'to', e.target.value)}
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
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add Sport Type Modal */}
        {showSportModal && (
          <div className="modal-overlay" onClick={() => setShowSportModal(false)}>
            <div className="modal-content sport-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header-row">
                <h4>Select a Sport Type</h4>
                <button 
                  type="button" 
                  className="modal-close-btn" 
                  onClick={() => setShowSportModal(false)}
                >
                  ✕
                </button>
              </div>
              
              {availableSports.length === 0 ? (
                <div className="modal-empty-state">
                  <p>All sports from your list are already being used.</p>
                  <p>You can add more sports in <strong>Settings → Sports List</strong>.</p>
                </div>
              ) : (
                <div className="sport-modal-list">
                  {Object.entries(
                    availableSports.reduce((acc, { category, sport }) => {
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(sport);
                      return acc;
                    }, {})
                  ).map(([category, sports]) => (
                    <div key={category} className="sport-modal-category">
                      <div className="sport-modal-category-label">{category}</div>
                      <div className="sport-modal-category-items">
                        {sports.map(sport => (
                          <button
                            key={sport}
                            type="button"
                            className="sport-modal-item"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Sport button clicked:', sport);
                              handleAddSportType(sport);
                            }}
                          >
                            {sport}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
            onClick={handleCancelWithConfirm}
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