import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Input, Flex, Text, VStack, HStack, Table, Heading, Icon, Field } from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react';
import { MdAdd, MdInfo, MdDelete, MdBuild } from 'react-icons/md';
import { calculateAge, calculateMaxHeartRate, calculateDefaultZones, validateZoneConsecutiveness, fixZoneGaps } from '../../../src/utils/heartRateUtils';
import { readSportsList, initialSportsList } from '../../../src/utils/sportsListManager';
import { DateInput } from './DateInput';

/**
 * HeartRateZonesEditor - Complex editor for heart rate zones configuration
 * Handles: mode selection, default zones, date ranges, and sport-specific overrides
 */
const HeartRateZonesEditor = ({
  zones = {},
  onChange,
  birthday,
  formula,
  errors = {},
  required = false,
  needsRecalculation = false
}) => {
  const [sportsList, setSportsList] = useState(initialSportsList);
  const [showSportModal, setShowSportModal] = useState(false);
  const lastModeRef = useRef(null);
  
  const currentMode = zones?.mode || '';
  const currentZones = zones?.default || {};
  const dateRanges = zones?.dateRanges || {};
  const sportTypes = zones?.sportTypes || {};
  
  // Calculate max heart rate
  const age = calculateAge(birthday);
  const calculatedMaxHR = calculateMaxHeartRate(birthday, formula);
  
  // Load sports list
  useEffect(() => {
    const loadSports = async () => {
      try {
        const sports = await readSportsList();
        if (sports && Object.keys(sports).length > 0) {
          setSportsList(sports);
        }
      } catch (error) {
        console.error('Failed to load sports list:', error);
      }
    };
    loadSports();
  }, []);
  
  // Auto-populate zones when mode changes and zones are empty
  useEffect(() => {
    // Only run if mode actually changed
    if (currentMode && currentMode !== lastModeRef.current) {
      lastModeRef.current = currentMode;
      
      const existingZones = zones?.default || {};
      const hasExistingZones = Object.keys(existingZones).length > 0;
      
      // Only auto-populate if we have max HR and no existing zones
      if (calculatedMaxHR && !hasExistingZones) {
        const defaultZones = calculateDefaultZones(calculatedMaxHR, currentMode);
        if (defaultZones) {
          onChange({ ...zones, default: defaultZones });
        }
      }
    }
  }, [currentMode, calculatedMaxHR, zones, onChange]);
  
  // Handle mode change
  const handleModeChange = (newMode) => {
    // Auto-recalculate zones when switching modes
    if (calculatedMaxHR && newMode !== currentMode) {
      const defaultZones = calculateDefaultZones(calculatedMaxHR, newMode);
      if (defaultZones) {
        // Create a fresh zones object with only the mode and new default zones
        const updatedZones = {
          mode: newMode,
          default: defaultZones
        };
        
        // Preserve dateRanges and sportTypes if they exist, but don't auto-convert them
        if (zones.dateRanges && Object.keys(zones.dateRanges).length > 0) {
          updatedZones.dateRanges = zones.dateRanges;
        }
        if (zones.sportTypes && Object.keys(zones.sportTypes).length > 0) {
          updatedZones.sportTypes = zones.sportTypes;
        }
        
        onChange(updatedZones);
        return;
      }
    }
    onChange({ ...zones, mode: newMode });
  };
  
  // Handle zone value changes with chaining logic
  const handleZoneChange = (zoneNumber, field, newValue) => {
    const updatedZones = { ...(zones.default || {}) };
    
    if (!updatedZones[`zone${zoneNumber}`]) {
      updatedZones[`zone${zoneNumber}`] = {};
    }
    updatedZones[`zone${zoneNumber}`][field] = newValue === '' ? null : parseInt(newValue);
    
    // Chain "to" value to next zone's "from" value
    if (field === 'to' && zoneNumber < 5 && newValue !== '' && newValue !== null) {
      const nextZoneNum = zoneNumber + 1;
      if (!updatedZones[`zone${nextZoneNum}`]) {
        updatedZones[`zone${nextZoneNum}`] = {};
      }
      updatedZones[`zone${nextZoneNum}`].from = parseInt(newValue) + 1;
    }
    
    onChange({ ...zones, default: updatedZones });
  };
  
  // Auto-populate zones based on birthday, formula and mode
  const autoPopulateZones = () => {
    const mode = currentMode || 'relative';
    const maxHR = calculatedMaxHR;
    
    if (maxHR) {
      const defaultZones = calculateDefaultZones(maxHR, mode);
      if (defaultZones) {
        onChange({ ...zones, default: defaultZones });
      }
    }
  };
  
  // Fix gaps in default zones
  const handleFixDefaultGaps = () => {
    const fixed = fixZoneGaps(currentZones);
    onChange({ ...zones, default: fixed });
  };
  
  // Fix gaps in date range zones
  const handleFixDateRangeGaps = (date) => {
    const fixed = fixZoneGaps(dateRanges[date]);
    const updated = { ...dateRanges, [date]: fixed };
    onChange({ ...zones, dateRanges: updated });
  };
  
  // Fix gaps in sport type zones
  const handleFixSportTypeGaps = (sport) => {
    const sportData = sportTypes[sport];
    const fixed = fixZoneGaps(sportData.default || sportData);
    const updated = { ...sportTypes, [sport]: { ...sportData, default: fixed } };
    onChange({ ...zones, sportTypes: updated });
  };
  
  // Fix gaps in sport date range zones
  const handleFixSportDateRangeGaps = (sport, date) => {
    const sportData = sportTypes[sport];
    const dateRangeData = sportData.dateRanges || {};
    const fixed = fixZoneGaps(dateRangeData[date]);
    const updatedDateRanges = { ...dateRangeData, [date]: fixed };
    const updated = { 
      ...sportTypes, 
      [sport]: { 
        ...sportData, 
        dateRanges: updatedDateRanges 
      } 
    };
    onChange({ ...zones, sportTypes: updated });
  };
  
  // Handle date range operations
  const handleAddDateRange = () => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...dateRanges };
    
    if (updated[today]) {
      alert('A date range for today already exists.');
      return;
    }
    
    // Copy default zones as starting point
    updated[today] = { ...currentZones };
    onChange({ ...zones, dateRanges: updated });
  };
  
  const handleRemoveDateRange = (date) => {
    const updated = { ...dateRanges };
    delete updated[date];
    onChange({ ...zones, dateRanges: updated });
  };
  
  const handleDateChange = (oldDate, newDateStr) => {
    if (!newDateStr || newDateStr === oldDate) return;
    
    if (dateRanges[newDateStr]) {
      alert('A date range for this date already exists.');
      return;
    }
    
    const updated = { ...dateRanges };
    updated[newDateStr] = updated[oldDate];
    delete updated[oldDate];
    onChange({ ...zones, dateRanges: updated });
  };
  
  const handleDateRangeZoneChange = (date, zoneNumber, field, newValue) => {
    const updated = { ...dateRanges };
    
    if (!updated[date][`zone${zoneNumber}`]) {
      updated[date][`zone${zoneNumber}`] = {};
    }
    updated[date][`zone${zoneNumber}`][field] = newValue === '' ? null : parseInt(newValue);
    
    // Chain "to" value to next zone's "from" value
    if (field === 'to' && zoneNumber < 5 && newValue !== '' && newValue !== null) {
      const nextZoneNum = zoneNumber + 1;
      if (!updated[date][`zone${nextZoneNum}`]) {
        updated[date][`zone${nextZoneNum}`] = {};
      }
      updated[date][`zone${nextZoneNum}`].from = parseInt(newValue) + 1;
    }
    
    onChange({ ...zones, dateRanges: updated });
  };
  
  // Handle sport type operations
  const handleAddSportType = (sportName) => {
    const updated = { ...sportTypes };
    updated[sportName] = {
      default: { ...currentZones },
      dateRanges: {}
    };
    onChange({ ...zones, sportTypes: updated });
    setShowSportModal(false);
  };
  
  const handleRemoveSportType = (sportName) => {
    const updated = { ...sportTypes };
    delete updated[sportName];
    onChange({ ...zones, sportTypes: updated });
  };
  
  const handleSportTypeZoneChange = (sportName, zoneNumber, field, newValue) => {
    const updated = { ...sportTypes };
    
    if (!updated[sportName].default[`zone${zoneNumber}`]) {
      updated[sportName].default[`zone${zoneNumber}`] = {};
    }
    updated[sportName].default[`zone${zoneNumber}`][field] = newValue === '' ? null : parseInt(newValue);
    
    // Chain "to" value to next zone's "from" value
    if (field === 'to' && zoneNumber < 5 && newValue !== '' && newValue !== null) {
      const nextZoneNum = zoneNumber + 1;
      if (!updated[sportName].default[`zone${nextZoneNum}`]) {
        updated[sportName].default[`zone${nextZoneNum}`] = {};
      }
      updated[sportName].default[`zone${nextZoneNum}`].from = parseInt(newValue) + 1;
    }
    
    onChange({ ...zones, sportTypes: updated });
  };
  
  const handleAddSportDateRange = (sportName) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...sportTypes };
    
    if (updated[sportName].dateRanges[today]) {
      alert('A date range for today already exists for this sport.');
      return;
    }
    
    updated[sportName].dateRanges[today] = { ...updated[sportName].default };
    onChange({ ...zones, sportTypes: updated });
  };
  
  const handleRemoveSportDateRange = (sportName, date) => {
    const updated = { ...sportTypes };
    delete updated[sportName].dateRanges[date];
    onChange({ ...zones, sportTypes: updated });
  };
  
  const handleSportDateChange = (sportName, oldDate, newDateStr) => {
    if (!newDateStr || newDateStr === oldDate) return;
    
    const sportDateRanges = sportTypes[sportName]?.dateRanges || {};
    if (sportDateRanges[newDateStr]) {
      alert('A date range for this date already exists for this sport.');
      return;
    }
    
    const updated = { ...sportTypes };
    updated[sportName].dateRanges[newDateStr] = updated[sportName].dateRanges[oldDate];
    delete updated[sportName].dateRanges[oldDate];
    onChange({ ...zones, sportTypes: updated });
  };
  
  const handleSportDateRangeZoneChange = (sportName, date, zoneNumber, field, newValue) => {
    const updated = { ...sportTypes };
    
    if (!updated[sportName].dateRanges[date][`zone${zoneNumber}`]) {
      updated[sportName].dateRanges[date][`zone${zoneNumber}`] = {};
    }
    updated[sportName].dateRanges[date][`zone${zoneNumber}`][field] = newValue === '' ? null : parseInt(newValue);
    
    // Chain "to" value to next zone's "from" value
    if (field === 'to' && zoneNumber < 5 && newValue !== '' && newValue !== null) {
      const nextZoneNum = zoneNumber + 1;
      if (!updated[sportName].dateRanges[date][`zone${nextZoneNum}`]) {
        updated[sportName].dateRanges[date][`zone${nextZoneNum}`] = {};
      }
      updated[sportName].dateRanges[date][`zone${nextZoneNum}`].from = parseInt(newValue) + 1;
    }
    
    onChange({ ...zones, sportTypes: updated });
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
  
  // Render zone table
  const renderZoneTable = (zonesData, onZoneChange, keyPrefix = '', zoneErrors = {}) => {
    return (
      <Box>
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
                  <Table.Cell key={`${keyPrefix}-zone${zoneNum}-from`}>
                    <Flex align="center" gap={1}>
                      <Input
                        type="number"
                        value={zonesData[`zone${zoneNum}`]?.from || ''}
                        onChange={(e) => onZoneChange(zoneNum, 'from', e.target.value)}
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
                  <Table.Cell key={`${keyPrefix}-zone${zoneNum}-to`}>
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
                          value={zonesData[`zone${zoneNum}`]?.to || ''}
                          onChange={(e) => onZoneChange(zoneNum, 'to', e.target.value)}
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
        {/* Display zone errors below the table */}
        {Object.keys(zoneErrors).length > 0 && (
          <Box mt={2}>
            {Object.entries(zoneErrors).map(([zone, message]) => (
              <Text key={zone} color="red.500" fontSize="sm">
                • {message}
              </Text>
            ))}
          </Box>
        )}
      </Box>
    );
  };
  
  return (
    <Box mb={6}>
      <Box mb={4}>
        <Heading size="md" mb={1} lineHeight="1.2" wordBreak="break-word">Heart Rate Zones</Heading>
        <Text fontSize="sm" color="textMuted">
          Configure your heart rate zones for training. Supports default zones, date ranges, and sport-specific overrides.
        </Text>
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
          {required && <Text as="span" color="red.500" ml={1}>*</Text>}
        </Text>
        <NativeSelectRoot borderColor={(errors['heartRateZones.mode'] || errors['heartRateZones']) ? 'red.500' : 'border'}>
          <NativeSelectField
            value={currentMode || ''}
            onChange={(e) => handleModeChange(e.target.value)}
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

      {/* Default Zones */}
      <Flex justify="space-between" align="center" mb={3} gap={2} flexWrap="wrap">
        <Heading size="sm" lineHeight="1.2" wordBreak="break-word" flex="1" minW="fit-content">Default Heart Rate Zones</Heading>
        <Flex gap={2} flexWrap="wrap">
          {(() => {
            const defaultZoneErrors = validateZoneConsecutiveness(currentZones, currentMode);
            const hasGaps = Object.keys(defaultZoneErrors).length > 0;
            return hasGaps && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleFixDefaultGaps}
                title="Automatically fix gaps between zones"
                flexShrink={0}
                colorPalette="blue"
              >
                <MdBuild /> Fix All Gaps
              </Button>
            );
          })()}
          {calculatedMaxHR && (
            <Button
              size="sm"
              variant="outline"
              onClick={autoPopulateZones}
              title="Recalculate zones based on current age and formula"
              flexShrink={0}
              colorPalette={needsRecalculation ? "orange" : undefined}
            >
              Recalculate Zones{needsRecalculation && ' *'}
            </Button>
          )}
        </Flex>
      </Flex>
      <Box mb={6}>
        {(() => {
          const defaultZoneErrors = validateZoneConsecutiveness(currentZones, currentMode);
          const errorMessages = {};
          // Map errors to match the error key format from validation
          Object.entries(defaultZoneErrors).forEach(([zone, message]) => {
            errorMessages[zone] = errors[`heartRateZones.default.${zone}`] || message;
          });
          return renderZoneTable(currentZones, handleZoneChange, 'default', errorMessages);
        })()}
      </Box>

      {/* Date Ranges Section */}
      <Box mb={6}>
        <Flex justify="space-between" align="center" mb={3} gap={2} flexWrap="wrap">
          <Heading size="sm" lineHeight="1.2" wordBreak="break-word" flex="1" minW="fit-content">Date Ranges</Heading>
          <Button onClick={handleAddDateRange} size="sm" variant="outline" flexShrink={0}>
            <MdAdd /> Add Date Range
          </Button>
        </Flex>
        {Object.keys(dateRanges).length === 0 && (
          <Text fontSize="sm" color="textMuted">No date ranges defined.</Text>
        )}
        <VStack align="stretch" gap={4}>
          {Object.entries(dateRanges)
            .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
            .map(([date, zonesData]) => (
            <Box key={date} p={4} borderWidth="1px" borderColor="border" borderRadius="md">
              <Flex justify="space-between" align="center" mb={3} gap={2} flexWrap="wrap">
                <Field.Root maxW="200px">
                  <Field.Label srOnly>Effective Date</Field.Label>
                  <DateInput
                    value={date}
                    onChange={(newDate) => handleDateChange(date, newDate)}
                    bg="inputBg"
                  />
                </Field.Root>
                <Flex gap={2} flexWrap="wrap">
                  {(() => {
                    const dateRangeErrors = validateZoneConsecutiveness(zonesData, currentMode);
                    const hasGaps = Object.keys(dateRangeErrors).length > 0;
                    return hasGaps && (
                      <Button
                        onClick={() => handleFixDateRangeGaps(date)}
                        size="sm"
                        variant="outline"
                        colorPalette="blue"
                        title="Fix gaps in this date range"
                        flexShrink={0}
                      >
                        <MdBuild /> Fix Gaps
                      </Button>
                    );
                  })()}
                  <Button onClick={() => handleRemoveDateRange(date)} size="sm" variant="outline" colorPalette="red" title="Remove date range" flexShrink={0}>
                    <MdDelete />
                  </Button>
                </Flex>
              </Flex>
              {(() => {
                const dateRangeErrors = validateZoneConsecutiveness(zonesData, currentMode);
                const errorMessages = {};
                Object.entries(dateRangeErrors).forEach(([zone, message]) => {
                  errorMessages[zone] = errors[`heartRateZones.dateRanges.${date}.${zone}`] || message;
                });
                return renderZoneTable(zonesData, (zoneNum, field, value) => handleDateRangeZoneChange(date, zoneNum, field, value), `date-${date}`, errorMessages);
              })()}
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Sport Types Section */}
      <Box>
        <Flex justify="space-between" align="center" mb={3} gap={2} flexWrap="wrap">
          <Heading size="sm" lineHeight="1.2" wordBreak="break-word" flex="1" minW="fit-content">Sport Type Overrides</Heading>
          <Button onClick={() => setShowSportModal(true)} size="sm" variant="outline" flexShrink={0}>
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
              <Flex justify="space-between" align="center" mb={4} gap={2} flexWrap="wrap">
                <Heading size="sm" lineHeight="1.2" wordBreak="break-word" flex="1" minW="fit-content">{sportName}</Heading>
                <Button onClick={() => handleRemoveSportType(sportName)} size="sm" variant="outline" colorPalette="red" flexShrink={0} title="Remove sport type">
                  <MdDelete />
                </Button>
              </Flex>
              
              {/* Default zones for this sport */}
              <Box mb={4}>
                <Flex justify="space-between" align="center" mb={2} gap={2} flexWrap="wrap">
                  <Heading size="xs" lineHeight="1.2" wordBreak="break-word" flex="1" minW="fit-content">Default Zones</Heading>
                  {(() => {
                    const sportZoneErrors = validateZoneConsecutiveness(sportData.default || {}, currentMode);
                    const hasGaps = Object.keys(sportZoneErrors).length > 0;
                    return hasGaps && (
                      <Button
                        onClick={() => handleFixSportTypeGaps(sportName)}
                        size="xs"
                        variant="outline"
                        colorPalette="blue"
                        title="Fix gaps in this sport's zones"
                        flexShrink={0}
                      >
                        <MdBuild /> Fix Gaps
                      </Button>
                    );
                  })()}
                </Flex>
                {(() => {
                  const sportZoneErrors = validateZoneConsecutiveness(sportData.default || {}, currentMode);
                  const errorMessages = {};
                  Object.entries(sportZoneErrors).forEach(([zone, message]) => {
                    errorMessages[zone] = errors[`heartRateZones.sportTypes.${sportName}.${zone}`] || message;
                  });
                  return renderZoneTable(sportData.default || {}, (zoneNum, field, value) => handleSportTypeZoneChange(sportName, zoneNum, field, value), `sport-${sportName}`, errorMessages);
                })()}
              </Box>
              
              {/* Date ranges for this sport */}
              <Box>
                <Flex justify="space-between" align="center" mb={2} gap={2} flexWrap="wrap">
                  <Heading size="xs" lineHeight="1.2" wordBreak="break-word" flex="1" minW="fit-content">Date Ranges</Heading>
                  <Button 
                    onClick={() => handleAddSportDateRange(sportName)} 
                    size={{ base: "xs", sm: "xs" }} 
                    variant="outline" 
                    flexShrink={0}
                    fontSize={{ base: "xs", sm: "sm" }}
                    px={{ base: 2, sm: 3 }}
                  >
                    <MdAdd /> Add Date Range
                  </Button>
                </Flex>
                {Object.keys(sportData.dateRanges || {}).length === 0 && (
                  <Text fontSize="sm" color="textMuted">No date ranges for this sport.</Text>
                )}
                <VStack align="stretch" gap={3}>
                  {Object.entries(sportData.dateRanges || {})
                    .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                    .map(([date, zonesData]) => (
                    <Box key={date} p={{ base: 2, sm: 3 }} borderWidth="1px" borderColor="border" borderRadius="md">
                      <Flex justify="space-between" align="center" mb={2} gap={2} flexWrap="wrap">
                        <Field.Root maxW={{ base: "100%", sm: "180px" }} flex="1">
                          <Field.Label srOnly>Effective Date</Field.Label>
                          <DateInput
                            value={date}
                            onChange={(newDate) => handleSportDateChange(sportName, date, newDate)}
                            bg="inputBg"
                            size="sm"
                          />
                        </Field.Root>
                        <Flex gap={2} flexWrap="wrap">
                          {(() => {
                            const sportDateErrors = validateZoneConsecutiveness(zonesData, currentMode);
                            const hasGaps = Object.keys(sportDateErrors).length > 0;
                            return hasGaps && (
                              <Button
                                onClick={() => handleFixSportDateRangeGaps(sportName, date)}
                                size="xs"
                                variant="outline"
                                colorPalette="blue"
                                title="Fix gaps in this date range"
                                flexShrink={0}
                              >
                                <MdBuild /> Fix
                              </Button>
                            );
                          })()}
                          <Button onClick={() => handleRemoveSportDateRange(sportName, date)} size="xs" variant="outline" colorPalette="red" flexShrink={0} title="Remove date range">
                            <MdDelete />
                          </Button>
                        </Flex>
                      </Flex>
                      {(() => {
                        const sportDateErrors = validateZoneConsecutiveness(zonesData, currentMode);
                        const errorMessages = {};
                        Object.entries(sportDateErrors).forEach(([zone, message]) => {
                          errorMessages[zone] = errors[`heartRateZones.sportTypes.${sportName}.dateRanges.${date}.${zone}`] || message;
                        });
                        return renderZoneTable(zonesData, (zoneNum, field, value) => handleSportDateRangeZoneChange(sportName, date, zoneNum, field, value), `sport-${sportName}-date-${date}`, errorMessages);
                      })()}
                    </Box>
                  ))}
                </VStack>
              </Box>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Sport Selection Modal */}
      {showSportModal && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0,0,0,0.5)"
          zIndex="1000"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setShowSportModal(false)}
        >
          <Box
            bg="cardBg"
            p={6}
            borderRadius="md"
            maxW="500px"
            maxH="80vh"
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Heading size="md" mb={4} lineHeight="1.2" wordBreak="break-word">Select Sport Type</Heading>
            {availableSports.length === 0 ? (
              <Text>All sports have been added.</Text>
            ) : (
              <VStack align="stretch" gap={2}>
                {availableSports.map(({ category, sport }) => (
                  <Button
                    key={sport}
                    onClick={() => handleAddSportType(sport)}
                    variant="outline"
                    justifyContent="flex-start"
                  >
                    <Text fontWeight="600">{sport}</Text>
                    <Text fontSize="xs" color="textMuted" ml={2}>({category})</Text>
                  </Button>
                ))}
              </VStack>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default HeartRateZonesEditor;
