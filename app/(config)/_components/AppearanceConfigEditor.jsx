import React, { useState, useRef, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { Box, Button, Flex, Text, VStack, HStack, Icon, ColorPicker, Portal, parseColor, Input, Code, Badge, Spinner } from '@chakra-ui/react';
import { MdInfo, MdWarning, MdDashboard, MdExpandMore, MdChevronRight, MdAdd, MdClose } from 'react-icons/md';
import BaseConfigEditor from './BaseConfigEditor';
import CountrySelector from '../../../src/components/config-fields/CountrySelector';
const DashboardEditor = lazy(() => import('../../../app/utilities/_components/DashboardEditor'));
import SportTypeMultiSelect from './appearance/SportTypeMultiSelect';
import SportTypeSortingOrder from './appearance/SportTypeSortingOrder';
import CollapsibleSection from './appearance/CollapsibleSection';
import { useAppearanceConfig } from './appearance/useAppearanceConfig';

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
  const { sportsList, validateAppearanceFields } = useAppearanceConfig();
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [showDashboardEditor, setShowDashboardEditor] = useState(false);
  const [dashboardJustSaved, setDashboardJustSaved] = useState(false);
  const [dashboardLayout, setDashboardLayout] = useState(initialData?.dashboard?.layout || []);
  const countryChangeHandlerRef = useRef(null);
  const formDataRef = useRef(null);
  const [expandedGroups, setExpandedGroups] = useState({
    globalSettings: false,
    dateFormat: false,
    dashboard: false,
    heatmap: false,
    photos: false,
    sportTypesSortingOrder: false
  });

  const toggleGroup = useCallback((groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedGroups({
      globalSettings: false,
      dateFormat: false,
      dashboard: false,
      heatmap: false,
      photos: false,
      sportTypesSortingOrder: false
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedGroups({
      globalSettings: true,
      dateFormat: true,
      dashboard: true,
      heatmap: true,
      photos: true,
      sportTypesSortingOrder: true
    });
  }, []);

  // Render sport type multi-select - now uses extracted component
  const renderSportTypeMultiSelect = useCallback((fieldName, fieldSchema, fieldPath, value, handleFieldChange, hasError, subsectionKey) => {
    return (
      <SportTypeMultiSelect
        fieldName={fieldName}
        fieldSchema={fieldSchema}
        fieldPath={fieldPath}
        value={value}
        onChange={handleFieldChange}
        hasError={hasError}
        sportsList={sportsList}
        subsectionKey={subsectionKey}
      />
    );
  }, [sportsList]);

  // Render sport type sorting order - now uses extracted component
  const renderSportTypeSortingOrder = useCallback((fieldName, fieldSchema, fieldPath, value, handleFieldChange, hasError) => {
    return (
      <SportTypeSortingOrder
        fieldName={fieldName}
        fieldSchema={fieldSchema}
        fieldPath={fieldPath}
        value={value}
        onChange={handleFieldChange}
        hasError={hasError}
        sportsList={sportsList}
      />
    );
  }, [sportsList]);

  // Modal handlers wrapped in useCallback
  const handleOpenCountrySelector = useCallback(() => {
    setShowCountrySelector(true);
  }, []);

  const handleCloseCountrySelector = useCallback(() => {
    setShowCountrySelector(false);
  }, []);

  const handleOpenDashboardEditor = useCallback(() => {
    setShowDashboardEditor(true);
  }, []);

  const handleCloseDashboardEditor = useCallback(() => {
    setShowDashboardEditor(false);
  }, []);

  const handleSaveDashboard = useCallback((updatedLayout) => {
    // Update the dashboard.layout in the form data
    // This will trigger the dirty state in BaseConfigEditor
    if (countryChangeHandlerRef.current) {
      countryChangeHandlerRef.current('dashboard.layout', updatedLayout);
    }
    setDashboardLayout(updatedLayout);
    setShowDashboardEditor(false);
    setDashboardJustSaved(true);
    // Clear the indicator after 8 seconds
    setTimeout(() => setDashboardJustSaved(false), 8000);
  }, []);

  const handleCountryChange = useCallback((countryCode) => {
    if (countryChangeHandlerRef.current) {
      countryChangeHandlerRef.current('photos.defaultEnabledFilters.countryCode', countryCode);
    }
  }, []);

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
          // Store the change handler and formData in refs for use in modals
          countryChangeHandlerRef.current = handleFieldChange;
          formDataRef.current = formData;
          
          return (
            <>
              {/* Collapse/Expand All Controls */}
              <Flex mb={4} gap={2} wrap="wrap">
                <Button 
                  onClick={expandAll} 
                  size={{ base: "xs", sm: "sm" }} 
                  variant="outline"
                  flex={{ base: "1", sm: "0" }}
                  minW={{ base: "auto", sm: "100px" }}
                >
                  Expand All
                </Button>
                <Button 
                  onClick={collapseAll} 
                  size={{ base: "xs", sm: "sm" }} 
                  variant="outline"
                  flex={{ base: "1", sm: "0" }}
                  minW={{ base: "auto", sm: "100px" }}
                >
                  Collapse All
                </Button>
              </Flex>

          {/* Global Appearance Settings Group */}
          {schema?.properties && (
            <Box mb={4} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
              <Button
                onClick={() => toggleGroup('globalSettings')}
                width="100%"
                justifyContent="flex-start"
                variant="ghost"
                fontWeight="600"
                bg="cardBg"
                color="text"
                whiteSpace="normal"
                textAlign="left"
                height="auto"
                py={2}
                wordBreak="break-word"
              >
                <Box as={expandedGroups.globalSettings ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                Global Appearance Settings
              </Button>
              {expandedGroups.globalSettings && (
                <Box p={4}>
                  {schema.properties.locale && renderBasicField('locale', schema.properties.locale)}
                  {schema.properties.unitSystem && renderBasicField('unitSystem', schema.properties.unitSystem)}
                  {schema.properties.timeFormat && renderBasicField('timeFormat', schema.properties.timeFormat)}
                </Box>
              )}
            </Box>
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
                <Box key={fieldName} mb={4} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                  <Button
                    onClick={() => toggleGroup('dateFormat')}
                    width="100%"
                    justifyContent="flex-start"
                    variant="ghost"
                    fontWeight="600"
                    bg="cardBg"
                    color="text"
                    whiteSpace="normal"
                    textAlign="left"
                    height="auto"
                    py={2}
                    wordBreak="break-word"
                  >
                    <Box as={expandedGroups.dateFormat ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                    {fieldSchema.title}
                  </Button>
                  {expandedGroups.dateFormat && (
                    <Box p={4}>
                      {fieldSchema.description && (
                        <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
                      )}
                      {renderBasicField('dateFormat.short', fieldSchema.properties.short)}
                      {renderBasicField('dateFormat.normal', fieldSchema.properties.normal)}
                    </Box>
                  )}
                </Box>
              );
            }

            // Special handling for dashboard - wrap in visual group
            if (fieldName === 'dashboard') {
              return (
                <Box key={fieldName} mb={4} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                  <Button
                    onClick={() => toggleGroup('dashboard')}
                    width="100%"
                    justifyContent="flex-start"
                    variant="ghost"
                    fontWeight="600"
                    bg="cardBg"
                    color="text"
                    whiteSpace="normal"
                    textAlign="left"
                    height="auto"
                    py={2}
                    wordBreak="break-word"
                  >
                    <Box as={expandedGroups.dashboard ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                    {fieldSchema.title}
                  </Button>
                  {expandedGroups.dashboard && (
                    <Box p={4}>
                      {fieldSchema.description && (
                        <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
                      )}
                      <Flex
                        align="flex-start"
                        gap={2}
                        p={3}
                        bg="blue.50"
                        _dark={{ bg: 'blue.900/30' }}
                        borderRadius="md"
                        mb={3}
                      >
                        <Icon fontSize="lg" color="blue.600"><MdInfo /></Icon>
                        <Text fontSize="sm">
                          Dashboard layout is a complex nested structure. 
                          Use the Dashboard Editor below to view and manage your widgets.
                          Leave as <Code fontSize="sm">null</Code> to use the default layout.
                        </Text>
                      </Flex>
                      
                      {/* Widget count indicator */}
                      <Flex align="center" gap={2} mb={3}>
                        <Text fontSize="sm" fontWeight="500">Current Layout:</Text>
                        {dashboardLayout === null || dashboardLayout === undefined || dashboardLayout.length === 0 ? (
                          <Badge colorScheme="gray" fontSize="xs">Default (null)</Badge>
                        ) : (
                          <Badge colorScheme="blue" fontSize="xs">
                            {dashboardLayout.length} {dashboardLayout.length === 1 ? 'widget' : 'widgets'} selected
                          </Badge>
                        )}
                      </Flex>
                      
                      {dashboardJustSaved && (
                        <Flex
                          align="flex-start"
                          gap={2}
                          p={3}
                          bg="orange.50"
                          _dark={{ bg: 'orange.900/30' }}
                          borderRadius="md"
                          mb={3}
                        >
                          <Icon fontSize="lg" color="orange.500"><MdWarning /></Icon>
                          <Text fontSize="sm">
                            Dashboard changes saved to form. <Text as="strong">Click the main Save button below to persist these changes to your config file.</Text>
                          </Text>
                        </Flex>
                      )}
                      <Button
                        onClick={handleOpenDashboardEditor}
                        size={{ base: "xs", sm: "sm" }}
                        width={{ base: "100%", sm: "auto" }}
                        whiteSpace="normal"
                        height="auto"
                        py={2}
                      >
                        <Flex align="center" gap={2}><Icon><MdDashboard /></Icon> Edit Dashboard Layout</Flex>
                      </Button>
                    </Box>
                  )}
                </Box>
              );
            }

            // Special handling for sport type sorting - wrap in visual group
            if (fieldName === 'sportTypesSortingOrder') {
              return (
                <Box key={fieldName} mb={4} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                  <Button
                    onClick={() => toggleGroup('sportTypesSortingOrder')}
                    width="100%"
                    justifyContent="flex-start"
                    variant="ghost"
                    fontWeight="600"
                    bg="cardBg"
                    color="text"
                    whiteSpace="normal"
                    textAlign="left"
                    height="auto"
                    py={2}
                    wordBreak="break-word"
                  >
                    <Box as={expandedGroups.sportTypesSortingOrder ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                    {fieldSchema.title}
                  </Button>
                  {expandedGroups.sportTypesSortingOrder && (
                    <Box p={4}>
                      {fieldSchema.description && (
                        <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
                      )}
                      {renderSportTypeSortingOrder(
                        fieldName, 
                        fieldSchema, 
                        fieldName, 
                        value, 
                        handleFieldChange, 
                        hasError
                      )}
                    </Box>
                  )}
                </Box>
              );
            }

            // Handle heatmap with special tileLayerUrl rendering
            if (fieldName === 'heatmap') {
              const tileLayerValue = getNestedValue(formData, 'heatmap.tileLayerUrl');
              const isArray = Array.isArray(tileLayerValue);
              
              return (
                <Box key={fieldName} mb={4} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                  <Button
                    onClick={() => toggleGroup('heatmap')}
                    width="100%"
                    justifyContent="flex-start"
                    variant="ghost"
                    fontWeight="600"
                    bg="cardBg"
                    color="text"
                    whiteSpace="normal"
                    textAlign="left"
                    height="auto"
                    py={2}
                    wordBreak="break-word"
                  >
                    <Box as={expandedGroups.heatmap ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                    {fieldSchema.title}
                  </Button>
                  {expandedGroups.heatmap && (
                    <Box p={4}>
                      {fieldSchema.description && (
                        <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
                      )}
                      
                      {/* polylineColor */}
                      <Box mb={4}>
                        <Text fontWeight="500" mb={1}>
                          {fieldSchema.properties.polylineColor.title || 'Polyline Color'}
                        </Text>
                        {fieldSchema.properties.polylineColor.description && (
                          <Text fontSize="sm" color="textMuted" mb={2}>
                            {fieldSchema.properties.polylineColor.description}
                          </Text>
                        )}
                        {(() => {
                          const currentColor = getNestedValue(formData, 'heatmap.polylineColor') || '#fc6719';
                          let parsedColor;
                          try {
                            parsedColor = parseColor(currentColor);
                          } catch {
                            parsedColor = parseColor('#fc6719');
                          }
                          return (
                            <ColorPicker.Root 
                              value={parsedColor}
                              onValueChange={(details) => {
                                handleFieldChange('heatmap.polylineColor', details.valueAsString);
                              }}
                              maxW="300px"
                            >
                              <ColorPicker.HiddenInput />
                              <ColorPicker.Control gap={2}>
                                <ColorPicker.Input flex="1" />
                                <ColorPicker.Trigger p={0} bg="transparent" border="none">
                                  <Box 
                                    width="40px" 
                                    height="40px" 
                                    borderRadius="md" 
                                    bg={currentColor}
                                    cursor="pointer"
                                  />
                                </ColorPicker.Trigger>
                              </ColorPicker.Control>
                              <Portal>
                                <ColorPicker.Positioner>
                                  <ColorPicker.Content>
                                    <ColorPicker.Area />
                                    <HStack>
                                      <ColorPicker.EyeDropper size="xs" variant="outline" />
                                      <ColorPicker.Sliders />
                                    </HStack>
                                  </ColorPicker.Content>
                                </ColorPicker.Positioner>
                              </Portal>
                            </ColorPicker.Root>
                          );
                        })()}
                        {errors['heatmap.polylineColor'] && (
                          <Text color="red.500" fontSize="sm" mt={1}>{errors['heatmap.polylineColor']}</Text>
                        )}
                      </Box>
                  
                  {/* tileLayerUrl - special handling for oneOf (string or array) */}
                  <Box mb={4}>
                    <Text fontWeight="500" mb={1} htmlFor="heatmap.tileLayerUrl">
                      {fieldSchema.properties.tileLayerUrl.oneOf[0].title || 'Tile Layer URL'}
                    </Text>
                    <Text fontSize="sm" color="textMuted" mb={2}>
                      URL template for map tiles. Can be a single URL or multiple URLs for layered maps.
                    </Text>
                    
                    {!isArray ? (
                      <>
                        <Input
                          id="heatmap.tileLayerUrl"
                          value={tileLayerValue || ''}
                          onChange={(e) => handleFieldChange('heatmap.tileLayerUrl', e.target.value)}
                          borderColor={errors['heatmap.tileLayerUrl'] ? 'red.500' : 'border'}
                          placeholder="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                          mb={2}
                        />
                        <Button
                          onClick={() => handleFieldChange('heatmap.tileLayerUrl', [tileLayerValue || ''])}
                          size={{ base: "xs", sm: "sm" }}
                          variant="outline"
                          width={{ base: "100%", sm: "auto" }}
                          whiteSpace="normal"
                          height="auto"
                          py={{ base: 1.5, sm: 2 }}
                        >
                          Convert to Multiple Layers
                        </Button>
                      </>
                    ) : (
                      <>
                        <VStack align="stretch" gap={2} mb={2}>
                          {tileLayerValue.map((url, index) => (
                            <Flex key={index} gap={2}>
                              <Input
                                value={url}
                                onChange={(e) => {
                                  const newArray = [...tileLayerValue];
                                  newArray[index] = e.target.value;
                                  handleFieldChange('heatmap.tileLayerUrl', newArray);
                                }}
                                placeholder={`Layer ${index + 1} URL`}
                                flex="1"
                              />
                              <Button
                                onClick={() => {
                                  const newArray = tileLayerValue.filter((_, i) => i !== index);
                                  handleFieldChange('heatmap.tileLayerUrl', newArray.length === 1 ? newArray[0] : newArray);
                                }}
                                size={{ base: "xs", sm: "sm" }}
                                variant="outline"
                                colorPalette="red"
                                minW={{ base: "28px", sm: "auto" }}
                                p={{ base: 1, sm: 2 }}
                              >
                                <Box as={MdClose} boxSize={{ base: "14px", sm: "16px" }} />
                              </Button>
                            </Flex>
                          ))}
                        </VStack>
                        <Button
                          onClick={() => handleFieldChange('heatmap.tileLayerUrl', [...tileLayerValue, ''])}
                          size={{ base: "xs", sm: "sm" }}
                          variant="outline"
                          width={{ base: "100%", sm: "auto" }}
                        >
                          <Box as={MdAdd} boxSize={{ base: "14px", sm: "16px" }} mr={1} /> Add Layer
                        </Button>
                      </>
                    )}
                    {errors['heatmap.tileLayerUrl'] && <Text color="red.500" fontSize="sm" mt={1}>{errors['heatmap.tileLayerUrl']}</Text>}
                  </Box>
                  
                  {/* enableGreyScale */}
                  {renderBasicField('heatmap.enableGreyScale', fieldSchema.properties.enableGreyScale)}
                    </Box>
                  )}
                </Box>
              );
            }

            // Handle nested sport type arrays in photos
            if (fieldName === 'photos') {
              return (
                <Box key={fieldName} mb={4} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                  <Button
                    onClick={() => toggleGroup('photos')}
                    width="100%"
                    justifyContent="flex-start"
                    variant="ghost"
                    fontWeight="600"
                    bg="cardBg"
                    color="text"
                    whiteSpace="normal"
                    textAlign="left"
                    height="auto"
                    py={2}
                    wordBreak="break-word"
                  >
                    <Box as={expandedGroups.photos ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                    {fieldSchema.title}
                  </Button>
                  {expandedGroups.photos && (
                    <Box p={4}>
                      {fieldSchema.description && (
                        <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
                      )}
                  
                  {/* hidePhotosForSportTypes */}
                  {renderSportTypeMultiSelect(
                    'hidePhotosForSportTypes',
                    fieldSchema.properties.hidePhotosForSportTypes,
                    'photos.hidePhotosForSportTypes',
                    getNestedValue(formData, 'photos.hidePhotosForSportTypes'),
                    handleFieldChange,
                    errors['photos.hidePhotosForSportTypes'],
                    'hidePhotosForSportTypes'
                  )}

                  {/* defaultEnabledFilters - heading only */}
                  <Box mb={4}>
                    <Text fontWeight="600" mb={3} fontSize="md">
                      Default Enabled Filters
                    </Text>

                    {/* sportTypes within defaultEnabledFilters - collapsible */}
                    {renderSportTypeMultiSelect(
                      'sportTypes',
                      fieldSchema.properties.defaultEnabledFilters.properties.sportTypes,
                      'photos.defaultEnabledFilters.sportTypes',
                      getNestedValue(formData, 'photos.defaultEnabledFilters.sportTypes'),
                      handleFieldChange,
                      errors['photos.defaultEnabledFilters.sportTypes'],
                      'defaultEnabledFilters'
                    )}

                    {/* defaultEnabledFilters.countryCode */}
                    <Box mt={3}>
                      <Text fontWeight="500" mb={1} fontSize="sm">
                        Country Code
                      </Text>
                      {fieldSchema.properties.defaultEnabledFilters.properties.countryCode.description && (
                        <Text fontSize="sm" color="textMuted" mb={2}>
                          {fieldSchema.properties.defaultEnabledFilters.properties.countryCode.description}
                        </Text>
                      )}
                      <Flex gap={2} direction={{ base: "column", sm: "row" }}>
                        <Input
                          value={getNestedValue(formData, 'photos.defaultEnabledFilters.countryCode') || ''}
                          readOnly
                          placeholder="Click button to select country"
                          flex="1"
                          borderColor={errors['photos.defaultEnabledFilters.countryCode'] ? 'red.500' : 'border'}
                        />
                        <Button
                          onClick={handleOpenCountrySelector}
                          size={{ base: "xs", sm: "md" }}
                          width={{ base: "100%", sm: "auto" }}
                          whiteSpace="normal"
                        >
                          Select Country
                        </Button>
                      </Flex>
                      {errors['photos.defaultEnabledFilters.countryCode'] && (
                        <Text color="red.500" fontSize="sm" mt={1}>{errors['photos.defaultEnabledFilters.countryCode']}</Text>
                      )}
                    </Box>
                  </Box>
                    </Box>
                  )}
                </Box>
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
          onChange={handleCountryChange}
          onClose={handleCloseCountrySelector}
        />
      )}

      {showDashboardEditor && (
        <Suspense fallback={
          <Box
            position="fixed"
            top="0"
            left="0"
            width="100vw"
            height="100vh"
            bg="blackAlpha.800"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex="9999"
          >
            <Box
              bg="cardBg"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border"
              p={8}
              boxShadow="xl"
            >
              <VStack gap={3}>
                <Spinner size="xl" color="primary" />
                <Text fontSize={{ base: "sm", sm: "md" }} color="textMuted">
                  Loading dashboard editor...
                </Text>
              </VStack>
            </Box>
          </Box>
        }>
          <DashboardEditor
            dashboardLayout={dashboardLayout}
            onClose={handleCloseDashboardEditor}
            onSave={handleSaveDashboard}
          />
        </Suspense>
      )}
    </>
  );
};

// Wrap with memo to prevent unnecessary re-renders
export default memo(AppearanceConfigEditor);
