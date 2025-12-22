import React from 'react';
import { Box, Text, Input, Flex, VStack, Heading } from '@chakra-ui/react';
import BaseConfigEditor from './BaseConfigEditor';

/**
 * ZwiftConfigEditor - Handles Zwift integration configuration fields
 * Uses BaseConfigEditor for standard field rendering
 */
const ZwiftConfigEditor = ({ 
  initialData, 
  onSave, 
  onCancel, 
  isLoading,
  onDirtyChange 
}) => {
  // Custom validation for Zwift fields
  const validateZwiftFields = (formData, getNestedValue) => {
    const errors = {};
    
    const level = getNestedValue(formData, 'level');
    const racingScore = getNestedValue(formData, 'racingScore');
    
    // Validate level range if provided
    if (level !== null && level !== undefined && level !== '') {
      const levelNum = parseInt(level);
      if (isNaN(levelNum) || levelNum < 1 || levelNum > 100) {
        errors['level'] = 'Zwift level must be between 1 and 100';
      }
    }
    
    // Validate racing score range if provided
    if (racingScore !== null && racingScore !== undefined && racingScore !== '') {
      const scoreNum = parseInt(racingScore);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 1000) {
        errors['racingScore'] = 'Zwift racing score must be between 0 and 1000';
      }
    }
    
    return errors;
  };

  return (
    <BaseConfigEditor
      sectionName="zwift"
      initialData={initialData}
      onSave={onSave}
      onCancel={onCancel}
      isLoading={isLoading}
      onDirtyChange={onDirtyChange}
      customValidation={validateZwiftFields}
    >
      {({ formData, errors, schema, handleFieldChange, getNestedValue }) => {
        if (!schema?.properties) return null;

        const levelValue = getNestedValue(formData, 'level');
        const racingScoreValue = getNestedValue(formData, 'racingScore');

        return (
          <Box p={4} bg="cardBg" borderWidth="1px" borderColor="border" borderRadius="md" shadows="md">
            <Heading size={{ base: "sm", sm: "md" }} mb={4} lineHeight="1.2" wordBreak="break-word">
              Zwift Integration Settings
            </Heading>
            
            <Text fontSize="sm" color="textMuted" mb={6}>
              Configure your Zwift profile information to display your Zwift badge and stats in the application.
            </Text>

            <VStack align="stretch" gap={4}>
              {/* Zwift Level Field */}
              <Box>
                <Flex align="center" gap={2} mb={1}>
                  <Text fontWeight="500">Zwift Level</Text>
                  <Text 
                    fontSize="sm" 
                    color="textMuted" 
                    cursor="help"
                    title="Your Zwift level (1 - 100). Will be used to render your Zwift badge. Leave empty to disable this feature"
                  >
                    ⓘ
                  </Text>
                </Flex>
                <Text fontSize="sm" color="textMuted" mb={2}>
                  Your Zwift level (1 - 100). Will be used to render your Zwift badge. Leave empty to disable this feature.
                </Text>
                <Input
                  type="number"
                  value={levelValue === null || levelValue === undefined ? '' : levelValue}
                  onChange={(e) => handleFieldChange('level', e.target.value === '' ? null : parseInt(e.target.value))}
                  placeholder="Enter your Zwift level (1-100)"
                  min="1"
                  max="100"
                  borderColor={errors['level'] ? 'red.500' : 'border'}
                  bg="inputBg"
                />
                {errors['level'] && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors['level']}
                  </Text>
                )}
              </Box>

              {/* Zwift Racing Score Field */}
              <Box>
                <Flex align="center" gap={2} mb={1}>
                  <Text fontWeight="500">Zwift Racing Score</Text>
                  <Text 
                    fontSize="sm" 
                    color="textMuted" 
                    cursor="help"
                    title="Your Zwift racing score (0 - 1000). Will be used to add to your Zwift badge if zwift.level is filled out"
                  >
                    ⓘ
                  </Text>
                </Flex>
                <Text fontSize="sm" color="textMuted" mb={2}>
                  Your Zwift racing score (0 - 1000). Will be used to add to your Zwift badge if zwift.level is filled out.
                </Text>
                <Input
                  type="number"
                  value={racingScoreValue === null || racingScoreValue === undefined ? '' : racingScoreValue}
                  onChange={(e) => handleFieldChange('racingScore', e.target.value === '' ? null : parseInt(e.target.value))}
                  placeholder="Enter your racing score (0-1000)"
                  min="0"
                  max="1000"
                  borderColor={errors['racingScore'] ? 'red.500' : 'border'}
                  bg="inputBg"
                />
                {errors['racingScore'] && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors['racingScore']}
                  </Text>
                )}
              </Box>

              {/* Info Box */}
              <Flex
                align="flex-start"
                gap={2}
                p={3}
                bg="blue.50"
                _dark={{ bg: 'blue.900/30' }}
                borderRadius="md"
                mt={2}
              >
                <Text fontSize="lg">ℹ️</Text>
                <Text fontSize="sm">
                  Both fields are optional. Leave them empty (null) to disable Zwift badge display. 
                  The racing score will only be shown if a level is also provided.
                </Text>
              </Flex>
            </VStack>
          </Box>
        );
      }}
    </BaseConfigEditor>
  );
};

export default ZwiftConfigEditor;
