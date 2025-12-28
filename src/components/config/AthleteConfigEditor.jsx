import React from 'react';
import { Box, Text, Flex, Icon } from '@chakra-ui/react';
import { MdInfo } from 'react-icons/md';
import { Field } from '@chakra-ui/react';
import BaseConfigEditor from './BaseConfigEditor';
import HeartRateZonesEditor from '../config-fields/HeartRateZonesEditor';
import WeightHistoryEditor from '../config-fields/WeightHistoryEditor';
import FtpHistoryEditor from '../config-fields/FtpHistoryEditor';
import { DateInput } from '../DateInput';
import { calculateMaxHeartRate } from '../../utils/heartRateUtils';

/**
 * AthleteConfigEditor - Handles athlete-specific configuration fields
 * Extends BaseConfigEditor with custom components for complex fields
 */
const AthleteConfigEditor = ({ 
  initialData, 
  onSave, 
  onCancel, 
  isLoading,
  onDirtyChange 
}) => {
  // Custom validation for athlete fields
  const validateAthleteFields = (formData, getNestedValue) => {
    const errors = {};
    
    // Validate heart rate zones
    const heartRateZones = getNestedValue(formData, 'heartRateZones');
    const hasDefaultZones = heartRateZones?.default && Object.keys(heartRateZones.default).length > 0;
    const hasDateRanges = heartRateZones?.dateRanges && Object.keys(heartRateZones.dateRanges).length > 0;
    const hasSportTypes = heartRateZones?.sportTypes && Object.keys(heartRateZones.sportTypes).length > 0;
    
    if (hasDefaultZones || hasDateRanges || hasSportTypes) {
      const mode = getNestedValue(formData, 'heartRateZones.mode');
      if (mode === null || mode === undefined || mode === '') {
        errors['heartRateZones.mode'] = 'Zone Mode is required when heart rate zones are configured';
      }
    }
    
    // Validate weight history entries
    const weightHistory = getNestedValue(formData, 'weightHistory');
    if (weightHistory && typeof weightHistory === 'object') {
      Object.entries(weightHistory).forEach(([date, weight]) => {
        if (weight <= 0) {
          errors['weightHistory'] = `All weight entries must be greater than zero. Entry for ${date} is ${weight}.`;
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
              errors['ftpHistory'] = `All FTP entries must be greater than zero. ${sport} entry for ${date} is ${ftp}.`;
            }
          });
        }
      });
    }
    
    return errors;
  };

  return (
    <BaseConfigEditor
      sectionName="athlete"
      initialData={initialData}
      onSave={onSave}
      onCancel={onCancel}
      isLoading={isLoading}
      onDirtyChange={onDirtyChange}
      customValidation={validateAthleteFields}
    >
      {({ formData, handleFieldChange, errors, schema, renderBasicField, getNestedValue }) => {
        if (!schema?.properties) return null;

        const birthday = getNestedValue(formData, 'birthday');
        const formula = getNestedValue(formData, 'maxHeartRateFormula');
        const maxHR = calculateMaxHeartRate(birthday, formula);

        return (
          <Box p={{ base: 3, md: 4 }} bg="cardBg" borderWidth="1px" borderColor="border" borderRadius="md" shadows="md">
            <Box mb={6}>
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="600" mb={2}>
                Athlete Configuration
              </Text>
              <Text fontSize="sm" color="textMuted">
                Configure your athlete profile including birthday, heart rate zones, weight and FTP history.
              </Text>
            </Box>

            {/* Birthday Field */}
            <Box mb={4}>
              <Field.Root required={schema?.required?.includes('birthday')}>
                <Field.Label fontWeight="500">
                  Birthday
                </Field.Label>
                <Text fontSize="sm" color="textMuted" mb={2}>
                  {schema.properties.birthday.description}
                </Text>
                <DateInput
                  value={getNestedValue(formData, 'birthday') || ''}
                  onChange={(value) => handleFieldChange('birthday', value)}
                  placeholder="Select birthday"
                  maxDate={new Date()}
                  width={{ base: "100%", sm: "300px" }}
                />
                {errors?.birthday && (
                  <Field.ErrorText>{errors.birthday}</Field.ErrorText>
                )}
              </Field.Root>
            </Box>

            {/* Max Heart Rate Formula Field with calculated display */}
            <Box mb={4}>
              <Text fontWeight="500" mb={1}>
                Max Heart Rate Formula
                {schema?.required?.includes('maxHeartRateFormula') && <Text as="span" color="red.500" ml={1}>*</Text>}
              </Text>
              <Text fontSize="sm" color="textMuted" mb={2}>
                {schema.properties.maxHeartRateFormula.description}
              </Text>
              
              {/* Handle oneOf schema for formula selection */}
              {schema.properties.maxHeartRateFormula.oneOf && (() => {
                const stringOption = schema.properties.maxHeartRateFormula.oneOf.find(
                  option => option.type === 'string' && option.enum
                );
                
                return (
                  <Flex gap={3} align="center" flexWrap="wrap" direction={{ base: "column", sm: "row" }}>
                    <Box flex="1" minW={{ base: "100%", sm: "200px" }}>
                      {renderBasicField('maxHeartRateFormula', stringOption, 'maxHeartRateFormula', true)}
                    </Box>
                    {maxHR && (
                      <Box 
                        p={2} 
                        bg="blue.50" 
                        _dark={{ bg: 'blue.900/30' }} 
                        borderRadius="md"
                        width={{ base: "100%", sm: "auto" }}
                      >
                        <Flex align="center" gap={2}>
                          <Icon fontSize="sm" color="blue.600"><MdInfo /></Icon>
                          <Text fontSize="sm" fontWeight="600" color="blue.800" _dark={{ color: 'blue.200' }}>
                            Calculated: {maxHR} BPM
                          </Text>
                        </Flex>
                      </Box>
                    )}
                  </Flex>
                );
              })()}
            </Box>

            {/* Heart Rate Zones Editor */}
            <HeartRateZonesEditor
              zones={getNestedValue(formData, 'heartRateZones') || {}}
              onChange={(zones) => handleFieldChange('heartRateZones', zones)}
              birthday={birthday}
              formula={formula}
              errors={errors}
              required={schema?.required?.includes('heartRateZones')}
            />

            {/* Weight History Editor */}
            <WeightHistoryEditor
              history={getNestedValue(formData, 'weightHistory') || {}}
              onChange={(history) => handleFieldChange('weightHistory', history)}
              errors={errors}
            />

            {/* FTP History Editor */}
            <FtpHistoryEditor
              history={getNestedValue(formData, 'ftpHistory') || {}}
              onChange={(history) => handleFieldChange('ftpHistory', history)}
              errors={errors}
            />
          </Box>
        );
      }}
    </BaseConfigEditor>
  );
};

export default AthleteConfigEditor;
