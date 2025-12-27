import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Input, Flex, Text, VStack, HStack, Table, Heading, Grid, Portal, Icon } from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react';
import { MdAdd, MdClose, MdInfo } from 'react-icons/md';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getSchemaBySection } from '../schemas/configSchemas';
import { readSportsList, initialSportsList } from '../utils/sportsListManager';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';

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
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });
  const [appearanceData, setAppearanceData] = useState(null);
  const schema = React.useMemo(() => getSchemaBySection(sectionName), [sectionName]);
  const [isDirty, setIsDirty] = useState(false);
  const isInitialMount = React.useRef(true);
  const isAutoPopulating = React.useRef(false);
  const { toasts, removeToast, showError } = useToast();

  useEffect(() => {
    setFormData(initialData);
    setIsDirty(false);
    isInitialMount.current = true;
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
    if (sectionName === 'athleteConfig') {
      async function loadSports() {
        try {
          // Load settings to get the default path
          const settings = JSON.parse(localStorage.getItem('config-tool-settings') || '{}');
          const list = await readSportsList(settings);
          setSportsList(list);
        } catch (error) {
          console.error('Error loading sports list:', error);
          // Keep initialSportsList as fallback
        }
      }
      loadSports();
    }
  }, [sectionName]);

  // Load appearance data when editing athlete section to get unitSystem
  useEffect(() => {
    if (sectionName === 'athlete') {
      async function loadAppearanceData() {
        try {
          const settings = JSON.parse(localStorage.getItem('config-tool-settings') || '{}');
          const defaultPath = settings.defaultConfigPath || '';
          
          // Get list of config files from the directory
          const configFilesResponse = await fetch(`/api/config-files?directory=${encodeURIComponent(defaultPath)}`);
          const configFilesResult = await configFilesResponse.json();
          
          if (configFilesResult.success && configFilesResult.files) {
            // Get section mapping to find appearance config file
            const parseSectionsResponse = await fetch('/api/parse-sections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ files: configFilesResult.files })
            });
            
            const parseSectionsResult = await parseSectionsResponse.json();
            
            if (parseSectionsResult.success && parseSectionsResult.detailedMapping) {
              const appearanceSection = parseSectionsResult.detailedMapping.appearance;
              
              if (appearanceSection && appearanceSection.filePath) {
                // Load the appearance config file
                const fileContentResponse = await fetch(`/api/file-content?path=${encodeURIComponent(appearanceSection.filePath)}`);
                const fileContentResult = await fileContentResponse.json();
                
                if (fileContentResult.success) {
                  const YAML = await import('yaml');
                  const parsedData = YAML.parse(fileContentResult.content);
                  setAppearanceData(parsedData.appearance || null);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error loading appearance data:', error);
        }
      }
      loadAppearanceData();
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
    
    // Only mark as dirty if this is not the initial mount/auto-population
    if (!isInitialMount.current && !isAutoPopulating.current) {
      console.log('Setting dirty to true. Field:', fieldPath, 'Value:', processedValue);
      setIsDirty(true);
    }
    
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
    
    // Special validation for athlete section - zone mode is required if zones exist
    if (sectionName === 'athlete') {
      const heartRateZones = getNestedValue(formData, 'heartRateZones');
      // Check if any zones actually exist (not just empty objects/arrays)
      const hasDefaultZones = heartRateZones?.default && Array.isArray(heartRateZones.default) && heartRateZones.default.length > 0;
      const hasDateRanges = heartRateZones?.dateRanges && Object.keys(heartRateZones.dateRanges).length > 0;
      const hasSportTypes = heartRateZones?.sportTypes && Object.keys(heartRateZones.sportTypes).length > 0;
      
      if (hasDefaultZones || hasDateRanges || hasSportTypes) {
        const mode = getNestedValue(formData, 'heartRateZones.mode');
        if (mode === null || mode === undefined || mode === '') {
          newErrors['heartRateZones.mode'] = 'Zone Mode is required when heart rate zones are configured';
        }
      }
    }
    
    // Validate weight history entries
    const weightHistory = getNestedValue(formData, 'weightHistory');
    if (weightHistory && typeof weightHistory === 'object') {
      Object.entries(weightHistory).forEach(([date, weight]) => {
        if (weight <= 0) {
          newErrors['weightHistory'] = `All weight entries must be greater than zero. Entry for ${date} is ${weight}.`;
        }
      });
    }
    
    // Validate FTP history entries
    const ftpHistory = getNestedValue(formData, 'ftpHistory');
    if (ftpHistory && typeof ftpHistory === 'object') {
      Object.entries(ftpHistory).forEach(([sport, sportHistory]) => {
        if (sportHistory && typeof sportHistory === 'object') {
          Object.entries(sportHistory).forEach(([date, ftp]) => {
            if (ftp <= 0) {
              newErrors['ftpHistory'] = `All FTP entries must be greater than zero. ${sport} entry for ${date} is ${ftp}.`;
            }
          });
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
    } else {
      showError('Please correct the errors in the form before saving.', 5000);
    }
  };

  const handleCancelWithConfirm = () => {
    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. These changes will be lost if you leave without saving. Are you sure you want to leave?',
        onConfirm: () => {
          onCancel();
          setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
        }
      });
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
    const existingZones = formData.heartRateZones?.default;
    
    // Only populate if zones don't already exist
    if (existingZones && Object.keys(existingZones).length > 0) {
      return; // Zones already exist, don't overwrite
    }
    
    const maxHR = calculateMaxHeartRate(birthday, formula);
    if (maxHR) {
      const defaultZones = calculateDefaultZones(maxHR, mode);
      if (defaultZones) {
        // Set flag to prevent marking as dirty
        isAutoPopulating.current = true;
        handleFieldChange('heartRateZones.default', defaultZones);
        // Reset flag after a short delay to ensure state update completes
        setTimeout(() => {
          isAutoPopulating.current = false;
        }, 0);
      }
    }
  }, [formData.birthday, formData.maxHeartRateFormula, formData.heartRateZones?.mode, formData.heartRateZones?.default, handleFieldChange]);

  // Auto-populate zones when mode changes or when birthday/formula changes
  React.useEffect(() => {
    const birthday = formData.birthday;
    const formula = formData.maxHeartRateFormula;
    const mode = formData.heartRateZones?.mode;
    
    // Auto-populate if we have all required data (function will check if zones exist)
    if (birthday && formula && mode) {
      autoPopulateZones();
    }
    
    // After first render and auto-population, mark that initial mount is complete
    if (isInitialMount.current) {
      // Use setTimeout to ensure all auto-population is done
      setTimeout(() => {
        isInitialMount.current = false;
      }, 0);
    }
  }, [formData.birthday, formData.maxHeartRateFormula, formData.heartRateZones?.mode, autoPopulateZones]);

  const renderHeartRateZones = (fieldName, fieldSchema, fieldPath, value, hasError) => {
    const currentZones = value?.default || {};
    const currentMode = value?.mode || '';
    const dateRanges = value?.dateRanges || {};
    
    // Calculate current max heart rate for display
    const birthday = formData.birthday;
    const formula = formData.maxHeartRateFormula;
    const calculatedMaxHR = calculateMaxHeartRate(birthday, formula);
    const age = calculateAge(birthday);

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
    const usedSports = Object.keys(sportTypes);
    const availableSports = [];
    Object.entries(sportsList).forEach(([category, sports]) => {
      sports.forEach(sport => {
        if (!usedSports.includes(sport)) {
          availableSports.push({ category, sport });
        }
      });
    });
    availableSports.sort((a, b) => {
      if (a.category === b.category) return a.sport.localeCompare(b.sport);
      return a.category.localeCompare(b.category);
    });

    return (
      <Box key={fieldPath} mb={6}>
        <Box mb={4}>
          <Heading size="md" mb={1} lineHeight="1.2" wordBreak="break-word">{fieldSchema.title || fieldName}</Heading>
          {fieldSchema.description && (
            <Text fontSize="sm" color="textMuted">{fieldSchema.description}</Text>
          )}
        </Box>

        {/* Calculated Max Heart Rate Display */}
        {calculatedMaxHR && (
          <Box mb={4} p={3} bg="blue.50" _dark={{ bg: 'blue.900/30' }} borderRadius="md">
            <Flex align="center" gap={2}>
              <Icon color="blue.600"><MdInfo /></Icon>
              <Box>
                <Text fontSize="sm" fontWeight="600" color="blue.800" _dark={{ color: 'blue.200' }}>
                  Calculated Max Heart Rate: {calculatedMaxHR} BPM
                </Text>
                <Text fontSize="xs" color="blue.700" _dark={{ color: 'blue.300' }}>
                  Based on age {age} and {formula} formula
                </Text>
              </Box>
            </Flex>
          </Box>
        )}

        {/* Mode Selection */}
        <Box mb={4}>
          <Text fontWeight="500" mb={1}>
            Zone Mode
            {schema?.required?.includes(fieldName) && <Text as="span" color="red.500" ml={1}>*</Text>}
          </Text>
          <NativeSelectRoot borderColor={(errors['heartRateZones.mode'] || errors['heartRateZones']) ? 'red.500' : 'border'}>
            <NativeSelectField
              id="heartRateZones.mode"
              value={currentMode || ''}
              onChange={(e) => handleFieldChange('heartRateZones.mode', e.target.value)}
              bg="inputBg"
            >
              <option value="">Select...</option>
              <option value="relative">Relative (%)</option>
              <option value="absolute">Absolute (BPM)</option>
            </NativeSelectField>
          </NativeSelectRoot>
          {(errors['heartRateZones.mode'] || errors['heartRateZones']) && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors['heartRateZones.mode'] || errors['heartRateZones']}
            </Text>
          )}
        </Box>

        <Flex justify="space-between" align="center" mb={3}>
          <Heading size="sm" lineHeight="1.2" wordBreak="break-word">Default Heart Rate Zones</Heading>
          {calculatedMaxHR && (
            <Button
              size="sm"
              variant="outline"
              onClick={autoPopulateZones}
              title="Recalculate zones based on current age and formula"
            >
              Recalculate Zones
            </Button>
          )}
        </Flex>

        {/* Default Zone Table */}
        <Box overflowX="auto" mb={6} borderWidth="1px" borderColor="border" borderRadius="md">
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row bg="tableHeaderBg">
                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Values</Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-1</Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-2</Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-3</Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-4</Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-5</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell fontWeight="500">From {currentMode === 'relative' ? '(%)' : '(BPM)'}:</Table.Cell>
                {[1, 2, 3, 4, 5].map(zoneNum => (
                  <Table.Cell key={`zone${zoneNum}-from`}>
                    <Flex align="center" gap={1}>
                      <Input
                        type="number"
                        value={currentZones[`zone${zoneNum}`]?.from || ''}
                        onChange={(e) => handleZoneChange(zoneNum, 'from', e.target.value)}
                        size="sm"
                        width="80px"
                        min="0"
                        max="250"
                        placeholder="0"
                        bg="inputBg"
                      />
                      <Text fontSize="xs" color="textMuted">
                        {currentMode === 'relative' ? '%' : 'BPM'}
                      </Text>
                    </Flex>
                  </Table.Cell>
                ))}
              </Table.Row>
              <Table.Row>
                <Table.Cell fontWeight="500">To {currentMode === 'relative' ? '(%)' : '(BPM)'}:</Table.Cell>
                {[1, 2, 3, 4, 5].map(zoneNum => (
                  <Table.Cell key={`zone${zoneNum}-to`}>
                    {zoneNum === 5 ? (
                      <Input
                        type="text"
                        value="∞"
                        readOnly
                        size="sm"
                        width="80px"
                        title="Zone 5 'to' value is always infinity (null)"
                        cursor="not-allowed"
                        bg="inputBg"
                      />
                    ) : (
                      <Flex align="center" gap={1}>
                        <Input
                          type="number"
                          value={currentZones[`zone${zoneNum}`]?.to || ''}
                          onChange={(e) => handleZoneChange(zoneNum, 'to', e.target.value)}
                          size="sm"
                          width="80px"
                          min="0"
                          max="250"
                          placeholder="0"
                          bg="inputBg"
                        />
                        <Text fontSize="xs" color="textMuted">
                          {currentMode === 'relative' ? '%' : 'BPM'}
                        </Text>
                      </Flex>
                    )}
                  </Table.Cell>
                ))}
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Box>

        {/* Date Ranges Section */}
        <Box mb={6}>
          <Flex 
            direction={{ base: "column", sm: "row" }}
            justify="space-between" 
            align={{ base: "stretch", sm: "center" }} 
            gap={3}
            mb={3}
          >
            <Heading size="sm" lineHeight="1.2" wordBreak="break-word">Date Ranges</Heading>
            <Button onClick={handleAddDateRange} size="sm" variant="outline">
              <MdAdd /> Add Date Range
            </Button>
          </Flex>
          {Object.keys(dateRanges).length === 0 && (
            <Text fontSize="sm" color="textMuted">No date ranges defined.</Text>
          )}
          <VStack align="stretch" gap={4}>
            {Object.entries(dateRanges)
              .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
              .map(([date, zones]) => (
              <Box key={date} p={4} borderWidth="1px" borderColor="border" borderRadius="md">
                <Flex 
                  direction={{ base: "column", sm: "row" }}
                  justify="space-between" 
                  align={{ base: "stretch", sm: "center" }} 
                  gap={3}
                  mb={3}
                >
                  <Box className="react-datepicker-wrapper" flex="1" maxW={{ base: "100%", sm: "200px" }}>
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
                  </Box>
                  <Button onClick={() => handleRemoveDateRange(date)} size="sm" variant="outline" colorPalette="red">
                    Remove
                  </Button>
                </Flex>
                <Box overflowX="auto" borderWidth="1px" borderColor="border" borderRadius="md">
                  <Table.Root size="sm" variant="outline">
                    <Table.Header>
                      <Table.Row bg="tableHeaderBg">
                        <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Values</Table.ColumnHeader>
                        <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-1</Table.ColumnHeader>
                        <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-2</Table.ColumnHeader>
                        <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-3</Table.ColumnHeader>
                        <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-4</Table.ColumnHeader>
                        <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-5</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      <Table.Row>
                        <Table.Cell fontWeight="500">From {currentMode === 'relative' ? '(%)' : '(BPM)'}:</Table.Cell>
                        {[1, 2, 3, 4, 5].map(zoneNum => (
                          <Table.Cell key={`date-${date}-zone${zoneNum}-from`}>
                            <Flex align="center" gap={1}>
                              <Input
                                type="number"
                                value={zones[`zone${zoneNum}`]?.from || ''}
                                onChange={(e) => handleDateRangeZoneChange(date, zoneNum, 'from', e.target.value)}
                                size="sm"
                                width="80px"
                                min="0"
                                max="250"
                                placeholder="0"
                                bg="inputBg"
                              />
                              <Text fontSize="xs" color="textMuted">
                                {currentMode === 'relative' ? '%' : 'BPM'}
                              </Text>
                            </Flex>
                          </Table.Cell>
                        ))}
                      </Table.Row>
                      <Table.Row>
                        <Table.Cell fontWeight="500">To {currentMode === 'relative' ? '(%)' : '(BPM)'}:</Table.Cell>
                        {[1, 2, 3, 4, 5].map(zoneNum => (
                          <Table.Cell key={`date-${date}-zone${zoneNum}-to`}>
                            {zoneNum === 5 ? (
                              <Input
                                type="text"
                                value="∞"
                                readOnly
                                size="sm"
                                width="80px"
                                title="Zone 5 'to' value is always infinity (null)"
                                cursor="not-allowed"
                                bg="inputBg"
                              />
                            ) : (
                              <Flex align="center" gap={1}>
                                <Input
                                  type="number"
                                  value={zones[`zone${zoneNum}`]?.to || ''}
                                  onChange={(e) => handleDateRangeZoneChange(date, zoneNum, 'to', e.target.value)}
                                  size="sm"
                                  width="80px"
                                  min="0"
                                  max="250"
                                  placeholder="0"
                                  bg="inputBg"
                                />
                                <Text fontSize="xs" color="textMuted">
                                  {currentMode === 'relative' ? '%' : 'BPM'}
                                </Text>
                              </Flex>
                            )}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    </Table.Body>
                  </Table.Root>
                </Box>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Sport Types Section */}
        <Box mb={6}>
          <Flex 
            direction={{ base: "column", sm: "row" }}
            justify="space-between" 
            align={{ base: "stretch", sm: "center" }} 
            gap={3}
            mb={3}
          >
            <Heading size="sm" lineHeight="1.2" wordBreak="break-word">Sport Type Overrides</Heading>
            <Button 
              onClick={() => {
                console.log('Opening sport modal. Sports list state:', sportsList);
                console.log('Available sports count:', availableSports.length);
                setShowSportModal(true);
              }}
              size="sm"
              variant="outline"
            >
              <MdAdd /> Add Sport Type
            </Button>
          </Flex>
          
          {Object.keys(sportTypes).length === 0 && (
            <Text fontSize="sm" color="textMuted">No sport type overrides defined.</Text>
          )}
          
          <VStack align="stretch" gap={4}>
            {Object.entries(sportTypes)
              .sort(([sportA], [sportB]) => sportA.localeCompare(sportB))
              .map(([sportName, sportData]) => (
              <Box key={sportName} p={4} borderWidth="1px" borderColor="border" borderRadius="md">
                <Flex 
                  direction={{ base: "column", sm: "row" }}
                  justify="space-between" 
                  align={{ base: "stretch", sm: "center" }} 
                  gap={3}
                  mb={4}
                >
                  <Heading size="sm" lineHeight="1.2" wordBreak="break-word">{sportName}</Heading>
                  <Button 
                    onClick={() => handleRemoveSportType(sportName)}
                    size="sm"
                    variant="outline"
                    colorPalette="red"
                  >
                    Remove Sport
                  </Button>
                </Flex>
                
                {/* Default zones for this sport */}
                <Box mb={4}>
                  <Heading size="xs" mb={2} lineHeight="1.2" wordBreak="break-word">Default Zones</Heading>
                  <Box overflowX="auto" borderWidth="1px" borderColor="border" borderRadius="md">
                    <Table.Root size="sm" variant="outline">
                      <Table.Header>
                        <Table.Row bg="tableHeaderBg">
                          <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Values</Table.ColumnHeader>
                          <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-1</Table.ColumnHeader>
                          <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-2</Table.ColumnHeader>
                          <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-3</Table.ColumnHeader>
                          <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-4</Table.ColumnHeader>
                          <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-5</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        <Table.Row>
                          <Table.Cell fontWeight="500">From {currentMode === 'relative' ? '(%)' : '(BPM)'}:</Table.Cell>
                          {[1, 2, 3, 4, 5].map(zoneNum => (
                            <Table.Cell key={`sport-${sportName}-zone${zoneNum}-from`}>
                              <Flex align="center" gap={1}>
                                <Input
                                  type="number"
                                  value={sportData.default?.[`zone${zoneNum}`]?.from || ''}
                                  onChange={(e) => handleSportTypeZoneChange(sportName, zoneNum, 'from', e.target.value)}
                                  size="sm"
                                  width="80px"
                                  min="0"
                                  max="250"
                                  placeholder="0"
                                  bg="inputBg"
                                />
                                <Text fontSize="xs" color="textMuted">
                                  {currentMode === 'relative' ? '%' : 'BPM'}
                                </Text>
                              </Flex>
                            </Table.Cell>
                          ))}
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell fontWeight="500">To {currentMode === 'relative' ? '(%)' : '(BPM)'}:</Table.Cell>
                          {[1, 2, 3, 4, 5].map(zoneNum => (
                            <Table.Cell key={`sport-${sportName}-zone${zoneNum}-to`}>
                              {zoneNum === 5 ? (
                                <Input
                                  type="text"
                                  value="∞"
                                  readOnly
                                  size="sm"
                                  width="80px"
                                  title="Zone 5 'to' value is always infinity (null)"
                                  cursor="not-allowed"
                                  bg="inputBg"
                                />
                              ) : (
                                <Flex align="center" gap={1}>
                                  <Input
                                    type="number"
                                    value={sportData.default?.[`zone${zoneNum}`]?.to || ''}
                                    onChange={(e) => handleSportTypeZoneChange(sportName, zoneNum, 'to', e.target.value)}
                                    size="sm"
                                    width="80px"
                                    min="0"
                                    max="250"
                                    placeholder="0"
                                    bg="inputBg"
                                  />
                                  <Text fontSize="xs" color="textMuted">
                                    {currentMode === 'relative' ? '%' : 'BPM'}
                                  </Text>
                                </Flex>
                              )}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      </Table.Body>
                    </Table.Root>
                  </Box>
                </Box>
                
                {/* Date ranges for this sport */}
                <Box>
                  <Flex 
                    direction={{ base: "column", sm: "row" }}
                    justify="space-between" 
                    align={{ base: "stretch", sm: "center" }} 
                    gap={3}
                    mb={2}
                  >
                    <Heading size="xs" lineHeight="1.2" wordBreak="break-word">Date Ranges for {sportName}</Heading>
                    <Button 
                      onClick={() => handleAddSportTypeDateRange(sportName)}
                      size="sm"
                      variant="ghost"
                    >
                      <MdAdd /> Add Date Range
                    </Button>
                  </Flex>
                  
                  {(!sportData.dateRanges || Object.keys(sportData.dateRanges).length === 0) && (
                    <Text fontSize="sm" color="textMuted">No date ranges for this sport.</Text>
                  )}
                  
                  <VStack align="stretch" gap={3}>
                    {sportData.dateRanges && Object.entries(sportData.dateRanges)
                      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                      .map(([date, zones]) => (
                      <Box key={date} p={3} borderWidth="1px" borderColor="border" borderRadius="md" bg="cardBg">
                        <Flex 
                          direction={{ base: "column", sm: "row" }}
                          justify="space-between" 
                          align={{ base: "stretch", sm: "center" }} 
                          gap={3}
                          mb={3}
                        >
                          <Box className="react-datepicker-wrapper" flex="1" maxW="200px">
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
                          </Box>
                          <Button 
                            onClick={() => handleRemoveSportTypeDateRange(sportName, date)}
                            size="sm"
                            variant="outline"
                            colorPalette="red"
                          >
                            Remove
                          </Button>
                        </Flex>
                        <Box overflowX="auto" borderWidth="1px" borderColor="border" borderRadius="md">
                          <Table.Root size="sm" variant="outline">
                            <Table.Header>
                              <Table.Row bg="tableHeaderBg">
                                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Values</Table.ColumnHeader>
                                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-1</Table.ColumnHeader>
                                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-2</Table.ColumnHeader>
                                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-3</Table.ColumnHeader>
                                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-4</Table.ColumnHeader>
                                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Zone-5</Table.ColumnHeader>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              <Table.Row>
                                <Table.Cell fontWeight="500">From {currentMode === 'relative' ? '(%)' : '(BPM)'}:</Table.Cell>
                                {[1, 2, 3, 4, 5].map(zoneNum => (
                                  <Table.Cell key={`sport-${sportName}-date-${date}-zone${zoneNum}-from`}>
                                    <Flex align="center" gap={1}>
                                      <Input
                                        type="number"
                                        value={zones[`zone${zoneNum}`]?.from || ''}
                                        onChange={(e) => handleSportTypeDateRangeZoneChange(sportName, date, zoneNum, 'from', e.target.value)}
                                        size="sm"
                                        width="80px"
                                        min="0"
                                        max="250"
                                        placeholder="0"
                                        bg="inputBg"
                                      />
                                      <Text fontSize="xs" color="textMuted">
                                        {currentMode === 'relative' ? '%' : 'BPM'}
                                      </Text>
                                    </Flex>
                                  </Table.Cell>
                                ))}
                              </Table.Row>
                              <Table.Row>
                                <Table.Cell fontWeight="500">To {currentMode === 'relative' ? '(%)' : '(BPM)'}:</Table.Cell>
                                {[1, 2, 3, 4, 5].map(zoneNum => (
                                  <Table.Cell key={`sport-${sportName}-date-${date}-zone${zoneNum}-to`}>
                                    {zoneNum === 5 ? (
                                      <Input
                                        type="text"
                                        value="∞"
                                        readOnly
                                        size="sm"
                                        width="80px"
                                        title="Zone 5 'to' value is always infinity (null)"
                                        cursor="not-allowed"
                                        bg="inputBg"
                                      />
                                    ) : (
                                      <Flex align="center" gap={1}>
                                        <Input
                                          type="number"
                                          value={zones[`zone${zoneNum}`]?.to || ''}
                                          onChange={(e) => handleSportTypeDateRangeZoneChange(sportName, date, zoneNum, 'to', e.target.value)}
                                          size="sm"
                                          width="80px"
                                          min="0"
                                          max="250"
                                          placeholder="0"
                                          bg="inputBg"
                                        />
                                        <Text fontSize="xs" color="textMuted">
                                          {currentMode === 'relative' ? '%' : 'BPM'}
                                        </Text>
                                      </Flex>
                                    )}
                                  </Table.Cell>
                                ))}
                              </Table.Row>
                            </Table.Body>
                          </Table.Root>
                        </Box>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Add Sport Type Modal */}
        {showSportModal && (
          <Portal>
            <Box
              position="fixed"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="blackAlpha.600"
              zIndex="1000"
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={() => setShowSportModal(false)}
            >
              <Box
                bg="bg"
                borderRadius="lg"
                boxShadow="lg"
                maxW="600px"
                w="90%"
                maxH="80vh"
                overflowY="auto"
                onClick={e => e.stopPropagation()}
              >
                <Flex
                  justify="space-between"
                  align="center"
                  p={4}
                  borderBottomWidth="1px"
                  borderColor="border"
                >
                  <Heading size="md">Select a Sport Type</Heading>
                  <Button 
                    onClick={() => setShowSportModal(false)}
                    size="sm"
                    variant="ghost"
                  >
                    <MdClose />
                  </Button>
                </Flex>
                
                <Box p={4}>
                  {availableSports.length === 0 ? (
                    <VStack gap={3} py={4}>
                      <Text>All sports from your list are already being used.</Text>
                      <Text>You can add more sports in <Text as="strong">Settings → Sports List</Text>.</Text>
                    </VStack>
                  ) : (
                    <VStack align="stretch" gap={4}>
                      {Object.entries(
                        availableSports.reduce((acc, { category, sport }) => {
                          if (!acc[category]) acc[category] = [];
                          acc[category].push(sport);
                          return acc;
                        }, {})
                      ).map(([category, sports]) => (
                        <Box key={category}>
                          <Text fontWeight="600" mb={2} color="textMuted" fontSize="sm" whiteSpace="normal" wordBreak="break-word" lineHeight="1.2">
                            {category}
                          </Text>
                          <Grid templateColumns="repeat(auto-fill, minmax(150px, 1fr))" gap={2}>
                            {sports.map(sport => (
                              <Button
                                key={sport}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Sport button clicked:', sport);
                                  handleAddSportType(sport);
                                }}
                                size="sm"
                                variant="outline"
                                justifyContent="flex-start"
                              >
                                {sport}
                              </Button>
                            ))}
                          </Grid>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
              </Box>
            </Box>
          </Portal>
        )}

        {hasError && <span className="field-error">{hasError}</span>}

      </Box>
    );
  };

  const renderWeightHistory = (fieldName, fieldSchema, fieldPath, value, hasError) => {
    let weightHistory = value || {};
    
    // Get unit system from appearance settings (imperial = lbs, metric = kg)
    // First check current form data, then check loaded appearance data
    let unitSystem = getNestedValue(formData, 'appearance.unitSystem');
    if (!unitSystem && appearanceData) {
      unitSystem = appearanceData.unitSystem;
    }
    
    const weightUnit = unitSystem === 'imperial' ? 'lbs' : unitSystem === 'metric' ? 'kg' : 'kg/lbs';
    const showUnitNote = !unitSystem;
    
    // Initialize with default entry if empty (just for display, not saving to state during render)
    if (Object.keys(weightHistory).length === 0) {
      weightHistory = { "1970-01-01": 0 };
    }
    
    // Helper to sort weight history entries newest to oldest
    const sortWeightHistory = (history) => {
      return Object.entries(history)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
        .reduce((acc, [date, weight]) => {
          acc[date] = weight;
          return acc;
        }, {});
    };
    
    const handleAddWeightEntry = () => {
      const today = new Date();
      const iso = today.toISOString().slice(0, 10);
      let newDate = iso;
      let counter = 1;
      
      // Find a unique date
      while (weightHistory[newDate]) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() - counter);
        newDate = nextDay.toISOString().slice(0, 10);
        counter++;
      }
      
      const updated = { ...weightHistory, [newDate]: 0 };
      handleFieldChange(fieldPath, sortWeightHistory(updated));
    };
    
    const handleRemoveWeightEntry = (date) => {
      const updated = { ...weightHistory };
      delete updated[date];
      handleFieldChange(fieldPath, sortWeightHistory(updated));
    };
    
    const handleWeightChange = (date, weight) => {
      const numericWeight = weight === '' ? 0 : parseFloat(weight);
      if (isNaN(numericWeight)) return;
      
      // Validate weight is greater than zero
      if (numericWeight <= 0) {
        alert('Weight must be greater than zero.');
        return;
      }
      
      const updated = { ...weightHistory, [date]: numericWeight };
      handleFieldChange(fieldPath, sortWeightHistory(updated));
    };
    
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
      if (weightHistory[newDate]) {
        alert('A weight entry for this date already exists.');
        return;
      }
      
      const updated = { ...weightHistory };
      updated[newDate] = updated[oldDate];
      delete updated[oldDate];
      handleFieldChange(fieldPath, sortWeightHistory(updated));
    };
    
    return (
      <Box key={fieldPath} mb={6}>
        <Heading size="md" mb={4} color="text">
          {fieldSchema.title || fieldName}
        </Heading>
        {fieldSchema.description && (
          <Text fontSize="sm" color="textMuted" mb={4}>{fieldSchema.description}</Text>
        )}
        
        <Box p={4} bg="cardBg" borderRadius="md" border="1px solid" borderColor="border">
          <Flex 
            direction={{ base: "column", sm: "row" }}
            justify="space-between" 
            align={{ base: "stretch", sm: "center" }} 
            gap={3}
            mb={4}
          >
            <Flex align="center" gap={2}>
              <Heading size="sm" color="text" lineHeight="1.2" wordBreak="break-word">Weight Entries</Heading>
              <Text 
                fontSize="sm" 
                color="textMuted" 
                cursor="help"
                title={'If you don\'t care about relative power, you can use "1970-01-01": YOUR_CURRENT_WEIGHT as a single entry in the Weight History to set a fixed weight for all activities.'}
              >
                ⓘ
              </Text>
            </Flex>
            <Button 
              size="sm" 
              onClick={handleAddWeightEntry}
              bg="primary"
              color="white"
              _hover={{ bg: "primaryHover" }}
            >
              + Add Weight Entry
            </Button>
          </Flex>
          
          {showUnitNote && (
            <Box p={3} bg="blue.50" borderRadius="md" mb={4} fontSize="sm">
              <Flex align="center" gap={2}>
                <Icon color="blue.600"><MdInfo /></Icon>
                <Text color="blue.800">
                  Weight unit depends on <Text as="strong">appearance.unitSystem</Text> setting (imperial = lbs, metric = kg). Configure this in the Appearance section.
                </Text>
              </Flex>
            </Box>
          )}
          
          {Object.keys(weightHistory).length === 0 && (
            <Text color="textMuted" textAlign="center" py={4}>No weight entries defined.</Text>
          )}
          
          <VStack align="stretch" gap={3}>
            {Object.entries(weightHistory)
              .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
              .map(([date, weight]) => (
                <Flex 
                  key={date} 
                  direction={{ base: "column", sm: "row" }}
                  align={{ base: "stretch", sm: "center" }} 
                  gap={3} 
                  p={3} 
                  bg="panelBg" 
                  borderRadius="md"
                >
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => handleDateChange(date, new Date(e.target.value))}
                    max={new Date().toISOString().split('T')[0]}
                    bg="inputBg"
                    width={{ base: "100%", sm: "160px" }}
                  />
                  <Flex gap={2} align="center" flex={{ base: "1", sm: "0" }}>
                    <Input
                      type="number"
                      value={weight}
                      onChange={(e) => handleWeightChange(date, e.target.value)}
                      placeholder="Weight"
                      min="0"
                      step="0.1"
                      bg="inputBg"
                      flex="1"
                      minW="80px"
                    />
                    <Text fontSize="sm" color="text" minW="50px">{weightUnit}</Text>
                  </Flex>
                  <Button 
                    size="sm" 
                    variant="outline"
                    colorPalette="red"
                    onClick={() => handleRemoveWeightEntry(date)}
                  >
                    Remove
                  </Button>
                </Flex>
              ))}
          </VStack>
        </Box>
        
        {hasError && <Text color="red.500" fontSize="sm" mt={2}>{hasError}</Text>}
      </Box>
    );
  };

  const renderFtpHistory = (fieldName, fieldSchema, fieldPath, value, hasError) => {
    let ftpHistory = value || {};
    
    // Helper to sort FTP history entries newest to oldest
    const sortFtpHistory = (history) => {
      return Object.entries(history)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
        .reduce((acc, [date, ftp]) => {
          acc[date] = ftp;
          return acc;
        }, {});
    };
    
    const handleAddFtpEntry = (sport) => {
      const today = new Date();
      const iso = today.toISOString().slice(0, 10);
      let newDate = iso;
      let counter = 1;
      
      const sportHistory = ftpHistory[sport] || {};
      
      // Find a unique date
      while (sportHistory[newDate]) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() - counter);
        newDate = nextDay.toISOString().slice(0, 10);
        counter++;
      }
      
      const updatedSportHistory = { ...sportHistory, [newDate]: 0 };
      const updated = { ...ftpHistory, [sport]: sortFtpHistory(updatedSportHistory) };
      handleFieldChange(fieldPath, updated);
    };
    
    const handleRemoveFtpEntry = (sport, date) => {
      const sportHistory = { ...(ftpHistory[sport] || {}) };
      delete sportHistory[date];
      
      const updated = { ...ftpHistory };
      if (Object.keys(sportHistory).length === 0) {
        delete updated[sport];
      } else {
        updated[sport] = sortFtpHistory(sportHistory);
      }
      handleFieldChange(fieldPath, updated);
    };
    
    const handleFtpChange = (sport, date, ftp) => {
      const numericFtp = ftp === '' ? 0 : parseFloat(ftp);
      if (isNaN(numericFtp)) return;
      
      // Validate FTP is greater than zero
      if (numericFtp <= 0) {
        alert('FTP must be greater than zero.');
        return;
      }
      
      const sportHistory = { ...(ftpHistory[sport] || {}), [date]: numericFtp };
      const updated = { ...ftpHistory, [sport]: sortFtpHistory(sportHistory) };
      handleFieldChange(fieldPath, updated);
    };
    
    const handleDateChange = (sport, oldDate, selectedDate) => {
      if (!selectedDate) return;
      
      const newDate = selectedDate.toISOString().slice(0, 10);
      if (newDate === oldDate) return;
      
      // Check if date is in the future
      const today = new Date();
      if (selectedDate > today) {
        alert('Date cannot be in the future. Please select today\'s date or a past date.');
        return;
      }
      
      const sportHistory = ftpHistory[sport] || {};
      
      // Check if new date already exists
      if (sportHistory[newDate]) {
        alert('An FTP entry for this date already exists.');
        return;
      }
      
      const updated = { ...sportHistory };
      updated[newDate] = updated[oldDate];
      delete updated[oldDate];
      const updatedFull = { ...ftpHistory, [sport]: sortFtpHistory(updated) };
      handleFieldChange(fieldPath, updatedFull);
    };
    
    const renderSportFtpHistory = (sport, sportTitle, tooltip) => {
      const sportHistory = ftpHistory[sport] || {};
      
      return (
        <Box key={sport} mb={4}>
          <Box p={4} bg="cardBg" borderRadius="md" border="1px solid" borderColor="border">
            <Flex 
              direction={{ base: "column", sm: "row" }}
              justify="space-between" 
              align={{ base: "stretch", sm: "center" }} 
              gap={3}
              mb={4}
            >
              <Flex align="center" gap={2}>
                <Heading size="sm" color="text" lineHeight="1.2" wordBreak="break-word">{sportTitle}</Heading>
                <Text 
                  fontSize="sm" 
                  color="textMuted" 
                  cursor="help"
                  title={tooltip}
                >
                  ⓘ
                </Text>
              </Flex>
              <Button 
                size="sm" 
                onClick={() => handleAddFtpEntry(sport)}
                bg="primary"
                color="white"
                _hover={{ bg: "primaryHover" }}
              >
                + Add {sportTitle} FTP
              </Button>
            </Flex>
            
            {Object.keys(sportHistory).length === 0 && (
              <Text color="textMuted" textAlign="center" py={4}>No {sportTitle} FTP entries defined.</Text>
            )}
            
            <VStack align="stretch" gap={3}>
              {Object.entries(sportHistory)
                .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                .map(([date, ftp]) => (
                  <Flex 
                    key={date} 
                    direction={{ base: "column", sm: "row" }}
                    align={{ base: "stretch", sm: "center" }} 
                    gap={3} 
                    p={3} 
                    bg="panelBg" 
                    borderRadius="md"
                  >
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => handleDateChange(sport, date, new Date(e.target.value))}
                      max={new Date().toISOString().split('T')[0]}
                      bg="inputBg"
                      width={{ base: "100%", sm: "160px" }}
                    />
                    <Flex gap={2} align="center" flex={{ base: "1", sm: "0" }}>
                      <Input
                        type="number"
                        value={ftp}
                        onChange={(e) => handleFtpChange(sport, date, e.target.value)}
                        placeholder="FTP"
                        min="0"
                        step="1"
                        bg="inputBg"
                        flex="1"
                        minW="80px"
                      />
                      <Text fontSize="sm" color="text" minW="50px">watts</Text>
                    </Flex>
                    <Button 
                      size="sm" 
                      variant="outline"
                      colorPalette="red"
                      onClick={() => handleRemoveFtpEntry(sport, date)}
                    >
                      Remove
                    </Button>
                  </Flex>
                ))}
            </VStack>
          </Box>
        </Box>
      );
    };
    
    return (
      <Box key={fieldPath} mb={6}>
        <Heading size="md" mb={4} color="text">
          {fieldSchema.title || fieldName}
        </Heading>
        {fieldSchema.description && (
          <Text fontSize="sm" color="textMuted" mb={4}>{fieldSchema.description}</Text>
        )}
        
        <VStack align="stretch" gap={4}>
          {renderSportFtpHistory(
            'cycling', 
            'Cycling', 
            'Functional Threshold Power (FTP) is the highest average power (measured in watts) you can sustain for about one hour without fatiguing. Usually tested with a 20-minute all-out effort. Your average power for those 20 minutes is multiplied by 0.95 to estimate your FTP.'
          )}
          
          {renderSportFtpHistory(
            'running', 
            'Running', 
            'Running equivalent (threshold pace or critical power) is using pace at lactate threshold (the fastest pace you can sustain for ~60 minutes). Some advanced setups with running power meters (like Stryd) do calculate a "running FTP," but most runners stick to pace or heart rate zones.'
          )}
        </VStack>
        
        {hasError && <Text color="red.500" fontSize="sm" mt={2}>{hasError}</Text>}
      </Box>
    );
  };

  const renderField = (fieldName, fieldSchema, fieldPath = fieldName, skipDescription = false) => {
    const value = getNestedValue(formData, fieldPath);
    const hasError = errors[fieldPath];

    // Special handling for heartRateZones field
    if (fieldName === 'heartRateZones') {
      return renderHeartRateZones(fieldName, fieldSchema, fieldPath, value, hasError);
    }
    
    // Special handling for weightHistory field
    if (fieldName === 'weightHistory') {
      return renderWeightHistory(fieldName, fieldSchema, fieldPath, value, hasError);
    }
    
    // Special handling for ftpHistory field
    if (fieldName === 'ftpHistory') {
      return renderFtpHistory(fieldName, fieldSchema, fieldPath, value, hasError);
    }

    // Handle oneOf schemas (like maxHeartRateFormula)
    if (fieldSchema.oneOf) {
      // For now, handle the common case where oneOf has string enum and object options
      const stringOption = fieldSchema.oneOf.find(option => option.type === 'string' && option.enum);
      if (stringOption) {
        return (
          <Box key={fieldPath} mb={4}>
            <Text fontWeight="500" mb={1}>
              {stringOption.title || fieldName}
              {schema?.required?.includes(fieldName) && <Text as="span" color="red.500" ml={1}>*</Text>}
            </Text>
            <NativeSelectRoot borderColor={hasError ? 'red.500' : 'border'}>
              <NativeSelectField
                id={fieldPath}
                value={value || stringOption.default || ''}
                onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
              >
                <option value="">Select...</option>
                {stringOption.enum.map((option, idx) => (
                  <option key={option} value={option}>
                    {stringOption.enumTitles?.[idx] || option}
                  </option>
                ))}
              </NativeSelectField>
            </NativeSelectRoot>
            {!skipDescription && stringOption.description && (
              <Text fontSize="sm" color="textMuted" mt={1}>{stringOption.description}</Text>
            )}
            {hasError && <Text color="red.500" fontSize="sm" mt={1}>{hasError}</Text>}
          </Box>
        );
      }
    }

    // Handle array types (e.g., ["string", "null"]) by using the primary type
    const fieldType = Array.isArray(fieldSchema.type) ? fieldSchema.type[0] : fieldSchema.type;

    switch (fieldType) {
      case 'string':
        if (fieldSchema.enum) {
          return (
            <Box key={fieldPath} mb={4}>
              <Text fontWeight="500" mb={1}>
                {fieldSchema.title || fieldName}
                {schema?.required?.includes(fieldName) && <Text as="span" color="red.500" ml={1}>*</Text>}
              </Text>
              <NativeSelectRoot borderColor={hasError ? 'red.500' : 'border'}>
                <NativeSelectField
                  id={fieldPath}
                  value={value || ''}
                  onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
                >
                  <option value="">Select...</option>
                  {fieldSchema.enum.map((option, idx) => (
                    <option key={option} value={option}>
                      {fieldSchema.enumTitles?.[idx] || option}
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
              {fieldSchema.description && (
                <Text fontSize="sm" color="textMuted" mt={1}>{fieldSchema.description}</Text>
              )}
              {hasError && <Text color="red.500" fontSize="sm" mt={1}>{hasError}</Text>}
            </Box>
          );
        }
        
        return (
          <Box key={fieldPath} mb={4}>
            <Text fontWeight="500" mb={1}>
              {fieldSchema.title || fieldName}
              {schema?.required?.includes(fieldName) && <Text as="span" color="red.500" ml={1}>*</Text>}
            </Text>
            <Input
              id={fieldPath}
              type={fieldSchema.format === 'date' ? 'date' : fieldSchema.format === 'uri' ? 'url' : 'text'}
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
              placeholder={fieldSchema.examples?.[0] || ''}
              borderColor={hasError ? 'red.500' : 'border'}
              bg="inputBg"
            />
            {fieldSchema.description && (
              <Text fontSize="sm" color="textMuted" mt={1}>{fieldSchema.description}</Text>
            )}
            {hasError && <Text color="red.500" fontSize="sm" mt={1}>{hasError}</Text>}
          </Box>
        );

      case 'number':
      case 'integer':
        return (
          <Box key={fieldPath} mb={4}>
            <Text fontWeight="500" mb={1}>
              {fieldSchema.title || fieldName}
              {schema?.required?.includes(fieldName) && <Text as="span" color="red.500" ml={1}>*</Text>}
            </Text>
            <Input
              id={fieldPath}
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldPath, parseFloat(e.target.value) || '')}
              min={fieldSchema.minimum}
              max={fieldSchema.maximum}
              step={fieldSchema.type === 'integer' ? 1 : 0.1}
              borderColor={hasError ? 'red.500' : 'border'}
              bg="inputBg"
            />
            {fieldSchema.description && (
              <Text fontSize="sm" color="textMuted" mt={1}>{fieldSchema.description}</Text>
            )}
            {hasError && <Text color="red.500" fontSize="sm" mt={1}>{hasError}</Text>}
          </Box>
        );

      case 'object':
        return (
          <Box key={fieldPath} mb={6}>
            <Heading size="md" mb={2}>{fieldSchema.title || fieldName}</Heading>
            {fieldSchema.description && (
              <Text fontSize="sm" color="textMuted" mb={3}>{fieldSchema.description}</Text>
            )}
            <VStack align="stretch" gap={4} pl={4} borderLeftWidth="2px" borderLeftColor="border">
              {Object.entries(fieldSchema.properties || {}).map(([subFieldName, subFieldSchema]) =>
                renderField(subFieldName, subFieldSchema, `${fieldPath}.${subFieldName}`)
              )}
            </VStack>
          </Box>
        );

      default:
        return (
          <Box key={fieldPath} mb={4}>
            <Text fontWeight="500" mb={1}>{fieldSchema.title || fieldName}</Text>
            <Text fontSize="sm" color="textMuted">Unsupported field type: {fieldType} (original: {JSON.stringify(fieldSchema.type)})</Text>
          </Box>
        );
    }
  };

  if (!schema) {
    return (
      <Box p={6}>
        <Flex
          align="center"
          gap={2}
          p={4}
          bg="red.50"
          _dark={{ bg: 'red.900/30' }}
          borderRadius="md"
        >
          <Text fontSize="lg">❌</Text>
          <Text>Schema not found for section: {sectionName}</Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={2} lineHeight="1.2" wordBreak="break-word">{schema.title || sectionName}</Heading>
      
      {schema.description && <Text color="textMuted" mb={4}>{schema.description}</Text>}
      
      <Flex
        align="flex-start"
        gap={2}
        p={3}
        bg="blue.50"
        _dark={{ bg: 'blue.900/30' }}
        borderRadius="md"
        mb={6}
      >
        <Box as={MdInfo} fontSize="xl" color="blue.500" mt={0.5} />
        <Text fontSize="sm">
          <Text as="strong">Note:</Text> Saving changes with this editor preserves section headers but may remove embedded comments from YAML files. 
          This form's guided input with descriptions and validation minimizes the need for comments.
        </Text>
      </Flex>

      <Box as="form" onSubmit={handleSubmit}>
        <VStack align="stretch" gap={4}>
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
                <Box key={fieldName} mb={4}>
                  <Text fontWeight="500" mb={1}>
                    {stringOption?.title || fieldName}
                    {schema?.required?.includes(fieldName) && <Text as="span" color="red.500" ml={1}>*</Text>}
                  </Text>
                  <Flex gap={3} align="center">
                    <NativeSelectRoot flex="1" borderColor={hasError ? 'red.500' : 'border'}>
                      <NativeSelectField
                        id={fieldName}
                        value={value || ''}
                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        bg="inputBg"
                      >
                        <option value="">Select...</option>
                        {stringOption?.enum.map((option, idx) => (
                          <option key={option} value={option}>
                            {stringOption.enumTitles?.[idx] || option}
                          </option>
                        ))}
                      </NativeSelectField>
                    </NativeSelectRoot>
                    {maxHR && (
                      <Text fontSize="sm" color="textMuted" whiteSpace="nowrap">
                        Calculated Max Heart Rate: <Text as="strong">{maxHR} BPM</Text>
                      </Text>
                    )}
                  </Flex>
                  {hasError && <Text color="red.500" fontSize="sm" mt={1}>{hasError}</Text>}
                </Box>
              );
            }
            
            return renderField(fieldName, fieldSchema);
          })}
        </VStack>

        <HStack justify="flex-end" gap={3} pt={4}>
          <Button 
            onClick={handleCancelWithConfirm}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            bg="primary"
            color="white"
            _hover={{ bg: "primaryHover" }}
            border={!isLoading ? "3px solid" : "none"}
            borderColor={!isLoading ? "primaryHover" : "transparent"}
            boxShadow={!isLoading ? { base: "0 0 8px rgba(252, 82, 0, 0.5)", _dark: "0 0 12px rgba(255, 127, 63, 0.8)" } : "none"}
          >
            {isLoading ? 'Saving...' : `Save Changes${isDirty ? ' *' : ''}`}
          </Button>
        </HStack>
      </Box>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Leave Anyway"
        confirmColorPalette="orange"
        onConfirm={confirmDialog.onConfirm || (() => {})}
        onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' })}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Box>
  );
};

export default ConfigSectionEditor;