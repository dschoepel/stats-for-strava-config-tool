import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Field,
  Input,
  IconButton,
  Badge,
  Flex,
  HoverCard,
  Portal,
  Checkbox,
  Grid,
  Select,
  createListCollection,
} from '@chakra-ui/react';
import { MdAdd, MdClose, MdWarning, MdInfo, MdLightbulb } from 'react-icons/md';
import BaseConfigEditor from './BaseConfigEditor';
import { Tooltip } from '../Tooltip';
import { generateRandomString } from '../../utils/stringUtils';
import { initialSportsList } from '../../utils/sportsListManager';
import SportTypeMultiSelect from './appearance/SportTypeMultiSelect';

/**
 * ImportConfigEditor - Handles import configuration fields
 * Uses BaseConfigEditor for standard field rendering and adds custom handling for arrays
 */
const ImportConfigEditor = ({ 
  initialData, 
  onSave, 
  onCancel, 
  isLoading,
  onDirtyChange 
}) => {
  // State for array field inputs
  const [arrayInputs, setArrayInputs] = useState({
    activitiesToSkipDuringImport: ''
  });

  // Custom validation for import fields
  const validateImportFields = (formData, getNestedValue) => {
    const errors = {};
    
    // Validate webhooks: if enabled, verifyToken must be provided
    const webhooksEnabled = getNestedValue(formData, 'webhooks.enabled');
    const verifyToken = getNestedValue(formData, 'webhooks.verifyToken');
    const checkInterval = getNestedValue(formData, 'webhooks.checkIntervalInMinutes');
    
    if (webhooksEnabled && (!verifyToken || verifyToken.trim() === '')) {
      errors['webhooks.verifyToken'] = 'Verify token is required when webhooks are enabled';
    }
    
    if (webhooksEnabled && (checkInterval === null || checkInterval === undefined || checkInterval < 1)) {
      errors['webhooks.checkIntervalInMinutes'] = 'Check interval must be at least 1 minute when webhooks are enabled';
    }
    
    return errors;
  };

  return (
    <BaseConfigEditor
      sectionName="import"
      initialData={initialData}
      onSave={onSave}
      onCancel={onCancel}
      isLoading={isLoading}
      onDirtyChange={onDirtyChange}
      customValidation={validateImportFields}
    >
      {({ schema, renderBasicField, formData, handleFieldChange, getNestedValue, errors }) => {
        // Custom array field renderer
        const renderArrayField = (fieldName, fieldSchema, fieldPath = fieldName) => {
          const value = getNestedValue(formData, fieldPath) || [];
          const newItem = arrayInputs[fieldName] || '';

          const handleAddItem = () => {
            if (newItem.trim()) {
              const updatedArray = [...value, newItem.trim()];
              handleFieldChange(fieldPath, updatedArray);
              setArrayInputs(prev => ({ ...prev, [fieldName]: '' }));
            }
          };

          const handleRemoveItem = (index) => {
            const updatedArray = value.filter((_, i) => i !== index);
            handleFieldChange(fieldPath, updatedArray);
          };

          const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddItem();
            }
          };

          return (
            <Field.Root key={fieldPath}>
              <Field.Label htmlFor={fieldPath}>
                {fieldSchema.title || fieldName}
              </Field.Label>
              
              {/* Warning message for destructive fields */}
              {(fieldName === 'sportTypesToImport' || 
                fieldName === 'activityVisibilitiesToImport' || 
                fieldName === 'skipActivitiesRecordedBefore') && (
                <Box 
                  p={3} 
                  mb={3} 
                  bg={{ base: "orange.50", _dark: "orange.900/20" }}
                  borderLeft="4px solid"
                  borderColor="orange.500"
                  borderRadius="md"
                >
                  <HStack gap={2} align="flex-start">
                    <MdWarning color="orange.500" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <Text fontSize="sm" color={{ base: "orange.800", _dark: "orange.200" }}>
                      Changing this setting after activities have been imported will delete activities that don't match the new criteria.
                    </Text>
                  </HStack>
                </Box>
              )}

              {/* Array items display */}
              {value.length > 0 && (
                <VStack align="stretch" gap={2} mb={3}>
                  {value.map((item, index) => (
                    <Flex
                      key={index}
                      p={2}
                      px={3}
                      bg="cardBg"
                      border="1px solid"
                      borderColor="border"
                      borderRadius="md"
                      align="center"
                      justify="space-between"
                      gap={2}
                      _hover={{ borderColor: "primary" }}
                    >
                      <Text fontSize="sm" color="text" flex="1">
                        {item}
                      </Text>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => handleRemoveItem(index)}
                        aria-label="Remove item"
                      >
                        <MdClose />
                      </IconButton>
                    </Flex>
                  ))}
                </VStack>
              )}

              {/* Add new item input */}
              <HStack gap={2}>
                <Input
                  id={fieldPath}
                  value={newItem}
                  onChange={(e) => setArrayInputs(prev => ({ ...prev, [fieldName]: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    fieldName === 'sportTypesToImport' 
                      ? 'e.g., Ride, Run, Swim' 
                      : fieldName === 'activityVisibilitiesToImport'
                      ? 'Select from dropdown'
                      : fieldName === 'activitiesToSkipDuringImport'
                      ? 'Activity ID'
                      : 'Add item'
                  }
                  bg="inputBg"
                  flex="1"
                />
                <Button
                  onClick={handleAddItem}
                  colorPalette="blue"
                  size="md"
                  px={4}
                  isDisabled={!newItem.trim()}
                >
                  <MdAdd />
                  Add
                </Button>
              </HStack>

              {/* For visibility field, show available options */}
              {fieldName === 'activityVisibilitiesToImport' && (
                <Box mt={2}>
                  <Text fontSize="xs" color="textMuted" mb={1}>
                    Available options:
                  </Text>
                  <HStack gap={2} flexWrap="wrap">
                    {['everyone', 'followers_only', 'only_me'].map((option) => (
                      <Badge
                        key={option}
                        colorPalette={value.includes(option) ? 'green' : 'gray'}
                        cursor="pointer"
                        onClick={() => {
                          if (!value.includes(option)) {
                            setArrayInputs(prev => ({ ...prev, [fieldName]: option }));
                          }
                        }}
                      >
                        {option}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}

              {fieldSchema.description && (
                <Field.HelperText color="helperText" mt={2}>
                  {fieldSchema.description}
                </Field.HelperText>
              )}
              
              {value.length === 0 && (
                <Text fontSize="sm" color="textMuted" mt={2} fontStyle="italic">
                  {fieldName === 'sportTypesToImport' || fieldName === 'activityVisibilitiesToImport'
                    ? 'Empty list means import all'
                    : 'No items added yet'}
                </Text>
              )}
            </Field.Root>
          );
        };

        // Custom renderer for sport types - using SportTypeMultiSelect component
        const renderSportTypesSelect = (fieldName, fieldSchema) => {
          const value = getNestedValue(formData, fieldName) || [];

          return (
            <Box key={fieldName}>
              {/* Warning message */}
              <Box 
                p={3} 
                mb={3} 
                bg={{ base: "orange.50", _dark: "orange.900/20" }}
                borderLeft="4px solid"
                borderColor="orange.500"
                borderRadius="md"
              >
                <HStack gap={2} align="flex-start">
                  <MdWarning color="orange.500" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <Text fontSize="sm" color={{ base: "orange.800", _dark: "orange.200" }}>
                    Changing this setting after activities have been imported will delete activities that don't match the new criteria.
                  </Text>
                </HStack>
              </Box>

              {/* Sport Type Multi-Select */}
              <SportTypeMultiSelect
                fieldName={fieldName}
                fieldSchema={fieldSchema}
                fieldPath={fieldName}
                value={value}
                onChange={handleFieldChange}
                hasError={errors[fieldName]}
                sportsList={initialSportsList}
                subsectionKey="import"
              />
              
              {value.length === 0 && (
                <Text fontSize="sm" color="textMuted" mt={2} fontStyle="italic">
                  Empty list means import all
                </Text>
              )}
            </Box>
          );
        };

        // Custom renderer for activity visibilities - checkbox grid
        const renderActivityVisibilities = (fieldName, fieldSchema) => {
          const value = getNestedValue(formData, fieldName) || [];
          
          const handleToggle = (optionValue) => {
            const updatedArray = value.includes(optionValue)
              ? value.filter(v => v !== optionValue)
              : [...value, optionValue];
            handleFieldChange(fieldName, updatedArray);
          };

          return (
            <Box key={fieldName}>
              <Text fontSize="sm" fontWeight="medium" mb={2} color="text">
                {fieldSchema.title || fieldName}
              </Text>
              
              {/* Warning message */}
              <Box 
                p={3} 
                mb={3} 
                bg={{ base: "orange.50", _dark: "orange.900/20" }}
                borderLeft="4px solid"
                borderColor="orange.500"
                borderRadius="md"
              >
                <HStack gap={2} align="flex-start">
                  <MdWarning color="orange.500" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <Text fontSize="sm" color={{ base: "orange.800", _dark: "orange.200" }}>
                    Changing this setting after activities have been imported will delete activities that don't match the new criteria.
                  </Text>
                </HStack>
              </Box>

              {/* Checkbox grid - single row on larger screens */}
              <Grid 
                templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                gap={3}
              >
                <Checkbox.Root
                  id="visibility-everyone"
                  checked={value.includes('everyone')}
                  onCheckedChange={() => handleToggle('everyone')}
                  colorPalette="orange"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label fontSize="sm">
                    Everyone
                  </Checkbox.Label>
                </Checkbox.Root>

                <Checkbox.Root
                  id="visibility-followers-only"
                  checked={value.includes('followers_only')}
                  onCheckedChange={() => handleToggle('followers_only')}
                  colorPalette="orange"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label fontSize="sm">
                    Followers Only
                  </Checkbox.Label>
                </Checkbox.Root>

                <Checkbox.Root
                  id="visibility-only-me"
                  checked={value.includes('only_me')}
                  onCheckedChange={() => handleToggle('only_me')}
                  colorPalette="orange"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label fontSize="sm">
                    Only Me
                  </Checkbox.Label>
                </Checkbox.Root>
              </Grid>

              {fieldSchema.description && (
                <Text fontSize="xs" color="textMuted" mt={2}>
                  {fieldSchema.description}
                </Text>
              )}
              
              {value.length === 0 && (
                <Text fontSize="sm" color="textMuted" mt={2} fontStyle="italic">
                  Empty list means import all
                </Text>
              )}
            </Box>
          );
        };

        return (
          <VStack align="stretch" gap={6}>
            {/* Basic Settings Section */}
            <Box 
              p={4} 
              bg="cardBg" 
              borderRadius="md" 
              border="1px solid" 
              borderColor="border"
              boxShadow="sm"
            >
              <VStack align="stretch" gap={4}>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color="text" mb={1}>
                    Import Limits
                  </Text>
                  <Text fontSize="sm" color="textMuted">
                    Control how many activities are processed per import cycle
                  </Text>
                </Box>
                {renderBasicField(
                  'numberOfNewActivitiesToProcessPerImport', 
                  schema?.properties?.numberOfNewActivitiesToProcessPerImport
                )}
              </VStack>
            </Box>

            {/* Filtering Section */}
            <Box 
              p={4} 
              bg="cardBg" 
              borderRadius="md" 
              border="1px solid" 
              borderColor="border"
              boxShadow="sm"
            >
              <VStack align="stretch" gap={4}>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color="text" mb={1}>
                    Activity Filtering
                  </Text>
                  <Text fontSize="sm" color="textMuted">
                    Filter which activities to import based on sport type, visibility, and date
                  </Text>
                </Box>

                {/* Info card for Sport Types */}
                <Box
                  p={4}
                  bg={{ base: "blue.50", _dark: "blue.900/10" }}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={{ base: "blue.200", _dark: "blue.800" }}
                >
                  {renderSportTypesSelect(
                    'sportTypesToImport',
                    schema?.properties?.sportTypesToImport
                  )}
                </Box>

                {/* Info card for Activity Visibilities */}
                <Box
                  p={4}
                  bg={{ base: "blue.50", _dark: "blue.900/10" }}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={{ base: "blue.200", _dark: "blue.800" }}
                >
                  {renderActivityVisibilities(
                    'activityVisibilitiesToImport',
                    schema?.properties?.activityVisibilitiesToImport
                  )}
                </Box>

                {renderBasicField(
                  'skipActivitiesRecordedBefore',
                  schema?.properties?.skipActivitiesRecordedBefore
                )}

                {renderArrayField(
                  'activitiesToSkipDuringImport',
                  schema?.properties?.activitiesToSkipDuringImport
                )}
              </VStack>
            </Box>

            {/* Advanced Options Section */}
            <Box 
              p={4} 
              bg="cardBg" 
              borderRadius="md" 
              border="1px solid" 
              borderColor="border"
              boxShadow="sm"
            >
              <VStack align="stretch" gap={4}>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color="text" mb={1}>
                    Advanced Options
                  </Text>
                  <Text fontSize="sm" color="textMuted">
                    Additional import settings for segments and performance
                  </Text>
                </Box>

                {renderBasicField(
                  'optInToSegmentDetailImport',
                  schema?.properties?.optInToSegmentDetailImport
                )}
              </VStack>
            </Box>

            {/* Webhooks Section */}
            {schema?.properties?.webhooks && (
              <Box 
                p={4} 
                bg="cardBg" 
                borderRadius="md" 
                border="1px solid" 
                borderColor="border"
                boxShadow="sm"
              >
                <VStack align="stretch" gap={4}>
                  <Box>
                    <HoverCard.Root openDelay={200} closeDelay={100}>
                      <HoverCard.Trigger asChild>
                        <HStack gap={2} cursor="help" width="fit-content">
                          <Text fontSize="lg" fontWeight="semibold" color="text">
                            Webhooks Configuration
                          </Text>
                          <Box as={MdInfo} color="blue.500" boxSize="18px" />
                        </HStack>
                      </HoverCard.Trigger>
                      <Portal>
                        <HoverCard.Positioner>
                          <HoverCard.Content maxW="500px" p={4} bg="cardBg" borderRadius="md" boxShadow="lg" border="1px solid" borderColor="border">
                            <HoverCard.Arrow>
                              <HoverCard.ArrowTip />
                            </HoverCard.Arrow>
                            <VStack align="stretch" gap={3}>
                              <Text fontSize="sm" fontWeight="semibold" color="text">
                                Automatic Activity Updates
                              </Text>
                              <Text fontSize="sm" color="text">
                                Statistics for Strava supports Strava webhooks to automatically import and build your data when new activities are uploaded. This eliminates the need to manually run import commands or set up cron jobs.
                              </Text>
                              <Text fontSize="sm" color="text">
                                When enabled, your app will receive real-time notifications from Strava whenever:
                              </Text>
                              <VStack align="stretch" gap={1} pl={3}>
                                <Text fontSize="sm" color="text">• A new activity is created</Text>
                                <Text fontSize="sm" color="text">• An existing activity is updated</Text>
                                <Text fontSize="sm" color="text">• An activity is deleted</Text>
                              </VStack>
                              <Text fontSize="sm" color="text">
                                These will trigger the import and build processes in the background. It may take a few minutes for all updates to fully complete.
                              </Text>
                              <Box p={2} bg={{ base: "orange.50", _dark: "orange.900/20" }} borderRadius="md" borderLeft="3px solid" borderColor="orange.500">
                                <Text fontSize="sm" fontWeight="semibold" mb={1} color="text" display="flex" alignItems="center" gap={1}>
                                  <MdWarning color="orange" size={16} /> Important
                                </Text>
                                <Text fontSize="sm" color="text">
                                  Your Statistics for Strava instance must be publicly accessible over HTTPS for Strava webhooks to work.
                                </Text>
                              </Box>
                              <Box p={2} bg={{ base: "blue.50", _dark: "blue.900/20" }} borderRadius="md" borderLeft="3px solid" borderColor="blue.500">
                                <Text fontSize="sm" fontWeight="semibold" mb={1} color="text" display="flex" alignItems="center" gap={1}>
                                  <MdLightbulb color="#3b82f6" size={16} /> Tip
                                </Text>
                                <Text fontSize="sm" color="text">
                                  If you're hosting on Cloudflare, make sure to disable "Bot Fight Mode". Cloudflare may incorrectly flag Strava's requests as bot traffic, causing the webhook integration to fail.
                                </Text>
                              </Box>
                            </VStack>
                          </HoverCard.Content>
                        </HoverCard.Positioner>
                      </Portal>
                    </HoverCard.Root>
                    <Text fontSize="sm" color="textMuted" mt={1}>
                      Enable automatic activity updates via Strava webhooks
                    </Text>
                  </Box>

                  {/* Custom webhook fields rendering with tooltip on verify token */}
                  <VStack align="stretch" gap={4}>
                    {/* Custom enabled field with auto-generation of verify token */}
                    {schema.properties.webhooks.properties.enabled && (() => {
                      const enabledSchema = schema.properties.webhooks.properties.enabled;
                      const isEnabled = getNestedValue(formData, 'webhooks.enabled');
                      
                      return (
                        <Field.Root>
                          <Checkbox.Root
                            id="webhooks.enabled"
                            checked={isEnabled || false}
                            onCheckedChange={(e) => {
                              handleFieldChange('webhooks.enabled', e.checked);
                              
                              // Auto-generate verify token if enabling and field is empty
                              if (e.checked) {
                                const currentToken = getNestedValue(formData, 'webhooks.verifyToken');
                                if (!currentToken || currentToken.trim() === '') {
                                  handleFieldChange('webhooks.verifyToken', generateRandomString(30));
                                }
                                
                                // Set default check interval if empty
                                const currentInterval = getNestedValue(formData, 'webhooks.checkIntervalInMinutes');
                                if (currentInterval === null || currentInterval === undefined || currentInterval < 1) {
                                  handleFieldChange('webhooks.checkIntervalInMinutes', 1);
                                }
                              }
                            }}
                            colorPalette="orange"
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Checkbox.Label>
                              {enabledSchema.title || 'enabled'}
                            </Checkbox.Label>
                          </Checkbox.Root>
                          {enabledSchema.description && (
                            <Field.HelperText color="helperText">{enabledSchema.description}</Field.HelperText>
                          )}
                        </Field.Root>
                      );
                    })()}
                    
                    <Field.Root invalid={!!errors['webhooks.verifyToken']}>
                      <Tooltip
                        openDelay={100}
                        showArrow
                        content="This token can be any string of characters. It will only be used the first time during webhooks registration with Strava."
                        contentProps={{ maxW: "300px" }}
                      >
                        <Field.Label htmlFor="webhooks.verifyToken" cursor="help">
                          {schema.properties.webhooks.properties.verifyToken.title || 'Verify Token'}
                        </Field.Label>
                      </Tooltip>
                      <Input
                        id="webhooks.verifyToken"
                        type="text"
                        value={getNestedValue(formData, 'webhooks.verifyToken') || ''}
                        onChange={(e) => handleFieldChange('webhooks.verifyToken', e.target.value)}
                        placeholder={schema.properties.webhooks.properties.verifyToken.default}
                        bg="inputBg"
                      />
                      {schema.properties.webhooks.properties.verifyToken.description && (
                        <Field.HelperText color="helperText">
                          {schema.properties.webhooks.properties.verifyToken.description}
                        </Field.HelperText>
                      )}
                      {errors['webhooks.verifyToken'] && (
                        <Field.ErrorText>
                          {errors['webhooks.verifyToken']}
                        </Field.ErrorText>
                      )}
                    </Field.Root>

                    {renderBasicField('checkIntervalInMinutes', schema.properties.webhooks.properties.checkIntervalInMinutes, 'webhooks.checkIntervalInMinutes', true)}
                  </VStack>
                </VStack>
              </Box>
            )}
          </VStack>
        );
      }}
    </BaseConfigEditor>
  );
};

export default ImportConfigEditor;
